import bcrypt from "bcryptjs";
import { requireUserRole } from "@/lib/authorization";
import {
  getSuperAdminPasswordHash,
  updateSuperAdminPassword,
} from "@/lib/data-access/super-admin-profile";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkSuperAdminPasswordMutationLimit } from "@/lib/rate-limit";
import { changeSuperAdminPasswordSchema } from "@/lib/validation/users";

export async function PATCH(request: Request) {
  try {
    const actor = await requireUserRole("super_admin");
    const limit = await checkSuperAdminPasswordMutationLimit(actor.id);
    if (!limit.allowed) return rateLimitResponse(limit, "super admin password");

    const body = await parseJsonRequest(request, changeSuperAdminPasswordSchema);
    if (!body.success) return body.response;

    const currentPasswordHash = await getSuperAdminPasswordHash(actor);
    if (!currentPasswordHash) {
      return Response.json(
        { error: "Super Admin account is no longer available" },
        { status: 409 },
      );
    }

    const currentPasswordMatches = await bcrypt.compare(
      body.data.currentPassword,
      currentPasswordHash,
    );
    if (!currentPasswordMatches) {
      return Response.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    const nextPasswordHash = await bcrypt.hash(body.data.newPassword, 12);
    const updated = await updateSuperAdminPassword(
      actor,
      currentPasswordHash,
      nextPasswordHash,
    );
    if (!updated) {
      return Response.json(
        { error: "Account changed during the request. Please try again." },
        { status: 409 },
      );
    }

    return Response.json(
      { message: "Password updated" },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-RateLimit-Remaining": String(limit.remaining),
        },
      },
    );
  } catch (error) {
    return apiErrorResponse(
      error,
      "Failed to update Super Admin password",
      "Password could not be updated",
    );
  }
}
