import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

export class SecurityDeviceBlockedError extends Error {
  constructor() {
    super("This device is blocked from signing in");
    this.name = "SecurityDeviceBlockedError";
  }
}

export function parseUserAgent(userAgent?: string) {
  if (!userAgent) return "Unknown device";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "Apple mobile";
  if (/Android/i.test(userAgent)) return "Android device";
  if (/Macintosh/i.test(userAgent)) return "Mac";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Browser";
}

export async function recordLoginEvent(input: {
  userId?: string;
  email: string;
  outcome: "success" | "failed" | "blocked";
  reason?: string;
  ipAddress: string;
  userAgent?: string;
}) {
  await prisma.loginEvent.create({
    data: {
      id: randomUUID(),
      userId: input.userId,
      email: input.email,
      outcome: input.outcome,
      reason: input.reason,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent?.slice(0, 500),
      deviceName: parseUserAgent(input.userAgent),
    },
  });
  if (
    (input.outcome !== "failed" && input.outcome !== "blocked") ||
    input.ipAddress === "unknown"
  ) {
    return;
  }

  const alertSince = new Date(Date.now() - 60 * 60 * 1000);
  const [recentFailures, existingAlert] = await Promise.all([
    prisma.loginEvent.count({
      where: {
        ipAddress: input.ipAddress,
        outcome: { in: ["failed", "blocked"] },
        createdAt: { gte: alertSince },
      },
    }),
    prisma.securityAlert.findFirst({
      where: {
        ipAddress: input.ipAddress,
        title: "Repeated failed sign-in attempts",
        status: { in: ["open", "investigating"] },
        createdAt: { gte: alertSince },
      },
      select: { id: true },
    }),
  ]);
  if (recentFailures >= 10 && !existingAlert) {
    await prisma.securityAlert.create({
      data: {
        id: randomUUID(),
        userId: input.userId,
        title: "Repeated failed sign-in attempts",
        description: `${recentFailures} failed or blocked sign-ins were recorded for IP ${input.ipAddress} within one hour.`,
        ipAddress: input.ipAddress,
        status: "open",
      },
    });
  }
}

export async function createSecuritySession(input: {
  userId: string;
  ipAddress: string;
  userAgent?: string;
}) {
  const sessionToken = createHash("sha256")
    .update(`${randomUUID()}\0${input.userId}\0${Date.now()}`)
    .digest("hex");
  const deviceHash = createHash("sha256")
    .update(input.userAgent || "unknown-device")
    .digest("hex");
  const device = await prisma.securityDevice.upsert({
    where: { userId_deviceHash: { userId: input.userId, deviceHash } },
    create: {
      id: randomUUID(),
      userId: input.userId,
      deviceHash,
      deviceName: parseUserAgent(input.userAgent),
      lastIpAddress: input.ipAddress,
    },
    update: {
      lastIpAddress: input.ipAddress,
      lastSeenAt: new Date(),
    },
  });
  if (device.blocked) throw new SecurityDeviceBlockedError();

  await prisma.securitySession.create({
    data: {
      id: randomUUID(),
      sessionToken,
      userId: input.userId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent?.slice(0, 500),
      deviceName: parseUserAgent(input.userAgent),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
    },
  });
  return sessionToken;
}

export async function isSecuritySessionValid(
  sessionToken: string,
  userId: string,
) {
  const now = new Date();
  const session = await prisma.securitySession.findUnique({
    where: { sessionToken },
    select: {
      id: true,
      userId: true,
      isRevoked: true,
      expiresAt: true,
      lastSeenAt: true,
    },
  });
  if (
    !session ||
    session.userId !== userId ||
    session.isRevoked ||
    session.expiresAt <= now
  ) {
    return false;
  }
  if (session.lastSeenAt.getTime() < now.getTime() - 5 * 60 * 1000) {
    await prisma.securitySession.updateMany({
      where: { id: session.id, isRevoked: false, expiresAt: { gt: now } },
      data: { lastSeenAt: now },
    });
  }
  return true;
}

export async function revokeSecuritySessionByToken(sessionToken: string) {
  await prisma.securitySession.updateMany({
    where: { sessionToken, isRevoked: false },
    data: { isRevoked: true, revokedAt: new Date() },
  });
}
