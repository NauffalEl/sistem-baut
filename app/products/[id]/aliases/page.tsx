"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import Link from "next/link";

type Alias = { id: string; alias: string };

export default function ProductAliasesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [newAlias, setNewAlias] = useState("");
  const [productName, setProductName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const [aliasRes, productRes] = await Promise.all([
        fetch(`/api/product-aliases?productId=${id}`, { cache: "no-store" }),
        fetch(`/api/products/${id}`, { cache: "no-store" }),
      ]);
      if (!aliasRes.ok) throw new Error("Gagal load alias");
      const aliasData = await aliasRes.json();
      setAliases(aliasData.aliases || []);

      if (productRes.ok) {
        const productData = await productRes.json();
        setProductName(productData.product?.name || "");
      }
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function addAlias(e: React.FormEvent) {
    e.preventDefault();
    if (!newAlias.trim()) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/product-aliases?productId=${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: newAlias.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.details?.alias?.[0] || "Gagal tambah alias");
        return;
      }
      setMessage("Alias ditambahkan");
      setNewAlias("");
      fetchData();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function removeAlias(aliasId: string) {
    if (!confirm("Hapus alias ini?")) return;
    setError("");
    try {
      const res = await fetch(`/api/product-aliases?id=${aliasId}&productId=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Gagal hapus alias");
        return;
      }
      fetchData();
    } catch {
      setError("Network error");
    }
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1>Aliases</h1>
          <p style={{ margin: 0, color: "#666" }}>{productName}</p>
        </div>
        <Link href={`/products/${id}`} className="btn-secondary" style={{ textDecoration: "none" }}>
          Back to Product
        </Link>
      </div>

      {error && <p className="error">{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <div className="card">
        <h3>Add Alias</h3>
        <form onSubmit={addAlias} style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            type="text"
            value={newAlias}
            onChange={(e) => setNewAlias(e.target.value)}
            placeholder="Alias name"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Add"}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>Current Aliases</h3>
        {loading ? (
          <p>Loading...</p>
        ) : aliases.length === 0 ? (
          <p>No aliases yet.</p>
        ) : (
          <table style={{ marginTop: 12 }}>
            <tbody>
              {aliases.map((a) => (
                <tr key={a.id}>
                  <td>{a.alias}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      onClick={() => removeAlias(a.id)}
                      style={{ color: "red", background: "none", border: "none", cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
