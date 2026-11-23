import { revalidatePath } from "next/cache";
import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { createCommunicationConversation } from "@/lib/data-access/super-admin-communication";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const merchantConversationSchema = z.object({
  merchantId: z.string().trim().min(1).max(100),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(3).max(4000),
}).strict();

export async function POST(request: Request) {
  try {
    const customer = await requireUserRole("customer");
    const body = await parseJsonRequest(request, merchantConversationSchema);
    if (!body.success) return body.response;
    const merchant = await prisma.user.findUnique({
      where: { id: body.data.merchantId },
      select: { id: true, role: true },
    });
    if (!merchant || merchant.role !== "seller") {
      return Response.json({ error: "Merchant not found" }, { status: 404 });
    }
    const conversation = await createCommunicationConversation(customer.id, {
      subject: body.data.subject,
      type: "merchant",
      participantIds: [merchant.id],
    });
    await prisma.communicationMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: customer.id,
        body: body.data.message,
      },
    });
    await prisma.communicationConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });
    revalidatePath("/super-admin/communication");
    return Response.json({ conversationId: conversation.id }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(
      error,
      "Failed to start merchant conversation",
      "Message could not be sent",
    );
  }
}
