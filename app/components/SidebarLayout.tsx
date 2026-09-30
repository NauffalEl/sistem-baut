"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { LogoutButton } from "./LogoutButton";

/** Pages a non-admin user is allowed to reach. */
const USER_NAV = ["/dashboard", "/products", "/inventory", "/sales"];

const ALL_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", badge: null as string | null },
  { href: "/products", label: "Produk", badge: null as string | null },
  { href: "/inventory", label: "Inventori", badge: null as string | null },
  { href: "/purchases", label: "Pembelian", badge: null as string | null },
  { href: "/sales", label: "Penjualan", badge: null as string | null },
  { href: "/suppliers", label: "Supplier", badge: null as string | null },
  { href: "/categories", label: "Kategori", badge: null as string | null },
  { href: "/ai-agent", label: "AI Advisor", badge: "Auto" },
];

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session, status: sessionStatus } = useSession();

  // While the session is still resolving, render the full admin nav to avoid
  // a sidebar flash. It is replaced as soon as the role is known.
  const isAdmin = sessionStatus === "loading" || session?.user?.role === "ADMIN";
  const navItems = isAdmin
    ? ALL_NAV_ITEMS
    : ALL_NAV_ITEMS.filter((i) => USER_NAV.includes(i.href));

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Auth pages (login/register) don't need app chrome
  const isAuthPage = pathname === "/login" || pathname === "/register";
  if (isAuthPage) {
    return <main className="auth-canvas">{children}</main>;
  }

  const currentItem = navItems.find(
    (item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
  );

  return (
    <div className={`app-shell ${collapsed ? "is-collapsed" : ""}`}>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`app-sidebar ${mobileOpen ? "is-mobile-open" : ""}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-mark" aria-hidden="true" style={{ background: "none", boxShadow: "none", width: 32, height: 32 }}>
            <img src="/boltinventory-icon.svg" alt="Logo" width="32" height="32" style={{ borderRadius: 6 }} />
          </div>
          <div className="brand-text">
            <span className="brand-name">BAUT.ID</span>
            <span className="brand-sub">Inventory OS</span>
          </div>
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Perluas menu" : "Ciutkan menu"}
            title={collapsed ? "Expand (Ctrl+\\)" : "Collapse"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {collapsed ? (
                <path d="M9 18l6-6-6-6" />
              ) : (
                <path d="M15 18l-6-6 6-6" />
              )}
            </svg>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="sidebar-nav" aria-label="Menu Utama">
          <div className="nav-group-label">{!collapsed && "MENU UTAMA"}</div>
          <ul className="nav-list">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <li key={item.href} className="nav-item">
                  <Link
                    href={item.href}
                    className={`nav-link ${active ? "active" : ""}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="nav-icon" aria-hidden="true">
                      {renderNavIcon(item.href)}
                    </span>
                    {!collapsed && (
                      <>
                        <span className="nav-text">{item.label}</span>
                        {item.badge && (
                          <span className={`nav-badge badge-${item.badge.toLowerCase()}`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer info in sidebar */}
        <div className="sidebar-footer">
          <div className="user-capsule">
            <div className="user-avatar" aria-hidden="true">
              {(session?.user?.name ?? "?").charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="user-meta">
                <span className="user-name">{session?.user?.name ?? "Memuat…"}</span>
                <span className="user-role">
                  {isAdmin && sessionStatus !== "loading" ? "Administrator" : "Staff"}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="app-main">
        {/* Top Navbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu navigasi"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="topbar-breadcrumbs">
              <span className="crumb-root">Sistem</span>
              <span className="crumb-sep">/</span>
              <span className="crumb-current">{currentItem?.label || "Page"}</span>
            </div>
          </div>

          <div className="topbar-right">
            <span className="live-status-pill">
              <span className="live-dot" />
              Online
            </span>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>

        {/* Page Content Body */}
        <main className="content-surface">{children}</main>
      </div>
    </div>
  );
}

function renderNavIcon(href: string) {
  switch (href) {
    case "/dashboard":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );
    case "/products":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    case "/inventory":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case "/purchases":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    case "/sales":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case "/ai-agent":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      );
    case "/suppliers":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      );
    case "/categories":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18" />
        </svg>
      );
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}
