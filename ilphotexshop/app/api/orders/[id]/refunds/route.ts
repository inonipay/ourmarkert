import { requireAuthenticatedUser } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { createOrderRefundRequest } from "@/lib/data-access/super-admin-orders";
import { orderIdSchema, orderRefundSchema } from "@/lib/validation/orders";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const customer = await requireAuthenticatedUser();
    const { id } = await context.params;
    const parsedId = orderIdSchema.safeParse(id);
    if (!parsedId.success) return Response.json({ error: "Invalid order ID" }, { status: 400 });
    const body = await parseJsonRequest(request, orderRefundSchema);
    if (!body.success) return body.response;
    const refund = await createOrderRefundRequest(customer.id, parsedId.data, body.data);
    if (!refund) return Response.json({ error: "Order not found" }, { status: 404 });
    return Response.json({ id: refund.id, status: refund.status }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to request refund", "Refund request could not be created");
  }
}
