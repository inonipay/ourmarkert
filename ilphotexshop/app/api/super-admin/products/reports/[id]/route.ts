import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { reviewProductReport } from "@/lib/data-access/super-admin-product-management";
import { productReportReviewSchema, productIdSchema } from "@/lib/validation/products";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireUserRole("super_admin");
    const { id } = await context.params;
    const parsedId = productIdSchema.safeParse(id);
    if (!parsedId.success) return Response.json({ error: "Invalid report ID" }, { status: 400 });
    const body = await parseJsonRequest(request, productReportReviewSchema);
    if (!body.success) return body.response;
    const changed = await reviewProductReport(actor.id, parsedId.data, body.data.action, body.data.note);
    if (!changed) return Response.json({ error: "Report not found or already reviewed" }, { status: 404 });
    return Response.json({ id: parsedId.data, status: body.data.action === "review" ? "reviewed" : "dismissed" });
  } catch (error) {
    return apiErrorResponse(error, "Failed to review report", "Product report could not be reviewed");
  }
}
