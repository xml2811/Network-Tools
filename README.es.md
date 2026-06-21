# MPTech Network Tools

Herramienta portable para Windows enfocada en diagnÃƒÂ³stico de red, inspecciÃƒÂ³n de red local y soluciÃƒÂ³n rÃƒÂ¡pida de problemas.

![Panel principal](docs/screenshots/network-tools-dashboard.png)

## Descargar

Ve a la ÃƒÂºltima release y descarga:

**MPTech-Network-Tools-v1.0.0-portable.exe**

La versiÃƒÂ³n portable es la descarga recomendada. No necesita instalaciÃƒÂ³n.

Si estÃƒÂ¡ disponible, la versiÃƒÂ³n installer es opcional.

## QuÃƒÂ© hace

MPTech Network Tools es una pequeÃƒÂ±a herramienta de escritorio para Windows pensada para diagnÃƒÂ³stico prÃƒÂ¡ctico de red.

EstÃƒÂ¡ diseÃƒÂ±ada para tÃƒÂ©cnicos, sysadmins, desarrolladores, estudiantes de IT y usuarios avanzados que quieren informaciÃƒÂ³n rÃƒÂ¡pida de red sin abrir varias herramientas distintas.

## Funciones

- Resumen automÃƒÂ¡tico de red al abrir la app.
- DetecciÃƒÂ³n de IP local, gateway, DNS e IP pÃƒÂºblica.
- InformaciÃƒÂ³n de adaptadores de red activos.
- DiagnÃƒÂ³stico automÃƒÂ¡tico.
- Herramienta de ping.
- Prueba de puertos TCP.
- Visor de puertos locales en escucha.
- Network Scan seguro V1.
- DetecciÃƒÂ³n de direcciÃƒÂ³n broadcast.
- DetecciÃƒÂ³n de MAC cuando estÃƒÂ¡ disponible.
- EstimaciÃƒÂ³n bÃƒÂ¡sica de fabricante.
- Inferencia bÃƒÂ¡sica de tipo de dispositivo.
- DetecciÃƒÂ³n de puertos comunes locales.
- Traceroute.
- Copiar informe al portapapeles.
- Exportar informe a TXT eligiendo dÃƒÂ³nde guardar.
- Informe propio de Network Scan.
- Interfaz multidioma:
  - InglÃƒÂ©s
  - EspaÃƒÂ±ol
  - PortuguÃƒÂ©s.

## Capturas

### Panel principal

![Panel principal](docs/screenshots/network-tools-dashboard.png)

### DiagnÃƒÂ³stico

![DiagnÃƒÂ³stico](docs/screenshots/network-tools-diagnostic.png)

### Network Scan

![Network Scan](docs/screenshots/network-tools-network-scan.png)

### Traceroute

![Traceroute](docs/screenshots/network-tools-traceroute.png)

### Puertos

![Puertos](docs/screenshots/network-tools-ports.png)

### Informe

![Informe](docs/screenshots/network-tools-report.png)

### Interfaz en espaÃƒÂ±ol

![EspaÃƒÂ±ol](docs/screenshots/network-tools-spanish.png)

### Interfaz en portuguÃƒÂ©s

![PortuguÃƒÂ©s](docs/screenshots/network-tools-portuguese.png)

## Network Scan V1

Network Scan estÃƒÂ¡ limitado de forma intencionada en la versiÃƒÂ³n 1.0.0 para que sea seguro y usable.

Comprueba la red local donde estÃƒÂ¡ conectado el PC y combina entradas ARP, descubrimiento por ping local, detecciÃƒÂ³n de broadcast y un pequeÃƒÂ±o conjunto de puertos comunes.

Puede mostrar:

- DirecciÃƒÂ³n IP.
- Rol.
- Hostname cuando estÃƒÂ¡ disponible.
- DirecciÃƒÂ³n MAC cuando estÃƒÂ¡ disponible.
- EstimaciÃƒÂ³n bÃƒÂ¡sica de fabricante.
- Tipo bÃƒÂ¡sico de dispositivo.
- Puertos comunes abiertos.
- Origen.
- Latencia/estado de origen.

Los escaneos profundos, escaneos agresivos de puertos y escaneos progresivos de redes grandes /16 o /8 quedan fuera de la V1.

## Idiomas

La interfaz incluye inglÃƒÂ©s, espaÃƒÂ±ol y portuguÃƒÂ©s.

Los textos estÃƒÂ¡n guardados en UTF-8 para mantener correctamente los acentos.

## Privacidad

MPTech Network Tools no necesita login, cuenta, servicio cloud ni backend.

Los informes se generan localmente.

## Notas

Windows SmartScreen puede mostrar un aviso porque el ejecutable todavÃƒÂ­a no estÃƒÂ¡ firmado con certificado de cÃƒÂ³digo.

## Stack tÃƒÂ©cnico

- Tauri 2
- React
- TypeScript
- Rust
- PowerShell/comandos de red de Windows

## Licencia

MIT License.