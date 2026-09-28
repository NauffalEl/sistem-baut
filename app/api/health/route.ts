import { NextResponse } from "next/server";
import { healthCheck } from "@/lib/production/monitoring";

export async function GET() {
  return healthCheck();
}
