import { requireUserRole } from "@/lib/authorization";
import {
  ConcurrentRoleChangeError,
  ProtectedSuperAdminRoleError,
  SelfRoleChangeError,
  UnavailableUserRoleChangeError,
  updateUserRoleAsSuperAdmin,
} from "@/lib/data-access/super-admin-users";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkUserRoleWriteLimit } from "@/lib/rate-limit";
import {
  updateUserRoleSchema,
  userIdSchema,
} from "@/lib/validation/users";

type UserRoleRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: UserRoleRouteContext) {
  try {
    const actor = await requireUserRole("super_admin");
    const { id } = await context.params;
    const parsedId = userIdSchema.safeParse(id);
    if (!parsedId.success) {
      return Response.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const limit = await checkUserRoleWriteLimit(actor.id);
    if (!limit.allowed) return rateLimitResponse(limit, "user role update");

    const body = await parseJsonRequest(request, updateUserRoleSchema);
    if (!body.success) return body.response;

    const result = await updateUserRoleAsSuperAdmin(
      actor.id,
      parsedId.data,
      body.data.role,
    );
    if (!result) return Response.json({ error: "User not found" }, { status: 404 });

    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof SelfRoleChangeError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof ProtectedSuperAdminRoleError) {
      return Response.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof UnavailableUserRoleChangeError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof ConcurrentRoleChangeError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    return apiErrorResponse(
      error,
      "Failed to update user role",
      "User role could not be updated",
    );
  }
}
