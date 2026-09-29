import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi").max(200, "Nama produk maksimal 200 karakter"),
  sku: z.string().min(1, "SKU wajib diisi").max(100, "SKU maksimal 100 karakter"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  type: z.string().max(100, "Jenis maksimal 100 karakter").optional(),
  size: z.string().max(100, "Ukuran maksimal 100 karakter").optional(),
  material: z.string().max(100, "Material maksimal 100 karakter").optional(),
  unit: z.string().default("pcs"),
  lastBuyPrice: z.number().min(0, "Harga beli tidak boleh negatif").default(0),
  sellingPrice: z.number().min(0, "Harga jual tidak boleh negatif").default(0),
  minStock: z.number().int().min(0, "Stok minimum tidak boleh negatif").default(0),
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
  name: z.string().min(1, "Nama kategori wajib diisi").max(100, "Nama kategori maksimal 100 karakter"),
});

export const createProductAliasSchema = z.object({
  productId: z.string().min(1, "ID produk wajib diisi"),
  alias: z.string().min(1, "Alias wajib diisi").max(200, "Alias maksimal 200 karakter"),
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
