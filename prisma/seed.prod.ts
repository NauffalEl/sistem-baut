/**
 * Production seed — data minimum yang wajib ada agar aplikasi bisa dipakai.
 *
 * Berbeda dengan prisma/seed.ts (dev/demo), file ini SENGAJA tidak membuat
 * produk, stok, supplier, purchase, atau sale apa pun. Tanpa dummy data,
 * database produksi mulai kosong dan diisi lewat aplikasi.
 *
 * Jalankan setelah `prisma migrate deploy`:
 *   npm run db:seed:prod
 *
 * Kredensial admin pertama dibaca dari env (lihat .env.example):
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
 * Script berhenti dengan error kalau kredensial tidak diisi, supaya tidak
 * ada akun dengan password default yang tidak disengaja di produksi.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Kategori dasar. Produk tetap harus dibuat manual lewat UI. */
const CATEGORIES = [
  { id: "cat-baut", name: "Baut" },
  { id: "cat-mur", name: "Mur" },
  { id: "cat-paku", name: "Paku" },
  { id: "cat-screw", name: "Screw" },
  { id: "cat-ring", name: "Ring" },
  { id: "cat-washer", name: "Washer" },
];

const ROLES = ["ADMIN", "USER"];

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Environment variable ${name} belum diisi. Isi di .env sebelum menjalankan seed produksi.`
    );
  }
  return value;
}

async function main() {
  console.log("Seeding production data (tanpa dummy data)...");

  // 1. Roles — wajib untuk login dan pemeriksaan hak akses.
  for (const name of ROLES) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(`Role ready: ${name}`);
  }

  // 2. Kategori dasar — mudah dihapus/diubah admin nanti.
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: {},
      create: category,
    });
  }
  console.log(`Categories ready: ${CATEGORIES.length}`);

  // 3. Akun admin pertama.
  const email = requireEnv("ADMIN_EMAIL");
  const password = requireEnv("ADMIN_PASSWORD");
  const name = process.env.ADMIN_NAME?.trim() || "Admin";

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD minimal 8 karakter.");
  }

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: "ADMIN" } });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin sudah ada, tidak diubah: ${email}`);
  } else {
    await prisma.user.create({
      data: {
        email,
        name,
        password: await bcrypt.hash(password, 12),
        roleId: adminRole.id,
        active: true,
      },
    });
    console.log(`Admin dibuat: ${email}`);
  }

  console.log("Seed produksi selesai. Tidak ada dummy data yang dibuat.");
}

main()
  .catch((e) => {
    console.error("Seed produksi error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
