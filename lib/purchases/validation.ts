import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().min(1, "Name required").max(200),
  contact: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
});

export const createPurchaseItemSchema = z.object({
  productId: z.string().min(1, "Product ID required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price must be non-negative"),
});

export const createPurchaseSchema = z.object({
  supplierId: z.string().min(1, "Supplier ID required"),
  items: z.array(createPurchaseItemSchema).min(1, "At least one item required"),
  note: z.string().max(500).optional(),
});

export const updatePurchaseSchema = z.object({
  status: z.enum(["draft", "confirmed", "cancelled"]).optional(),
  note: z.string().max(500).optional(),
});

export const purchaseSearchSchema = z.object({
  q: z.string().optional(),
  supplierId: z.string().optional(),
  status: z.enum(["draft", "confirmed", "cancelled"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>;
export type PurchaseSearchInput = z.infer<typeof purchaseSearchSchema>;
