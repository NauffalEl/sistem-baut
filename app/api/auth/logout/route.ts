import { signOut } from "@/lib/auth/config";
import { NextResponse } from "next/server";

export async function POST() {
  await signOut({ redirect: true, redirectTo: "/login" });
  return NextResponse.json({ success: true });
}
