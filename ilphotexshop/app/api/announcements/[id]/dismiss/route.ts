import { requireAuthenticatedUser } from "@/lib/authorization";
import { dismissAnnouncementForUser } from "@/lib/data-access/super-admin-announcements";
import { apiErrorResponse } from "@/lib/http/api-error-response";
import { announcementIdSchema } from "@/lib/validation/announcements";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuthenticatedUser();
    const { id } = await params;
    const parsedId = announcementIdSchema.safeParse(id);
    if (!parsedId.success) {
      return Response.json({ error: "Invalid announcement ID" }, { status: 400 });
    }

    const dismissed = await dismissAnnouncementForUser(user.id, parsedId.data);
    if (!dismissed) {
      return Response.json({ error: "Announcement not found" }, { status: 404 });
    }
    return Response.json(
      { dismissed: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiErrorResponse(
      error,
      "Failed to dismiss announcement",
      "Announcement could not be dismissed",
    );
  }
}
