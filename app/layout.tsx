import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarLayout } from "./components/SidebarLayout";
import { AuthProvider } from "./components/AuthProvider";
import { THEME_COOKIE, isTheme } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistem Inventory Baut",
  description: "Sistem Inventory Baut",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Theme is resolved on the server from a cookie so the first paint is already
  // correct. No inline <script> needed, so there is no flash and no React warning.
  const store = await cookies();
  const stored = store.get(THEME_COOKIE)?.value;
  const theme = isTheme(stored) ? stored : "light";

  return (
    <html lang="id" data-theme={theme} className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AuthProvider>
          <SidebarLayout>{children}</SidebarLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
