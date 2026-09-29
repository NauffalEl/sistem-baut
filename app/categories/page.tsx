"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { useConfirmDialog } from "@/app/components/useConfirmDialog";

type Category = { id: string; name: string };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { dialogProps, ask } = useConfirmDialog();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal memuat kategori");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal tambah kategori");
        return;
      }
      setMessage("Kategori ditambahkan");
      setNewName("");
      await fetchCategories();
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  async function updateCategory(id: string) {
    if (!editingName.trim()) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editingName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal update kategori");
        return;
      }
      setMessage("Kategori diperbarui");
      setEditingId(null);
      setEditingName("");
      await fetchCategories();
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  function removeCategory(c: Category) {
    ask(
      `Hapus kategori ${c.name}?`,
      async () => {
        try {
          const res = await fetch("/api/categories", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: c.id }),
          });
          if (!res.ok) {
            const data = await res.json();
            setError(data.error || "Gagal hapus kategori");
            return;
          }
          setMessage("Kategori dihapus");
          await fetchCategories();
        } catch {
          setError("Koneksi bermasalah. Coba lagi.");
        }
      },
      { description: "Produk dalam kategori ini tidak akan terhapus.", confirmLabel: "Ya, Hapus" }
    );
  }

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Kategori</h1>
          <p className="page-sub">Kelompokkan produk agar mudah dicari dan dianalisis</p>
        </div>
        <Link href="/products" className="btn-secondary">
          Ke Produk
        </Link>
      </div>

      {error && <p className="message error">{error}</p>}
      {message && <p className="message success">{message}</p>}

      <div className="card">
        <h3>Tambah Kategori</h3>
        <form onSubmit={addCategory} style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Contoh: Bolt M10"
            style={{ flex: 1, minWidth: 200 }}
            required
          />
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Menyimpan…" : "Tambah"}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Daftar Kategori ({categories.length})</h3>
        {loading ? (
          <p className="muted">Memuat data…</p>
        ) : categories.length === 0 ? (
          <p className="empty-state">Belum ada kategori. Tambahkan di atas.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama Kategori</th>
                  <th className="action-col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>
                      {editingId === c.id ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          style={{ maxWidth: 280 }}
                          autoFocus
                        />
                      ) : (
                        <span style={{ fontWeight: 600, color: "var(--ink)" }}>{c.name}</span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                        {editingId === c.id ? (
                          <>
                            <button onClick={() => updateCategory(c.id)} className="action-link edit" disabled={saving}>
                              Simpan
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditingName("");
                              }}
                              className="action-link"
                            >
                              Batal
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(c.id);
                                setEditingName(c.name);
                              }}
                              className="action-link edit"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => removeCategory(c)}
                              className="action-link delete"
                              aria-label={`Hapus ${c.name}`}
                              title="Hapus"
                            >
                              <TrashIcon />
                            </button>
                          </>
                        )}
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
