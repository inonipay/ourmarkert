import { z } from "zod";

export const conversationTypeSchema = z.enum(["customer", "merchant", "staff"]);
export const supportTicketStatusSchema = z.enum([
  "open",
  "in_progress",
  "resolved",
  "closed",
]);
export const supportTicketPrioritySchema = z.enum([
  "low",
  "normal",
  "high",
  "urgent",
]);
export const announcementAudienceSchema = z.enum([
  "all_users",
  "merchants",
  "customers",
  "admins",
  "specific_users",
]);

export const createConversationSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  type: conversationTypeSchema,
  participantEmails: z.array(z.string().trim().email().max(254)).max(20).default([]),
}).strict();

export const addConversationMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
}).strict();

export const createSupportTicketSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  description: z.string().trim().min(3).max(4000),
  category: z.string().trim().min(2).max(100),
  priority: supportTicketPrioritySchema,
}).strict();

export const publicSupportTicketSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).optional(),
  phone: z.string().trim().max(32).optional(),
  category: z.enum([
    "Order",
    "Payment",
    "Product",
    "Merchant",
    "Account",
    "General",
  ]),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(3).max(4000),
}).strict().refine(
  (value) => Boolean(value.email || value.phone),
  {
    message: "Provide at least one email address or phone number",
    path: ["contact"],
  },
);

export const updateSupportTicketSchema = z.object({
  status: supportTicketStatusSchema,
  assignedToEmail: z.string().trim().email().max(254).optional(),
}).strict();

export const createEmailCampaignSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  content: z.string().trim().min(3).max(4000),
  audience: announcementAudienceSchema,
  scheduledAt: z.string().datetime({ offset: true }).optional(),
}).strict();

export const createSmsCampaignSchema = z.object({
  name: z.string().trim().min(3).max(160),
  message: z.string().trim().min(3).max(1600),
  audience: announcementAudienceSchema,
  scheduledAt: z.string().datetime({ offset: true }).optional(),
}).strict();
