"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ProductScanDraftLine } from "@/lib/products/scan-draft";

type MatchedProduct = {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  aliases: { alias: string }[];
};

type ReviewLine = ProductScanDraftLine & {
  /** Product the matcher resolved for this line, if any. */
  product: MatchedProduct | null;
  confidence: number;
  /** Only used when the product is new. */
  sku: string;
  categoryId: string;
};

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n ?? 0);

/** Turns a scanned name into an uppercase SKU stem. */
function toSkuStem(name: string) {
  const cleaned = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return cleaned || "PRODUK";
}

export function ProductScanReview({
  lines: initialLines,
  categories,
}: {
  lines: ProductScanDraftLine[];
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const defaultCategoryId = categories[0]?.id ?? "";

  const [lines, setLines] = useState<ReviewLine[]>(() =>
    initialLines.map((line) => ({
      ...line,
      product: null,
      confidence: 0,
      sku: toSkuStem(line.name),
      categoryId: defaultCategoryId,
    }))
  );
  /** Names the server has already been asked about, so edits resolve once. */
  const [queried, setQueried] = useState<string[]>([]);
  const [resolveError, setResolveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [results, setResults] = useState<string[]>([]);

  // Names that changed since the last match request.
  const unresolved = lines
    .map((l) => l.name.trim())
    .filter((name, i, arr) => name !== "" && arr.indexOf(name) === i && !queried.includes(name));
  const unresolvedKey = unresolved.join("\n");
  /** A request is in flight while names are still waiting to be asked about. */
  const resolving = unresolvedKey !== "";

  useEffect(() => {
    if (unresolvedKey === "") return;
    const names = unresolvedKey.split("\n");
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/ocr/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ names }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal mencocokkan produk");
        if (cancelled) return;
        const matches = (data.matches ?? []) as Array<{
          name: string;
          product: MatchedProduct | null;
          confidence?: number;
        }>;
        setLines((prev) =>
          prev.map((line) => {
            const hit = matches.find((m) => m.name === line.name.trim());
            if (!hit) return line;
            return {
              ...line,
              product: hit.product ?? null,
              confidence: hit.confidence ?? 0,
            };
          })
        );
      } catch (e) {
        if (!cancelled) {
          setResolveError(e instanceof Error ? e.message : "Gagal mencocokkan produk");
        }
      } finally {
        if (!cancelled) {
          setResolveError("");
          setQueried((prev) => [...prev, ...names]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [unresolvedKey]);

  function updateLine<K extends keyof ReviewLine>(idx: number, key: K, value: ReviewLine[K]) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l)));
  }

  function updateName(idx: number, name: string) {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, name, sku: toSkuStem(name) } : l))
    );
  }

  async function saveAll() {
    setSaving(true);
    setSaveError("");
    setResults([]);

    const notes: string[] = [];
    for (const line of lines) {
      const name = line.name.trim();
      if (!name) {
        setSaveError("Nama produk tidak boleh kosong.");
        setSaving(false);
        return;
      }

      try {
        if (line.product) {
          // Existing product: only the price moves. A scanned receipt is not
          // allowed to rename an established product without human review.
          const priceChanged = line.price !== line.product.sellingPrice;
          const res = await fetch(`/api/products/${line.product.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sellingPrice: line.price }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => null);
            throw new Error(data?.error || `Gagal memperbarui "${name}"`);
          }

          // Keep the scanned wording as an alias so the next scan resolves
          // exactly instead of relying on fuzzy similarity again.
          const known = line.product.aliases.map((a) => a.alias.toLowerCase());
          const isSameName = name.toLowerCase() === line.product.name.toLowerCase();
          if (!isSameName && !known.includes(name.toLowerCase())) {
            const aliasRes = await fetch(
              `/api/product-aliases?productId=${line.product.id}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: line.product.id, alias: name }),
              }
            );
            if (!aliasRes.ok) {
              const data = await aliasRes.json().catch(() => null);
              throw new Error(data?.error || `Gagal menyimpan alias "${name}"`);
            }
            notes.push(
              `${name} → harga ${
                priceChanged ? `${rupiah(line.product.sellingPrice)} → ` : ""
              }${rupiah(line.price)}, alias disimpan`
            );
          } else {
            notes.push(
              priceChanged
                ? `${name} → harga ${rupiah(line.product.sellingPrice)} → ${rupiah(line.price)}`
                : `${name} → tidak ada perubahan`
            );
          }
        } else {
          if (!line.categoryId) {
            setSaveError(`Kategori wajib dipilih untuk "${name}".`);
            setSaving(false);
            return;
          }
          const res = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              sku: line.sku.trim() || toSkuStem(name),
              categoryId: line.categoryId,
              unit: "pcs",
              sellingPrice: line.price,
              minStock: 0,
            }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => null);
            throw new Error(data?.error || `Gagal membuat produk "${name}"`);
          }
          notes.push(`${name} → produk baru dibuat (${rupiah(line.price)})`);
        }
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : `Gagal menyimpan "${name}"`);
        setSaving(false);
        return;
      }
    }

    setResults(notes);
    setSaving(false);
    router.refresh();
  }

  const priceDiff = (l: ReviewLine) => (l.product ? l.price - l.product.sellingPrice : 0);

  return (
    <div className="card">
      <h2 className="card-title">Hasil Pindai — Tinjau Produk</h2>
      <p className="muted" style={{ fontSize: 12.5, margin: "0 0 14px" }}>
        Baris yang namanya sudah dikenal (nama atau alias) akan diperbarui
        harganya saja. Baris baru akan dibuat sebagai produk, dan nama yang
        dipindai disimpan sebagai alias. Belum ada yang tersimpan sebelum kamu
        tekan Simpan Semua.
      </p>

      {resolveError && <p className="message error">{resolveError}</p>}
      {saveError && <p className="message error">{saveError}</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ minWidth: 210 }}>Nama dari Struk</th>
              <th>Cocok dengan</th>
              <th className="num">Harga Struk</th>
              <th className="num">Harga Tersimpan</th>
              <th className="num">Selisih</th>
              <th>Kategori</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => {
              const diff = priceDiff(line);
              return (
                <tr key={idx}>
                  <td>
                    <input
                      type="text"
                      value={line.name}
                      onChange={(e) => updateName(idx, e.target.value)}
                      aria-label={`Nama item baris ${idx + 1}`}
                    />
                    {!line.product && (
                      <input
                        type="text"
                        value={line.sku}
                        onChange={(e) => updateLine(idx, "sku", e.target.value)}
                        placeholder="SKU"
                        aria-label={`SKU item baris ${idx + 1}`}
                        className="mt-4"
                      />
                    )}
                  </td>
                  <td>
                    {line.product ? (
                      <div>
                        <div className="action-link">{line.product.name}</div>
                        <small className="muted">
                          {line.product.sku} · cocok {(line.confidence * 100).toFixed(0)}%
                        </small>
                      </div>
                    ) : (
                      <span className="badge badge-warning">Produk baru</span>
                    )}
                  </td>
                  <td className="num">
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={line.price}
                      onChange={(e) => updateLine(idx, "price", Number(e.target.value) || 0)}
                      aria-label={`Harga baris ${idx + 1}`}
                      className="num-input"
                    />
                  </td>
                  <td className="num muted">
                    {line.product ? rupiah(line.product.sellingPrice) : "—"}
                  </td>
                  <td className="num">
                    {line.product ? (
                      diff !== 0 ? (
                        <span className={diff > 0 ? "badge badge-warning" : "badge badge-success"}>
                          {diff > 0 ? "+" : "−"}
                          {rupiah(Math.abs(diff))}
                        </span>
                      ) : (
                        <span className="muted">sama</span>
                      )
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    {line.product ? (
                      <span className="muted">tetap</span>
                    ) : (
                      <select
                        value={line.categoryId}
                        onChange={(e) => updateLine(idx, "categoryId", e.target.value)}
                        aria-label={`Kategori item baris ${idx + 1}`}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {resolving && <p className="muted" style={{ marginTop: 10 }}>Mencocokkan produk…</p>}

      {results.length > 0 && (
        <div className="message success" style={{ marginTop: 14, textAlign: "left" }}>
          <strong>Ringkasan perubahan</strong>
          <ul style={{ margin: "6px 0 0 16px", listStyle: "disc" }}>
            {results.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", marginTop: 14, alignItems: "center" }}>
        <button
          type="button"
          className="btn-primary"
          onClick={saveAll}
          disabled={saving || resolving || lines.length === 0}
        >
          {saving ? "Menyimpan…" : "Simpan Semua"}
        </button>
        <Link href="/products" className="btn-secondary">
          Batal
        </Link>
      </div>
    </div>
  );
}