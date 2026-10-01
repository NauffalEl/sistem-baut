import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Add pgbouncer=true if missing for Vercel/Supabase compatibility
const dbUrl = process.env.DATABASE_URL || "";
const url = dbUrl.includes("pooler.supabase.com") && !dbUrl.includes("pgbouncer=true")
  ? `${dbUrl}${dbUrl.includes("?") ? "&" : "?"}pgbouncer=true`
  : dbUrl;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
    // Query logging is very noisy and slows down local development noticeably.
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
