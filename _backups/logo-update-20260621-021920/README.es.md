# MPTech Network Tools

Herramienta portable para Windows enfocada en diagnóstico de red, inspección de red local y solución rápida de problemas.

![Panel principal](docs/screenshots/network-tools-dashboard.png)

## Descargar

Ve a la última release y descarga:

**MPTech-Network-Tools-v1.0.0-portable.exe**

La versión portable es la descarga recomendada. No necesita instalación.

Si está disponible, la versión installer es opcional.

## Qué hace

MPTech Network Tools es una pequeña herramienta de escritorio para Windows pensada para diagnóstico práctico de red.

Está diseñada para técnicos, sysadmins, desarrolladores, estudiantes de IT y usuarios avanzados que quieren información rápida de red sin abrir varias herramientas distintas.

## Funciones

- Resumen automático de red al abrir la app.
- Detección de IP local, gateway, DNS e IP pública.
- Información de adaptadores de red activos.
- Diagnóstico automático.
- Herramienta de ping.
- Prueba de puertos TCP.
- Visor de puertos locales en escucha.
- Network Scan seguro V1.
- Detección de dirección broadcast.
- Detección de MAC cuando está disponible.
- Estimación básica de fabricante.
- Inferencia básica de tipo de dispositivo.
- Detección de puertos comunes locales.
- Traceroute.
- Copiar informe al portapapeles.
- Exportar informe a TXT eligiendo dónde guardar.
- Informe propio de Network Scan.
- Interfaz multidioma:
  - Inglés
  - Español
  - Portugués.

## Capturas

### Panel principal

![Panel principal](docs/screenshots/network-tools-dashboard.png)

### Diagnóstico

![Diagnóstico](docs/screenshots/network-tools-diagnostic.png)

### Network Scan

![Network Scan](docs/screenshots/network-tools-network-scan.png)

### Traceroute

![Traceroute](docs/screenshots/network-tools-traceroute.png)

### Puertos

![Puertos](docs/screenshots/network-tools-ports.png)

### Informe

![Informe](docs/screenshots/network-tools-report.png)

### Interfaz en español

![Español](docs/screenshots/network-tools-spanish.png)

### Interfaz en portugués

![Portugués](docs/screenshots/network-tools-portuguese.png)

## Network Scan V1

Network Scan está limitado de forma intencionada en la versión 1.0.0 para que sea seguro y usable.

Comprueba la red local donde está conectado el PC y combina entradas ARP, descubrimiento por ping local, detección de broadcast y un pequeño conjunto de puertos comunes.

Puede mostrar:

- Dirección IP.
- Rol.
- Hostname cuando está disponible.
- Dirección MAC cuando está disponible.
- Estimación básica de fabricante.
- Tipo básico de dispositivo.
- Puertos comunes abiertos.
- Origen.
- Latencia/estado de origen.

Los escaneos profundos, escaneos agresivos de puertos y escaneos progresivos de redes grandes /16 o /8 quedan fuera de la V1.

## Idiomas

La interfaz incluye inglés, español y portugués.

Los textos están guardados en UTF-8 para mantener correctamente los acentos.

## Privacidad

MPTech Network Tools no necesita login, cuenta, servicio cloud ni backend.

Los informes se generan localmente.

## Notas

Windows SmartScreen puede mostrar un aviso porque el ejecutable todavía no está firmado con certificado de código.

## Stack técnico

- Tauri 2
- React
- TypeScript
- Rust
- PowerShell/comandos de red de Windows

## Licencia

MIT License.