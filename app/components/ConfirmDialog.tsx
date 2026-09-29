"use client";

export type ConfirmTone = "danger" | "primary";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * Lightweight accessible confirm modal. Replaces window.confirm so the
 * wording, tone, and layout match the rest of the design system.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  tone = "danger",
  busy = false,
  onConfirm,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={busy ? undefined : onClose}
      role="presentation"
    >
      <div
        className="modal-card modal-card-sm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-title" className="modal-title">
          {title}
        </h3>
        {description && <p className="modal-desc">{description}</p>}
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={tone === "danger" ? "btn-danger" : "btn-primary"}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Memproses…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
