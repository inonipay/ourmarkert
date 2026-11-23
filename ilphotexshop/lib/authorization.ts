import "server-only";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { UserRole } from "@prisma/client";
import { authOptions } from "@/lib/auth-options";
import { findUserForSession } from "@/lib/data-access/users";

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication is required");
    this.name = "AuthenticationRequiredError";
  }
}

export class AuthorizationDeniedError extends Error {
  constructor() {
    super("You do not have permission to access this resource");
    this.name = "AuthorizationDeniedError";
  }
}

export async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  return session?.user?.id
    ? findUserForSession(session.user.id)
    : null;
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();
  if (!user) throw new AuthenticationRequiredError();
  return user;
}

export async function requireSuperAdminPageUser(
  callbackUrl = "/super-admin/dashboard",
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  if (user.role !== "super_admin") redirect("/");
  return user;
}

export async function requireMerchantPageUser(
  callbackUrl = "/merchant/dashboard",
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  if (user.role !== "seller") redirect("/");
  return user;
}

export async function requireCustomerPageUser(callbackUrl = "/orders") {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  if (user.role !== "customer") redirect("/");
  return user;
}

export async function requireUserRole(role: UserRole | readonly UserRole[]) {
  const user = await requireAuthenticatedUser();
  const allowedRoles = typeof role === "string" ? [role] : role;
  if (!allowedRoles.includes(user.role)) throw new AuthorizationDeniedError();
  return user;
}

export function authorizationErrorResponse(error: unknown) {
  if (error instanceof AuthenticationRequiredError) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }
  if (error instanceof AuthorizationDeniedError) {
    return Response.json({ error: "You do not have permission" }, { status: 403 });
  }
  return null;
}
