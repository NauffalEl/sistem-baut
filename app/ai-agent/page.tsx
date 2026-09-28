"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type AIAgentSettings = {
  id: string;
  enabled: boolean;
  scheduledEnabled: boolean;
  frequency: string;
  dayOfWeek: number;
  timeOfDay: string;
  lastRun: string | null;
  nextRun: string | null;
};

type AIReport = {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  createdAt: string;
};

type ExecutionLog = {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  tokensUsed: number;
  costUSD: number;
};

const ANALYSIS_TYPES = [
  { value: "inventory", label: "Inventory Analysis" },
  { value: "sales", label: "Sales Analysis" },
  { value: "purchase", label: "Purchase Analysis" },
  { value: "price", label: "Price Analysis" },
  { value: "product", label: "Product Normalization" },
  { value: "weekly", label: "Weekly Report" },
];

export default function AIAgentPage() {
  const [settings, setSettings] = useState<AIAgentSettings | null>(null);
  const [reports, setReports] = useState<AIReport[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [settingsRes, reportsRes, logsRes] = await Promise.all([
        fetch("/api/ai-agent/settings"),
        fetch("/api/ai-agent/reports"),
        fetch("/api/ai-agent/logs"),
      ]);

      if (settingsRes.ok) {
        const d = await settingsRes.json();
        setSettings(d.settings);
      }
      if (reportsRes.ok) {
        const d = await reportsRes.json();
        setReports(d.reports || []);
      }
      if (logsRes.ok) {
        const d = await logsRes.json();
        setLogs(d.logs || []);
      }
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function toggleSetting(key: keyof AIAgentSettings) {
    if (!settings) return;
    try {
      const res = await fetch("/api/ai-agent/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: settings.id, [key]: !settings[key] }),
      });
      if (res.ok) {
        const d = await res.json();
        setSettings(d.settings);
      }
    } catch {
      alert("Network error");
    }
  }

  async function runAnalysis(type: string) {
    setRunning(type);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/ai-agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to run analysis");
        return;
      }
      setResult(data.result);
      fetchData();
    } catch {
      setError("Network error");
    } finally {
      setRunning(null);
    }
  }

  async function reviewReport(reportId: string, status: "reviewed" | "archived") {
    try {
      const res = await fetch(`/api/ai-agent/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchData();
    } catch {
      alert("Network error");
    }
  }

  if (loading) return <div className="container"><p>Loading...</p></div>;
  if (error) return <div className="container"><p className="error">{error}</p></div>;

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>AI Agent</h1>
        <Link href="/dashboard" className="btn-secondary" style={{ textDecoration: "none" }}>
          Back
        </Link>
      </div>

      {/* Settings */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Settings</h3>
        {!settings ? (
          <p>No settings configured.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, marginTop: 16 }}>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
                AI Agent
              </label>
              <button
                onClick={() => toggleSetting("enabled")}
                style={{
                  background: settings.enabled ? "#16a34a" : "#ef4444",
                  color: "#fff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                {settings.enabled ? "ON" : "OFF"}
              </button>
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
                Scheduled Run
              </label>
              <button
                onClick={() => toggleSetting("scheduledEnabled")}
                style={{
                  background: settings.scheduledEnabled ? "#3b82f6" : "#9ca3af",
                  color: "#fff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                {settings.scheduledEnabled ? "ON" : "OFF"}
              </button>
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
                Frequency
              </label>
              <select
                value={settings.frequency}
                onChange={(e) => {
                  fetch("/api/ai-agent/settings", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: settings.id, frequency: e.target.value }),
                  }).then((r) => r.json().then((d) => setSettings(d.settings)));
                }}
                style={{ padding: "8px", borderRadius: 4, border: "1px solid #ccc" }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
                Last Run
              </label>
              <p style={{ margin: 0 }}>
                {settings.lastRun
                  ? new Date(settings.lastRun).toLocaleString()
                  : "Never"}
              </p>
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
                Next Run
              </label>
              <p style={{ margin: 0 }}>
                {settings.nextRun
                  ? new Date(settings.nextRun).toLocaleString()
                  : "Not scheduled"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Run Analysis */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Manual Run</h3>
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          {ANALYSIS_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => runAnalysis(t.value)}
              disabled={running !== null || !settings?.enabled}
              className="btn-primary"
            >
              {running === t.value ? "Running..." : t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="card" style={{ marginBottom: 20, borderLeft: "4px solid #3b82f6" }}>
          <h3>{result.title}</h3>
          <p>{result.content}</p>
          {result.recommendations && result.recommendations.length > 0 && (
            <div>
              <strong>Recommendations:</strong>
              <ul>
                {result.recommendations.map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Reports */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Recent Reports ({reports.length})</h3>
        {reports.length === 0 ? (
          <p>No reports yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.type}</td>
                  <td>{r.status}</td>
                  <td>{new Date(r.createdAt).toLocaleString()}</td>
                  <td>
                    {r.status === "generated" && (
                      <>
                        <button
                          onClick={() => reviewReport(r.id, "reviewed")}
                          style={{ marginRight: 8 }}
                        >
                          Review
                        </button>
                        <button
                          onClick={() => reviewReport(r.id, "archived")}
                          style={{ color: "#666" }}
                        >
                          Archive
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Logs */}
      <div className="card">
        <h3>Execution Logs ({logs.length})</h3>
        {logs.length === 0 ? (
          <p>No logs yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Started</th>
                <th>Completed</th>
                <th>Tokens</th>
                <th>Cost</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td style={{ color: l.status === "completed" ? "#16a34a" : l.status === "failed" ? "#ef4444" : "#f59e0b" }}>
                    {l.status}
                  </td>
                  <td>{new Date(l.startedAt).toLocaleString()}</td>
                  <td>{l.completedAt ? new Date(l.completedAt).toLocaleString() : "-"}</td>
                  <td>{l.tokensUsed}</td>
                  <td>${l.costUSD.toFixed(3)}</td>
                  <td style={{ color: "#ef4444" }}>{l.error || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
