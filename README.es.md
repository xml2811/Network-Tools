# MPTech Network Tools

Herramienta portable para Windows enfocada en diagnostico basico de red.

Este proyecto forma parte de MPTech Tools: una coleccion de utilidades pequenas, practicas y portables para Windows, pensadas para tecnicos, usuarios avanzados, desarrolladores y administradores de sistemas.

## Estado actual

V1 en desarrollo.

## Funciones actuales

- Resumen de red.
- Carga automatica inicial del resumen al abrir la app.
- Adaptadores de red activos.
- Deteccion de IP local.
- Deteccion de gateway.
- Deteccion de DNS.
- Comprobacion de IP publica.
- Comprobaciones de ping.
- Test de puertos TCP.
- Puertos locales en escucha.
- Network Scan local basico limitado a redes privadas/locales.
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
## Proximo modulo planificado

### Network Scan

Modulo de escaneo LAN basico y seguro, limitado a redes privadas/locales y pensado solo para redes propias o donde el usuario tenga permiso.
## Network Scan V1

Network Scan usa una estrategia local segura:

- Descubrimiento por cache ARP.
- Descubrimiento por ping en el segmento local /24 actual.
- Busqueda de hostname cuando sea posible.
- MAC cuando este disponible.
- Inferencia basica del tipo de dispositivo.
- Comprobacion de puertos comunes solo en hosts locales encontrados.

El escaneo profundo de redes /16 o /8 queda para un futuro modo avanzado.
## Clasificacion de Network Scan

La V1 incluye:

- Identificacion de broadcast.
- Deteccion de gateway.
- Origen del dato: ARP, ping o calculado.
- Estimacion basica de fabricante por prefijo MAC.
- Inferencia basica de tipo de dispositivo por hostname, fabricante y puertos comunes.
- Comprobacion de puertos comunes solo en hosts locales descubiertos.