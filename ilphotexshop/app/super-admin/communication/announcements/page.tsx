import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import SuperAdminAnnouncementManager from "@/components/super-admin/announcement-manager";
import { getSuperAdminAnnouncements } from "@/lib/data-access/super-admin-announcements";

export const metadata: Metadata = {
  title: "Announcements | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

function toUtcInputValue(date: Date) {
  return date.toISOString().slice(0, 16);
}

export default async function SuperAdminAnnouncementsPage() {
  const announcements = await getSuperAdminAnnouncements();
  const now = new Date();
  const defaultEndsAt = new Date(now);
  defaultEndsAt.setUTCDate(defaultEndsAt.getUTCDate() + 7);

  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">Workspace / Communication Center / Announcements</div>
          <h1>Announcements</h1>
          <p>Schedule in-app messages for marketplace users.</p>
        </div>
        <Megaphone aria-hidden="true" size={25} />
      </div>

      <div className="super-admin-data-note" role="note">
        Announcements appear only to signed-in users in the selected audience. Email and SMS
        delivery are not configured. Times are entered and displayed in UTC.
      </div>

      <div className="super-admin-payment-overview-actions">
        <Link
          className="super-admin-back-action"
          href="/super-admin/communication/notifications"
        >
          View notification activity
        </Link>
      </div>

      <SuperAdminAnnouncementManager
        announcements={announcements}
        defaultEndsAt={toUtcInputValue(defaultEndsAt)}
        defaultStartsAt={toUtcInputValue(now)}
      />
    </div>
  );
}
