# MPTech Network Tools

Portable Windows toolkit for basic network diagnostics.

This project is part of the MPTech Tools collection: small, practical and portable Windows utilities for technicians, advanced users, developers and sysadmins.

## Current status

V1 development.

## Current features

- Network summary.
- Active network adapters.
- Local IP detection.
- Gateway detection.
- DNS detection.
- Public IP check.
- Ping checks.
- TCP port testing.
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