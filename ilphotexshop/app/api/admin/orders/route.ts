import { getAdminOrders } from "@/lib/data-access/orders";
import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkOrderReadLimit } from "@/lib/rate-limit";
import { listOrdersQuerySchema } from "@/lib/validation/orders";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  try {
    const admin = await requireUserRole(["admin", "super_admin"]);
    const query = listOrdersQuerySchema.safeParse(
      Object.fromEntries(requestUrl.searchParams.entries()),
    );
    if (!query.success) {
      return Response.json(
        { error: "Invalid order query", details: query.error.flatten() },
        { status: 400 },
      );
    }

    const limit = await checkOrderReadLimit(admin.id);
    if (!limit.allowed) return rateLimitResponse(limit, "order read");

    const result = await getAdminOrders(query.data);
    return Response.json(result, {
      headers: {
        "Cache-Control": "no-store",
        "X-RateLimit-Remaining": String(limit.remaining),
      },
    });
  } catch (error) {
    return apiErrorResponse(
      error,
      "Failed to load admin orders",
      "Orders are temporarily unavailable",
    );
  }
}
