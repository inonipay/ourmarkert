import { revalidatePath } from "next/cache";
import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { createSupportTicket } from "@/lib/data-access/super-admin-communication";
import { createSupportTicketSchema } from "@/lib/validation/communication";

export async function POST(request: Request) {
  try {
    const actor = await requireUserRole("super_admin");
    const body = await parseJsonRequest(request, createSupportTicketSchema);
    if (!body.success) return body.response;
    const ticket = await createSupportTicket(actor.id, body.data);
    revalidatePath("/super-admin/communication/support-tickets");
    return Response.json({ ticket }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create support ticket", "Support ticket could not be created");
  }
}
