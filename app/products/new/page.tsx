"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ProductForm from "@/components/productForm";
import { ProductScanReview } from "./ProductScanReview";
import { readProductScanDraft } from "@/lib/products/scan-draft";

export default function NewProductPage() {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scanDraft, setScanDraft] = useState<ReturnType<typeof readProductScanDraft>>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Gagal memuat kategori");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Terjadi kesalahan";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Reading the draft is a browser-only store, so it happens after mount to
    // keep SSR and hydration consistent.
    void (async () => {
      const draft = readProductScanDraft();
      if (draft) setScanDraft(draft);
      await fetchCategories();
    })();
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
        {scanDraft && !loading && categories.length > 0 ? (
          <ProductScanReview lines={scanDraft.lines} categories={categories} />
        ) : loading ? (
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
