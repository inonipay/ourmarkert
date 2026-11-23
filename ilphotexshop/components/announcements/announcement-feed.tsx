import { getActiveAnnouncementsForUser } from "@/lib/data-access/super-admin-announcements";
import AnnouncementFeedClient from "@/components/announcements/announcement-feed-client";

export default async function AnnouncementFeed({
  userId,
}: {
  userId: string | null;
}) {
  if (!userId) return null;

  const announcements = await getActiveAnnouncementsForUser(userId);
  if (!announcements.length) return null;
  return <AnnouncementFeedClient announcements={announcements} />;
}
