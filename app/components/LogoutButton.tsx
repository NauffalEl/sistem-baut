"use client";

import { usePathname } from "next/navigation";

export function LogoutButton() {
  const pathname = usePathname();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Session may already be gone — still return to login.
    } finally {
      window.location.href = "/login";
    }
  }

  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="topbar-icon-btn"
      aria-label="Keluar"
      title="Keluar"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    </button>
  );
}
