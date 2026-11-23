import { revalidatePath } from "next/cache";
import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { addSupportTicketMessage } from "@/lib/data-access/super-admin-communication";
import { addConversationMessageSchema } from "@/lib/validation/communication";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireUserRole("super_admin");
    const body = await parseJsonRequest(request, addConversationMessageSchema);
    if (!body.success) return body.response;
    const { id } = await context.params;
    const message = await addSupportTicketMessage(id, actor.id, body.data.body);
    if (!message) {
      return Response.json({ error: "Ticket not found or closed." }, { status: 404 });
    }
    revalidatePath("/super-admin/communication/support-tickets");
    return Response.json({ message });
  } catch (error) {
    return apiErrorResponse(error, "Failed to add ticket message", "Ticket message could not be added");
  }
}
