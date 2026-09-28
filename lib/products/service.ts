import { prisma } from "@/lib/db";
import {
  CreateProductInput,
  UpdateProductInput,
  CreateCategoryInput,
  CreateProductAliasInput,
  ProductSearchInput,
} from "./validation";

export async function createProduct(data: CreateProductInput) {
  const product = await prisma.product.create({
    data,
    include: { category: true, aliases: true },
  });
  // Auto-create inventory record
  await prisma.inventory.create({
    data: { productId: product.id, quantity: 0 },
  });
  return product;
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { category: true, aliases: true, inventory: true },
  });
}

export async function getProducts(search: ProductSearchInput) {
  const { q, categoryId, active, page, limit } = search;
  const where: Record<string, unknown> = {};

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { aliases: { some: { alias: { contains: q, mode: "insensitive" } } } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (active !== undefined) where.active = active;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, aliases: true, inventory: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  return prisma.product.update({
    where: { id },
    data,
    include: { category: true, aliases: true },
  });
}

export async function deleteProduct(id: string) {
  return prisma.product.update({
    where: { id },
    data: { active: false },
    include: { category: true, aliases: true },
  });
}

export async function createCategory(data: CreateCategoryInput) {
  return prisma.category.create({ data });
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function getCategoryById(id: string) {
  return prisma.category.findUnique({ where: { id } });
}

export async function updateCategory(id: string, name: string) {
  return prisma.category.update({ where: { id }, data: { name } });
}

export async function deleteCategory(id: string) {
  return prisma.category.delete({ where: { id } });
}

export async function createProductAlias(data: CreateProductAliasInput) {
  return prisma.productAlias.create({
    data,
    include: { product: true },
  });
}

export async function getProductAliases(productId: string) {
  return prisma.productAlias.findMany({ where: { productId } });
}

export async function deleteProductAlias(id: string) {
  return prisma.productAlias.delete({ where: { id } });
}

export async function checkSkuExists(sku: string, excludeId?: string) {
  const product = await prisma.product.findUnique({ where: { sku } });
  return product && product.id !== excludeId;
}