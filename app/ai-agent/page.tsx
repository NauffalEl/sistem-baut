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

  if (loading) return <div className="container"><p className="muted">Memuat data…</p></div>;
  if (error) return <div className="container"><p className="error">{error}</p></div>;

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>AI Advisor</h1>
          <p className="page-sub">Konfigurasi agen AI, jadwal mingguan, dan riwayat laporan</p>
        </div>
        <Link href="/dashboard" className="btn-secondary">Kembali</Link>
      </div>

      {/* Settings */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Pengaturan AI</h3>
        {!settings ? (
          <p className="muted">Belum ada pengaturan.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 16 }}>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6, fontSize: 12.5, color: "var(--muted)" }}>Status AI Agent</label>
              <button
                onClick={() => toggleSetting("enabled")}
                className={`action-btn ${settings.enabled ? "enabled" : "disabled"}`}
              >
                {settings.enabled ? "ON" : "OFF"}
              </button>
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6, fontSize: 12.5, color: "var(--muted)" }}>Jadwal Otomatis</label>
              <button
                onClick={() => toggleSetting("scheduledEnabled")}
                className={`action-btn ${settings.scheduledEnabled ? "enabled" : "disabled"}`}
              >
                {settings.scheduledEnabled ? "ON" : "OFF"}
              </button>
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6, fontSize: 12.5, color: "var(--muted)" }}>Frekuensi</label>
              <select
                value={settings.frequency}
                onChange={(e) => {
                  fetch("/api/ai-agent/settings", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: settings.id, frequency: e.target.value }),
                  }).then((r) => r.json().then((d) => setSettings(d.settings)));
                }}
                className="action-select"
              >
                <option value="daily">Harian</option>
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6, fontSize: 12.5, color: "var(--muted)" }}>Terakhir Dijalankan</label>
              <p style={{ margin: 0, fontSize: 13.5 }}>
                {settings.lastRun ? new Date(settings.lastRun).toLocaleString("id-ID") : "Belum pernah"}
              </p>
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6, fontSize: 12.5, color: "var(--muted)" }}>Jadwal Berikutnya</label>
              <p style={{ margin: 0, fontSize: 13.5 }}>
                {settings.nextRun ? new Date(settings.nextRun).toLocaleString("id-ID") : "Tidak dijadwalkan"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Run Analysis */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Jalankan Analisis Manual</h3>
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          {ANALYSIS_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => runAnalysis(t.value)}
              disabled={running !== null || !settings?.enabled}
              className="btn-primary"
            >
              {running === t.value ? "Menjalankan..." : t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="card" style={{ marginBottom: 20, borderLeft: "4px solid var(--accent)" }}>
          <h3>{result.title}</h3>
          <p>{result.content}</p>
          {result.recommendations && result.recommendations.length > 0 && (
            <div>
              <strong>Rekomendasi:</strong>
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
        <h3>Laporan Terbaru ({reports.length})</h3>
        {reports.length === 0 ? (
          <p className="empty-state">Belum ada laporan</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Tipe</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600, color: "var(--ink)" }}>{r.title}</td>
                    <td className="muted">{r.type}</td>
                    <td>
                      <span className={`badge ${r.status === "reviewed" ? "badge-success" : r.status === "archived" ? "badge-muted" : "badge-warning"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="muted">{new Date(r.createdAt).toLocaleString("id-ID")}</td>
                    <td>
                      {r.status === "generated" && (
                        <div className="row-actions">
                          <button
                            onClick={() => reviewReport(r.id, "reviewed")}
                            className="action-link"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => reviewReport(r.id, "archived")}
                            className="action-link delete"
                          >
                            Arsip
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Logs */}
      <div className="card">
        <h3>Riwayat Eksekusi ({logs.length})</h3>
        {logs.length === 0 ? (
          <p className="empty-state">Belum ada riwayat</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Dimulai</th>
                  <th>Selesai</th>
                  <th>Token</th>
                  <th>Biaya</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td style={{ color: l.status === "completed" ? "var(--success)" : l.status === "failed" ? "var(--danger)" : "var(--warning)", fontWeight: 600 }}>
                      {l.status}
                    </td>
                    <td>{new Date(l.startedAt).toLocaleString("id-ID")}</td>
                    <td>{l.completedAt ? new Date(l.completedAt).toLocaleString("id-ID") : "-"}</td>
                    <td className="num">{l.tokensUsed}</td>
                    <td className="num">${l.costUSD.toFixed(3)}</td>
                    <td style={{ color: "var(--danger)" }}>{l.error || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
