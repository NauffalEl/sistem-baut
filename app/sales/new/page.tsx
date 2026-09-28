"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  inventory: { quantity: number } | null;
};

type LineItem = {
  productId: string;
  quantity: number;
  price: number;
};

export default function NewSalePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<LineItem[]>([{ productId: "", quantity: 1, price: 0 }]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products?limit=100")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.items || []);
      })
      .catch(() => setError("Gagal load products"))
      .finally(() => setLoading(false));
  }, []);

  const updateItem = useCallback((idx: number, field: keyof LineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  }, []);

  const addItem = () => setItems((prev) => [...prev, { productId: "", quantity: 1, price: 0 }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const validItems = items.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      setError("Minimal 1 item dengan produk dan quantity valid");
      setSaving(false);
      return;
    }

    // Check stock
    for (const item of validItems) {
      const prod = products.find((p) => p.id === item.productId);
      const available = prod?.inventory?.quantity ?? 0;
      if (available < item.quantity) {
        setError(
          `Stok tidak cukup: ${prod?.name} (tersedia ${available}, diminta ${item.quantity})`
        );
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: validItems, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal buat sale");
        return;
      }
      router.push(`/sales/${data.sale.id}`);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>New Sale</h1>
        <Link href="/sales" className="btn-secondary" style={{ textDecoration: "none" }}>
          Back
        </Link>
      </div>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Items</label>
          {items.map((item, idx) => (
            <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <select
                value={item.productId}
                onChange={(e) => {
                  const prod = products.find((p) => p.id === e.target.value);
                  updateItem(idx, "productId", e.target.value);
                  if (prod) updateItem(idx, "price", prod.sellingPrice);
                }}
                style={{ flex: 2 }}
              >
                <option value="">Select product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — Stok: {p.inventory?.quantity ?? 0}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                style={{ width: 80 }}
                placeholder="Qty"
              />
              <input
                type="number"
                min="0"
                value={item.price}
                onChange={(e) => updateItem(idx, "price", Number(e.target.value))}
                style={{ width: 100 }}
                placeholder="Price"
              />
              <span style={{ width: 80, textAlign: "right" }}>
                {(item.quantity * item.price).toLocaleString()}
              </span>
              <button type="button" onClick={() => removeItem(idx)}>×</button>
            </div>
          ))}
          <button type="button" onClick={addItem}>+ Add Item</button>
        </div>

        <div className="form-group">
          <label>Note</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div style={{ margin: "16px 0", fontSize: 18, fontWeight: 600 }}>
          Total: {total.toLocaleString()}
        </div>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Create Sale"}
        </button>
      </form>
    </div>
  );
}
