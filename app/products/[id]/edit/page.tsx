"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchCategories(), fetchProduct()]).finally(() => setLoading(false));
  }, [id]);

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Gagal load kategori");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (e: any) {
      setError(e.message || "Error");
    }
  }

  async function fetchProduct() {
    try {
      const res = await fetch(`/api/products/${id}`, { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal load produk");
      }
      const data = await res.json();
      setProduct(data.product);
    } catch (e: any) {
      setError(e.message || "Error");
    }
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>Edit Product</h1>
        <Link href={`/products/${id}`} className="btn-secondary" style={{ textDecoration: "none" }}>
          Back to Product
        </Link>
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : product ? (
        <div className="card">
          <ProductForm
            categories={categories}
            productId={product.id}
            initialData={{
              name: product.name,
              sku: product.sku,
              categoryId: product.categoryId,
              type: product.type || undefined,
              size: product.size || undefined,
              material: product.material || undefined,
              unit: product.unit,
              lastBuyPrice: product.lastBuyPrice,
              sellingPrice: product.sellingPrice,
              minStock: product.minStock,
              active: product.active,
            }}
          />
        </div>
      ) : (
        <p>Produk tidak ditemukan.</p>
      )}
    </div>
  );
}
