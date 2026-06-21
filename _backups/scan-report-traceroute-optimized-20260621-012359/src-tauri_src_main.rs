use serde::Serialize;
use serde_json::Value;
use std::net::{IpAddr, TcpStream, ToSocketAddrs};
use std::process::Command;
use std::time::{Duration, Instant};

#[derive(Serialize, Clone)]
struct NetworkAdapter {
    description: String,
    mac_address: String,
    ip_addresses: Vec<String>,
    gateways: Vec<String>,
    dns_servers: Vec<String>,
}

#[derive(Serialize, Clone)]
struct NetworkDetails {
    hostname: String,
    os: String,
    primary_ip: String,
    gateway: String,
    dns_servers: Vec<String>,
    public_ip: String,
    adapters: Vec<NetworkAdapter>,
}

#[derive(Serialize, Clone)]
struct PingCheck {
    target: String,
    label: String,
    ok: bool,
    elapsed_ms: u128,
    message: String,
}

#[derive(Serialize, Clone)]
struct DiagnosticResult {
    summary: String,
    recommendations: Vec<String>,
    checks: Vec<PingCheck>,
    report: String,
}

#[derive(Serialize, Clone)]
struct LocalPort {
    protocol: String,
    local_address: String,
    local_port: String,
    state: String,
    process_id: String,
    process_name: String,
}

#[derive(Serialize, Clone)]
struct LanHost {
    ip: String,
    hostname: String,
    mac_address: String,
    vendor_guess: String,
    device_type: String,
    network_role: String,
    open_ports: Vec<String>,
    status: String,
    latency_ms: u128,
    latency_display: String,
    source: String,
}

fn run_powershell(script: &str) -> Result<String, String> {
    let full_script = format!(
        "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; $OutputEncoding=[System.Text.Encoding]::UTF8; {}",
        script
    );

    let output = Command::new("powershell")
        .args([
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            &full_script,
        ])
        .output()
        .map_err(|error| format!("Failed to run PowerShell: {error}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

    if output.status.success() {
        Ok(stdout)
    } else if !stderr.is_empty() {
        Err(stderr)
    } else {
        Err(stdout)
    }
}

fn value_to_string(value: Option<&Value>) -> String {
    match value {
        Some(Value::String(text)) => text.clone(),
        Some(Value::Number(num)) => num.to_string(),
        Some(Value::Bool(flag)) => flag.to_string(),
        _ => String::new(),
    }
}

fn value_to_vec(value: Option<&Value>) -> Vec<String> {
    match value {
        Some(Value::Array(items)) => items
            .iter()
            .filter_map(|item| match item {
                Value::String(text) => Some(text.clone()),
                Value::Number(num) => Some(num.to_string()),
                _ => None,
            })
            .filter(|text| !text.trim().is_empty())
            .collect(),
        Some(Value::String(text)) => {
            if text.trim().is_empty() {
                Vec::new()
            } else {
                vec![text.clone()]
            }
        }
        Some(Value::Number(num)) => vec![num.to_string()],
        _ => Vec::new(),
    }
}

fn get_public_ip() -> String {
    let script = r###"
try {
  $value = Invoke-RestMethod -Uri 'https://api.ipify.org' -TimeoutSec 4
  $value.ToString().Trim()
} catch {
  ''
}
"###;

    run_powershell(script).unwrap_or_default()
}

fn get_hostname() -> String {
    std::env::var("COMPUTERNAME")
        .or_else(|_| std::env::var("HOSTNAME"))
        .unwrap_or_else(|_| "unknown".to_string())
}

fn is_private_ipv4(ip: &str) -> bool {
    ip.starts_with("10.")
        || ip.starts_with("192.168.")
        || ip.starts_with("172.16.")
        || ip.starts_with("172.17.")
        || ip.starts_with("172.18.")
        || ip.starts_with("172.19.")
        || ip.starts_with("172.20.")
        || ip.starts_with("172.21.")
        || ip.starts_with("172.22.")
        || ip.starts_with("172.23.")
        || ip.starts_with("172.24.")
        || ip.starts_with("172.25.")
        || ip.starts_with("172.26.")
        || ip.starts_with("172.27.")
        || ip.starts_with("172.28.")
        || ip.starts_with("172.29.")
        || ip.starts_with("172.30.")
        || ip.starts_with("172.31.")
}

fn ipv4_prefix_24(ip: &str) -> Option<String> {
    let parts: Vec<&str> = ip.split('.').collect();

    if parts.len() != 4 {
        return None;
    }

    Some(format!("{}.{}.{}", parts[0], parts[1], parts[2]))
}

fn load_adapters() -> Vec<NetworkAdapter> {
    let script = r###"
$items = Get-CimInstance Win32_NetworkAdapterConfiguration |
  Where-Object { $_.IPEnabled -eq $true } |
  ForEach-Object {
    [PSCustomObject]@{
      Description = $_.Description
      MACAddress = $_.MACAddress
      IPAddress = @($_.IPAddress)
      DefaultIPGateway = @($_.DefaultIPGateway)
      DNSServerSearchOrder = @($_.DNSServerSearchOrder)
    }
  }

$items | ConvertTo-Json -Depth 6 -Compress
"###;

    let Ok(json) = run_powershell(script) else {
        return Vec::new();
    };

    if json.trim().is_empty() {
        return Vec::new();
    }

    let Ok(value) = serde_json::from_str::<Value>(&json) else {
        return Vec::new();
    };

    let rows = match value {
        Value::Array(items) => items,
        item => vec![item],
    };

    let mut adapters = Vec::new();

    for row in rows {
        let adapter = NetworkAdapter {
            description: value_to_string(row.get("Description")),
            mac_address: value_to_string(row.get("MACAddress")),
            ip_addresses: value_to_vec(row.get("IPAddress")),
            gateways: value_to_vec(row.get("DefaultIPGateway")),
            dns_servers: value_to_vec(row.get("DNSServerSearchOrder")),
        };

        if !adapter.description.is_empty() || !adapter.ip_addresses.is_empty() {
            adapters.push(adapter);
        }
    }

    adapters
}

#[tauri::command]
fn get_network_details() -> Result<NetworkDetails, String> {
    let adapters = load_adapters();

    let primary_ip = adapters
        .iter()
        .flat_map(|adapter| adapter.ip_addresses.clone())
        .find(|ip| ip.contains('.') && !ip.starts_with("169.254."))
        .unwrap_or_default();

    let gateway = adapters
        .iter()
        .flat_map(|adapter| adapter.gateways.clone())
        .find(|gateway| gateway.contains('.'))
        .unwrap_or_default();

    let mut dns_servers: Vec<String> = Vec::new();

    for dns in adapters
        .iter()
        .flat_map(|adapter| adapter.dns_servers.clone())
        .filter(|dns| dns.contains('.'))
    {
        if !dns_servers.contains(&dns) {
            dns_servers.push(dns);
        }
    }

    Ok(NetworkDetails {
        hostname: get_hostname(),
        os: std::env::consts::OS.to_string(),
        primary_ip,
        gateway,
        dns_servers,
        public_ip: get_public_ip(),
        adapters,
    })
}

fn ping_once(label: &str, target: &str) -> PingCheck {
    let clean_target = target.trim().to_string();

    if clean_target.is_empty() {
        return PingCheck {
            target: clean_target,
            label: label.to_string(),
            ok: false,
            elapsed_ms: 0,
            message: "Target is empty".to_string(),
        };
    }

    let start = Instant::now();

    let output = Command::new("ping")
        .args(["-n", "1", "-w", "1500", &clean_target])
        .output();

    let elapsed = start.elapsed().as_millis();

    match output {
        Ok(result) => {
            if result.status.success() {
                PingCheck {
                    target: clean_target.clone(),
                    label: label.to_string(),
                    ok: true,
                    elapsed_ms: elapsed,
                    message: format!("{clean_target} reachable ({elapsed} ms approx)"),
                }
            } else {
                PingCheck {
                    target: clean_target.clone(),
                    label: label.to_string(),
                    ok: false,
                    elapsed_ms: elapsed,
                    message: format!("{clean_target} not reachable"),
                }
            }
        }
        Err(error) => PingCheck {
            target: clean_target,
            label: label.to_string(),
            ok: false,
            elapsed_ms: elapsed,
            message: format!("Ping failed: {error}"),
        },
    }
}

#[tauri::command]
fn ping_host(host: String) -> Result<String, String> {
    let host = host.trim();

    if host.is_empty() {
        return Err("Host is empty".to_string());
    }

    let mut lines = Vec::new();
    lines.push(format!("Ping results for {host}"));

    let mut ok_count = 0;

    for index in 1..=4 {
        let check = ping_once(&format!("Ping {index}"), host);

        if check.ok {
            ok_count += 1;
            lines.push(format!("Reply {index}: OK ({} ms approx)", check.elapsed_ms));
        } else {
            lines.push(format!("Reply {index}: failed"));
        }
    }

    lines.push(String::new());
    lines.push(format!("Packets: sent = 4, received = {ok_count}, lost = {}", 4 - ok_count));

    if ok_count == 4 {
        lines.push("Status: connection looks stable.".to_string());
    } else if ok_count > 0 {
        lines.push("Status: partial packet loss detected.".to_string());
    } else {
        lines.push("Status: host is not reachable.".to_string());
    }

    Ok(lines.join("\n"))
}

#[tauri::command]
fn test_tcp_port(host: String, port: u16, timeout_ms: u64) -> Result<String, String> {
    let host = host.trim();

    if host.is_empty() {
        return Err("Host is empty".to_string());
    }

    if port == 0 {
        return Err("Invalid port".to_string());
    }

    let timeout = Duration::from_millis(timeout_ms.clamp(500, 10000));
    let address = format!("{host}:{port}");

    let mut addrs = address
        .to_socket_addrs()
        .map_err(|error| format!("Could not resolve host: {error}"))?;

    let socket = addrs
        .find(|addr| matches!(addr.ip(), IpAddr::V4(_) | IpAddr::V6(_)))
        .ok_or_else(|| "No socket address found".to_string())?;

    let start = Instant::now();

    match TcpStream::connect_timeout(&socket, timeout) {
        Ok(_) => {
            let elapsed = start.elapsed().as_millis();
            Ok(format!("{host}:{port} OPEN ({elapsed} ms)"))
        }
        Err(error) => Ok(format!("{host}:{port} CLOSED or FILTERED ({error})")),
    }
}

#[tauri::command]
fn get_local_listening_ports() -> Result<Vec<LocalPort>, String> {
    let script = r###"
$items = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Sort-Object LocalPort |
  Select-Object -First 80 |
  ForEach-Object {
    $processName = ''
    try {
      $processName = (Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName
    } catch {
      $processName = ''
    }

    [PSCustomObject]@{
      Protocol = 'TCP'
      LocalAddress = $_.LocalAddress
      LocalPort = $_.LocalPort.ToString()
      State = $_.State.ToString()
      ProcessId = $_.OwningProcess.ToString()
      ProcessName = $processName
    }
  }

$items | ConvertTo-Json -Depth 4 -Compress
"###;

    let json = run_powershell(script)?;

    if json.trim().is_empty() {
        return Ok(Vec::new());
    }

    let value = serde_json::from_str::<Value>(&json)
        .map_err(|error| format!("Could not parse local ports: {error}"))?;

    let rows = match value {
        Value::Array(items) => items,
        item => vec![item],
    };

    let mut ports = Vec::new();

    for row in rows {
        ports.push(LocalPort {
            protocol: value_to_string(row.get("Protocol")),
            local_address: value_to_string(row.get("LocalAddress")),
            local_port: value_to_string(row.get("LocalPort")),
            state: value_to_string(row.get("State")),
            process_id: value_to_string(row.get("ProcessId")),
            process_name: value_to_string(row.get("ProcessName")),
        });
    }

    Ok(ports)
}

#[tauri::command]
fn scan_local_network() -> Result<Vec<LanHost>, String> {
    let details = get_network_details()?;
    let primary_ip = details.primary_ip.trim().to_string();

    if primary_ip.is_empty() {
        return Err("Primary IP not detected. Refresh network summary first.".to_string());
    }

    if !is_private_ipv4(&primary_ip) {
        return Err("Network scan is limited to private/local IPv4 ranges only.".to_string());
    }

    let Some(prefix) = ipv4_prefix_24(&primary_ip) else {
        return Err("Could not calculate local /24 prefix.".to_string());
    };

    let gateway = details.gateway.clone();

    let script_template = r###"
$prefix = '__PREFIX__'
$gateway = '__GATEWAY__'
$commonPorts = @(22, 80, 443, 445, 3389, 8080, 554, 8008, 8009, 9100, 515, 631)
$results = @{}

function Get-VendorGuess {
  param([string]$Mac)

  if ([string]::IsNullOrWhiteSpace($Mac)) {
    return ''
  }

  $prefix = $Mac.ToLower().Replace('-', ':')
  if ($prefix.Length -ge 8) {
    $prefix = $prefix.Substring(0, 8)
  }

  switch -Regex ($prefix) {
    '^f4:c8:8a|^a4:08:01|^d8:bb:c1|^10:ff:e0|^2c:f0:5d' { return 'Realtek / PC hardware' }
    '^44:3b:14|^a4:97:33|^98:de:d0|^50:c7:bf' { return 'Router / network device' }
    '^00:1a:79|^b8:27:eb|^dc:a6:32|^e4:5f:01' { return 'Linux / embedded device' }
    '^f0:18:98|^3c:5a:b4|^a4:c3:61|^28:cf:e9' { return 'Apple' }
    '^bc:92:6b|^cc:46:d6|^f4:f5:d8|^a0:21:b7|^e8:50:8b' { return 'Samsung' }
    '^64:cc:2e|^28:6c:07|^50:8f:4c|^ec:fa:5c|^1c:bf:ce' { return 'Xiaomi / Android device' }
    '^d4:6e:0e|^38:37:8b|^70:4f:57' { return 'LG / TV or media device' }
    '^00:17:88|^ec:b5:fa|^48:a9:8a' { return 'Philips / smart device' }
    '^70:ee:50|^b0:c5:54|^44:65:0d' { return 'Netgear / network device' }
    '^50:c7:bf|^c4:e9:84|^e8:48:b8' { return 'TP-Link / network device' }
    '^fc:ec:da|^dc:9f:db|^24:a4:3c' { return 'Amazon / media device' }
    '^00:80:77|^00:1f:29|^b4:2e:99' { return 'Brother / printer' }
    '^00:1b:a9|^44:1e:a1|^b4:0e:de' { return 'HP / printer or PC' }
    default { return '' }
  }
}

function Get-DeviceType {
  param(
    [string]$Ip,
    [string]$Hostname,
    [string]$Vendor,
    [array]$OpenPorts
  )

  if ($Ip.EndsWith('.255')) {
    return 'network/broadcast'
  }

  if ($Ip -eq $gateway) {
    return 'router/gateway'
  }

  $h = $Hostname.ToLower()
  $v = $Vendor.ToLower()

  if ($h -match 'desktop|laptop|pc-|win|windows' -or $OpenPorts -contains '445' -or $OpenPorts -contains '3389') {
    return 'windows pc'
  }

  if ($h -match 'iphone|ipad|macbook|imac' -or $v -match 'apple') {
    return 'apple device'
  }

  if ($h -match 'android|phone|mobile|xiaomi|redmi|poco|samsung|huawei|oppo|realme' -or $v -match 'xiaomi|samsung|android') {
    return 'mobile/android'
  }

  if ($h -match 'tv|chromecast|firetv|webos|bravia|androidtv' -or $v -match 'lg|philips|amazon' -or $OpenPorts -contains '8008' -or $OpenPorts -contains '8009') {
    return 'tv/media'
  }

  if ($h -match 'printer|brother|epson|canon|hp' -or $v -match 'brother|printer' -or $OpenPorts -contains '9100' -or $OpenPorts -contains '515' -or $OpenPorts -contains '631') {
    return 'printer'
  }

  if ($OpenPorts -contains '554') {
    return 'camera/rtsp'
  }

  if ($OpenPorts -contains '22') {
    return 'linux/server/nas'
  }

  if ($OpenPorts -contains '80' -or $OpenPorts -contains '443' -or $OpenPorts -contains '8080') {
    return 'web device'
  }

  return 'unknown'
}

function Add-HostResult {
  param(
    [string]$Ip,
    [string]$Mac,
    [int]$Latency,
    [string]$Source
  )

  if ([string]::IsNullOrWhiteSpace($Ip)) {
    return
  }

  if ($Ip -notlike "$prefix.*") {
    return
  }

  if ($Ip.EndsWith('.0')) {
    return
  }

  $hostname = ''
  $openPorts = @()

  $role = 'device'
  $latencyDisplay = "$Latency ms"

  if ($Ip.EndsWith('.255')) {
    $role = 'broadcast'
    $Source = 'calculated'
    $latencyDisplay = '-'
  } else {
    if ($Source -eq 'arp' -and $Latency -eq 0) {
      $latencyDisplay = 'cached'
    }

    try {
      $hostname = ([System.Net.Dns]::GetHostEntry($Ip)).HostName
    } catch {
      $hostname = ''
    }

    foreach ($port in $commonPorts) {
      try {
        $client = New-Object System.Net.Sockets.TcpClient
        $iar = $client.BeginConnect($Ip, $port, $null, $null)
        $success = $iar.AsyncWaitHandle.WaitOne(120, $false)
        if ($success -and $client.Connected) {
          $openPorts += $port.ToString()
        }
        $client.Close()
      } catch {}
    }
  }

  if ($Ip -eq $gateway) {
    $role = 'gateway'
  }

  $vendor = Get-VendorGuess -Mac $Mac
  $deviceType = Get-DeviceType -Ip $Ip -Hostname $hostname -Vendor $vendor -OpenPorts $openPorts

  $results[$Ip] = [PSCustomObject]@{
    Ip = $Ip
    Hostname = $hostname
    MacAddress = $Mac
    VendorGuess = $vendor
    DeviceType = $deviceType
    NetworkRole = $role
    OpenPorts = @($openPorts)
    Status = 'online'
    LatencyMs = $Latency
    LatencyDisplay = $latencyDisplay
    Source = $Source
  }
}

$broadcast = "$prefix.255"
Add-HostResult -Ip $broadcast -Mac 'ff-ff-ff-ff-ff-ff' -Latency 0 -Source 'calculated'

try {
  arp -a | ForEach-Object {
    $line = $_.ToString().Trim()
    if ($line -match "^(\d+\.\d+\.\d+\.\d+)\s+([a-fA-F0-9\-]{17})\s+") {
      Add-HostResult -Ip $matches[1] -Mac $matches[2] -Latency 0 -Source 'arp'
    }
  }
} catch {}

1..254 | ForEach-Object {
  $ip = "$prefix.$_"

  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $alive = Test-Connection -ComputerName $ip -Count 1 -Quiet -TimeoutSeconds 1 -ErrorAction SilentlyContinue
  $sw.Stop()

  if ($alive) {
    $mac = ''
    try {
      $arpLine = arp -a $ip | Select-String $ip | Select-Object -First 1
      if ($arpLine -and $arpLine.ToString() -match "([a-fA-F0-9\-]{17})") {
        $mac = $matches[1]
      }
    } catch {}

    Add-HostResult -Ip $ip -Mac $mac -Latency ([int]$sw.ElapsedMilliseconds) -Source 'ping'
  }
}

$results.Values |
  Sort-Object {
    [version]$_.Ip
  } |
  ConvertTo-Json -Depth 6 -Compress
"###;

    let script = script_template
        .replace("__PREFIX__", &prefix)
        .replace("__GATEWAY__", &gateway);

    let json = run_powershell(&script)?;

    if json.trim().is_empty() {
        return Ok(Vec::new());
    }

    let value = serde_json::from_str::<Value>(&json)
        .map_err(|error| format!("Could not parse network scan results: {error}"))?;

    let rows = match value {
        Value::Array(items) => items,
        item => vec![item],
    };

    let mut hosts = Vec::new();

    for row in rows {
        hosts.push(LanHost {
            ip: value_to_string(row.get("Ip")),
            hostname: value_to_string(row.get("Hostname")),
            mac_address: value_to_string(row.get("MacAddress")),
            vendor_guess: value_to_string(row.get("VendorGuess")),
            device_type: value_to_string(row.get("DeviceType")),
            network_role: value_to_string(row.get("NetworkRole")),
            open_ports: value_to_vec(row.get("OpenPorts")),
            status: value_to_string(row.get("Status")),
            latency_ms: value_to_string(row.get("LatencyMs")).parse::<u128>().unwrap_or(0),
            latency_display: value_to_string(row.get("LatencyDisplay")),
            source: value_to_string(row.get("Source")),
        });
    }

    Ok(hosts)
}


#[tauri::command]
fn trace_route(host: String) -> Result<String, String> {
    let host = host.trim();

    if host.is_empty() {
        return Err("Host is empty".to_string());
    }

    let allowed = host
        .chars()
        .all(|character| character.is_ascii_alphanumeric() || character == '.' || character == '-' || character == ':' || character == '_');

    if !allowed {
        return Err("Invalid host. Use a domain, IPv4 or IPv6 address.".to_string());
    }

    let output = Command::new("tracert")
        .args(["-d", "-h", "20", "-w", "1000", host])
        .output()
        .map_err(|error| format!("Failed to run tracert: {error}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    let mut lines = Vec::new();
    lines.push(format!("Traceroute results for {host}"));
    lines.push("Max hops: 20 | Timeout per hop: 1000 ms | DNS lookup disabled".to_string());
    lines.push(String::new());

    if !stdout.trim().is_empty() {
        lines.push(stdout);
    }

    if !stderr.trim().is_empty() {
        lines.push(String::new());
        lines.push("Errors:".to_string());
        lines.push(stderr);
    }

    Ok(lines.join("\n"))
}

#[tauri::command]
fn run_basic_diagnostics() -> Result<DiagnosticResult, String> {
    let details = get_network_details()?;

    let mut checks = Vec::new();

    if !details.gateway.is_empty() {
        checks.push(ping_once("Gateway", &details.gateway));
    }

    if let Some(dns) = details.dns_servers.first() {
        checks.push(ping_once("Primary DNS", dns));
    }

    checks.push(ping_once("Internet IP", "8.8.8.8"));
    checks.push(ping_once("Domain resolution", "example.com"));

    let gateway_ok = checks.iter().find(|check| check.label == "Gateway").map(|c| c.ok);
    let dns_ok = checks.iter().find(|check| check.label == "Primary DNS").map(|c| c.ok);
    let internet_ok = checks.iter().find(|check| check.label == "Internet IP").map(|c| c.ok).unwrap_or(false);
    let domain_ok = checks.iter().find(|check| check.label == "Domain resolution").map(|c| c.ok).unwrap_or(false);

    let mut recommendations = Vec::new();

    let summary = if gateway_ok == Some(false) {
        recommendations.push("Gateway does not respond. Check router, cable/Wi-Fi, local network or adapter configuration.".to_string());
        "Local network problem detected.".to_string()
    } else if internet_ok && !domain_ok {
        recommendations.push("Internet IP responds but domain does not. This usually points to a DNS problem.".to_string());
        "DNS problem detected.".to_string()
    } else if gateway_ok == Some(true) && !internet_ok {
        recommendations.push("Gateway responds but internet IP does not. Check router WAN, ISP connection or firewall.".to_string());
        "Internet connectivity problem detected.".to_string()
    } else if dns_ok == Some(false) && internet_ok {
        recommendations.push("Primary DNS server does not respond, but internet seems reachable. Try another DNS server.".to_string());
        "DNS server may be unstable.".to_string()
    } else if internet_ok && domain_ok {
        recommendations.push("Basic connectivity looks good.".to_string());
        "Network looks OK.".to_string()
    } else {
        recommendations.push("Not enough information. Check adapter, gateway, DNS and internet access.".to_string());
        "Network status unclear.".to_string()
    };

    let mut report = Vec::new();
    report.push("MPTech Network Tools - Diagnostic Report".to_string());
    report.push("----------------------------------------".to_string());
    report.push(format!("Hostname: {}", details.hostname));
    report.push(format!("OS: {}", details.os));
    report.push(format!("Primary IP: {}", details.primary_ip));
    report.push(format!("Gateway: {}", details.gateway));
    report.push(format!("DNS: {}", details.dns_servers.join(", ")));
    report.push(format!("Public IP: {}", details.public_ip));
    report.push(String::new());
    report.push(format!("Summary: {summary}"));
    report.push(String::new());
    report.push("Checks:".to_string());

    for check in &checks {
        let status = if check.ok { "OK" } else { "FAIL" };
        report.push(format!(
            "- {} ({}) => {} - {}",
            check.label, check.target, status, check.message
        ));
    }

    report.push(String::new());
    report.push("Recommendations:".to_string());

    for recommendation in &recommendations {
        report.push(format!("- {recommendation}"));
    }

    Ok(DiagnosticResult {
        summary,
        recommendations,
        checks,
        report: report.join("\n"),
    })
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_network_details,
            run_basic_diagnostics,
            ping_host,
            test_tcp_port,
            get_local_listening_ports,
            scan_local_network,
            trace_route
        ])
        .run(tauri::generate_context!())
        .expect("error while running MPTech Network Tools");
}