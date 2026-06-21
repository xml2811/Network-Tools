<p align="center">
  <img src="docs/branding/logo.png" alt="MPTech Network Tools logo" width="180">
</p>
# MPTech Network Tools

Herramienta portable para Windows enfocada en diagnÃ³stico de red, inspecciÃ³n de red local y soluciÃ³n rÃ¡pida de problemas.

![Panel principal](docs/screenshots/network-tools-dashboard.png)

## Descargar

Ve a la Ãºltima release y descarga:

**MPTech-Network-Tools-v1.0.0-portable.exe**

La versiÃ³n portable es la descarga recomendada. No necesita instalaciÃ³n.

Si estÃ¡ disponible, la versiÃ³n installer es opcional.

## QuÃ© hace

MPTech Network Tools es una pequeÃ±a herramienta de escritorio para Windows pensada para diagnÃ³stico prÃ¡ctico de red.

EstÃ¡ diseÃ±ada para tÃ©cnicos, sysadmins, desarrolladores, estudiantes de IT y usuarios avanzados que quieren informaciÃ³n rÃ¡pida de red sin abrir varias herramientas distintas.

## Funciones

- Resumen automÃ¡tico de red al abrir la app.
- DetecciÃ³n de IP local, gateway, DNS e IP pÃºblica.
- InformaciÃ³n de adaptadores de red activos.
- DiagnÃ³stico automÃ¡tico.
- Herramienta de ping.
- Prueba de puertos TCP.
- Visor de puertos locales en escucha.
- Network Scan seguro V1.
- DetecciÃ³n de direcciÃ³n broadcast.
- DetecciÃ³n de MAC cuando estÃ¡ disponible.
- EstimaciÃ³n bÃ¡sica de fabricante.
- Inferencia bÃ¡sica de tipo de dispositivo.
- DetecciÃ³n de puertos comunes locales.
- Traceroute.
- Copiar informe al portapapeles.
- Exportar informe a TXT eligiendo dÃ³nde guardar.
- Informe propio de Network Scan.
- Interfaz multidioma:
  - InglÃ©s
  - EspaÃ±ol
  - PortuguÃ©s.

## Capturas

### Panel principal

![Panel principal](docs/screenshots/network-tools-dashboard.png)

### DiagnÃ³stico

![DiagnÃ³stico](docs/screenshots/network-tools-diagnostic.png)

### Network Scan

![Network Scan](docs/screenshots/network-tools-network-scan.png)

### Traceroute

![Traceroute](docs/screenshots/network-tools-traceroute.png)

### Puertos

![Puertos](docs/screenshots/network-tools-ports.png)

### Informe

![Informe](docs/screenshots/network-tools-report.png)

### Interfaz en espaÃ±ol

![EspaÃ±ol](docs/screenshots/network-tools-spanish.png)

### Interfaz en portuguÃ©s

![PortuguÃ©s](docs/screenshots/network-tools-portuguese.png)

## Network Scan V1

Network Scan estÃ¡ limitado de forma intencionada en la versiÃ³n 1.0.0 para que sea seguro y usable.

Comprueba la red local donde estÃ¡ conectado el PC y combina entradas ARP, descubrimiento por ping local, detecciÃ³n de broadcast y un pequeÃ±o conjunto de puertos comunes.

Puede mostrar:

- DirecciÃ³n IP.
- Rol.
- Hostname cuando estÃ¡ disponible.
- DirecciÃ³n MAC cuando estÃ¡ disponible.
- EstimaciÃ³n bÃ¡sica de fabricante.
- Tipo bÃ¡sico de dispositivo.
- Puertos comunes abiertos.
- Origen.
- Latencia/estado de origen.

Los escaneos profundos, escaneos agresivos de puertos y escaneos progresivos de redes grandes /16 o /8 quedan fuera de la V1.

## Idiomas

La interfaz incluye inglÃ©s, espaÃ±ol y portuguÃ©s.

Los textos estÃ¡n guardados en UTF-8 para mantener correctamente los acentos.

## Privacidad

MPTech Network Tools no necesita login, cuenta, servicio cloud ni backend.

Los informes se generan localmente.

## Notas

Windows SmartScreen puede mostrar un aviso porque el ejecutable todavÃ­a no estÃ¡ firmado con certificado de cÃ³digo.

## Stack tÃ©cnico

- Tauri 2
- React
- TypeScript
- Rust
- PowerShell/comandos de red de Windows

## Licencia

MIT License.