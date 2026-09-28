"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Receipt = {
  id: string;
  fileName: string;
  status: string;
  createdAt: string;
  ocrResults: Array<{
    id: string;
    rawText: string;
    quantity: number;
    price: number;
    confidence: number;
    reviewed: boolean;
    product: { name: string; sku: string } | null;
  }>;
};

export default function OCRPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ocr", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal load receipts");
      const data = await res.json();
      setReceipts(data.receipts || []);
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
        // Don't set Content-Type header — browser sets it with boundary
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal upload");
        return;
      }
      fetchReceipts();
    } catch {
      setError("Network error");
    } finally {
      setUploading(false);
    }
  }

  async function handleReview(receiptId: string, ocrResultId: string, reviewed: boolean) {
    try {
      const res = await fetch(`/api/ocr/${receiptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocrResultId, reviewed }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Gagal update");
        return;
      }
      fetchReceipts();
      if (selectedReceipt?.id === receiptId) {
        setSelectedReceipt((prev) =>
          prev
            ? {
                ...prev,
                ocrResults: prev.ocrResults.map((r) =>
                  r.id === ocrResultId ? { ...r, reviewed } : r
                ),
              }
            : prev
        );
      }
    } catch {
      alert("Network error");
    }
  }

  async function handleCreatePurchase(receiptId: string, supplierId: string) {
    if (!supplierId) {
      alert("Pilih supplier dulu");
      return;
    }
    if (!confirm("Buat purchase dari OCR ini?")) return;
    try {
      const res = await fetch(`/api/ocr/${receiptId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal buat purchase");
        return;
      }
      alert("Purchase berhasil dibuat!");
      fetchReceipts();
    } catch {
      alert("Network error");
    }
  }

  const statusColor = (s: string) =>
    s === "confirmed" ? "#16a34a" : s === "completed" ? "#3b82f6" : s === "failed" ? "#ef4444" : "#f59e0b";

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>OCR Receipts</h1>
        <label className="btn-primary" style={{ cursor: "pointer" }}>
          {uploading ? "Uploading..." : "Upload Receipt"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleUpload}
            style={{ display: "none" }}
            disabled={uploading}
          />
        </label>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : receipts.length === 0 ? (
        <p>No receipts yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {receipts.map((r) => (
            <div key={r.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{r.fileName}</strong>
                  <p style={{ margin: "4px 0", color: "#666", fontSize: 14 }}>
                    {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
                <span style={{ color: statusColor(r.status), fontWeight: 600, textTransform: "capitalize" }}>
                  {r.status}
                </span>
              </div>

              {r.ocrResults.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <h4>OCR Results</h4>
                  {r.ocrResults.map((ocr) => (
                    <div
                      key={ocr.id}
                      style={{
                        padding: 12,
                        border: "1px solid #eee",
                        borderRadius: 4,
                        marginTop: 8,
                      }}
                    >
                      <p style={{ margin: "4px 0" }}>
                        <strong>Product:</strong> {ocr.product?.name || "Not matched"}
                      </p>
                      <p style={{ margin: "4px 0" }}>
                        <strong>Qty:</strong> {ocr.quantity} |{" "}
                        <strong>Price:</strong> {ocr.price}
                      </p>
                      <p style={{ margin: "4px 0" }}>
                        <strong>Confidence:</strong> {(ocr.confidence * 100).toFixed(0)}% |{" "}
                        <strong>Reviewed:</strong> {ocr.reviewed ? "Yes" : "No"}
                      </p>
                      <details style={{ marginTop: 8 }}>
                        <summary style={{ cursor: "pointer", fontSize: 13, color: "#666" }}>
                          Raw Text
                        </summary>
                        <pre
                          style={{
                            marginTop: 8,
                            padding: 8,
                            background: "#f5f5f5",
                            borderRadius: 4,
                            fontSize: 12,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {ocr.rawText}
                        </pre>
                      </details>
                      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                        <button
                          onClick={() => handleReview(r.id, ocr.id, !ocr.reviewed)}
                          style={{ fontSize: 13 }}
                        >
                          {ocr.reviewed ? "Unreview" : "Mark Reviewed"}
                        </button>
                      </div>
                    </div>
                  ))}

                  {r.status === "completed" && (
                    <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
                      <select
                        id={`supplier-${r.id}`}
                        style={{ flex: 1 }}
                      >
                        <option value="">Select supplier...</option>
                        {/* Suppliers loaded dynamically - simplified for now */}
                      </select>
                      <button
                        onClick={() => {
                          const sel = document.getElementById(`supplier-${r.id}`) as HTMLSelectElement;
                          handleCreatePurchase(r.id, sel?.value || "");
                        }}
                        className="btn-primary"
                      >
                        Create Purchase
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
