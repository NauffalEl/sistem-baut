import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed Roles (sudah ada, pastikan)
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

  // Seed Categories
  const categories = [
    { id: "cat-baut", name: "Baut" },
    { id: "cat-mur", name: "Mur" },
    { id: "cat-paku", name: "Paku" },
    { id: "cat-screw", name: "Screw" },
    { id: "cat-ring", name: "Ring" },
    { id: "cat-washer", name: "Washer" },
  ];
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {},
      create: cat,
    });
  }
  console.log("Categories created:", categories.map((c) => c.name).join(", "));

  // Seed Admin User
  const adminEmail = "admin@gmail.com";
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin",
      password: await bcrypt.hash("admin", 12),
      roleId: adminRole.id,
      active: true,
    },
  });
  console.log("Admin user ready:", admin.email);

  // Seed Regular User (sample customer/user)
  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      name: "User Sample",
      password: await bcrypt.hash("user123", 12),
      roleId: userRole.id,
      active: true,
    },
  });
  console.log("User sample ready:", user.email);

  // Seed Products (dummy baut inventory)
  const products = [
    { sku: "B-M8-30", name: "Baut M8x30", categoryId: "cat-baut", type: "Baut", size: "M8x30", material: "Baja", sellingPrice: 500, minStock: 50 },
    { sku: "B-M8-40", name: "Baut M8x40", categoryId: "cat-baut", type: "Baut", size: "M8x40", material: "Baja", sellingPrice: 600, minStock: 50 },
    { sku: "B-M10-30", name: "Baut M10x30", categoryId: "cat-baut", type: "Baut", size: "M10x30", material: "Baja", sellingPrice: 700, minStock: 40 },
    { sku: "B-M10-50", name: "Baut M10x50", categoryId: "cat-baut", type: "Baut", size: "M10x50", material: "Baja", sellingPrice: 850, minStock: 30 },
    { sku: "M-M8", name: "Mur M8", categoryId: "cat-mur", type: "Mur", size: "M8", material: "Baja", sellingPrice: 200, minStock: 100 },
    { sku: "M-M10", name: "Mur M10", categoryId: "cat-mur", type: "Mur", size: "M10", material: "Baja", sellingPrice: 250, minStock: 80 },
    { sku: "P-2inch", name: "Paku 2 inch", categoryId: "cat-paku", type: "Paku", size: "2\"", material: "Baja", sellingPrice: 300, minStock: 200 },
    { sku: "P-3inch", name: "Paku 3 inch", categoryId: "cat-paku", type: "Paku", size: "3\"", material: "Baja", sellingPrice: 350, minStock: 150 },
    { sku: "S-M3-8", name: "Screw M3x8", categoryId: "cat-screw", type: "Screw", size: "M3x8", material: "Stainless", sellingPrice: 150, minStock: 300 },
    { sku: "S-M4-10", name: "Screw M4x10", categoryId: "cat-screw", type: "Screw", size: "M4x10", material: "Stainless", sellingPrice: 180, minStock: 250 },
    { sku: "R-8", name: "Ring M8", categoryId: "cat-ring", type: "Ring", size: "M8", material: "Baja", sellingPrice: 100, minStock: 150 },
    { sku: "R-10", name: "Ring M10", categoryId: "cat-ring", type: "Ring", size: "M10", material: "Baja", sellingPrice: 120, minStock: 100 },
    { sku: "W-8", name: "Washer M8", categoryId: "cat-washer", type: "Washer", size: "M8", material: "Baja", sellingPrice: 50, minStock: 300 },
    { sku: "W-10", name: "Washer M10", categoryId: "cat-washer", type: "Washer", size: "M10", material: "Baja", sellingPrice: 60, minStock: 250 },
    { sku: "B-M6-20", name: "Baut M6x20", categoryId: "cat-baut", type: "Baut", size: "M6x20", material: "Baja", sellingPrice: 400, minStock: 60 },
    { sku: "M-M6", name: "Mur M6", categoryId: "cat-mur", type: "Mur", size: "M6", material: "Baja", sellingPrice: 150, minStock: 120 },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        name: p.name,
        categoryId: p.categoryId,
        type: p.type,
        size: p.size,
        material: p.material,
        sellingPrice: p.sellingPrice,
        minStock: p.minStock,
        active: true,
      },
    });
    console.log("Product ready:", p.sku);
  }

  // Seed Inventory (stok awal)
  const inventory = [
    { sku: "B-M8-30", quantity: 150 },
    { sku: "B-M8-40", quantity: 80 },
    { sku: "B-M10-30", quantity: 60 },
    { sku: "B-M10-50", quantity: 40 },
    { sku: "M-M8", quantity: 200 },
    { sku: "M-M10", quantity: 150 },
    { sku: "P-2inch", quantity: 300 },
    { sku: "P-3inch", quantity: 200 },
    { sku: "S-M3-8", quantity: 500 },
    { sku: "S-M4-10", quantity: 400 },
    { sku: "R-8", quantity: 250 },
    { sku: "R-10", quantity: 180 },
    { sku: "W-8", quantity: 400 },
    { sku: "W-10", quantity: 350 },
    { sku: "B-M6-20", quantity: 100 },
    { sku: "M-M6", quantity: 180 },
  ];

  for (const inv of inventory) {
    const product = await prisma.product.findUnique({ where: { sku: inv.sku } });
    if (product) {
      await prisma.inventory.upsert({
        where: { productId: product.id },
        update: { quantity: inv.quantity },
        create: { productId: product.id, quantity: inv.quantity },
      });
      console.log("Inventory updated:", inv.sku, "qty", inv.quantity);
    }
  }

  // Seed Suppliers (id deterministik supaya idempotent)
  const suppliers = [
    { id: "sup-pt-baut-jaya", name: "PT Baut Jaya", contact: "0812-3456-7890", address: "Jl. Industri No. 12, Jakarta" },
    { id: "sup-cv-screw-indonesia", name: "CV Screw Indonesia", contact: "0813-9876-5432", address: "Jl. Raya Indah No. 45, Bandung" },
    { id: "sup-tokok-baut-sentosa", name: "Tokok Baut Sentosa", contact: "0856-1122-3344", address: "Jl. Merdeka No. 88, Surabaya" },
    { id: "sup-pt-fastener-prima", name: "PT Fastener Prima", contact: "0819-8765-4321", address: "Jl. Pangeran No. 22, Semarang" },
    { id: "sup-cv-mur-mandiri", name: "CV Mur Mandiri", contact: "0823-4455-6677", address: "Jl. Kebon Jeruk No. 33, Jakarta" },
  ];

  for (const s of suppliers) {
    await prisma.supplier.upsert({
      where: { id: s.id },
      update: {},
      create: s,
    });
    console.log("Supplier ready:", s.name);
  }

  // Seed Purchases (historical dummy)
  const purchaseNoBase = Date.now().toString(36).toUpperCase();
  const supplier1 = await prisma.supplier.findUnique({ where: { id: "sup-pt-baut-jaya" } });
  const supplier2 = await prisma.supplier.findUnique({ where: { id: "sup-cv-screw-indonesia" } });

  if (supplier1 && supplier2) {
    const purchases = [
      {
        purchaseNo: `P-${purchaseNoBase}-001`,
        supplierId: supplier1.id,
        items: [
          { sku: "B-M8-30", quantity: 100, price: 400 },
          { sku: "M-M8", quantity: 200, price: 150 },
        ],
        note: "Pembelian bulanan PT Baut Jaya",
      },
      {
        purchaseNo: `P-${purchaseNoBase}-002`,
        supplierId: supplier2.id,
        items: [
          { sku: "S-M3-8", quantity: 300, price: 120 },
          { sku: "S-M4-10", quantity: 250, price: 140 },
        ],
        note: "Order screw stainless",
      },
    ];

    for (const p of purchases) {
      const createdPurchase = await prisma.purchase.create({
        data: {
          purchaseNo: p.purchaseNo,
          supplierId: p.supplierId,
          total: p.items.reduce((sum, i) => sum + i.quantity * i.price, 0),
          status: "confirmed",
          note: p.note,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 hari lalu
        },
      });

      for (const item of p.items) {
        const product = await prisma.product.findUnique({ where: { sku: item.sku } });
        if (product) {
          await prisma.purchaseItem.create({
            data: {
              purchaseId: createdPurchase.id,
              productId: product.id,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.quantity * item.price,
            },
          });

          // Update stock
          const inventory = await prisma.inventory.findUnique({ where: { productId: product.id } });
          if (inventory) {
            await prisma.inventory.update({
              where: { productId: product.id },
              data: { quantity: inventory.quantity + item.quantity },
            });
            await prisma.stockMovement.create({
              data: {
                productId: product.id,
                quantity: item.quantity,
                source: "purchase",
                sourceId: createdPurchase.id,
                note: `Pembelian ${p.purchaseNo}`,
              },
            });
          }
        }
      }
      console.log("Purchase confirmed:", p.purchaseNo);
    }
  }

  // Seed Sales (historical dummy)
  const saleNoBase = Date.now().toString(36).toUpperCase();
  const sales = [
    {
      saleNo: `S-${saleNoBase}-001`,
      items: [
        { sku: "B-M8-30", quantity: 10, price: 500 },
        { sku: "M-M8", quantity: 20, price: 200 },
      ],
      note: "Penjualan ke pelanggan umum",
    },
    {
      saleNo: `S-${saleNoBase}-002`,
      items: [
        { sku: "P-2inch", quantity: 50, price: 300 },
        { sku: "W-8", quantity: 100, price: 50 },
      ],
      note: "Penjualan eceran",
    },
  ];

  for (const s of sales) {
    const createdSale = await prisma.sale.create({
      data: {
        saleNo: s.saleNo,
        total: s.items.reduce((sum, i) => sum + i.quantity * i.price, 0),
        status: "confirmed",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 hari lalu
      },
    });

    for (const item of s.items) {
      const product = await prisma.product.findUnique({ where: { sku: item.sku } });
      if (product) {
        await prisma.saleItem.create({
          data: {
            saleId: createdSale.id,
            productId: product.id,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.quantity * item.price,
          },
        });

        // Update stock
        const inventory = await prisma.inventory.findUnique({ where: { productId: product.id } });
        if (inventory) {
          await prisma.inventory.update({
            where: { productId: product.id },
            data: { quantity: Math.max(0, inventory.quantity - item.quantity) },
          });
          await prisma.stockMovement.create({
            data: {
              productId: product.id,
              quantity: -item.quantity,
              source: "sale",
              sourceId: createdSale.id,
              note: `Penjualan ${s.saleNo}`,
            },
          });
        }
      }
    }
    console.log("Sale confirmed:", s.saleNo);
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
