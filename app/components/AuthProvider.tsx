"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Client session context for the App Router.
 * `useSession` (used by page components for role-based UI) requires this provider.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
