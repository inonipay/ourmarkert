import {
  setProductPublishedState,
  SuspendedMerchantProductError,
} from "@/lib/data-access/products";
import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkProductMutationLimit } from "@/lib/rate-limit";
import {
  productIdSchema,
  publishProductSchema,
} from "@/lib/validation/products";

type PublishRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: PublishRouteContext) {
  try {
    const admin = await requireUserRole(["admin", "super_admin"]);
    const { id } = await context.params;
    const parsedId = productIdSchema.safeParse(id);
    if (!parsedId.success) {
      return Response.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const limit = await checkProductMutationLimit(admin.id);
    if (!limit.allowed) {
      return rateLimitResponse(limit, "product moderation");
    }

    const body = await parseJsonRequest(request, publishProductSchema);
    if (!body.success) return body.response;

    const updated = await setProductPublishedState(
      admin,
      parsedId.data,
      body.data.isPublished,
    );
    if (!updated) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json({ id: parsedId.data, ...body.data }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof SuspendedMerchantProductError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    return apiErrorResponse(
      error,
      "Failed to moderate product",
      "Product moderation is temporarily unavailable",
    );
  }
}
