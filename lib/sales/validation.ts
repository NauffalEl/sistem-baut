import { z } from "zod";

export const createSaleItemSchema = z.object({
  productId: z.string().min(1, "Product ID required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price must be non-negative"),
});

export const createSaleSchema = z.object({
  items: z.array(createSaleItemSchema).min(1, "At least one item required"),
});

export const updateSaleSchema = z.object({
  status: z.enum(["draft", "confirmed", "cancelled"]).optional(),
  note: z.string().max(500).optional(),
});

export const saleSearchSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["draft", "confirmed", "cancelled"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
export type SaleSearchInput = z.infer<typeof saleSearchSchema>;
