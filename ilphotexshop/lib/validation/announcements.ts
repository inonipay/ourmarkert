import { z } from "zod";

export const announcementAudienceSchema = z.enum([
  "all_users",
  "merchants",
  "customers",
  "admins",
  "specific_users",
]);

export const announcementPrioritySchema = z.enum([
  "urgent",
  "high",
  "normal",
  "low",
]);

export const createAnnouncementSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    message: z.string().trim().min(3).max(4000),
    audience: announcementAudienceSchema,
    priority: announcementPrioritySchema,
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    recipientEmails: z
      .array(z.string().trim().email().max(254))
      .max(100)
      .default([])
      .transform((emails) => [
        ...new Set(emails.map((email) => email.toLowerCase())),
      ]),
  })
  .strict()
  .superRefine((announcement, context) => {
    if (new Date(announcement.endsAt) <= new Date(announcement.startsAt)) {
      context.addIssue({
        code: "custom",
        message: "The end time must be after the start time.",
        path: ["endsAt"],
      });
    }

    if (new Date(announcement.endsAt) <= new Date()) {
      context.addIssue({
        code: "custom",
        message: "The end time must be in the future.",
        path: ["endsAt"],
      });
    }

    if (
      announcement.audience === "specific_users" &&
      announcement.recipientEmails.length === 0
    ) {
      context.addIssue({
        code: "custom",
        message: "Add at least one recipient email.",
        path: ["recipientEmails"],
      });
    }

    if (
      announcement.audience !== "specific_users" &&
      announcement.recipientEmails.length > 0
    ) {
      context.addIssue({
        code: "custom",
        message: "Specific recipient emails are only valid for a specific-user audience.",
        path: ["recipientEmails"],
      });
    }
  });

export const announcementIdSchema = z.string().trim().min(1).max(100);

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
