import { z } from "zod";

export const merchantKycSubmissionSchema = z
  .object({
    ownerFullName: z.string().trim().min(2).max(100),
    businessName: z.string().trim().min(2).max(160),
    businessAddress: z.string().trim().min(3).max(500),
    taxId: z.string().trim().max(64).optional(),
  })
  .strict();

export const merchantKycReviewSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("approve"),
      reason: z.string().trim().min(3).max(500).optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal("reject"),
      reason: z.string().trim().min(3).max(500),
    })
    .strict(),
]);

export const eraseMerchantKycSchema = z
  .object({
    reason: z.string().trim().min(3).max(500),
    confirmation: z.literal("DELETE_KYC"),
  })
  .strict();

export const merchantKycIdSchema = z.string().trim().min(1).max(100);

export type MerchantKycStatus = "pending" | "approved";
