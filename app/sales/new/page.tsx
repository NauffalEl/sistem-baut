"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { readScanDraft } from "@/lib/sales/scan-draft";

type Product = {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  inventory: { quantity: number } | null;
};

type LineItem = { productId: string; quantity: number; price: number };

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n ?? 0);

export default function NewSalePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<LineItem[]>([{ productId: "", quantity: 1, price: 0 }]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [receiptId, setReceiptId] = useState(searchParams.get("receiptId") || "");
  const [scanInfo, setScanInfo] = useState("");

  useEffect(() => {
    fetch("/api/products?limit=100")
      .then((r) => r.json())
      .then((data) => setProducts(data.items || []))
      .catch(() => setError("Gagal memuat produk"))
      .finally(() => setLoading(false));
  }, []);

  /** Prefill from a receipt scanned on /sales (draft is written to sessionStorage). */
  useEffect(() => {
    const draft = readScanDraft();
    if (!draft) return;

    if (draft.receiptId) setReceiptId(draft.receiptId);
    if (draft.lines?.length) {
      setItems(
        draft.lines.map((l) => ({
          productId: l.productId ?? "",
          quantity: Math.max(1, l.quantity || 1),
          price: l.price || 0,
        }))
      );
      const matched = draft.lines.filter((l) => l.productId).length;
      setScanInfo(
        matched === draft.lines.length
          ? `Nota ${draft.receiptId} discan. ${draft.lines.length} item siap diperiksa.`
          : `Nota ${draft.receiptId} discan. ${matched}/${draft.lines.length} item cocok, sisanya perlu dipilih manual.`
      );
    }
  }, []);

  const updateItem = useCallback((idx: number, field: keyof LineItem, value: string | number) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }, []);

  const addItem = () => setItems((prev) => [...prev, { productId: "", quantity: 1, price: 0 }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validItems = items.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      setError("Minimal 1 item dengan produk dan quantity valid");
      return;
    }
    if (!receiptId.trim()) {
      setError("ID Nota wajib diisi");
      return;
    }

    for (const item of validItems) {
      const prod = products.find((p) => p.id === item.productId);
      const available = prod?.inventory?.quantity ?? 0;
      if (available < item.quantity) {
        setError(`Stok tidak cukup: ${prod?.name} (tersedia ${available}, diminta ${item.quantity})`);
        return;
      }
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: validItems, note, receiptId: receiptId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal membuat penjualan");
        return;
      }
      router.push(`/sales/${data.sale.id}`);
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
          <h1>Penjualan Baru</h1>
          <p className="page-sub">Pilih produk untuk menambah item penjualan</p>
        </div>
        <Link href="/sales" className="btn-ghost">← Kembali</Link>
      </div>

      {error && <p className="message error">{error}</p>}
      {scanInfo && <p className="message success">{scanInfo}</p>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h3>Item Penjualan</h3>
          {items.map((item, idx) => (
            <div key={idx} className="line-item">
              <select
                value={item.productId}
                onChange={(e) => {
                  const prod = products.find((p) => p.id === e.target.value);
                  updateItem(idx, "productId", e.target.value);
                  if (prod) updateItem(idx, "price", prod.sellingPrice);
                }}
                className="line-item-product"
                required
              >
                <option value="">Pilih produk…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — stok {p.inventory?.quantity ?? 0}
                  </option>
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
                type="number"
                min="0"
                value={item.price}
                onChange={(e) => updateItem(idx, "price", Number(e.target.value))}
                className="line-item-price"
                placeholder="Harga"
                aria-label="Harga jual"
                required
              />
              <span className="line-item-subtotal">{rupiah(item.quantity * item.price)}</span>
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
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>ID Nota (diisi otomatis dari hasil scan, atau masukkan manual)</label>
            <input
              type="text"
              value={receiptId}
              onChange={(e) => setReceiptId(e.target.value)}
              placeholder="Contoh: REC-2026-001"
              required
            />
          </div>
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
          {saving ? "Menyimpan…" : "Simpan Penjualan"}
        </button>
      </form>
    </div>
  );
}
