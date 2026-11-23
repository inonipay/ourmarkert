import { revalidatePath } from "next/cache";
import { requireUserRole } from "@/lib/authorization";
import { cancelSuperAdminAnnouncement } from "@/lib/data-access/super-admin-announcements";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { rateLimitResponse } from "@/lib/http/rate-limit-response";
import { checkSuperAdminAnnouncementMutationLimit } from "@/lib/rate-limit";
import { announcementIdSchema } from "@/lib/validation/announcements";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireUserRole("super_admin");
    const limit = await checkSuperAdminAnnouncementMutationLimit(actor.id);
    if (!limit.allowed) return rateLimitResponse(limit, "announcement mutation");

    const { id } = await params;
    const parsedId = announcementIdSchema.safeParse(id);
    if (!parsedId.success) {
      return Response.json({ error: "Invalid announcement ID" }, { status: 400 });
    }

    const cancelled = await cancelSuperAdminAnnouncement(actor.id, parsedId.data);
    if (!cancelled) {
      return Response.json(
        { error: "Announcement is not active or was already cancelled." },
        { status: 404 },
      );
    }
    revalidatePath("/super-admin/communication/announcements");
    return Response.json(
      { cancelled: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiErrorResponse(
      error,
      "Failed to cancel announcement",
      "Announcement could not be cancelled",
    );
  }
}
