import { z } from "zod";

export const pakistanPhone = z.string().transform(value => value.replace(/\D/g, "").replace(/^92/, "").replace(/^0/, "")).refine(value => /^3\d{9}$/.test(value), "Enter a valid Pakistani mobile number");

export const checkoutSchema = z.object({
  full_name: z.string().trim().min(2).max(80),
  phone: pakistanPhone,
  email: z.string().trim().email().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  address: z.string().trim().min(10).max(500),
  notes: z.string().trim().max(500).optional().default(""),
  items: z.array(z.object({ slug: z.string().trim().min(2).max(160), variant_id: z.string().trim().max(160).optional(), variant_label: z.string().trim().max(160).optional().default(""), quantity: z.number().int().min(1).max(10) })).min(1).max(25)
});

export const trackingSchema = z.object({ order_number: z.string().trim().min(6).max(30), phone: pakistanPhone });
