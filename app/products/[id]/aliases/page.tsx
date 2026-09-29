"use client";

import { useState, useEffect, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { useConfirmDialog } from "@/app/components/useConfirmDialog";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";

type Alias = { id: string; alias: string };

export default function ProductAliasesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [newAlias, setNewAlias] = useState("");
  const [productName, setProductName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { dialogProps, ask } = useConfirmDialog();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [aliasRes, productRes] = await Promise.all([
        fetch(`/api/product-aliases?productId=${id}`, { cache: "no-store" }),
        fetch(`/api/products/${id}`, { cache: "no-store" }),
      ]);
      if (!aliasRes.ok) throw new Error("Gagal memuat alias");
      const aliasData = await aliasRes.json();
      setAliases(aliasData.aliases || []);

      if (productRes.ok) {
        const productData = await productRes.json();
        setProductName(productData.product?.name || "");
      }
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function addAlias(e: React.FormEvent) {
    e.preventDefault();
    const value = newAlias.trim();
    if (!value) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/product-aliases?productId=${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.details?.alias?.[0] || data?.error || "Gagal menambah alias");
        return;
      }
      setMessage("Alias ditambahkan");
      setNewAlias("");
      await fetchData();
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  function removeAlias(alias: Alias) {
    ask(
      `Hapus alias "${alias.alias}"?`,
      async () => {
        try {
          const res = await fetch(`/api/product-aliases?id=${alias.id}`, { method: "DELETE" });
          if (!res.ok) {
            const data = await res.json().catch(() => null);
            setError(data?.error || "Gagal hapus alias");
            return;
          }
          setMessage("Alias dihapus");
          await fetchData();
        } catch {
          setError("Koneksi bermasalah. Coba lagi.");
        }
      },
      { description: "Nama alternatif ini tidak akan lagi dipakai untuk pencocokan.", confirmLabel: "Ya, Hapus" }
    );
  }

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Alias Produk</h1>
          <p className="page-sub">
            Nama alternatif untuk pencocokan hasil pindai struk
            {productName && ` — ${productName}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href={`/products/${id}/edit`} className="btn-secondary">
            Edit Produk
          </Link>
          <Link href={`/products/${id}`} className="btn-ghost">
            ← Kembali
          </Link>
        </div>
      </div>

      {error && <p className="message error">{error}</p>}
      {message && <p className="message success">{message}</p>}

      <div className="card">
        <h3>Tambah Alias</h3>
        <form onSubmit={addAlias} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            type="text"
            value={newAlias}
            onChange={(e) => setNewAlias(e.target.value)}
            placeholder="Contoh: baut 10, screw 10mm"
            style={{ flex: 1, minWidth: 220 }}
            required
          />
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Menyimpan…" : "Tambah"}
          </button>
        </form>
        <p className="muted" style={{ margin: "10px 0 0", fontSize: 12.5 }}>
          Alias bersifat unik. Satu alias hanya bisa dimiliki satu produk.
        </p>
      </div>

      <div className="card">
        <h3>Daftar Alias ({aliases.length})</h3>
        {loading ? (
          <p className="muted">Memuat data…</p>
        ) : aliases.length === 0 ? (
          <p className="empty-state">Belum ada alias untuk produk ini.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Alias</th>
                  <th className="action-col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {aliases.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600, color: "var(--ink)" }}>{a.alias}</td>
                    <td>
                      <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                        <button onClick={() => removeAlias(a)} className="action-link delete">
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
