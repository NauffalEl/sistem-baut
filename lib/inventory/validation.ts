import { z } from "zod";

export const adjustStockSchema = z.object({
  productId: z.string().min(1, "Product ID required"),
  quantity: z.number().int().min(1, "Quantity must be positive"),
  direction: z.enum(["in", "out"]),
  source: z.enum(["adjustment", "correction", "return"]),
  note: z.string().max(500).optional(),
});

export const stockHistorySchema = z.object({
  productId: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  source: z
    .enum(["purchase", "sale", "adjustment", "return", "correction"])
    .optional(),
});

export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type StockHistoryInput = z.infer<typeof stockHistorySchema>;
