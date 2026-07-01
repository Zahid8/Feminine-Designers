import { z } from "zod";

export const indianPhoneSchema = z
  .string()
  .trim()
  .regex(/^(\+91[-\s]?)?[6-9]\d{9}$/, "Enter a valid Indian mobile number.");

export const customerSchema = z.object({
  fullName: z.string().trim().min(2, "Customer name is required."),
  phonePrimary: indianPhoneSchema,
  phoneSecondary: indianPhoneSchema.optional().or(z.literal("")),
  email: z.email().optional().or(z.literal("")),
  address: z.string().optional(),
  birthDate: z.string().optional(),
  notes: z.string().optional(),
  preferredCommunication: z.enum(["Phone", "WhatsApp", "SMS", "Email"]),
  tags: z.array(z.string()).default([])
});

export type CustomerInput = z.infer<typeof customerSchema>;
