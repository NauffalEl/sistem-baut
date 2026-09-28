"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Supplier = {
  id: string;
  name: string;
  contact: string | null;
  address: string | null;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/suppliers", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal load suppliers");
      const data = await res.json();
      setSuppliers(data.suppliers || []);
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  async function addSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), contact, address }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal tambah supplier");
        return;
      }
      setMessage("Supplier ditambahkan");
      setName("");
      setContact("");
      setAddress("");
      fetchSuppliers();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function updateSupplier(id: string) {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/suppliers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: name.trim(), contact, address }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal update supplier");
        return;
      }
      setMessage("Supplier diupdate");
      setEditingId(null);
      setName("");
      setContact("");
      setAddress("");
      fetchSuppliers();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function removeSupplier(id: string) {
    if (!confirm("Hapus supplier ini?")) return;
    setError("");
    try {
      const res = await fetch("/api/suppliers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Gagal hapus supplier");
        return;
      }
      fetchSuppliers();
    } catch {
      setError("Network error");
    }
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>Suppliers</h1>
        <Link href="/purchases" className="btn-secondary" style={{ textDecoration: "none" }}>
          Back to Purchases
        </Link>
      </div>

      {error && <p className="error">{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <div className="card">
        <h3>{editingId ? "Edit Supplier" : "Add Supplier"}</h3>
        <form onSubmit={editingId ? (e) => { e.preventDefault(); updateSupplier(editingId); } : addSupplier}>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              style={{ flex: 1, minWidth: 150 }}
              required
            />
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Contact"
              style={{ flex: 1, minWidth: 120 }}
            />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Address"
              style={{ flex: 1, minWidth: 150 }}
            />
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Add"}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setName(""); setContact(""); setAddress(""); }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>All Suppliers</h3>
        {loading ? (
          <p>Loading...</p>
        ) : suppliers.length === 0 ? (
          <p>No suppliers yet.</p>
        ) : (
          <table style={{ marginTop: 12 }}>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.contact || "-"}</td>
                  <td>{s.address || "-"}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      onClick={() => {
                        setEditingId(s.id);
                        setName(s.name);
                        setContact(s.contact || "");
                        setAddress(s.address || "");
                      }}
                      style={{ marginRight: 8 }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeSupplier(s.id)}
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
