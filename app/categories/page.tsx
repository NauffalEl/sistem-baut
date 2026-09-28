"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal load kategori");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

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
      fetchCategories();
    } catch {
      setError("Network error");
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
      setMessage("Kategori diupdate");
      setEditingId(null);
      fetchCategories();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function removeCategory(id: string) {
    if (!confirm("Hapus kategori ini?")) return;
    setError("");
    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Gagal hapus kategori");
        return;
      }
      fetchCategories();
    } catch {
      setError("Network error");
    }
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>Categories</h1>
        <Link href="/products" className="btn-secondary" style={{ textDecoration: "none" }}>
          Back to Products
        </Link>
      </div>

      {error && <p className="error">{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <div className="card">
        <h3>Add Category</h3>
        <form onSubmit={addCategory} style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Add"}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>All Categories</h3>
        {loading ? (
          <p>Loading...</p>
        ) : categories.length === 0 ? (
          <p>No categories yet.</p>
        ) : (
          <table style={{ marginTop: 12 }}>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>
                    {editingId === c.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                      />
                    ) : (
                      c.name
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {editingId === c.id ? (
                      <>
                        <button onClick={() => updateCategory(c.id)} disabled={saving} style={{ marginRight: 8 }}>
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(c.id);
                            setEditingName(c.name);
                          }}
                          style={{ marginRight: 8 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeCategory(c.id)}
                          style={{ color: "red", background: "none", border: "none", cursor: "pointer" }}
                        >
                          Delete
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
    </div>
  );
}
