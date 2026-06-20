# MPTech Network Tools

Herramienta portable para Windows enfocada en diagnostico basico de red.

Este proyecto forma parte de MPTech Tools: una coleccion de utilidades pequenas, practicas y portables para Windows, pensadas para tecnicos, usuarios avanzados, desarrolladores y administradores de sistemas.

## Estado actual

V1 en desarrollo inicial.

## Funciones previstas para V1

- Resumen de red.
- Deteccion de IP local.
- Comprobaciones de ping.
- Test de puertos TCP.
- Comprobar IP publica.
- Vista de interfaces de red.
- Puertos abiertos locales.
- Escaneo LAN basico.
- Copiar/exportar diagnostico.

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