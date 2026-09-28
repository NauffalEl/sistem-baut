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
  lastBuyPrice: number;
  sellingPrice: number;
  minStock: number;
  active?: boolean;
};

type ProductFormProps = {
  categories: { id: string; name: string }[];
  productId?: string;
  initialData?: Partial<ProductFormData>;
};

export default function ProductForm({
  categories,
  productId,
  initialData,
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
    lastBuyPrice: 0,
    sellingPrice: 0,
    minStock: 0,
    active: true,
    ...initialData,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      ...form,
      lastBuyPrice: Number(form.lastBuyPrice) || 0,
      sellingPrice: Number(form.sellingPrice) || 0,
      minStock: Number(form.minStock) || 0,
    };

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
            ? JSON.stringify(data.details)
            : data.error;
        setError(details || "Terjadi kesalahan");
        return;
      }
      router.push(`/products/${data.product?.id}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="error">{error}</p>}

      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="sku">SKU</label>
        <input
          id="sku"
          value={form.sku}
          onChange={(e) => update("sku", e.target.value)}
          required
          readOnly={Boolean(productId)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="categoryId">Category</label>
        <select
          id="categoryId"
          value={form.categoryId}
          onChange={(e) => update("categoryId", e.target.value)}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="type">Type</label>
        <input
          id="type"
          value={form.type ?? ""}
          onChange={(e) => update("type", e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="size">Size</label>
        <input
          id="size"
          value={form.size ?? ""}
          onChange={(e) => update("size", e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="material">Material</label>
        <input
          id="material"
          value={form.material ?? ""}
          onChange={(e) => update("material", e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="unit">Unit</label>
        <input
          id="unit"
          value={form.unit}
          onChange={(e) => update("unit", e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="lastBuyPrice">Last Buy Price</label>
        <input
          id="lastBuyPrice"
          type="number"
          min="0"
          value={form.lastBuyPrice}
          onChange={(e) => update("lastBuyPrice", Number(e.target.value))}
        />
      </div>

      <div className="form-group">
        <label htmlFor="sellingPrice">Selling Price</label>
        <input
          id="sellingPrice"
          type="number"
          min="0"
          value={form.sellingPrice}
          onChange={(e) => update("sellingPrice", Number(e.target.value))}
        />
      </div>

      <div className="form-group">
        <label htmlFor="minStock">Min Stock</label>
        <input
          id="minStock"
          type="number"
          min="0"
          value={form.minStock}
          onChange={(e) => update("minStock", Number(e.target.value))}
        />
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Saving..." : productId ? "Update" : "Create"}
      </button>
    </form>
  );
}
