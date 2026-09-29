"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProductFormData = {
  name: string;
  sku: string;
  categoryId: string;
  type?: string;
  size?: string;
  material?: string;
  unit: string;
  sellingPrice: string;
  minStock: number;
  active?: boolean;
};

type ProductFormProps = {
  categories: { id: string; name: string }[];
  productId?: string;
  initialData?: Partial<ProductFormData>;
  /** Aliases already saved for the product (edit mode). */
  initialAliases?: string[];
};

export default function ProductForm({
  categories,
  productId,
  initialData,
  initialAliases = [],
}: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormData>({
    name: "",
    sku: "",
    categoryId: categories[0]?.id ?? "",
    type: "",
    size: "",
    material: "",
    unit: "pcs",
    sellingPrice: "",
    minStock: 0,
    active: true,
    ...initialData,
  });
  /** Alias rows are edited inline; each row is one alternative name for OCR matching. */
  const [aliases, setAliases] = useState<string[]>(
    initialAliases.length > 0 ? initialAliases : [""]
  );
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function update<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const updateAlias = (idx: number, value: string) =>
    setAliases((prev) => prev.map((a, i) => (i === idx ? value : a)));

  const addAliasField = () => setAliases((prev) => [...prev, ""]);

  const removeAliasField = (idx: number) =>
    setAliases((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : [""]));

  /** Create an alias server-side. Failures are reported, never silently dropped. */
  async function saveAlias(targetProductId: string, value: string) {
    const res = await fetch(`/api/product-aliases?productId=${targetProductId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: targetProductId, alias: value }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || "Gagal menyimpan alias");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const payload = {
      ...form,
      sellingPrice: Number(form.sellingPrice) || 0,
      minStock: Number(form.minStock) || 0,
    };

    const newAliases = aliases.map((a) => a.trim()).filter(Boolean);

    try {
      const res = await fetch(
        productId ? `/api/products/${productId}` : "/api/products",
        {
          method: productId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        const details =
          typeof data.details === "object" && data.details
            ? Object.entries(data.details)
                .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
                .join(" • ")
            : data.error;
        setError(details || "Terjadi kesalahan. Coba lagi.");
        return;
      }

      const savedId = data.product?.id ?? productId;

      // Aliases are globally unique, so only send values that are not already
      // stored for this product. Prevents duplicate-key errors on re-save.
      const existing = new Set(
        (initialAliases ?? []).map((a) => a.trim().toLowerCase()).filter(Boolean)
      );
      const toCreate = newAliases.filter((a) => !existing.has(a.toLowerCase()));

      if (toCreate.length > 0 && savedId) {
        const results = await Promise.allSettled(toCreate.map((a) => saveAlias(savedId, a)));
        const failed = results.filter((r) => r.status === "rejected");
        if (failed.length > 0) {
          const reason = (failed[0] as PromiseRejectedResult).reason?.message || "Gagal menyimpan alias";
          setError(`Produk tersimpan, tetapi ada alias yang gagal disimpan: ${reason}`);
          setLoading(false);
          return;
        }
      }

      router.push(`/products/${savedId}`);
      router.refresh();
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="message error">{error}</p>}
      {message && <p className="message success">{message}</p>}

      <div className="form-grid">
        <div className="form-group form-group-wide">
          <label htmlFor="name">Nama Produk</label>
          <input
            id="name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Contoh: Baut M10 Stainless"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="sku">SKU</label>
          <input
            id="sku"
            value={form.sku}
            onChange={(e) => update("sku", e.target.value.toUpperCase())}
            placeholder="BLT-M10-STS"
            required
            readOnly={Boolean(productId)}
          />
          {productId && (
            <small className="muted">SKU tidak bisa diubah setelah produk dibuat.</small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="categoryId">Kategori</label>
          <select
            id="categoryId"
            value={form.categoryId}
            onChange={(e) => update("categoryId", e.target.value)}
            required
          >
            <option value="">Pilih kategori…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="type">Jenis</label>
          <input
            id="type"
            value={form.type ?? ""}
            onChange={(e) => update("type", e.target.value)}
            placeholder="Bolt, Nut, Ring, dll"
          />
        </div>

        <div className="form-group">
          <label htmlFor="size">Ukuran</label>
          <input
            id="size"
            value={form.size ?? ""}
            onChange={(e) => update("size", e.target.value)}
            placeholder="M10 × 40 mm"
          />
        </div>

        <div className="form-group">
          <label htmlFor="material">Material</label>
          <input
            id="material"
            value={form.material ?? ""}
            onChange={(e) => update("material", e.target.value)}
            placeholder="Stainless, Besi, Kuningan, dll"
          />
        </div>

        <div className="form-group">
          <label htmlFor="unit">Satuan</label>
          <input
            id="unit"
            value={form.unit}
            onChange={(e) => update("unit", e.target.value)}
            placeholder="pcs, kg, box"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="sellingPrice">Harga Jual (Rp)</label>
          <input
            id="sellingPrice"
            type="text"
            value={form.sellingPrice}
            onChange={(e) => update("sellingPrice", e.target.value)}
            placeholder="Masukkan harga jual secara manual"
          />
        </div>

        <div className="form-group">
          <label htmlFor="minStock">Stok Minimum</label>
          <input
            id="minStock"
            type="number"
            min="0"
            step="1"
            value={form.minStock}
            onChange={(e) => update("minStock", Number(e.target.value))}
          />
          <small className="muted">Batas bawah sebelum ditandai stok menipis.</small>
        </div>

      </div>

      {/* Alias — alternative names used by OCR / search matching */}
      <div className="form-group">
        <label>Alias / Nama Alternatif</label>
        <p className="muted" style={{ margin: "0 0 10px", fontSize: 12.5 }}>
          Dipakai untuk mencocokkan hasil pindai struk. Contoh: baut 10, screw 10mm, hex bolt m10.
        </p>
        {aliases.map((alias, idx) => (
          <div className="line-item" key={idx}>
            <input
              type="text"
              value={alias}
              onChange={(e) => updateAlias(idx, e.target.value)}
              placeholder="Nama alternatif"
              className="line-item-product"
              style={{ minWidth: 0 }}
            />
            {aliases.length > 1 && (
              <button
                type="button"
                onClick={() => removeAliasField(idx)}
                className="action-link delete"
                style={{ background: "transparent" }}
              >
                Hapus
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addAliasField} className="btn-secondary btn-sm">
          + Tambah Alias
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Menyimpan…" : productId ? "Simpan Perubahan" : "Simpan Produk"}
        </button>
      </div>
    </form>
  );
}
