import { revalidatePath } from "next/cache";
import { requireUserRole } from "@/lib/authorization";
import {
  AnnouncementRecipientsNotFoundError,
  createSuperAdminAnnouncement,
} from "@/lib/data-access/super-admin-announcements";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { parseJsonRequest } from "@/lib/http/parse-json-request";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkSuperAdminAnnouncementMutationLimit } from "@/lib/rate-limit";
import { createAnnouncementSchema } from "@/lib/validation/announcements";

export async function POST(request: Request) {
  try {
    const actor = await requireUserRole("super_admin");
    const limit = await checkSuperAdminAnnouncementMutationLimit(actor.id);
    if (!limit.allowed) return rateLimitResponse(limit, "announcement mutation");

    const body = await parseJsonRequest(
      request,
      createAnnouncementSchema,
      40_000,
    );
    if (!body.success) return body.response;

    const announcement = await createSuperAdminAnnouncement(
      actor.id,
      body.data,
    );
    revalidatePath("/super-admin/communication/announcements");
    return Response.json(
      { announcement },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    if (error instanceof AnnouncementRecipientsNotFoundError) {
      return Response.json(
        { error: "One or more recipients are unavailable or inactive." },
        { status: 422 },
      );
    }
    return apiErrorResponse(
      error,
      "Failed to create announcement",
      "Announcement could not be created",
    );
  }
}
