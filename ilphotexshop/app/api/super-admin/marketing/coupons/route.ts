import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { couponSchema } from "@/lib/validation/marketing";
import { createCoupon, setCouponStatus } from "@/lib/data-access/super-admin-marketing";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const actor = await requireUserRole("super_admin");
    const body = await parseJsonRequest(request, couponSchema);
    if (!body.success) return body.response;
    const coupon = await createCoupon(actor.id, body.data);
    return Response.json(coupon, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create coupon", "Coupon could not be created");
  }
}

export async function PATCH(request: Request) {
  try {
    await requireUserRole("super_admin");
    const body = await parseJsonRequest(
      request,
      z.object({ id: z.string().min(1), status: z.enum(["draft", "scheduled", "active", "paused", "ended", "cancelled"]) }).strict(),
    );
    if (!body.success) return body.response;
    const changed = await setCouponStatus(body.data.id, body.data.status);
    if (!changed) return Response.json({ error: "Coupon not found" }, { status: 404 });
    return Response.json(body.data);
  } catch (error) {
    return apiErrorResponse(error, "Failed to update coupon", "Coupon status could not be updated");
  }
}
