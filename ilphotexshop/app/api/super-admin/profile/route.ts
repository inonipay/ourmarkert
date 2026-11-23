import { requireUserRole } from "@/lib/authorization";
import { updateSuperAdminProfile } from "@/lib/data-access/super-admin-profile";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkSuperAdminProfileMutationLimit } from "@/lib/rate-limit";
import { updateUserProfileSchema } from "@/lib/validation/users";

export async function PATCH(request: Request) {
  try {
    const actor = await requireUserRole("super_admin");
    const limit = await checkSuperAdminProfileMutationLimit(actor.id);
    if (!limit.allowed) return rateLimitResponse(limit, "super admin profile");

    const body = await parseJsonRequest(request, updateUserProfileSchema);
    if (!body.success) return body.response;

    const profile = await updateSuperAdminProfile(actor, body.data);
    if (!profile) {
      return Response.json(
        { error: "Super Admin account is no longer available" },
        { status: 409 },
      );
    }

    return Response.json(
      { profile },
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
      "Failed to update Super Admin profile",
      "Profile could not be updated",
    );
  }
}
