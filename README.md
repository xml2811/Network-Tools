# MPTech Network Tools

Portable Windows toolkit for network diagnostics, local network inspection and quick troubleshooting.

![Dashboard](docs/screenshots/network-tools-dashboard.png)

## Download

Go to the latest release and download:

**MPTech-Network-Tools-v1.0.0-portable.exe**

The portable version is the recommended download. It does not require installation.

If available, the installer version is optional.

## What it does

MPTech Network Tools is a small Windows desktop tool focused on practical network diagnostics.

It is designed for technicians, sysadmins, developers, IT students and advanced Windows users who want quick network information without opening several separate tools.

## Features

- Automatic network summary on startup.
- Local IP, gateway, DNS and public IP detection.
- Active network adapter information.
- Automatic diagnostic checks.
- Ping tool.
- TCP port test.
- Local listening ports viewer.
- Safe Network Scan V1.
- Broadcast address detection.
- MAC address detection when available.
- Basic vendor guess.
- Basic device type inference.
- Common local port detection.
- Traceroute tool.
- Copy report to clipboard.
- Export report to TXT with save dialog.
- Network Scan report.
- Multilanguage interface:
  - English
  - Spanish
  - Portuguese.

## Screenshots

### Dashboard

![Dashboard](docs/screenshots/network-tools-dashboard.png)

### Diagnostic

![Diagnostic](docs/screenshots/network-tools-diagnostic.png)

### Network Scan

![Network Scan](docs/screenshots/network-tools-network-scan.png)

### Traceroute

![Traceroute](docs/screenshots/network-tools-traceroute.png)

### Ports

![Ports](docs/screenshots/network-tools-ports.png)

### Report

![Report](docs/screenshots/network-tools-report.png)

### Spanish interface

![Spanish](docs/screenshots/network-tools-spanish.png)

### Portuguese interface

![Portuguese](docs/screenshots/network-tools-portuguese.png)

## Network Scan V1

Network Scan is intentionally safe and limited for version 1.0.0.

It checks the local network where the PC is connected and combines ARP entries, local ping discovery, broadcast detection and a small set of common service ports.

It can show:

- IP address.
- Role.
- Hostname when available.
- MAC address when available.
- Basic vendor guess.
- Basic device type.
- Common open ports.
- Source.
- Latency/source status.

Deep scans, aggressive port scanning and large /16 or /8 progressive scans are intentionally not included in V1.

## Languages

The interface includes English, Spanish and Portuguese.

## Privacy

MPTech Network Tools does not require login, account, cloud service or backend server.

Reports are generated locally.

## Notes

Windows SmartScreen may show a warning because the executable is not code-signed yet.

## Tech stack

- Tauri 2
- React
- TypeScript
- Rust
- PowerShell/Windows networking commands

## License

MIT License.