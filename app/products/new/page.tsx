"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProductForm from "@/components/productForm";

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Gagal load kategori");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>Create Product</h1>
        <Link href="/products" className="btn-secondary" style={{ textDecoration: "none" }}>
          Back to Products
        </Link>
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading categories...</p>
      ) : (
        <div className="card">
          <ProductForm categories={categories} />
        </div>
      )}
    </div>
  );
}
