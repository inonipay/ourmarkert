import { z } from "zod";

export const paymentAccountSchema = z
  .object({
    type: z.enum(["bank", "mobile_money"]),
    provider: z.string().trim().min(2).max(100),
    accountName: z.string().trim().min(2).max(160),
    accountNumber: z.string().trim().min(3).max(100),
    currency: z.string().trim().regex(/^[A-Z]{3}$/).default("RWF"),
  })
  .strict();

export const paymentAccountStatusSchema = z
  .object({ isActive: z.boolean() })
  .strict();

export const paymentAccountIdSchema = z.string().trim().min(1).max(100);

export type PaymentAccountInput = z.infer<typeof paymentAccountSchema>;
