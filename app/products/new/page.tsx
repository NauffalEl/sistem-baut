"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ProductForm from "@/components/productForm";

export default function NewProductPage() {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Gagal memuat kategori");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Produk Baru</h1>
          <p className="page-sub">Tambahkan barang baru beserta nama alternatif untuk pencarian</p>
        </div>
        <Link href="/products" className="btn-secondary">
          ← Kembali ke Produk
        </Link>
      </div>

      {error && <p className="message error">{error}</p>}

      <div className="card">
        {loading ? (
          <p className="muted">Memuat kategori…</p>
        ) : categories.length === 0 ? (
          <p className="empty-state">
            Belum ada kategori.{" "}
            <Link href="/categories" className="action-link">
              Buat kategori dulu
            </Link>{" "}
            sebelum menambah produk.
          </p>
        ) : (
          <ProductForm categories={categories} />
        )}
      </div>
    </div>
  );
}
