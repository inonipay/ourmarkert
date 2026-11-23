import { requireUserRole } from "@/lib/authorization";
import {
  AnonymizedMerchantAccessError,
  ConcurrentMerchantAccessChangeError,
  updateMerchantAccessAsSuperAdmin,
} from "@/lib/data-access/super-admin-merchants";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkMerchantAccessWriteLimit } from "@/lib/rate-limit";
import {
  merchantAccessActionSchema,
  userIdSchema,
} from "@/lib/validation/users";

type MerchantAccessRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  context: MerchantAccessRouteContext,
) {
  try {
    const actor = await requireUserRole("super_admin");
    const { id } = await context.params;
    const parsedId = userIdSchema.safeParse(id);
    if (!parsedId.success) {
      return Response.json({ error: "Invalid merchant ID" }, { status: 400 });
    }

    const limit = await checkMerchantAccessWriteLimit(actor.id);
    if (!limit.allowed) return rateLimitResponse(limit, "merchant access update");

    const body = await parseJsonRequest(request, merchantAccessActionSchema);
    if (!body.success) return body.response;

    const result = await updateMerchantAccessAsSuperAdmin(
      actor.id,
      parsedId.data,
      body.data,
    );
    if (!result) {
      return Response.json({ error: "Merchant not found" }, { status: 404 });
    }

    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof AnonymizedMerchantAccessError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof ConcurrentMerchantAccessChangeError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    return apiErrorResponse(
      error,
      "Failed to update merchant access",
      "Merchant access could not be updated",
    );
  }
}
