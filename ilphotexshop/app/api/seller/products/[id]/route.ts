import {
  deleteManagedProduct,
  InvalidProductPricingError,
  updateManagedProduct,
} from "@/lib/data-access/products";
import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkProductMutationLimit } from "@/lib/rate-limit";
import {
  productIdSchema,
  updateProductSchema,
} from "@/lib/validation/products";

type ProductRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: ProductRouteContext) {
  try {
    const actor = await requireUserRole(["seller", "admin", "super_admin"]);
    const { id } = await context.params;
    const parsedId = productIdSchema.safeParse(id);
    if (!parsedId.success) {
      return Response.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const limit = await checkProductMutationLimit(actor.id);
    if (!limit.allowed) {
      return rateLimitResponse(limit, "product write");
    }

    const body = await parseJsonRequest(request, updateProductSchema);
    if (!body.success) return body.response;

    const product = await updateManagedProduct(actor, parsedId.data, body.data);
    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json(product, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof InvalidProductPricingError) {
      return Response.json(
        { error: "Previous price must be greater than current price" },
        { status: 400 },
      );
    }
    return apiErrorResponse(
      error,
      "Failed to update seller product",
      "Product could not be updated",
    );
  }
}

export async function DELETE(_request: Request, context: ProductRouteContext) {
  try {
    const actor = await requireUserRole(["seller", "admin", "super_admin"]);
    const { id } = await context.params;
    const parsedId = productIdSchema.safeParse(id);
    if (!parsedId.success) {
      return Response.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const limit = await checkProductMutationLimit(actor.id);
    if (!limit.allowed) {
      return rateLimitResponse(limit, "product write");
    }

    const deleted = await deleteManagedProduct(actor, parsedId.data);
    if (!deleted) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(
      error,
      "Failed to delete seller product",
      "Product could not be deleted",
    );
  }
}
