import { invoke } from "@tauri-apps/api/core";
import { useMemo, useState } from "react";

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

function App() {
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

  async function loadDetails() {
    setLoadingSummary(true);
    setCopyStatus("");

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

    try {
      const result = await invoke<DiagnosticResult>("run_basic_diagnostics");
      setDiagnostic(result);

      const freshDetails = await invoke<NetworkDetails>("get_network_details");
      setDetails(freshDetails);
    } catch (error) {
      setDiagnostic({
        summary: "Diagnostic failed",
        recommendations: [String(error)],
        checks: [],
        report: String(error)
      });
    } finally {
      setLoadingDiagnostic(false);
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

  async function copyReport() {
    const report = diagnostic?.report || buildQuickReport();

    try {
      await navigator.clipboard.writeText(report);
      setCopyStatus("Report copied to clipboard.");
    } catch {
      setCopyStatus("Could not copy automatically. Select the report text manually.");
    }
  }

  function buildQuickReport() {
    if (!details) {
      return "No network data loaded yet.";
    }

    return [
      "MPTech Network Tools - Quick Report",
      "------------------------------------",
      `Hostname: ${details.hostname}`,
      `OS: ${details.os}`,
      `Primary IP: ${details.primary_ip}`,
      `Gateway: ${details.gateway}`,
      `DNS: ${details.dns_servers.join(", ")}`,
      `Public IP: ${details.public_ip}`,
      "",
      "Adapters:",
      ...details.adapters.map((adapter) => {
        return [
          `- ${adapter.description}`,
          `  MAC: ${adapter.mac_address}`,
          `  IPs: ${adapter.ip_addresses.join(", ")}`,
          `  Gateway: ${adapter.gateways.join(", ")}`,
          `  DNS: ${adapter.dns_servers.join(", ")}`
        ].join("\n");
      })
    ].join("\n");
  }

  const reportText = useMemo(() => {
    if (diagnostic?.report) {
      return diagnostic.report;
    }

    if (details) {
      return buildQuickReport();
    }

    return "";
  }, [diagnostic, details]);

  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="eyebrow">MPTech Tools</p>
          <h1>Network Tools</h1>
          <p>
            Portable Windows toolkit for network diagnostics, ping checks,
            TCP port testing and quick troubleshooting.
          </p>
        </div>

        <div className="hero-actions">
          <button onClick={loadDetails} disabled={loadingSummary}>
            {loadingSummary ? "Loading..." : "Refresh summary"}
          </button>

          <button onClick={runDiagnostic} disabled={loadingDiagnostic}>
            {loadingDiagnostic ? "Checking..." : "Run diagnostic"}
          </button>
        </div>
      </section>

      <section className="status-strip">
        <div>
          <span>Primary IP</span>
          <strong>{details?.primary_ip || "Not loaded"}</strong>
        </div>
        <div>
          <span>Gateway</span>
          <strong>{details?.gateway || "Not loaded"}</strong>
        </div>
        <div>
          <span>DNS</span>
          <strong>{details?.dns_servers?.[0] || "Not loaded"}</strong>
        </div>
        <div>
          <span>Public IP</span>
          <strong>{details?.public_ip || "Not loaded"}</strong>
        </div>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Network summary</h2>

          {details ? (
            <div className="result">
              <p><strong>Hostname:</strong> {details.hostname}</p>
              <p><strong>OS:</strong> {details.os}</p>
              <p><strong>Primary IP:</strong> {details.primary_ip || "Not detected"}</p>
              <p><strong>Gateway:</strong> {details.gateway || "Not detected"}</p>
              <p><strong>DNS:</strong> {details.dns_servers.length ? details.dns_servers.join(", ") : "Not detected"}</p>
              <p><strong>Public IP:</strong> {details.public_ip || "Not available"}</p>
            </div>
          ) : (
            <p className="muted">Click refresh or run diagnostic to load network information.</p>
          )}
        </article>

        <article className="card">
          <h2>Automatic diagnostic</h2>

          {diagnostic ? (
            <div>
              <div className={diagnostic.summary.includes("OK") ? "badge ok" : "badge warn"}>
                {diagnostic.summary}
              </div>

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

              <h3>Recommendations</h3>
              <ul>
                {diagnostic.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="muted">Run diagnostic to check gateway, DNS, internet IP and domain resolution.</p>
          )}
        </article>

        <article className="card">
          <h2>Ping check</h2>
          <label>
            Host or IP
            <input value={pingHost} onChange={(event) => setPingHost(event.target.value)} />
          </label>
          <button onClick={runPing}>Ping</button>
          <pre>{pingResult}</pre>
        </article>

        <article className="card">
          <h2>TCP port test</h2>
          <label>
            Host or IP
            <input value={portHost} onChange={(event) => setPortHost(event.target.value)} />
          </label>
          <label>
            Port
            <input value={port} onChange={(event) => setPort(event.target.value)} />
          </label>
          <button onClick={testPort}>Test port</button>
          <pre>{portResult}</pre>
        </article>

        <article className="card wide">
          <h2>Active adapters</h2>

          {details?.adapters?.length ? (
            <div className="adapter-list">
              {details.adapters.map((adapter) => (
                <div className="adapter" key={`${adapter.description}-${adapter.mac_address}`}>
                  <h3>{adapter.description}</h3>
                  <p><strong>MAC:</strong> {adapter.mac_address || "Not available"}</p>
                  <p><strong>IPs:</strong> {adapter.ip_addresses.join(", ") || "Not detected"}</p>
                  <p><strong>Gateway:</strong> {adapter.gateways.join(", ") || "Not detected"}</p>
                  <p><strong>DNS:</strong> {adapter.dns_servers.join(", ") || "Not detected"}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No active adapters loaded yet.</p>
          )}
        </article>

        <article className="card wide">
          <div className="card-header">
            <h2>Diagnostic report</h2>
            <button onClick={copyReport} disabled={!details && !diagnostic}>
              Copy report
            </button>
          </div>

          {copyStatus && <p className="copy-status">{copyStatus}</p>}

          <pre className="report">{reportText || "Run diagnostic to generate a report."}</pre>
        </article>
      </section>
    </main>
  );
}

export default App;