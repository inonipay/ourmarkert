import { getCustomerOrder } from "@/lib/data-access/orders";
import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkOrderReadLimit } from "@/lib/rate-limit";
import { orderIdSchema } from "@/lib/validation/orders";

type OrderRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: OrderRouteContext) {
  try {
    const { id } = await context.params;
    const customer = await requireUserRole("customer");
    const parsedId = orderIdSchema.safeParse(id);
    if (!parsedId.success) {
      return Response.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const limit = await checkOrderReadLimit(customer.id);
    if (!limit.allowed) return rateLimitResponse(limit, "order read");

    const order = await getCustomerOrder(customer.id, parsedId.data);
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    return Response.json(order, {
      headers: {
        "Cache-Control": "no-store",
        "X-RateLimit-Remaining": String(limit.remaining),
      },
    });
  } catch (error) {
    return apiErrorResponse(
      error,
      "Failed to load customer order",
      "Order is temporarily unavailable",
    );
  }
}
