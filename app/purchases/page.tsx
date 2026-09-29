"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { useConfirmDialog } from "@/app/components/useConfirmDialog";

type PurchaseItem = {
  id: string;
  quantity: number;
  price: number;
  subtotal: number;
};

type Purchase = {
  id: string;
  purchaseNo: string;
  status: string;
  total: number;
  note: string | null;
  createdAt: string;
  supplier: { name: string };
  items: PurchaseItem[];
};

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n ?? 0);

const STATUS_BADGE: Record<string, string> = {
  draft: "badge-warning",
  confirmed: "badge-success",
  cancelled: "badge-muted",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  confirmed: "Dikonfirmasi",
  cancelled: "Dibatalkan",
};

export default function PurchasesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const { dialogProps, ask } = useConfirmDialog();

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/purchases?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal load pembelian");
      const data = await res.json();
      setPurchases(data.items);
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const t = setTimeout(fetchPurchases, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchPurchases, search]);

  const handleConfirm = (id: string) => {
    ask(
      "Konfirmasi pembelian?",
      async () => {
        try {
          const res = await fetch(`/api/purchases/${id}/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "confirm" }),
          });
          const data = await res.json();
          if (!res.ok) {
            setError(data.error || "Gagal konfirmasi pembelian");
            return;
          }
          await fetchPurchases();
        } catch {
          setError("Koneksi bermasalah. Coba lagi.");
        }
      },
      {
        description: "Stok produk akan bertambah dan harga tersimpan ke riwayat.",
        confirmLabel: "Konfirmasi",
        tone: "primary",
      }
    );
  };

  const handleCancel = (id: string, no: string) => {
    ask(
      `Batalkan pembelian ${no}?`,
      async () => {
        try {
          const res = await fetch(`/api/purchases/${id}/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "cancel" }),
          });
          const data = await res.json();
          if (!res.ok) {
            setError(data.error || "Gagal membatalkan pembelian");
            return;
          }
          await fetchPurchases();
        } catch {
          setError("Koneksi bermasalah. Coba lagi.");
        }
      },
      { description: "Status diubah menjadi dibatalkan.", confirmLabel: "Batalkan PO" }
    );
  };

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Pembelian</h1>
          <p className="page-sub">Kelola purchase order dan penerimaan barang dari supplier</p>
        </div>
        {isAdmin && (
          <Link href="/purchases/new" className="btn-primary">
            + Pembelian Baru
          </Link>
        )}
      </div>

      {error && <p className="message error">{error}</p>}

      <div className="filters">
        <input
          className="grow"
          type="text"
          placeholder="Cari nomor PO atau supplier…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Dikonfirmasi</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </div>

      {loading ? (
        <p className="muted">Memuat data…</p>
      ) : purchases.length === 0 ? (
        <div className="card empty-state">
          Belum ada pembelian. {isAdmin && "Mulai dengan membuat purchase order baru."}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>No. PO</th>
                <th>Supplier</th>
                <th className="num-col">Item</th>
                <th className="num-col">Total</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th className="action-col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id}>
                  <td className="num">{p.purchaseNo}</td>
                  <td style={{ fontWeight: 600, color: "var(--ink)" }}>{p.supplier.name}</td>
                  <td className="num">{p.items.length}</td>
                  <td className="num">{rupiah(p.total)}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[p.status] ?? "badge-muted"}`}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="muted">{new Date(p.createdAt).toLocaleDateString("id-ID")}</td>
                  <td>
                    <div className="row-actions">
                      <Link href={`/purchases/${p.id}`} className="action-link">
                        Lihat
                      </Link>
                      {isAdmin && p.status === "draft" && (
                        <>
                          <button
                            onClick={() => handleConfirm(p.id)}
                            className="table-action"
                          >
                            Konfirmasi
                          </button>
                          <button
                            onClick={() => handleCancel(p.id, p.purchaseNo)}
                            className="action-link delete"
                            aria-label={`Batalkan ${p.purchaseNo}`}
                            title="Batalkan"
                          >
                            <TrashIcon />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
