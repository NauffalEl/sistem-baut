import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = [
  "/dashboard",
  "/products",
  "/inventory",
  "/purchases",
  "/suppliers",
  "/sales",
  "/categories",
];

const ADMIN_ONLY_PATHS = ["/inventory", "/categories", "/suppliers"];

export default async function proxy(req: NextRequest) {
  let token = null;
  try {
    token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
    });
  } catch (e) {
    // getToken may fail if AUTH_SECRET is missing, malformed, or cookie is corrupted.
    console.error("[proxy] getToken failed:", e);
    // Don't redirect here; let the route handle it.
  }

  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAdminOnly = ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAdminOnly && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
