"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useConfirmDialog } from "@/app/components/useConfirmDialog";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { InventoryQuickPanel } from "@/components/inventory/InventoryQuickPanel";
import { writeScanDraft } from "@/lib/sales/scan-draft";

type SaleItem = {
  id: string;
  quantity: number;
  price: number;
  subtotal: number;
};

type Sale = {
  id: string;
  saleNo: string;
  status: string;
  total: number;
  note: string | null;
  createdAt: string;
  items: SaleItem[];
};

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n ?? 0);

const STATUS_BADGE: Record<string, string> = { draft: "badge-warning", confirmed: "badge-success", cancelled: "badge-muted" };
const STATUS_LABEL: Record<string, string> = { draft: "Draft", confirmed: "Dikonfirmasi", cancelled: "Dibatalkan" };

export default function SalesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [scanning, setScanning] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { dialogProps, ask } = useConfirmDialog();

  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/sales?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal load penjualan");
      const data = await res.json();
      setSales(data.items || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const t = setTimeout(fetchSales, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchSales, search]);

  /**
   * Upload receipt image to /api/ocr, stash the parsed lines, then send the
   * admin to /sales/new where the items get prefilled for review.
   */
  async function handleScan(file: File) {
    setScanning(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/ocr", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal memproses gambar");
        return;
      }

      const receiptId = data.receipt?.id ?? "";
      const lines = data.ocrResult?.items ?? [];
      if (!receiptId) {
        setError("OCR selesai tapi tidak menghasilkan ID Nota.");
        return;
      }

      writeScanDraft({
        receiptId,
        lines: (Array.isArray(lines) ? lines : []).map(
          (l: { matchedProductId?: string | null; rawName?: string; quantity?: number; price?: number }) => ({
            productId: l.matchedProductId ?? null,
            name: l.rawName ?? "",
            quantity: Number(l.quantity) || 1,
            price: Number(l.price) || 0,
          })
        ),
      });
      router.push("/sales/new");

    } catch {
      setError("Koneksi bermasalah saat memproses gambar");
    } finally {
      setScanning(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const handleConfirm = (id: string) => {
    ask(
      "Konfirmasi penjualan?",
      async () => {
        try {
          const res = await fetch(`/api/sales/${id}/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "confirm" }),
          });
          const data = await res.json();
          if (!res.ok) {
            setError(data.error || "Gagal konfirmasi penjualan");
            return;
          }
          await fetchSales();
        } catch {
          setError("Koneksi bermasalah. Coba lagi.");
        }
      },
      { description: "Stok produk akan berkurang.", confirmLabel: "Ya, Konfirmasi", tone: "primary" }
    );
  };

  const handleCancel = (id: string, no: string) => {
    ask(
      `Batalkan penjualan ${no}?`,
      async () => {
        try {
          const res = await fetch(`/api/sales/${id}/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "cancel" }),
          });
          const data = await res.json();
          if (!res.ok) {
            setError(data.error || "Gagal membatalkan penjualan");
            return;
          }
          await fetchSales();
        } catch {
          setError("Koneksi bermasalah. Coba lagi.");
        }
      },
      { description: "Status diubah menjadi dibatalkan.", confirmLabel: "Ya, Batalkan" }
    );
  };

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Penjualan</h1>
          <p className="page-sub">Kelola struk dan transaksi keluar</p>
        </div>
        <div className="page-head-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowInventory(true)}
          >
            Inventori
          </button>
          {isAdmin && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="visually-hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleScan(file);
                }}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => fileRef.current?.click()}
                disabled={scanning}
              >
                {scanning ? "Memproses…" : "Scan Struk"}
              </button>
              <Link href="/sales/new" className="btn-primary">
                + Penjualan Baru
              </Link>
            </>
          )}
        </div>
      </div>

      {error && <p className="message error">{error}</p>}

      <div className="filters">
        <input 
          className="grow" 
          type="text" 
          placeholder="Cari nomor SO…" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          aria-label="Cari penjualan"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter status">
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Dikonfirmasi</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </div>

      {loading ? (
        <p className="muted">Memuat data…</p>
      ) : sales.length === 0 ? (
        <div className="card empty-state">
          {search || filter 
            ? "Tidak ada penjualan yang cocok dengan filter." 
            : isAdmin
              ? "Belum ada penjualan. Mulai dengan membuat struk baru."
              : "Belum ada penjualan."}
        </div>
      ) : (
        <>
          <p className="table-meta">Menampilkan {sales.length} transaksi</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No. SO</th>
                  <th className="num-col">Item</th>
                  <th className="num-col">Total</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                  <th className="action-col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id}>
                    <td className="num cell-strong">{s.saleNo}</td>
                    <td className="num num-col">{s.items.length}</td>
                    <td className="num num-col cell-strong">{rupiah(s.total)}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[s.status] ?? "badge-muted"}`}>
                        {STATUS_LABEL[s.status] ?? s.status}
                      </span>
                    </td>
                    <td className="muted">{new Date(s.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="action-col">
                      <div className="row-actions">
                        <Link href={`/sales/${s.id}`} className="action-link">Lihat</Link>
                        {isAdmin && s.status === "draft" && (
                          <>
                            <button onClick={() => handleConfirm(s.id)} className="table-action">Konfirmasi</button>
                            <button onClick={() => handleCancel(s.id, s.saleNo)} className="action-link delete" aria-label={`Batalkan ${s.saleNo}`} title="Batalkan">
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
        </>
      )}

      {showInventory && <InventoryQuickPanel onClose={() => setShowInventory(false)} />}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
