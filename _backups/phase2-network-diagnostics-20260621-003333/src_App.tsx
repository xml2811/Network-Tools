import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

type NetworkSummary = {
  hostname: string;
  os: string;
  local_ips: string[];
};

function App() {
  const [summary, setSummary] = useState<NetworkSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [pingHost, setPingHost] = useState("8.8.8.8");
  const [pingResult, setPingResult] = useState("");
  const [portHost, setPortHost] = useState("google.com");
  const [port, setPort] = useState("443");
  const [portResult, setPortResult] = useState("");

  async function loadSummary() {
    setLoading(true);
    try {
      const result = await invoke<NetworkSummary>("get_network_summary");
      setSummary(result);
    } catch (error) {
      setPingResult(String(error));
    } finally {
      setLoading(false);
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

  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="eyebrow">MPTech Tools</p>
          <h1>Network Tools</h1>
          <p>
            Portable Windows toolkit for basic network diagnostics, ping checks,
            TCP port tests and local troubleshooting.
          </p>
        </div>
        <button onClick={loadSummary} disabled={loading}>
          {loading ? "Loading..." : "Refresh network summary"}
        </button>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Network summary</h2>
          {summary ? (
            <div className="result">
              <p><strong>Hostname:</strong> {summary.hostname}</p>
              <p><strong>OS:</strong> {summary.os}</p>
              <p><strong>Local IPs:</strong></p>
              <ul>
                {summary.local_ips.map((ip) => (
                  <li key={ip}>{ip}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="muted">Click refresh to load basic network information.</p>
          )}
        </article>

        <article className="card">
          <h2>Ping check</h2>
          <label>
            Host or IP
            <input value={pingHost} onChange={(e) => setPingHost(e.target.value)} />
          </label>
          <button onClick={runPing}>Ping</button>
          <pre>{pingResult}</pre>
        </article>

        <article className="card">
          <h2>TCP port test</h2>
          <label>
            Host or IP
            <input value={portHost} onChange={(e) => setPortHost(e.target.value)} />
          </label>
          <label>
            Port
            <input value={port} onChange={(e) => setPort(e.target.value)} />
          </label>
          <button onClick={testPort}>Test port</button>
          <pre>{portResult}</pre>
        </article>

        <article className="card">
          <h2>Planned V1 modules</h2>
          <ul>
            <li>Show network interfaces</li>
            <li>Show local IP, gateway and DNS</li>
            <li>Show public IP</li>
            <li>Ping diagnostics</li>
            <li>TCP port testing</li>
            <li>Local open ports</li>
            <li>Basic LAN scan</li>
          </ul>
        </article>
      </section>
    </main>
  );
}

export default App;