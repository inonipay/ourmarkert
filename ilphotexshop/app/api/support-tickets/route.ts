import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { getAuthenticatedUser } from "@/lib/authorization";
import { createPublicSupportTicket } from "@/lib/data-access/super-admin-communication";
import { publicSupportTicketSchema } from "@/lib/validation/communication";
import {
  checkSupportTicketSubmitLimit,
  getClientIp,
} from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";

export async function POST(request: Request) {
  try {
    const body = await parseJsonRequest(request, publicSupportTicketSchema, 20_000);
    if (!body.success) return body.response;

    const user = await getAuthenticatedUser();
    const requesterId = user?.id ?? null;
    const ipAddress = getClientIp(
      request.headers.get("x-real-ip"),
      request.headers.get("x-forwarded-for"),
    );
    const identifier = requesterId
      ? `user:${requesterId}`
      : `ip:${ipAddress}`;
    const limit = await checkSupportTicketSubmitLimit(identifier);
    if (!limit.allowed) {
      return rateLimitResponse(limit, "support request");
    }

    const ticket = await createPublicSupportTicket(requesterId, body.data);
    return Response.json(
      { ticketId: ticket.id },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiErrorResponse(
      error,
      "Failed to create support request",
      "Support request could not be submitted",
    );
  }
}
