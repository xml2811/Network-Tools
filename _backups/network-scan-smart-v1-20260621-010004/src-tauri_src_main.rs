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
    status: String,
    latency_ms: u128,
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
            .filter_map(|item| item.as_str().map(|text| text.to_string()))
            .filter(|text| !text.trim().is_empty())
            .collect(),
        Some(Value::String(text)) => {
            if text.trim().is_empty() {
                Vec::new()
            } else {
                vec![text.clone()]
            }
        }
        _ => Vec::new(),
    }
}

fn get_public_ip() -> String {
    let script = r#"
try {
  $value = Invoke-RestMethod -Uri 'https://api.ipify.org' -TimeoutSec 4
  $value.ToString().Trim()
} catch {
  ''
}
"#;

    run_powershell(script).unwrap_or_default()
}

fn get_hostname() -> String {
    std::env::var("COMPUTERNAME")
        .or_else(|_| std::env::var("HOSTNAME"))
        .unwrap_or_else(|_| "unknown".to_string())
}

fn load_adapters() -> Vec<NetworkAdapter> {
    let script = r#"
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
"#;

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

fn resolve_hostname(ip: &str) -> String {
    let script = format!(
        r#"
try {{
  $name = ([System.Net.Dns]::GetHostEntry('{}')).HostName
  if ($name) {{ $name.ToString() }} else {{ '' }}
}} catch {{
  ''
}}
"#,
        ip
    );

    run_powershell(&script).unwrap_or_default()
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
    let script = r#"
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
"#;

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
        return Err("Could not calculate /24 network prefix.".to_string());
    };

    let mut hosts: Vec<LanHost> = Vec::new();

    for last_octet in 1..=254 {
        let ip = format!("{}.{}", prefix, last_octet);
        let start = Instant::now();

        let output = Command::new("ping")
            .args(["-n", "1", "-w", "250", &ip])
            .output();

        let latency = start.elapsed().as_millis();

        if let Ok(result) = output {
            if result.status.success() {
                let hostname = resolve_hostname(&ip);

                hosts.push(LanHost {
                    ip,
                    hostname,
                    status: "online".to_string(),
                    latency_ms: latency,
                });
            }
        }
    }

    Ok(hosts)
}
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_network_details,
            run_basic_diagnostics,
            ping_host,
            test_tcp_port,
            get_local_listening_ports,
            scan_local_network
        ])
        .run(tauri::generate_context!())
        .expect("error while running MPTech Network Tools");
}