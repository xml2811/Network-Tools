# MPTech Network Tools

Portable Windows toolkit for basic network diagnostics.

This project is part of the MPTech Tools collection: small, practical and portable Windows utilities for technicians, advanced users, developers and sysadmins.

## Current status

V1 development.

## Current features

- Network summary.
- Automatic initial network summary when the app opens.
- Active network adapters.
- Local IP detection.
- Gateway detection.
- DNS detection.
- Public IP check.
- Ping checks.
- TCP port testing.
- Local listening ports.
- Basic local Network Scan limited to private/local networks.
- Automatic basic diagnosis.
- Copy diagnostic report.

## Diagnostic logic

The tool checks:

- Gateway reachability.
- Primary DNS reachability.
- Internet IP reachability.
- Domain resolution.

Then it gives a human-readable diagnosis, for example:

- Local network problem.
- DNS problem.
- Internet connectivity problem.
- Network looks OK.

## Not included in early V1

Advanced system changes are planned for later because they can break connectivity or require administrator permissions:

- Change static IP.
- Change gateway.
- Change DNS.
- Release/renew DHCP.
- Reset adapters.
- Winsock reset.

## Responsible use

Use this tool only on your own systems or networks where you have permission.

## Tech stack

- Tauri
- React
- TypeScript
- Rust
- Windows command integration
## Planned next module

### Network Scan

A safe basic LAN scan module is planned for V1/V1.1. It should be limited to private/local networks and used only on networks where the user has permission.
## Network Scan V1

Network Scan uses a safe local discovery strategy:

- ARP cache discovery.
- Ping discovery on the current local /24 segment.
- Hostname lookup when available.
- MAC address when available.
- Basic device type inference.
- Common service port checks only on discovered local hosts.

Deep scanning of very large /16 or /8 networks is planned for a future advanced mode.
## Network Scan classification

Current V1 classification includes:

- Broadcast address identification.
- Gateway role detection.
- Source detection: ARP, ping or calculated.
- Basic vendor guess from common MAC prefixes.
- Basic device type inference from hostname, vendor and common ports.
- Common port checks on discovered local hosts only.