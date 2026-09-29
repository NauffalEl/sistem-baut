"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { useConfirmDialog } from "@/app/components/useConfirmDialog";

type Supplier = {
  id: string;
  name: string;
  contact: string | null;
  address: string | null;
};

const emptyForm = { name: "", contact: "", address: "" };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { dialogProps, ask } = useConfirmDialog();

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/suppliers", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal memuat supplier");
      const data = await res.json();
      setSuppliers(data.suppliers || []);
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(s: Supplier) {
    setEditingId(s.id);
    setForm({ name: s.name, contact: s.contact || "", address: s.address || "" });
    setMessage("");
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/suppliers", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...form, name: form.name.trim() } : { ...form, name: form.name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || (editingId ? "Gagal update supplier" : "Gagal tambah supplier"));
        return;
      }
      setMessage(editingId ? "Supplier diperbarui" : "Supplier ditambahkan");
      resetForm();
      await fetchSuppliers();
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  function removeSupplier(s: Supplier) {
    ask(
      `Hapus supplier ${s.name}?`,
      async () => {
        try {
          const res = await fetch("/api/suppliers", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: s.id }),
          });
          if (!res.ok) {
            const data = await res.json();
            setError(data.error || "Gagal hapus supplier");
            return;
          }
          setMessage("Supplier dihapus");
          if (editingId === s.id) resetForm();
          await fetchSuppliers();
        } catch {
          setError("Koneksi bermasalah. Coba lagi.");
        }
      },
      { description: "Data supplier akan dihapus permanen.", confirmLabel: "Ya, Hapus" }
    );
  }

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Supplier</h1>
          <p className="page-sub">Kelola daftar pemasok barang</p>
        </div>
        <Link href="/purchases" className="btn-secondary">
          Ke Pembelian
        </Link>
      </div>

      {error && <p className="message error">{error}</p>}
      {message && <p className="message success">{message}</p>}

      <div className="card">
        <h3>{editingId ? "Edit Supplier" : "Tambah Supplier"}</h3>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Nama</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="PT Sumber Baut"
                required
              />
            </div>
            <div className="form-group">
              <label>Kontak</label>
              <input
                type="text"
                value={form.contact}
                onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                placeholder="0812… atau email"
              />
            </div>
            <div className="form-group form-group-wide">
              <label>Alamat</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Jl. Industri No. 1"
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Menyimpan…" : editingId ? "Simpan Perubahan" : "Tambah Supplier"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="btn-ghost">
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Daftar Supplier ({suppliers.length})</h3>
        {loading ? (
          <p className="muted">Memuat data…</p>
        ) : suppliers.length === 0 ? (
          <p className="empty-state">Belum ada supplier. Tambahkan di atas.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Kontak</th>
                  <th>Alamat</th>
                  <th className="action-col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id} style={editingId === s.id ? { background: "var(--accent-soft)" } : undefined}>
                    <td style={{ fontWeight: 600, color: "var(--ink)" }}>{s.name}</td>
                    <td className="muted">{s.contact || "—"}</td>
                    <td className="muted">{s.address || "—"}</td>
                    <td>
                      <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                        <button onClick={() => startEdit(s)} className="action-link edit">Edit</button>
                        <button
                          onClick={() => removeSupplier(s)}
                          className="action-link delete"
                          aria-label={`Hapus ${s.name}`}
                          title="Hapus"
                        >
                          <TrashIcon />
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
