import { revalidatePath } from "next/cache";
import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { prisma } from "@/lib/prisma";
import {
  createCommunicationConversation,
} from "@/lib/data-access/super-admin-communication";
import { createConversationSchema } from "@/lib/validation/communication";

export async function POST(request: Request) {
  try {
    const actor = await requireUserRole("super_admin");
    const body = await parseJsonRequest(request, createConversationSchema);
    if (!body.success) return body.response;
    const users = await prisma.user.findMany({
      where: { email: { in: body.data.participantEmails, mode: "insensitive" } },
      select: { id: true },
    });
    if (users.length !== body.data.participantEmails.length) {
      return Response.json({ error: "One or more participants were not found." }, { status: 422 });
    }
    const conversation = await createCommunicationConversation(actor.id, {
      subject: body.data.subject,
      type: body.data.type,
      participantIds: users.map((user) => user.id),
    });
    revalidatePath("/super-admin/communication");
    return Response.json({ conversation }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create conversation", "Conversation could not be created");
  }
}
