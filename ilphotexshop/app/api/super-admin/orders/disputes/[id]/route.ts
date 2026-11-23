import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { reviewOrderDispute } from "@/lib/data-access/super-admin-orders";
import { orderIdSchema, orderDisputeReviewSchema } from "@/lib/validation/orders";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireUserRole("super_admin");
    const { id } = await context.params;
    const parsedId = orderIdSchema.safeParse(id);
    if (!parsedId.success) return Response.json({ error: "Invalid dispute ID" }, { status: 400 });
    const body = await parseJsonRequest(request, orderDisputeReviewSchema);
    if (!body.success) return body.response;
    const changed = await reviewOrderDispute(parsedId.data, body.data.action, body.data.resolution);
    if (!changed) return Response.json({ error: "Dispute not found" }, { status: 404 });
    return Response.json({ id: parsedId.data, status: body.data.action });
  } catch (error) {
    return apiErrorResponse(error, "Failed to review dispute", "Dispute could not be reviewed");
  }
}
