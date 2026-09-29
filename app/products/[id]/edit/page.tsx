"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import ProductForm from "@/components/productForm";

type Product = {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  type: string | null;
  size: string | null;
  material: string | null;
  unit: string;
  lastBuyPrice: number;
  sellingPrice: number;
  minStock: number;
  active: boolean;
};

type Alias = { id: string; alias: string };

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [aliases, setAliases] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [catRes, prodRes, aliasRes] = await Promise.all([
          fetch("/api/categories", { cache: "no-store" }),
          fetch(`/api/products/${id}`, { cache: "no-store" }),
          fetch(`/api/product-aliases?productId=${id}`, { cache: "no-store" }),
        ]);

        if (!prodRes.ok) {
          const data = await prodRes.json().catch(() => null);
          throw new Error(data?.error || "Produk tidak ditemukan");
        }
        if (!catRes.ok) throw new Error("Gagal memuat kategori");

        const catData = await catRes.json();
        const prodData = await prodRes.json();
        const aliasData = aliasRes.ok ? await aliasRes.json() : { aliases: [] };

        if (!active) return;
        setCategories(catData.categories || []);
        setProduct(prodData.product);
        setAliases((aliasData.aliases || []).map((a: Alias) => a.alias));
      } catch (e: any) {
        if (!active) return;
        setError(e.message || "Gagal memuat data produk");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Edit Produk</h1>
          <p className="page-sub">Perbarui data, harga, dan nama alternatif produk</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href={`/products/${id}/aliases`} className="btn-secondary">
            Kelola Alias
          </Link>
          <Link href={`/products/${id}`} className="btn-ghost">
            ← Kembali
          </Link>
        </div>
      </div>

      {error && <p className="message error">{error}</p>}

      {loading ? (
        <p className="muted">Memuat data produk…</p>
      ) : product ? (
        <div className="card">
          <ProductForm
            categories={categories}
            productId={product.id}
            initialAliases={aliases}
            initialData={{
              name: product.name,
              sku: product.sku,
              categoryId: product.categoryId,
              type: product.type || undefined,
              size: product.size || undefined,
              material: product.material || undefined,
              unit: product.unit,
              sellingPrice: String(product.sellingPrice),
              minStock: product.minStock,
              active: product.active,
            }}
          />
        </div>
      ) : !error ? (
        <div className="card empty-state">Produk tidak ditemukan.</div>
      ) : null}
    </div>
  );
}
