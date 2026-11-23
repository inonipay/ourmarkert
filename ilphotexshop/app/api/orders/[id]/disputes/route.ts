import { requireAuthenticatedUser } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { createOrderDisputeRequest } from "@/lib/data-access/super-admin-orders";
import { orderIdSchema, orderDisputeSchema } from "@/lib/validation/orders";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const customer = await requireAuthenticatedUser();
    const { id } = await context.params;
    const parsedId = orderIdSchema.safeParse(id);
    if (!parsedId.success) return Response.json({ error: "Invalid order ID" }, { status: 400 });
    const body = await parseJsonRequest(request, orderDisputeSchema);
    if (!body.success) return body.response;
    const dispute = await createOrderDisputeRequest(customer.id, parsedId.data, body.data.reason);
    if (!dispute) return Response.json({ error: "Order not found" }, { status: 404 });
    return Response.json({ id: dispute.id, status: dispute.status }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to open dispute", "Dispute could not be created");
  }
}
