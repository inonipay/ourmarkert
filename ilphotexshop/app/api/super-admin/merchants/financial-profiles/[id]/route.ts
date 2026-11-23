import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { setMerchantFinancialProfileVerified } from "@/lib/data-access/super-admin-merchant-management";
import { staffInvitationIdSchema } from "@/lib/validation/users";
import { z } from "zod";

const verifySchema = z.object({ isVerified: z.boolean() }).strict();

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireUserRole("super_admin");
    const { id } = await context.params;
    const parsedId = staffInvitationIdSchema.safeParse(id);
    if (!parsedId.success) return Response.json({ error: "Invalid financial profile ID" }, { status: 400 });
    const body = await parseJsonRequest(request, verifySchema);
    if (!body.success) return body.response;
    const changed = await setMerchantFinancialProfileVerified(actor.id, parsedId.data, body.data.isVerified);
    if (!changed) return Response.json({ error: "Financial profile not found" }, { status: 404 });
    return Response.json({ id: parsedId.data, isVerified: body.data.isVerified });
  } catch (error) {
    return apiErrorResponse(error, "Failed to verify merchant financial profile", "Verification state could not be updated");
  }
}
