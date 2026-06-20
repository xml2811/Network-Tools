use serde::Serialize;
use std::net::{IpAddr, TcpStream, ToSocketAddrs};
use std::process::Command;
use std::time::{Duration, Instant};

#[derive(Serialize)]
struct NetworkSummary {
    hostname: String,
    os: String,
    local_ips: Vec<String>,
}

#[tauri::command]
fn get_network_summary() -> NetworkSummary {
    let hostname = std::env::var("COMPUTERNAME")
        .or_else(|_| std::env::var("HOSTNAME"))
        .unwrap_or_else(|_| "unknown".to_string());

    let os = std::env::consts::OS.to_string();

    let mut local_ips = Vec::new();

    if let Ok(output) = Command::new("ipconfig").output() {
        let text = String::from_utf8_lossy(&output.stdout);

        for line in text.lines() {
            let clean = line.trim();

            if clean.contains("IPv4") {
                if let Some((_, value)) = clean.split_once(':') {
                    let ip = value.trim().to_string();

                    if !ip.is_empty() && !local_ips.contains(&ip) {
                        local_ips.push(ip);
                    }
                }
            }
        }
    }

    NetworkSummary {
        hostname,
        os,
        local_ips,
    }
}

#[tauri::command]
fn ping_host(host: String) -> Result<String, String> {
    let host = host.trim();

    if host.is_empty() {
        return Err("Host is empty".to_string());
    }

    let output = Command::new("ping")
        .args(["-n", "4", host])
        .output()
        .map_err(|error| format!("Failed to run ping: {error}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        Ok(stdout)
    } else if !stderr.trim().is_empty() {
        Err(stderr)
    } else {
        Err(stdout)
    }
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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_network_summary,
            ping_host,
            test_tcp_port
        ])
        .run(tauri::generate_context!())
        .expect("error while running MPTech Network Tools");
}