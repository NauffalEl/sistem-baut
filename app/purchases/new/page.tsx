"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrashIcon } from "@/components/icons/TrashIcon";

type Supplier = { id: string; name: string };
type Product = { id: string; name: string; sku: string; lastBuyPrice: number };

type LineItem = { productId: string; quantity: number; price: string };

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n ?? 0);

export default function NewPurchasePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ productId: "", quantity: 1, price: "" }]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/suppliers").then((r) => r.json()),
      fetch("/api/products?limit=100").then((r) => r.json()),
    ])
      .then(([s, p]) => {
        setSuppliers(s.suppliers || []);
        setProducts(p.items || []);
        if (s.suppliers?.length) setSupplierId(s.suppliers[0].id);
      })
      .catch(() => setError("Gagal memuat data supplier/produk"))
      .finally(() => setLoading(false));
  }, []);

  const updateItem = useCallback((idx: number, field: keyof LineItem, value: string | number) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }, []);

  /** Price is a string in state so the field can be cleared; keep it digits-only. */
  const updatePrice = useCallback((idx: number, raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, price: digits } : item)));
  }, []);

  const addItem = () => setItems((prev) => [...prev, { productId: "", quantity: 1, price: "" }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const total = items.reduce((sum, item) => sum + item.quantity * (Number(item.price) || 0), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId) {
      setError("Pilih supplier terlebih dahulu");
      return;
    }
    const validItems = items.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      setError("Minimal 1 item dengan produk dan quantity valid");
      return;
    }
    if (validItems.some((i) => i.price.trim() === "")) {
      setError("Harga beli wajib diisi untuk setiap item");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          items: validItems.map((i) => ({ ...i, price: Number(i.price) })),
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal membuat pembelian");
        return;
      }
      router.push(`/purchases/${data.purchase.id}`);
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="container"><p className="muted">Memuat data…</p></div>;

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Pembelian Baru</h1>
          <p className="page-sub">Tentukan supplier, produk, dan harga beli</p>
        </div>
        <Link href="/purchases" className="btn-secondary">← Kembali</Link>
      </div>

      {error && <p className="message error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="form-group">
            <label>Supplier</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
              <option value="">Pilih supplier…</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card">
          <h3>Item Pembelian</h3>
          {items.map((item, idx) => (
            <div key={idx} className="line-item">
              <select
                value={item.productId}
                onChange={(e) => {
                  const prod = products.find((p) => p.id === e.target.value);
                  updateItem(idx, "productId", e.target.value);
                  if (prod && prod.lastBuyPrice > 0) {
                    updateItem(idx, "price", String(prod.lastBuyPrice));
                  }
                }}
                className="line-item-product"
                required
              >
                <option value="">Pilih produk…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                className="line-item-qty"
                placeholder="Qty"
                aria-label="Quantity"
                required
              />
              <input
                type="text"
                inputMode="numeric"
                value={item.price}
                onChange={(e) => updatePrice(idx, e.target.value)}
                className="line-item-price"
                placeholder="Harga"
                aria-label="Harga beli"
                required
              />
              <span className="line-item-subtotal">
                {rupiah(item.quantity * (Number(item.price) || 0))}
              </span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="action-link delete"
                  aria-label="Hapus item"
                  title="Hapus item"
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addItem} className="btn-secondary btn-sm">+ Tambah Item</button>
        </div>

        <div className="card">
          <div className="form-group">
            <label>Catatan</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" />
          </div>
        </div>

        <div className="card total-bar">
          <span>Total</span>
          <span className="total-value">{rupiah(total)}</span>
        </div>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Menyimpan…" : "Simpan Pembelian"}
        </button>
      </form>
    </div>
  );
}
