import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { recordCampaignEvent } from "@/lib/data-access/super-admin-marketing";
import { z } from "zod";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await parseJsonRequest(
      request,
      z.object({
        type: z.enum(["view", "click", "conversion"]),
        userId: z.string().max(100).optional(),
        orderId: z.string().max(100).optional(),
        amount: z.number().int().min(0).optional(),
        currency: z.string().length(3).optional(),
      }).strict(),
    );
    if (!body.success) return body.response;
    const event = await recordCampaignEvent(
      id,
      body.data.type,
      body.data.userId,
      body.data.orderId,
      body.data.amount,
      body.data.currency,
    );
    if (!event) return Response.json({ error: "Campaign is not active" }, { status: 404 });
    return Response.json({ id: event.id }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to record campaign event", "Campaign event could not be recorded");
  }
}
