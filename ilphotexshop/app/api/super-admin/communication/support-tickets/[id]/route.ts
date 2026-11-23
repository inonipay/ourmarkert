import { revalidatePath } from "next/cache";
import { requireUserRole } from "@/lib/authorization";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { prisma } from "@/lib/prisma";
import { updateSupportTicket } from "@/lib/data-access/super-admin-communication";
import { updateSupportTicketSchema } from "@/lib/validation/communication";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireUserRole("super_admin");
    const body = await parseJsonRequest(request, updateSupportTicketSchema);
    if (!body.success) return body.response;
    const { id } = await context.params;
    let assignedToId: string | undefined;
    if (body.data.assignedToEmail) {
      const user = await prisma.user.findUnique({
        where: { email: body.data.assignedToEmail },
        select: { id: true },
      });
      if (!user) return Response.json({ error: "Assignee was not found." }, { status: 422 });
      assignedToId = user.id;
    }
    const changed = await updateSupportTicket(id, {
      status: body.data.status,
      assignedToId,
    });
    if (!changed) return Response.json({ error: "Ticket not found." }, { status: 404 });
    revalidatePath("/super-admin/communication/support-tickets");
    return Response.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error, "Failed to update support ticket", "Support ticket could not be updated");
  }
}
