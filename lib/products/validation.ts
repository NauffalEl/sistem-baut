import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name required").max(200, "Name too long"),
  sku: z.string().min(1, "SKU required").max(100, "SKU too long"),
  categoryId: z.string().min(1, "Category required"),
  type: z.string().max(100).optional(),
  size: z.string().max(100).optional(),
  material: z.string().max(100).optional(),
  unit: z.string().default("pcs"),
  lastBuyPrice: z.number().min(0).default(0),
  sellingPrice: z.number().min(0).default(0),
  minStock: z.number().int().min(0).default(0),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  categoryId: z.string().optional(),
  type: z.string().max(100).optional(),
  size: z.string().max(100).optional(),
  material: z.string().max(100).optional(),
  unit: z.string().optional(),
  lastBuyPrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name required").max(100, "Name too long"),
});

export const createProductAliasSchema = z.object({
  productId: z.string().min(1, "Product ID required"),
  alias: z.string().min(1, "Alias required").max(200, "Alias too long"),
});

export const productSearchSchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().optional(),
  active: z
    .preprocess(
      (v) => (v === "true" ? true : v === "false" ? false : undefined),
      z.boolean().optional()
    )
    .pipe(z.boolean().optional()),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateProductAliasInput = z.infer<typeof createProductAliasSchema>;
export type ProductSearchInput = z.infer<typeof productSearchSchema>;
