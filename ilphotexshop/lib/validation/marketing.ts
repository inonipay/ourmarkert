import { z } from "zod";

export const couponSchema = z
  .object({
    code: z.string().trim().min(3).max(64).regex(/^[A-Z0-9_-]+$/),
    name: z.string().trim().min(2).max(160),
    description: z.string().trim().max(500).optional(),
    discountType: z.enum(["percentage", "fixed_amount"]),
    discountValue: z.number().int().min(1).max(100000000),
    minimumSubtotal: z.number().int().min(0).max(100000000).default(0),
    maximumDiscount: z.number().int().min(1).max(100000000).nullable().optional(),
    usageLimit: z.number().int().min(1).max(1000000).nullable().optional(),
    perUserLimit: z.number().int().min(1).max(1000).default(1),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.discountType === "percentage" && value.discountValue > 100) {
      context.addIssue({ code: "custom", message: "Percentage cannot exceed 100", path: ["discountValue"] });
    }
    if (new Date(value.endsAt).getTime() <= new Date(value.startsAt).getTime()) {
      context.addIssue({ code: "custom", message: "End time must follow start time", path: ["endsAt"] });
    }
  });

export const campaignSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    description: z.string().trim().max(1000).optional(),
    kind: z.enum(["discount", "special_offer", "seasonal", "featured"]),
    status: z.enum(["draft", "scheduled", "active", "paused", "ended", "cancelled"]).default("draft"),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
  })
  .strict()
  .superRefine((value, context) => {
    if (new Date(value.endsAt).getTime() <= new Date(value.startsAt).getTime()) {
      context.addIssue({ code: "custom", message: "End time must follow start time", path: ["endsAt"] });
    }
  });

export const featuredMerchantSchema = z
  .object({
    merchantId: z.string().trim().min(1).max(100),
    position: z.number().int().min(0).max(100).default(0),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime().nullable().optional(),
  })
  .strict();

export const bannerSchema = z
  .object({
    title: z.string().trim().min(2).max(160),
    subtitle: z.string().trim().max(500).optional(),
    imageUrl: z.string().url().max(2048),
    hrefUrl: z.string().url().max(2048).nullable().optional(),
    placement: z.enum(["homepage", "category", "checkout"]).default("homepage"),
    status: z.enum(["draft", "scheduled", "active", "paused", "ended", "cancelled"]).default("draft"),
    position: z.number().int().min(0).max(100).default(0),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
  })
  .strict()
  .superRefine((value, context) => {
    if (new Date(value.endsAt).getTime() <= new Date(value.startsAt).getTime()) {
      context.addIssue({ code: "custom", message: "End time must follow start time", path: ["endsAt"] });
    }
  });
