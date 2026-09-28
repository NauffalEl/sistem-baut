import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed Roles
  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN" },
  });

  const userRole = await prisma.role.upsert({
    where: { name: "USER" },
    update: {},
    create: { name: "USER" },
  });

  console.log("Roles created:", { adminRole, userRole });

  // Seed Categories
  const categoryNames = ["Baut", "Mur", "Paku", "Screw", "Ring", "Washer"];
  for (const name of categoryNames) {
    await prisma.category.upsert({
      where: { id: `cat-${name.toLowerCase()}` },
      update: {},
      create: { id: `cat-${name.toLowerCase()}`, name },
    });
  }
  console.log("Categories created:", categoryNames);

  // Seed Admin User
  const adminEmail = "admin@sistem-baut.com";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("Admin123!", 12);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        password: hashedPassword,
        roleId: adminRole.id,
        active: true,
      },
    });
    console.log("Admin user created:", { id: admin.id, email: admin.email });
  } else {
    console.log("Admin user already exists");
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
