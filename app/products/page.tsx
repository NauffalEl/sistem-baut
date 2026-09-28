"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  sku: string;
  category: { name: string } | null;
  active: boolean;
  sellingPrice: number;
  inventory: { quantity: number } | null;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, filterCategory, filterActive]);

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch {}
  }

  async function fetchProducts() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (filterCategory) params.set("categoryId", filterCategory);
      if (filterActive) params.set("active", filterActive);
      const res = await fetch(`/api/products?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal load produk");
      const data = await res.json();
      setProducts(data.items);
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin nonaktifkan produk ini?")) return;
    try {
      const res = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Gagal hapus produk");
        return;
      }
      fetchProducts();
    } catch {
      alert("Network error");
    }
  }

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Produk</h1>
          <p className="page-sub">Kelola daftar produk, SKU, dan harga jual</p>
        </div>
        <Link href="/products/new" className="btn-primary">+ Produk Baru</Link>
      </div>

      {error && <p className="message error">{error}</p>}

      <div className="filters">
        <input
          className="grow"
          type="text"
          placeholder="Cari nama atau SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
      </div>

      {loading ? (
        <p className="muted">Memuat data…</p>
      ) : products.length === 0 ? (
        <div className="card empty-state">Belum ada produk. Mulai dengan menambah produk baru.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>SKU</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Stok</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: "var(--ink)" }}>{p.name}</td>
                  <td className="num">{p.sku}</td>
                  <td className="muted">{p.category?.name || "—"}</td>
                  <td className="num">{p.sellingPrice.toLocaleString("id-ID")}</td>
                  <td className="num">{p.inventory?.quantity ?? 0}</td>
                  <td>
                    <span className={`badge ${p.active ? "badge-success" : "badge-muted"}`}>
                      {p.active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <Link href={`/products/${p.id}`} className="action-link">Lihat</Link>
                      <Link href={`/products/${p.id}/edit`} className="action-link">Edit</Link>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="action-link delete"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
