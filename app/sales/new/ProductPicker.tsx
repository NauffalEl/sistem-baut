"use client";

import { useEffect, useRef, useState } from "react";

export type PickableProduct = {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  inventory: { quantity: number } | null;
  /** Alias = alternate spelling an admin can search for (e.g. "baut 30" → "Baut 6×30"). */
  aliases?: { alias: string }[];
};

type Props = {
  products: PickableProduct[];
  value: string;
  onSelect: (product: PickableProduct) => void;
  placeholder?: string;
  label?: string;
};

/**
 * Searchable product dropdown. A native <select> cannot be filtered, so an admin
 * scanning a receipt has no quick way to correct a wrong or missing match.
 */
export function ProductPicker({ products, value, onSelect, placeholder = "Cari produk…", label = "Produk" }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = products.find((p) => p.id === value);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
  }, [open]);

  // Close when clicking outside the picker.
  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const term = query.trim().toLowerCase();

  // Match on name, SKU, or any alias so a scanned shorthand still resolves.
  const matches = term
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          (p.aliases ?? []).some((a) => a.alias.toLowerCase().includes(term))
      )
    : products;

  // When the search only hits via alias, show that alias so the admin can
  // confirm they picked the right product rather than a same-name lookalike.
  const matchedAlias = (p: PickableProduct) =>
    term && !p.name.toLowerCase().includes(term) && !p.sku.toLowerCase().includes(term)
      ? (p.aliases ?? []).find((a) => a.alias.toLowerCase().includes(term))?.alias
      : undefined;

  return (
    <div className="product-picker-wrap" ref={wrapRef}>
      <button
        type="button"
        className="product-picker-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={selected ? "" : "muted"}>
          {selected ? `${selected.name} (${selected.sku})` : placeholder}
        </span>
        <span className="muted" aria-hidden="true">
          {selected ? `stok ${selected.inventory?.quantity ?? 0}` : "▾"}
        </span>
      </button>

      {open && (
        <div className="product-picker-dropdown" role="listbox" aria-label={label}>
          <div className="product-picker-search">
            <input
              ref={searchRef}
              type="text"
              value={query}
              placeholder="Ketik nama, SKU, atau alias…"
              onChange={(e) => setQuery(e.target.value)}
              aria-label={`Cari ${label.toLowerCase()}`}
            />
          </div>
          <ul className="product-picker-list">
            {matches.length === 0 ? (
              <li className="product-picker-option muted">Produk tidak ditemukan</li>
            ) : (
              matches.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`product-picker-option ${p.id === value ? "is-selected" : ""}`}
                    onClick={() => {
                      onSelect(p);
                      setOpen(false);
                      setQuery("");
                    }}
                    role="option"
                    aria-selected={p.id === value}
                  >
                    <span>
                      {p.name} <span className="muted">({p.sku})</span>
                      {matchedAlias(p) && (
                        <span className="muted"> · alias: {matchedAlias(p)}</span>
                      )}
                    </span>
                    <span className="muted">stok {p.inventory?.quantity ?? 0}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
