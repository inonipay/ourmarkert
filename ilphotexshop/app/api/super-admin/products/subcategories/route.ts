import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import {
  setProductSubcategoryStatus,
  upsertProductSubcategory,
} from "@/lib/data-access/super-admin-product-management";
import { productSubcategorySchema } from "@/lib/validation/products";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    await requireUserRole("super_admin");
    const body = await parseJsonRequest(request, productSubcategorySchema);
    if (!body.success) return body.response;
    const subcategory = await upsertProductSubcategory(body.data);
    return Response.json(subcategory);
  } catch (error) {
    return apiErrorResponse(error, "Failed to save subcategory", "Subcategory could not be saved");
  }
}

export async function PATCH(request: Request) {
  try {
    await requireUserRole("super_admin");
    const body = await parseJsonRequest(
      request,
      z.object({ id: z.string().min(1), isActive: z.boolean() }).strict(),
    );
    if (!body.success) return body.response;
    const changed = await setProductSubcategoryStatus(body.data.id, body.data.isActive);
    if (!changed) return Response.json({ error: "Subcategory not found" }, { status: 404 });
    return Response.json(body.data);
  } catch (error) {
    return apiErrorResponse(error, "Failed to update subcategory", "Subcategory could not be updated");
  }
}
