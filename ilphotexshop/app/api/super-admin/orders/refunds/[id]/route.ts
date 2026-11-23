import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { reviewOrderRefund } from "@/lib/data-access/super-admin-orders";
import { orderIdSchema, orderRefundReviewSchema } from "@/lib/validation/orders";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireUserRole("super_admin");
    const { id } = await context.params;
    const parsedId = orderIdSchema.safeParse(id);
    if (!parsedId.success) return Response.json({ error: "Invalid refund ID" }, { status: 400 });
    const body = await parseJsonRequest(request, orderRefundReviewSchema);
    if (!body.success) return body.response;
    const changed = await reviewOrderRefund(actor.id, parsedId.data, body.data.action);
    if (!changed) return Response.json({ error: "Refund not found" }, { status: 404 });
    return Response.json({ id: parsedId.data, status: body.data.action });
  } catch (error) {
    return apiErrorResponse(error, "Failed to review refund", "Refund could not be reviewed");
  }
}
