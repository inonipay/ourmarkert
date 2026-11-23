import { revalidatePath } from "next/cache";
import { requireUserRole } from "@/lib/authorization";
import {
  ProductNotPublishedError,
  setSuperAdminProductFeaturedState,
} from "@/lib/data-access/products";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkProductMutationLimit } from "@/lib/rate-limit";
import {
  featureProductSchema,
  productIdSchema,
} from "@/lib/validation/products";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireUserRole("super_admin");
    const { id } = await params;
    const parsedId = productIdSchema.safeParse(id);
    if (!parsedId.success) {
      return Response.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const limit = await checkProductMutationLimit(admin.id);
    if (!limit.allowed) return rateLimitResponse(limit, "product feature update");

    const body = await parseJsonRequest(request, featureProductSchema);
    if (!body.success) return body.response;

    const updated = await setSuperAdminProductFeaturedState(
      parsedId.data,
      body.data.isFeatured,
    );
    if (!updated) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    revalidatePath("/super-admin/products/featured-products");
    revalidatePath("/");
    return Response.json(
      { id: parsedId.data, isFeatured: body.data.isFeatured },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof ProductNotPublishedError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    return apiErrorResponse(
      error,
      "Failed to update featured product state",
      "Product feature state could not be updated",
    );
  }
}
