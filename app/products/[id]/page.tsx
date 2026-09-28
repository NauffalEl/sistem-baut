"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  sku: string;
  category: { id: string; name: string } | null;
  type: string | null;
  size: string | null;
  material: string | null;
  unit: string;
  lastBuyPrice: number;
  sellingPrice: number;
  minStock: number;
  active: boolean;
  inventory: { quantity: number } | null;
  aliases: { id: string; alias: string }[];
};

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  async function fetchProduct() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${id}`, { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal load produk");
      }
      const data = await res.json();
      setProduct(data.product);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate() {
    if (!confirm("Yakin ingin nonaktifkan produk ini?")) return;
    setDeactivating(true);
    try {
      const res = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Gagal nonaktifkan produk");
        return;
      }
      router.push("/products");
    } catch {
      alert("Network error");
    } finally {
      setDeactivating(false);
    }
  }

  if (loading) return <div className="container"><p>Loading...</p></div>;
  if (error) return <div className="container"><p className="error">{error}</p></div>;
  if (!product) return <div className="container"><p>Produk tidak ditemukan</p></div>;

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>{product.name}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/products/${product.id}/edit`} className="btn-primary" style={{ textDecoration: "none" }}>
            Edit
          </Link>
          <Link href={`/products/${product.id}/aliases`} className="btn-secondary" style={{ textDecoration: "none" }}>
            Aliases
          </Link>
          {product.active && (
            <button onClick={handleDeactivate} className="btn-danger" disabled={deactivating}>
              {deactivating ? "Deactivating..." : "Deactivate"}
            </button>
          )}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="card">
        <h3>Details</h3>
        <table style={{ marginTop: 12 }}>
          <tbody>
            <tr><td><strong>SKU</strong></td><td>{product.sku}</td></tr>
            <tr><td><strong>Category</strong></td><td>{product.category?.name || "-"}</td></tr>
            <tr><td><strong>Type</strong></td><td>{product.type || "-"}</td></tr>
            <tr><td><strong>Size</strong></td><td>{product.size || "-"}</td></tr>
            <tr><td><strong>Material</strong></td><td>{product.material || "-"}</td></tr>
            <tr><td><strong>Unit</strong></td><td>{product.unit}</td></tr>
            <tr><td><strong>Last Buy Price</strong></td><td>{product.lastBuyPrice}</td></tr>
            <tr><td><strong>Selling Price</strong></td><td>{product.sellingPrice}</td></tr>
            <tr><td><strong>Min Stock</strong></td><td>{product.minStock}</td></tr>
            <tr><td><strong>Current Stock</strong></td><td>{product.inventory?.quantity ?? 0}</td></tr>
            <tr><td><strong>Status</strong></td><td>{product.active ? "Active" : "Inactive"}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>Aliases</h3>
        {product.aliases.length === 0 ? (
          <p>No aliases.</p>
        ) : (
          <ul>
            {product.aliases.map((a) => (
              <li key={a.id}>{a.alias}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
