import { revalidatePath } from "next/cache";
import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { addConversationMessage } from "@/lib/data-access/super-admin-communication";
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
    const changed = await addConversationMessage(id, actor.id, body.data.body);
    if (!changed) return Response.json({ error: "Conversation not found or closed." }, { status: 404 });
    revalidatePath("/super-admin/communication");
    return Response.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error, "Failed to send message", "Message could not be sent");
  }
}
