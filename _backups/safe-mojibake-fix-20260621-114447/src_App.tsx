import { invoke } from "@tauri-apps/api/core";
import { useEffect, useMemo, useState } from "react";

type Language = "en" | "es" | "pt";
type Section = "dashboard" | "diagnostic" | "ping" | "ports" | "scan" | "traceroute" | "adapters" | "report";

type NetworkAdapter = {
  description: string;
  mac_address: string;
  ip_addresses: string[];
  gateways: string[];
  dns_servers: string[];
};

type NetworkDetails = {
  hostname: string;
  os: string;
  primary_ip: string;
  gateway: string;
  dns_servers: string[];
  public_ip: string;
  adapters: NetworkAdapter[];
};

type PingCheck = {
  target: string;
  label: string;
  ok: boolean;
  elapsed_ms: number;
  message: string;
};

type DiagnosticResult = {
  summary: string;
  recommendations: string[];
  checks: PingCheck[];
  report: string;
};

type LocalPort = {
  protocol: string;
  local_address: string;
  local_port: string;
  state: string;
  process_id: string;
  process_name: string;
};

type LanHost = {
  ip: string;
  hostname: string;
  mac_address: string;
  vendor_guess: string;
  device_type: string;
  network_role: string;
  open_ports: string[];
  status: string;
  latency_ms: number;
  latency_display: string;
  source: string;
};

const i18n = {
  en: {
    appTitle: "Network Tools",
    brand: "MPTech Tools",
    subtitle: "Portable Windows toolkit",
    refresh: "Refresh",
    runDiagnostic: "Run diagnostic",
    ready: "Ready",
    status: "Status",
    notLoaded: "Not loaded",
    unknown: "Unknown",
    none: "None",

    dashboard: "Dashboard",
    dashboardDesc: "Network overview",
    diagnostic: "Diagnostic",
    diagnosticDesc: "Automatic checks",
    ping: "Ping",
    pingDesc: "Host reachability",
    ports: "Ports",
    portsDesc: "TCP port test",
    scan: "Network Scan",
    scanDesc: "Local LAN scan",
    traceroute: "Traceroute",
    tracerouteDesc: "Route path check",
    adapters: "Adapters",
    adaptersDesc: "Network interfaces",
    report: "Report",
    reportDesc: "Copy/export info",

    primaryIp: "Primary IP",
    gateway: "Gateway",
    dns: "DNS",
    publicIp: "Public IP",
    networkSummary: "Network summary",
    hostname: "Hostname",
    os: "OS",
    quickActions: "Quick actions",
    fullDiagnostic: "Full diagnostic",
    fullDiagnosticDesc: "Gateway, DNS and internet checks",
    pingTools: "Ping tools",
    pingToolsDesc: "Check host reachability",
    portTest: "Port test",
    portTestDesc: "Check TCP service access",
    scanActionDesc: "Find active devices on local LAN",
    tracerouteActionDesc: "Show route path to a host",
    reportActionDesc: "Copy diagnostic summary",
    emptyDashboard: "Click Refresh or Run diagnostic to load the network summary.",

    automaticDiagnostic: "Automatic diagnostic",
    automaticDiagnosticHelp: "Checks gateway, DNS, internet IP and domain resolution.",
    recommendations: "Recommendations",
    emptyDiagnostic: "Run diagnostic to generate automatic checks and recommendations.",

    hostOrIp: "Host or IP",
    pingHelp: "Check if a host or IP responds. Useful for testing gateway, DNS, public IPs or domains.",
    noPing: "No ping result yet.",

    tcpPortTest: "TCP port test",
    tcpPortHelp: "Check if a TCP service is reachable. Example: google.com:443, router:80, server:22.",
    port: "Port",
    testPort: "Test port",
    noPortResult: "No port test result yet.",
    localPorts: "Local listening ports",
    localPortsHelp: "Shows TCP ports currently listening on this PC.",
    loadPorts: "Load ports",
    loading: "Loading...",
    noLocalPorts: "Click Load ports to show local listening TCP ports.",
    address: "Address",
    process: "Process",
    pid: "PID",

    networkScanTitle: "Network Scan",
    networkScanHelp: "Smart local LAN discovery. It checks active hosts, known ARP entries, broadcast address and common service ports in safe V1 mode.",
    startScan: "Start scan",
    scanning: "Scanning...",
    scanNote: "This module is intended only for your own network or networks where you have permission. V1 avoids public ranges and only checks a small set of common ports on discovered local hosts.",
    scanReady: "No network scan has been run yet.",
    scanRunning: "Scanning local network in safe V1 mode. This may take a few seconds...",
    scanDone: "Scan completed. Entries found:",
    noScanRows: "Run a scan to list active devices on your local network.",
    copyScanReport: "Copy scan report",
    exportScanTxt: "Export scan TXT",
    runScanFirst: "Run Network Scan first.",
    scanReportCopied: "Network Scan report copied to clipboard.",
    scanTxtExported: "Network Scan TXT exported:",
    role: "Role",
    mac: "MAC",
    vendor: "Vendor",
    type: "Type",
    openPorts: "Open ports",
    source: "Source",
    latency: "Latency",

    tracerouteHelp: "Trace the route from this PC to a host or IP. Useful for finding routing, ISP or network path problems.",
    runTraceroute: "Run traceroute",
    tracing: "Tracing...",
    traceRunning: "Running traceroute...",
    traceNote: "Traceroute is manual because it can take several seconds. V1 uses an optimized limit of 12 hops and 600 ms per hop.",
    noTrace: "No traceroute result yet.",

    activeAdapters: "Active adapters",
    activeAdaptersHelp: "Shows active network adapters with IP, gateway, DNS and MAC address.",
    noAdapters: "No active adapters loaded yet. Click Refresh first.",
    ips: "IPs",

    diagnosticReport: "Diagnostic report",
    diagnosticReportHelp: "Copy or export the current network summary and diagnostic result.",
    copyReport: "Copy report",
    exportTxt: "Export TXT",
    reportCopied: "Report copied to clipboard.",
    noReport: "Run diagnostic to generate a report.",
    noExportData: "Run a diagnostic or refresh the summary before exporting.",
    txtExported: "TXT exported:",
    copyFailed: "Could not copy automatically. Select the report text manually."
  },
  es: {
    appTitle: "Herramientas de Red",
    brand: "MPTech Tools",
    subtitle: "Kit portable para Windows",
    refresh: "Actualizar",
    runDiagnostic: "Ejecutar diagnÃƒÂ³stico",
    ready: "Listo",
    status: "Estado",
    notLoaded: "No cargado",
    unknown: "Desconocido",
    none: "Ninguno",

    dashboard: "Panel",
    dashboardDesc: "Resumen de red",
    diagnostic: "DiagnÃƒÂ³stico",
    diagnosticDesc: "Comprobaciones automÃƒÂ¡ticas",
    ping: "Ping",
    pingDesc: "Respuesta del host",
    ports: "Puertos",
    portsDesc: "Prueba TCP",
    scan: "Network Scan",
    scanDesc: "Escaneo LAN local",
    traceroute: "Traceroute",
    tracerouteDesc: "Ruta hasta un host",
    adapters: "Adaptadores",
    adaptersDesc: "Interfaces de red",
    report: "Informe",
    reportDesc: "Copiar/exportar datos",

    primaryIp: "IP principal",
    gateway: "Gateway",
    dns: "DNS",
    publicIp: "IP pÃƒÂºblica",
    networkSummary: "Resumen de red",
    hostname: "Nombre del equipo",
    os: "Sistema",
    quickActions: "Acciones rÃƒÂ¡pidas",
    fullDiagnostic: "DiagnÃƒÂ³stico completo",
    fullDiagnosticDesc: "Gateway, DNS e internet",
    pingTools: "Herramientas Ping",
    pingToolsDesc: "Comprobar respuesta de host",
    portTest: "Prueba de puerto",
    portTestDesc: "Comprobar acceso TCP",
    scanActionDesc: "Encontrar dispositivos en la LAN",
    tracerouteActionDesc: "Ver ruta hasta un host",
    reportActionDesc: "Copiar resumen de diagnÃƒÂ³stico",
    emptyDashboard: "Pulsa Actualizar o Ejecutar diagnÃƒÂ³stico para cargar el resumen de red.",

    automaticDiagnostic: "DiagnÃƒÂ³stico automÃƒÂ¡tico",
    automaticDiagnosticHelp: "Comprueba gateway, DNS, IP de internet y resoluciÃƒÂ³n de dominio.",
    recommendations: "Recomendaciones",
    emptyDiagnostic: "Ejecuta el diagnÃƒÂ³stico para generar comprobaciones y recomendaciones.",

    hostOrIp: "Host o IP",
    pingHelp: "Comprueba si un host o IP responde. ÃƒÅ¡til para probar gateway, DNS, IPs pÃƒÂºblicas o dominios.",
    noPing: "TodavÃƒÂ­a no hay resultado de ping.",

    tcpPortTest: "Prueba de puerto TCP",
    tcpPortHelp: "Comprueba si un servicio TCP es accesible. Ejemplo: google.com:443, router:80, servidor:22.",
    port: "Puerto",
    testPort: "Probar puerto",
    noPortResult: "TodavÃƒÂ­a no hay resultado de prueba de puerto.",
    localPorts: "Puertos locales en escucha",
    localPortsHelp: "Muestra los puertos TCP que estÃƒÂ¡n escuchando en este PC.",
    loadPorts: "Cargar puertos",
    loading: "Cargando...",
    noLocalPorts: "Pulsa Cargar puertos para mostrar los puertos TCP locales en escucha.",
    address: "DirecciÃƒÂ³n",
    process: "Proceso",
    pid: "PID",

    networkScanTitle: "Network Scan",
    networkScanHelp: "Descubrimiento inteligente de LAN local. Comprueba hosts activos, entradas ARP conocidas, direcciÃƒÂ³n broadcast y puertos comunes en modo seguro V1.",
    startScan: "Iniciar escaneo",
    scanning: "Escaneando...",
    scanNote: "Este mÃƒÂ³dulo estÃƒÂ¡ pensado solo para tu propia red o redes donde tengas permiso. La V1 evita rangos pÃƒÂºblicos y solo comprueba un conjunto pequeÃƒÂ±o de puertos comunes en hosts locales descubiertos.",
    scanReady: "TodavÃƒÂ­a no se ha ejecutado ningÃƒÂºn escaneo de red.",
    scanRunning: "Escaneando la red local en modo seguro V1. Puede tardar unos segundos...",
    scanDone: "Escaneo completado. Entradas encontradas:",
    noScanRows: "Ejecuta un escaneo para listar dispositivos activos en tu red local.",
    copyScanReport: "Copiar informe",
    exportScanTxt: "Exportar TXT",
    runScanFirst: "Ejecuta Network Scan primero.",
    scanReportCopied: "Informe de Network Scan copiado al portapapeles.",
    scanTxtExported: "TXT de Network Scan exportado:",
    role: "Rol",
    mac: "MAC",
    vendor: "Fabricante",
    type: "Tipo",
    openPorts: "Puertos abiertos",
    source: "Origen",
    latency: "Latencia",

    tracerouteHelp: "Traza la ruta desde este PC hasta un host o IP. ÃƒÅ¡til para detectar problemas de rutas, ISP o red.",
    runTraceroute: "Ejecutar traceroute",
    tracing: "Trazando...",
    traceRunning: "Ejecutando traceroute...",
    traceNote: "Traceroute es manual porque puede tardar varios segundos. La V1 usa un lÃƒÂ­mite optimizado de 12 saltos y 600 ms por salto.",
    noTrace: "TodavÃƒÂ­a no hay resultado de traceroute.",

    activeAdapters: "Adaptadores activos",
    activeAdaptersHelp: "Muestra adaptadores activos con IP, gateway, DNS y direcciÃƒÂ³n MAC.",
    noAdapters: "No hay adaptadores activos cargados. Pulsa Actualizar primero.",
    ips: "IPs",

    diagnosticReport: "Informe de diagnÃƒÂ³stico",
    diagnosticReportHelp: "Copia o exporta el resumen de red y el resultado del diagnÃƒÂ³stico.",
    copyReport: "Copiar informe",
    exportTxt: "Exportar TXT",
    reportCopied: "Informe copiado al portapapeles.",
    noReport: "Ejecuta el diagnÃƒÂ³stico para generar un informe.",
    noExportData: "Ejecuta un diagnÃƒÂ³stico o actualiza el resumen antes de exportar.",
    txtExported: "TXT exportado:",
    copyFailed: "No se pudo copiar automÃƒÂ¡ticamente. Selecciona el texto del informe manualmente."
  },
  pt: {
    appTitle: "Ferramentas de Rede",
    brand: "MPTech Tools",
    subtitle: "Kit portÃƒÂ¡til para Windows",
    refresh: "Atualizar",
    runDiagnostic: "Executar diagnÃƒÂ³stico",
    ready: "Pronto",
    status: "Estado",
    notLoaded: "NÃƒÂ£o carregado",
    unknown: "Desconhecido",
    none: "Nenhum",

    dashboard: "Painel",
    dashboardDesc: "Resumo da rede",
    diagnostic: "DiagnÃƒÂ³stico",
    diagnosticDesc: "VerificaÃƒÂ§ÃƒÂµes automÃƒÂ¡ticas",
    ping: "Ping",
    pingDesc: "Resposta do host",
    ports: "Portas",
    portsDesc: "Teste TCP",
    scan: "Network Scan",
    scanDesc: "Varredura LAN local",
    traceroute: "Traceroute",
    tracerouteDesc: "Rota atÃƒÂ© um host",
    adapters: "Adaptadores",
    adaptersDesc: "Interfaces de rede",
    report: "RelatÃƒÂ³rio",
    reportDesc: "Copiar/exportar dados",

    primaryIp: "IP principal",
    gateway: "Gateway",
    dns: "DNS",
    publicIp: "IP pÃƒÂºblica",
    networkSummary: "Resumo da rede",
    hostname: "Nome do computador",
    os: "Sistema",
    quickActions: "AÃƒÂ§ÃƒÂµes rÃƒÂ¡pidas",
    fullDiagnostic: "DiagnÃƒÂ³stico completo",
    fullDiagnosticDesc: "Gateway, DNS e internet",
    pingTools: "Ferramentas de Ping",
    pingToolsDesc: "Verificar resposta do host",
    portTest: "Teste de porta",
    portTestDesc: "Verificar acesso TCP",
    scanActionDesc: "Encontrar dispositivos na LAN",
    tracerouteActionDesc: "Mostrar rota atÃƒÂ© um host",
    reportActionDesc: "Copiar resumo do diagnÃƒÂ³stico",
    emptyDashboard: "Clique em Atualizar ou Executar diagnÃƒÂ³stico para carregar o resumo da rede.",

    automaticDiagnostic: "DiagnÃƒÂ³stico automÃƒÂ¡tico",
    automaticDiagnosticHelp: "Verifica gateway, DNS, IP de internet e resoluÃƒÂ§ÃƒÂ£o de domÃƒÂ­nio.",
    recommendations: "RecomendaÃƒÂ§ÃƒÂµes",
    emptyDiagnostic: "Execute o diagnÃƒÂ³stico para gerar verificaÃƒÂ§ÃƒÂµes e recomendaÃƒÂ§ÃƒÂµes.",

    hostOrIp: "Host ou IP",
    pingHelp: "Verifica se um host ou IP responde. ÃƒÅ¡til para testar gateway, DNS, IPs pÃƒÂºblicas ou domÃƒÂ­nios.",
    noPing: "Ainda nÃƒÂ£o hÃƒÂ¡ resultado de ping.",

    tcpPortTest: "Teste de porta TCP",
    tcpPortHelp: "Verifica se um serviÃƒÂ§o TCP estÃƒÂ¡ acessÃƒÂ­vel. Exemplo: google.com:443, router:80, servidor:22.",
    port: "Porta",
    testPort: "Testar porta",
    noPortResult: "Ainda nÃƒÂ£o hÃƒÂ¡ resultado de teste de porta.",
    localPorts: "Portas locais em escuta",
    localPortsHelp: "Mostra as portas TCP que estÃƒÂ£o em escuta neste PC.",
    loadPorts: "Carregar portas",
    loading: "Carregando...",
    noLocalPorts: "Clique em Carregar portas para mostrar as portas TCP locais em escuta.",
    address: "EndereÃƒÂ§o",
    process: "Processo",
    pid: "PID",

    networkScanTitle: "Network Scan",
    networkScanHelp: "Descoberta inteligente da LAN local. Verifica hosts ativos, entradas ARP conhecidas, endereÃƒÂ§o broadcast e portas comuns em modo seguro V1.",
    startScan: "Iniciar varredura",
    scanning: "Escaneando...",
    scanNote: "Este mÃƒÂ³dulo deve ser usado apenas na sua prÃƒÂ³pria rede ou em redes onde vocÃƒÂª tem permissÃƒÂ£o. A V1 evita faixas pÃƒÂºblicas e verifica apenas um pequeno conjunto de portas comuns em hosts locais descobertos.",
    scanReady: "Ainda nÃƒÂ£o foi executada nenhuma varredura de rede.",
    scanRunning: "Escaneando a rede local em modo seguro V1. Pode levar alguns segundos...",
    scanDone: "Varredura concluÃƒÂ­da. Entradas encontradas:",
    noScanRows: "Execute uma varredura para listar dispositivos ativos na sua rede local.",
    copyScanReport: "Copiar relatÃƒÂ³rio",
    exportScanTxt: "Exportar TXT",
    runScanFirst: "Execute o Network Scan primeiro.",
    scanReportCopied: "RelatÃƒÂ³rio do Network Scan copiado para a ÃƒÂ¡rea de transferÃƒÂªncia.",
    scanTxtExported: "TXT do Network Scan exportado:",
    role: "FunÃƒÂ§ÃƒÂ£o",
    mac: "MAC",
    vendor: "Fabricante",
    type: "Tipo",
    openPorts: "Portas abertas",
    source: "Origem",
    latency: "LatÃƒÂªncia",

    tracerouteHelp: "TraÃƒÂ§a a rota deste PC atÃƒÂ© um host ou IP. ÃƒÅ¡til para detectar problemas de rota, ISP ou rede.",
    runTraceroute: "Executar traceroute",
    tracing: "TraÃƒÂ§ando...",
    traceRunning: "Executando traceroute...",
    traceNote: "Traceroute ÃƒÂ© manual porque pode levar vÃƒÂ¡rios segundos. A V1 usa um limite otimizado de 12 saltos e 600 ms por salto.",
    noTrace: "Ainda nÃƒÂ£o hÃƒÂ¡ resultado de traceroute.",

    activeAdapters: "Adaptadores ativos",
    activeAdaptersHelp: "Mostra adaptadores ativos com IP, gateway, DNS e endereÃƒÂ§o MAC.",
    noAdapters: "Nenhum adaptador ativo carregado. Clique em Atualizar primeiro.",
    ips: "IPs",

    diagnosticReport: "RelatÃƒÂ³rio de diagnÃƒÂ³stico",
    diagnosticReportHelp: "Copie ou exporte o resumo da rede e o resultado do diagnÃƒÂ³stico.",
    copyReport: "Copiar relatÃƒÂ³rio",
    exportTxt: "Exportar TXT",
    reportCopied: "RelatÃƒÂ³rio copiado para a ÃƒÂ¡rea de transferÃƒÂªncia.",
    noReport: "Execute o diagnÃƒÂ³stico para gerar um relatÃƒÂ³rio.",
    noExportData: "Execute um diagnÃƒÂ³stico ou atualize o resumo antes de exportar.",
    txtExported: "TXT exportado:",
    copyFailed: "NÃƒÂ£o foi possÃƒÂ­vel copiar automaticamente. Selecione o texto do relatÃƒÂ³rio manualmente."
  }
} as const;

function App() {
  const [language, setLanguage] = useState<Language>("en");
  const t = i18n[language];

  const sections: { id: Section; label: string; description: string }[] = [
    { id: "dashboard", label: t.dashboard, description: t.dashboardDesc },
    { id: "diagnostic", label: t.diagnostic, description: t.diagnosticDesc },
    { id: "ping", label: t.ping, description: t.pingDesc },
    { id: "ports", label: t.ports, description: t.portsDesc },
    { id: "scan", label: t.scan, description: t.scanDesc },
    { id: "traceroute", label: t.traceroute, description: t.tracerouteDesc },
    { id: "adapters", label: t.adapters, description: t.adaptersDesc },
    { id: "report", label: t.report, description: t.reportDesc }
  ];

  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [details, setDetails] = useState<NetworkDetails | null>(null);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingDiagnostic, setLoadingDiagnostic] = useState(false);

  const [pingHost, setPingHost] = useState("8.8.8.8");
  const [pingResult, setPingResult] = useState("");

  const [portHost, setPortHost] = useState("google.com");
  const [port, setPort] = useState("443");
  const [portResult, setPortResult] = useState("");

  const [copyStatus, setCopyStatus] = useState("");
  const [exportStatus, setExportStatus] = useState("");

  const [traceHost, setTraceHost] = useState("google.com");
  const [traceResult, setTraceResult] = useState("");
  const [loadingTrace, setLoadingTrace] = useState(false);

  const [localPorts, setLocalPorts] = useState<LocalPort[]>([]);
  const [loadingPorts, setLoadingPorts] = useState(false);

  const [lanHosts, setLanHosts] = useState<LanHost[]>([]);
  const [loadingScan, setLoadingScan] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [scanCopyStatus, setScanCopyStatus] = useState("");

  async function loadDetails() {
    setLoadingSummary(true);
    setCopyStatus("");
    setExportStatus("");

    try {
      const result = await invoke<NetworkDetails>("get_network_details");
      setDetails(result);
    } catch (error) {
      setPingResult(String(error));
    } finally {
      setLoadingSummary(false);
    }
  }

  async function runDiagnostic() {
    setLoadingDiagnostic(true);
    setCopyStatus("");
    setExportStatus("");

    try {
      const result = await invoke<DiagnosticResult>("run_basic_diagnostics");
      setDiagnostic(result);

      const freshDetails = await invoke<NetworkDetails>("get_network_details");
      setDetails(freshDetails);
      setActiveSection("diagnostic");
    } catch (error) {
      setDiagnostic({
        summary: "Diagnostic failed",
        recommendations: [String(error)],
        checks: [],
        report: String(error)
      });
      setActiveSection("diagnostic");
    } finally {
      setLoadingDiagnostic(false);
    }
  }

  async function runTraceroute() {
    setLoadingTrace(true);
    setTraceResult(t.traceRunning);

    try {
      const result = await invoke<string>("trace_route", { host: traceHost });
      setTraceResult(result);
    } catch (error) {
      setTraceResult(String(error));
    } finally {
      setLoadingTrace(false);
    }
  }

  async function runPing() {
    setPingResult("Checking...");

    try {
      const result = await invoke<string>("ping_host", { host: pingHost });
      setPingResult(result);
    } catch (error) {
      setPingResult(String(error));
    }
  }

  async function testPort() {
    setPortResult("Checking...");

    try {
      const result = await invoke<string>("test_tcp_port", {
        host: portHost,
        port: Number(port),
        timeoutMs: 2500
      });

      setPortResult(result);
    } catch (error) {
      setPortResult(String(error));
    }
  }

  async function runNetworkScan() {
    setLoadingScan(true);
    setScanCopyStatus("");
    setScanResult(t.scanRunning);

    try {
      const result = await invoke<LanHost[]>("scan_local_network");
      setLanHosts(result);
      setScanResult(`${t.scanDone} ${result.length}`);
    } catch (error) {
      setScanResult(String(error));
    } finally {
      setLoadingScan(false);
    }
  }

  async function loadLocalPorts() {
    setLoadingPorts(true);

    try {
      const result = await invoke<LocalPort[]>("get_local_listening_ports");
      setLocalPorts(result);
    } catch (error) {
      setPortResult(String(error));
    } finally {
      setLoadingPorts(false);
    }
  }

  function buildNetworkScanReport() {
    if (!lanHosts.length) {
      return "No Network Scan has been run yet.";
    }

    const hostBlocks = lanHosts.map((host) => {
      return [
        `IP: ${host.ip}`,
        `${t.role}: ${host.network_role || "device"}`,
        `${t.hostname}: ${host.hostname || t.unknown}`,
        `${t.mac}: ${host.mac_address || t.unknown}`,
        `${t.vendor}: ${host.vendor_guess || t.unknown}`,
        `${t.type}: ${host.device_type || "unknown"}`,
        `${t.openPorts}: ${host.open_ports.length ? host.open_ports.join(", ") : t.none}`,
        `${t.source}: ${host.source || "unknown"}`,
        `${t.latency}: ${host.latency_display || `${host.latency_ms} ms`}`
      ].join("\n");
    });

    return [
      "MPTech Network Tools - Network Scan Report",
      "------------------------------------------",
      `${t.scanDone} ${lanHosts.length}`,
      "",
      hostBlocks.join("\n\n")
    ].join("\n");
  }

  async function copyNetworkScanReport() {
    if (!lanHosts.length) {
      setScanCopyStatus(t.runScanFirst);
      return;
    }

    try {
      await navigator.clipboard.writeText(buildNetworkScanReport());
      setScanCopyStatus(t.scanReportCopied);
    } catch {
      setScanCopyStatus(t.copyFailed);
    }
  }

  function buildQuickReport() {
    if (!details) {
      return "No network data loaded yet.";
    }

    return [
      "MPTech Network Tools - Quick Report",
      "------------------------------------",
      `${t.hostname}: ${details.hostname}`,
      `${t.os}: ${details.os}`,
      `${t.primaryIp}: ${details.primary_ip}`,
      `${t.gateway}: ${details.gateway}`,
      `${t.dns}: ${details.dns_servers.join(", ")}`,
      `${t.publicIp}: ${details.public_ip}`,
      "",
      `${t.adapters}:`,
      ...details.adapters.map((adapter) => {
        return [
          `- ${adapter.description}`,
          `  ${t.mac}: ${adapter.mac_address}`,
          `  ${t.ips}: ${adapter.ip_addresses.join(", ")}`,
          `  ${t.gateway}: ${adapter.gateways.join(", ")}`,
          `  ${t.dns}: ${adapter.dns_servers.join(", ")}`
        ].join("\n");
      })
    ].join("\n");
  }


  function buildFullReport() {
    const blocks: string[] = [];

    blocks.push("MPTech Network Tools - Full Report");
    blocks.push("----------------------------------");
    blocks.push("");

    blocks.push("Network Summary");
    blocks.push("---------------");

    if (details) {
      blocks.push(buildQuickReport());
    } else {
      blocks.push("No network summary loaded yet.");
    }

    blocks.push("");
    blocks.push("Diagnostic");
    blocks.push("----------");

    if (diagnostic) {
      blocks.push(`Summary: ${diagnostic.summary}`);
      blocks.push("");

      if (diagnostic.checks.length) {
        blocks.push("Checks:");
        diagnostic.checks.forEach((check) => {
          blocks.push(`- ${check.label}: ${check.ok ? "OK" : "FAIL"} - ${check.message}`);
        });
        blocks.push("");
      }

      if (diagnostic.recommendations.length) {
        blocks.push("Recommendations:");
        diagnostic.recommendations.forEach((item) => {
          blocks.push(`- ${item}`);
        });
      }
    } else {
      blocks.push("No diagnostic has been run yet.");
    }

    blocks.push("");
    blocks.push("Network Scan");
    blocks.push("------------");

    if (lanHosts.length) {
      blocks.push(buildNetworkScanReport());
    } else {
      blocks.push("No Network Scan has been run yet.");
    }

    return blocks.join("\n");
  }

  async function exportTxtReport() {
    const report = buildFullReport();

    if (!details && !diagnostic && !lanHosts.length) {
      setExportStatus(t.noExportData);
      return;
    }

    try {
      const path = await invoke<string>("export_report_to_txt", {
        filePrefix: "mptech-network-tools-report",
        content: report
      });

      setExportStatus(`${t.txtExported} ${path}`);
    } catch (error) {
      setExportStatus(String(error));
    }
  }

  async function exportNetworkScanTxt() {
    if (!lanHosts.length) {
      setScanCopyStatus(t.runScanFirst);
      return;
    }

    try {
      const path = await invoke<string>("export_report_to_txt", {
        filePrefix: "mptech-network-scan-report",
        content: buildNetworkScanReport()
      });

      setScanCopyStatus(`${t.scanTxtExported} ${path}`);
    } catch (error) {
      setScanCopyStatus(String(error));
    }
  }

  async function copyReport() {
    const report = buildFullReport();

    try {
      await navigator.clipboard.writeText(report);
      setCopyStatus(t.reportCopied);
    } catch {
      setCopyStatus(t.copyFailed);
    }
  }

  useEffect(() => {
    loadDetails();
  }, []);

  const reportText = useMemo(() => {
    if (details || diagnostic || lanHosts.length) {
      return buildFullReport();
    }

    return "";
  }, [diagnostic, details, lanHosts, language]);

  const dnsText = details?.dns_servers?.length ? details.dns_servers.join(", ") : t.notLoaded;
  const diagnosticOk = diagnostic?.summary.includes("OK");

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">NT</div>
          <div>
            <p>{t.brand}</p>
            <h1>{t.appTitle}</h1>
          </div>
        </div>

        <nav className="nav">
          {sections.map((section) => (
            <button
              key={section.id}
              className={activeSection === section.id ? "nav-item active" : "nav-item"}
              onClick={() => setActiveSection(section.id)}
            >
              <strong>{section.label}</strong>
              <span>{section.description}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span>{t.status}</span>
          <strong>{diagnostic?.summary || t.ready}</strong>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">{t.subtitle}</p>
            <h2>{sections.find((section) => section.id === activeSection)?.label}</h2>
          </div>

          <div className="topbar-actions">
            <select
              className="language-select"
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
              aria-label="Language"
            >
              <option value="en">English</option>
              <option value="es">EspaÃƒÂ±ol</option>
              <option value="pt">PortuguÃƒÂªs</option>
            </select>

            <button className="btn btn-secondary" onClick={loadDetails} disabled={loadingSummary}>
              {loadingSummary ? t.loading : t.refresh}
            </button>
            <button className="btn btn-primary" onClick={runDiagnostic} disabled={loadingDiagnostic}>
              {loadingDiagnostic ? "Checking..." : t.runDiagnostic}
            </button>
          </div>
        </header>

        {activeSection === "dashboard" && (
          <section className="section">
            <div className="metric-grid">
              <Metric title={t.primaryIp} value={details?.primary_ip || t.notLoaded} />
              <Metric title={t.gateway} value={details?.gateway || t.notLoaded} />
              <Metric title={t.dns} value={details?.dns_servers?.[0] || t.notLoaded} />
              <Metric title={t.publicIp} value={details?.public_ip || t.notLoaded} />
            </div>

            <div className="panel-grid">
              <article className="panel">
                <h3>{t.networkSummary}</h3>
                {details ? (
                  <div className="info-list">
                    <Info label={t.hostname} value={details.hostname} />
                    <Info label={t.os} value={details.os} />
                    <Info label={t.primaryIp} value={details.primary_ip || "Not detected"} />
                    <Info label={t.gateway} value={details.gateway || "Not detected"} />
                    <Info label={t.dns} value={dnsText} />
                    <Info label={t.publicIp} value={details.public_ip || "Not available"} />
                  </div>
                ) : (
                  <Empty text={t.emptyDashboard} />
                )}
              </article>

              <article className="panel">
                <h3>{t.quickActions}</h3>
                <div className="quick-actions">
                  <button className="quick-action" onClick={runDiagnostic} disabled={loadingDiagnostic}>
                    <span>{t.fullDiagnostic}</span>
                    <small>{t.fullDiagnosticDesc}</small>
                  </button>
                  <button className="quick-action" onClick={() => setActiveSection("ping")}>
                    <span>{t.pingTools}</span>
                    <small>{t.pingToolsDesc}</small>
                  </button>
                  <button className="quick-action" onClick={() => setActiveSection("ports")}>
                    <span>{t.portTest}</span>
                    <small>{t.portTestDesc}</small>
                  </button>
                  <button className="quick-action" onClick={() => setActiveSection("scan")}>
                    <span>{t.scan}</span>
                    <small>{t.scanActionDesc}</small>
                  </button>
                  <button className="quick-action" onClick={() => setActiveSection("traceroute")}>
                    <span>{t.traceroute}</span>
                    <small>{t.tracerouteActionDesc}</small>
                  </button>
                  <button className="quick-action" onClick={() => setActiveSection("report")}>
                    <span>{t.report}</span>
                    <small>{t.reportActionDesc}</small>
                  </button>
                </div>
              </article>
            </div>
          </section>
        )}

        {activeSection === "diagnostic" && (
          <section className="section">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <h3>{t.automaticDiagnostic}</h3>
                  <p>{t.automaticDiagnosticHelp}</p>
                </div>
                {diagnostic && (
                  <div className={diagnosticOk ? "badge ok" : "badge warn"}>
                    {diagnostic.summary}
                  </div>
                )}
              </div>

              {diagnostic ? (
                <>
                  <div className="checks">
                    {diagnostic.checks.map((check) => (
                      <div className="check-row" key={`${check.label}-${check.target}`}>
                        <span className={check.ok ? "dot ok-dot" : "dot fail-dot"} />
                        <div>
                          <strong>{check.label}</strong>
                          <p>{check.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h4>{t.recommendations}</h4>
                  <ul className="clean-list">
                    {diagnostic.recommendations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <Empty text={t.emptyDiagnostic} />
              )}
            </article>
          </section>
        )}

        {activeSection === "ping" && (
          <section className="section">
            <article className="panel">
              <h3>{t.ping}</h3>
              <p className="panel-subtitle">{t.pingHelp}</p>

              <div className="form-row">
                <label>
                  {t.hostOrIp}
                  <input value={pingHost} onChange={(event) => setPingHost(event.target.value)} />
                </label>
                <button className="btn btn-primary" onClick={runPing}>{t.ping}</button>
              </div>

              <pre className="terminal">{pingResult || t.noPing}</pre>
            </article>
          </section>
        )}

        {activeSection === "ports" && (
          <section className="section">
            <div className="panel-grid">
              <article className="panel">
                <h3>{t.tcpPortTest}</h3>
                <p className="panel-subtitle">{t.tcpPortHelp}</p>

                <div className="form-grid">
                  <label>
                    {t.hostOrIp}
                    <input value={portHost} onChange={(event) => setPortHost(event.target.value)} />
                  </label>

                  <label>
                    {t.port}
                    <input value={port} onChange={(event) => setPort(event.target.value)} />
                  </label>
                </div>

                <button className="btn btn-primary" onClick={testPort}>{t.testPort}</button>

                <pre className="terminal">{portResult || t.noPortResult}</pre>
              </article>

              <article className="panel">
                <div className="panel-header">
                  <div>
                    <h3>{t.localPorts}</h3>
                    <p>{t.localPortsHelp}</p>
                  </div>
                  <button className="btn btn-secondary" onClick={loadLocalPorts} disabled={loadingPorts}>
                    {loadingPorts ? t.loading : t.loadPorts}
                  </button>
                </div>

                {localPorts.length ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>{t.port}</th>
                          <th>{t.address}</th>
                          <th>{t.process}</th>
                          <th>{t.pid}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {localPorts.map((item) => (
                          <tr key={`${item.local_address}-${item.local_port}-${item.process_id}`}>
                            <td>{item.local_port}</td>
                            <td>{item.local_address}</td>
                            <td>{item.process_name || t.unknown}</td>
                            <td>{item.process_id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty text={t.noLocalPorts} />
                )}
              </article>
            </div>
          </section>
        )}

        {activeSection === "scan" && (
          <section className="section">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <h3>{t.networkScanTitle}</h3>
                  <p>{t.networkScanHelp}</p>
                </div>
                <div className="panel-actions">
                  {lanHosts.length > 0 && (
                    <>
                      <button className="btn btn-secondary" onClick={copyNetworkScanReport}>
                        {t.copyScanReport}
                      </button>
                      <button className="btn btn-secondary" onClick={exportNetworkScanTxt}>
                        {t.exportScanTxt}
                      </button>
                    </>
                  )}
                  <button className="btn btn-primary" onClick={runNetworkScan} disabled={loadingScan}>
                    {loadingScan ? t.scanning : t.startScan}
                  </button>
                </div>
              </div>

              <div className="scan-note">{t.scanNote}</div>

              {scanCopyStatus && <p className="copy-status">{scanCopyStatus}</p>}

              <pre className="terminal">{scanResult || t.scanReady}</pre>

              {lanHosts.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>IP</th>
                        <th>{t.role}</th>
                        <th>{t.hostname}</th>
                        <th>{t.mac}</th>
                        <th>{t.vendor}</th>
                        <th>{t.type}</th>
                        <th>{t.openPorts}</th>
                        <th>{t.source}</th>
                        <th>{t.latency}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lanHosts.map((host) => (
                        <tr key={host.ip}>
                          <td>{host.ip}</td>
                          <td>{host.network_role || "device"}</td>
                          <td>{host.hostname || t.unknown}</td>
                          <td>{host.mac_address || t.unknown}</td>
                          <td>{host.vendor_guess || t.unknown}</td>
                          <td>{host.device_type || "unknown"}</td>
                          <td>{host.open_ports.length ? host.open_ports.join(", ") : t.none}</td>
                          <td>{host.source || "unknown"}</td>
                          <td>{host.latency_display || `${host.latency_ms} ms`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty text={t.noScanRows} />
              )}
            </article>
          </section>
        )}

        {activeSection === "traceroute" && (
          <section className="section">
            <article className="panel">
              <h3>{t.traceroute}</h3>
              <p className="panel-subtitle">{t.tracerouteHelp}</p>

              <div className="form-row">
                <label>
                  {t.hostOrIp}
                  <input value={traceHost} onChange={(event) => setTraceHost(event.target.value)} />
                </label>
                <button className="btn btn-primary" onClick={runTraceroute} disabled={loadingTrace}>
                  {loadingTrace ? t.tracing : t.runTraceroute}
                </button>
              </div>

              <div className="scan-note">{t.traceNote}</div>

              <pre className="terminal">{traceResult || t.noTrace}</pre>
            </article>
          </section>
        )}

        {activeSection === "adapters" && (
          <section className="section">
            <article className="panel">
              <h3>{t.activeAdapters}</h3>
              <p className="panel-subtitle">{t.activeAdaptersHelp}</p>

              {details?.adapters?.length ? (
                <div className="adapter-list">
                  {details.adapters.map((adapter) => (
                    <div className="adapter" key={`${adapter.description}-${adapter.mac_address}`}>
                      <h4>{adapter.description}</h4>
                      <Info label={t.mac} value={adapter.mac_address || t.unknown} />
                      <Info label={t.ips} value={adapter.ip_addresses.join(", ") || "Not detected"} />
                      <Info label={t.gateway} value={adapter.gateways.join(", ") || "Not detected"} />
                      <Info label={t.dns} value={adapter.dns_servers.join(", ") || "Not detected"} />
                    </div>
                  ))}
                </div>
              ) : (
                <Empty text={t.noAdapters} />
              )}
            </article>
          </section>
        )}

        {activeSection === "report" && (
          <section className="section">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <h3>{t.diagnosticReport}</h3>
                  <p>{t.diagnosticReportHelp}</p>
                </div>
                <div className="panel-actions">
                  <button className="btn btn-secondary" onClick={copyReport} disabled={!details && !diagnostic && !lanHosts.length}>
                    {t.copyReport}
                  </button>
                  <button className="btn btn-primary" onClick={exportTxtReport} disabled={!details && !diagnostic && !lanHosts.length}>
                    {t.exportTxt}
                  </button>
                </div>
              </div>

              {copyStatus && <p className="copy-status">{copyStatus}</p>}
              {exportStatus && <p className="copy-status">{exportStatus}</p>}

              <pre className="terminal report">{reportText || t.noReport}</pre>
            </article>
          </section>
        )}
      </section>
    </main>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <article className="metric">
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="empty">{text}</div>;
}

export default App;