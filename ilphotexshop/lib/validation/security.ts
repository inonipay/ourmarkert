import { z } from "zod";

export const twoFactorActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("setup") }).strict(),
  z.object({ action: z.literal("enable"), code: z.string().regex(/^[0-9]{6}$/) }).strict(),
  z.object({
    action: z.literal("disable"),
    code: z.string().regex(/^[0-9]{6}$/),
    password: z.string().min(1).max(72),
  }).strict(),
]);

export const securityAlertUpdateSchema = z.object({
  status: z.enum(["open", "investigating", "resolved", "dismissed"]),
}).strict();

export const securityDeviceUpdateSchema = z.object({
  action: z.enum(["trust", "untrust", "block", "unblock"]),
}).strict();

export const securityPolicyUpdateSchema = z.object({
  type: z.enum(["password", "session", "access"]),
  name: z.string().trim().min(1).max(160),
  value: z.string().trim().min(1).max(500),
}).strict();
