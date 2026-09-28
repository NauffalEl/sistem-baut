import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav style={{ padding: "12px 24px", borderBottom: "1px solid #eee", display: "flex", gap: 16 }}>
          <a href="/dashboard">Dashboard</a>
          <a href="/products">Products</a>
          <a href="/inventory">Inventory</a>
          <a href="/purchases">Purchases</a>
          <a href="/sales">Sales</a>
          <a href="/ai-agent">AI Agent</a>
          <a href="/ocr">OCR</a>
          <a href="/suppliers">Suppliers</a>
          <a href="/categories">Categories</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
