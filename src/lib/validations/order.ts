import { z } from "zod";
import { indianPhoneSchema } from "@/lib/validations/customer";

export const orderItemSchema = z.object({
  garmentType: z.string().min(1, "Garment type is required."),
  customGarmentType: z.string().optional(),
  quantity: z.coerce.number().min(1).max(99),
  rateRupees: z.coerce.number().min(0),
  discountRupees: z.coerce.number().min(0).default(0),
  stitchingCostRupees: z.coerce.number().min(0).default(0),
  fabricLength: z.string().optional(),
  fabricColor: z.string().optional(),
  designReference: z.string().optional(),
  stitchingInstructions: z.string().optional()
});

export const newOrderSchema = z.object({
  customerName: z.string().trim().min(2),
  phonePrimary: indianPhoneSchema,
  orderDate: z.string().min(1),
  deliveryDate: z.string().min(1),
  priority: z.enum(["Normal", "Urgent", "Express"]),
  status: z.enum(["Draft", "New", "In Stitching", "Ready", "Delivered", "Cancelled"]),
  assignedTailor: z.string().optional(),
  internalNotes: z.string().optional(),
  customerNotes: z.string().optional(),
  orderDiscountRupees: z.coerce.number().min(0).default(0),
  accessoriesCostRupees: z.coerce.number().min(0).default(0),
  advancePaidRupees: z.coerce.number().min(0).default(0),
  paymentMethod: z.enum(["Cash", "UPI", "Card", "Bank Transfer", "Mixed"]),
  items: z.array(orderItemSchema).min(1)
});

export type NewOrderInput = z.infer<typeof newOrderSchema>;
