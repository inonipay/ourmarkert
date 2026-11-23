import { revalidatePath } from "next/cache";
import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import {
  closeCommunicationConversation,
  reopenCommunicationConversation,
} from "@/lib/data-access/super-admin-communication";
import { z } from "zod";

const conversationActionSchema = z.object({
  action: z.enum(["close", "reopen"]),
}).strict();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireUserRole("super_admin");
    const body = await parseJsonRequest(request, conversationActionSchema);
    if (!body.success) return body.response;
    const { id } = await context.params;
    const changed =
      body.data.action === "close"
        ? await closeCommunicationConversation(id)
        : await reopenCommunicationConversation(id);
    if (!changed) return Response.json({ error: "Conversation state could not be changed." }, { status: 409 });
    revalidatePath("/super-admin/communication");
    return Response.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error, "Failed to update conversation", "Conversation could not be updated");
  }
}
