import { z } from "zod";

export const paymentProofSubmissionSchema = z
  .object({
    method: z.enum(["bank_transfer", "mobile_money"]),
    transactionReference: z.string().trim().min(3).max(120),
  })
  .strict();

export const paymentProofReviewSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }).strict(),
  z
    .object({
      action: z.literal("reject"),
      reason: z.string().trim().min(3).max(500),
    })
    .strict(),
]);

export const paymentProofIdSchema = z.string().trim().min(1).max(100);

export type PaymentProofSubmission = z.infer<
  typeof paymentProofSubmissionSchema
>;
export type PaymentProofReview = z.infer<typeof paymentProofReviewSchema>;
