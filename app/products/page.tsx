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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>Products</h1>
        <Link href="/products/new" className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
          + New Product
        </Link>
      </div>

      {error && <p className="error">{error}</p>}

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.sku}</td>
                <td>{p.category?.name || "-"}</td>
                <td>{p.sellingPrice}</td>
                <td>{p.inventory?.quantity ?? 0}</td>
                <td>{p.active ? "Active" : "Inactive"}</td>
                <td>
                  <Link href={`/products/${p.id}`}>View</Link>
                  {" | "}
                  <Link href={`/products/${p.id}/edit`}>Edit</Link>
                  {" | "}
                  <button
                    onClick={() => handleDelete(p.id)}
                    style={{ color: "red", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
