# MPTech Network Tools

Herramienta portable para Windows enfocada en diagnostico basico de red.

Este proyecto forma parte de MPTech Tools: una coleccion de utilidades pequenas, practicas y portables para Windows, pensadas para tecnicos, usuarios avanzados, desarrolladores y administradores de sistemas.

## Estado actual

V1 en desarrollo.

## Funciones actuales

- Resumen de red.
- Adaptadores de red activos.
- Deteccion de IP local.
- Deteccion de gateway.
- Deteccion de DNS.
- Comprobacion de IP publica.
- Comprobaciones de ping.
- Test de puertos TCP.
- Diagnostico automatico basico.
- Copiar informe de diagnostico.

## Logica de diagnostico

La herramienta comprueba:

- Si responde el gateway.
- Si responde el DNS principal.
- Si responde una IP de internet.
- Si resuelve un dominio.

Despues genera un diagnostico entendible, por ejemplo:

- Problema de red local.
- Problema de DNS.
- Problema de conectividad a internet.
- Red aparentemente correcta.

## No incluido en la V1 inicial

Los cambios avanzados del sistema se dejan para mas adelante porque pueden romper la conexion o requerir permisos de administrador:

- Cambiar IP estatica.
- Cambiar gateway.
- Cambiar DNS.
- Liberar/renovar DHCP.
- Resetear adaptadores.
- Reset Winsock.

## Uso responsable

Usa esta herramienta solo en tus propios sistemas o redes donde tengas permiso.

## Tecnologias

- Tauri
- React
- TypeScript
- Rust
- Integracion con comandos de Windows