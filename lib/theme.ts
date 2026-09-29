/** Shared theme identifiers. Kept dependency-free so both server and client can import. */
export const THEME_COOKIE = "sistem-baut-theme";

export type Theme = "light" | "dark";

export const isTheme = (v: unknown): v is Theme => v === "light" || v === "dark";
