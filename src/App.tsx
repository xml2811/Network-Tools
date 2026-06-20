import { invoke } from "@tauri-apps/api/core";
import { useMemo, useState } from "react";

type Section = "dashboard" | "diagnostic" | "ping" | "ports" | "adapters" | "report";

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

const sections: { id: Section; label: string; description: string }[] = [
  { id: "dashboard", label: "Dashboard", description: "Network overview" },
  { id: "diagnostic", label: "Diagnostic", description: "Automatic checks" },
  { id: "ping", label: "Ping", description: "Host reachability" },
  { id: "ports", label: "Ports", description: "TCP port test" },
  { id: "adapters", label: "Adapters", description: "Network interfaces" },
  { id: "report", label: "Report", description: "Copy/export info" }
];

function App() {
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

  async function copyReport() {
    const report = diagnostic?.report || buildQuickReport();

    try {
      await navigator.clipboard.writeText(report);
      setCopyStatus("Report copied to clipboard.");
    } catch {
      setCopyStatus("Could not copy automatically. Select the report text manually.");
    }
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

  const dnsText = details?.dns_servers?.length ? details.dns_servers.join(", ") : "Not loaded";
  const diagnosticOk = diagnostic?.summary.includes("OK");

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">NT</div>
          <div>
            <p>MPTech Tools</p>
            <h1>Network Tools</h1>
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
          <span>Status</span>
          <strong>{diagnostic?.summary || "Ready"}</strong>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Portable Windows toolkit</p>
            <h2>{sections.find((section) => section.id === activeSection)?.label}</h2>
          </div>

          <div className="topbar-actions">
            <button onClick={loadDetails} disabled={loadingSummary}>
              {loadingSummary ? "Loading..." : "Refresh"}
            </button>
            <button onClick={runDiagnostic} disabled={loadingDiagnostic}>
              {loadingDiagnostic ? "Checking..." : "Run diagnostic"}
            </button>
          </div>
        </header>

        {activeSection === "dashboard" && (
          <section className="section">
            <div className="metric-grid">
              <Metric title="Primary IP" value={details?.primary_ip || "Not loaded"} />
              <Metric title="Gateway" value={details?.gateway || "Not loaded"} />
              <Metric title="DNS" value={details?.dns_servers?.[0] || "Not loaded"} />
              <Metric title="Public IP" value={details?.public_ip || "Not loaded"} />
            </div>

            <div className="panel-grid">
              <article className="panel">
                <h3>Network summary</h3>
                {details ? (
                  <div className="info-list">
                    <Info label="Hostname" value={details.hostname} />
                    <Info label="OS" value={details.os} />
                    <Info label="Primary IP" value={details.primary_ip || "Not detected"} />
                    <Info label="Gateway" value={details.gateway || "Not detected"} />
                    <Info label="DNS" value={dnsText} />
                    <Info label="Public IP" value={details.public_ip || "Not available"} />
                  </div>
                ) : (
                  <Empty text="Click Refresh or Run diagnostic to load the network summary." />
                )}
              </article>

              <article className="panel">
                <h3>Quick actions</h3>
                <div className="quick-actions">
                  <button onClick={runDiagnostic} disabled={loadingDiagnostic}>
                    Full diagnostic
                  </button>
                  <button onClick={() => setActiveSection("ping")}>
                    Open ping tools
                  </button>
                  <button onClick={() => setActiveSection("ports")}>
                    Open port test
                  </button>
                  <button onClick={() => setActiveSection("report")}>
                    Open report
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
                  <h3>Automatic diagnostic</h3>
                  <p>Checks gateway, DNS, internet IP and domain resolution.</p>
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

                  <h4>Recommendations</h4>
                  <ul className="clean-list">
                    {diagnostic.recommendations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <Empty text="Run diagnostic to generate automatic checks and recommendations." />
              )}
            </article>
          </section>
        )}

        {activeSection === "ping" && (
          <section className="section">
            <article className="panel">
              <h3>Ping check</h3>
              <p className="panel-subtitle">
                Check if a host or IP responds. Useful for testing gateway, DNS, public IPs or domains.
              </p>

              <div className="form-row">
                <label>
                  Host or IP
                  <input value={pingHost} onChange={(event) => setPingHost(event.target.value)} />
                </label>
                <button onClick={runPing}>Ping</button>
              </div>

              <pre className="terminal">{pingResult || "No ping result yet."}</pre>
            </article>
          </section>
        )}

        {activeSection === "ports" && (
          <section className="section">
            <article className="panel">
              <h3>TCP port test</h3>
              <p className="panel-subtitle">
                Check if a TCP service is reachable. Example: google.com:443, router:80, server:22.
              </p>

              <div className="form-grid">
                <label>
                  Host or IP
                  <input value={portHost} onChange={(event) => setPortHost(event.target.value)} />
                </label>

                <label>
                  Port
                  <input value={port} onChange={(event) => setPort(event.target.value)} />
                </label>
              </div>

              <button onClick={testPort}>Test port</button>

              <pre className="terminal">{portResult || "No port test result yet."}</pre>
            </article>
          </section>
        )}

        {activeSection === "adapters" && (
          <section className="section">
            <article className="panel">
              <h3>Active adapters</h3>
              <p className="panel-subtitle">
                Shows active network adapters with IP, gateway, DNS and MAC address.
              </p>

              {details?.adapters?.length ? (
                <div className="adapter-list">
                  {details.adapters.map((adapter) => (
                    <div className="adapter" key={`${adapter.description}-${adapter.mac_address}`}>
                      <h4>{adapter.description}</h4>
                      <Info label="MAC" value={adapter.mac_address || "Not available"} />
                      <Info label="IPs" value={adapter.ip_addresses.join(", ") || "Not detected"} />
                      <Info label="Gateway" value={adapter.gateways.join(", ") || "Not detected"} />
                      <Info label="DNS" value={adapter.dns_servers.join(", ") || "Not detected"} />
                    </div>
                  ))}
                </div>
              ) : (
                <Empty text="No active adapters loaded yet. Click Refresh first." />
              )}
            </article>
          </section>
        )}

        {activeSection === "report" && (
          <section className="section">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <h3>Diagnostic report</h3>
                  <p>Copy the current network summary and diagnostic result.</p>
                </div>
                <button onClick={copyReport} disabled={!details && !diagnostic}>
                  Copy report
                </button>
              </div>

              {copyStatus && <p className="copy-status">{copyStatus}</p>}

              <pre className="terminal report">
                {reportText || "Run diagnostic to generate a report."}
              </pre>
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