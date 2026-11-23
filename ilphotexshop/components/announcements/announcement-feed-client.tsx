"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { AnnouncementPriority } from "@prisma/client";

type AnnouncementItem = {
  id: string;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  endsAt: Date;
};

const dateFormat = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export default function AnnouncementFeedClient({
  announcements,
}: {
  announcements: AnnouncementItem[];
}) {
  const [visibleAnnouncements, setVisibleAnnouncements] = useState(announcements);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function dismiss(id: string) {
    setPendingId(id);
    setError(null);
    try {
      const response = await fetch(
        `/api/announcements/${encodeURIComponent(id)}/dismiss`,
        { method: "POST" },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Announcement could not be dismissed.");
      }
      setVisibleAnnouncements((current) =>
        current.filter((announcement) => announcement.id !== id),
      );
    } catch (dismissError) {
      setError(
        dismissError instanceof Error
          ? dismissError.message
          : "Announcement could not be dismissed.",
      );
    } finally {
      setPendingId(null);
    }
  }

  if (!visibleAnnouncements.length) return null;

  return (
    <section aria-label="Announcements" className="announcement-feed">
      {visibleAnnouncements.map((announcement) => (
        <article
          className={`announcement-feed-item is-${announcement.priority}`}
          key={announcement.id}
        >
          <div className="announcement-feed-copy">
            <span className={`announcement-feed-priority is-${announcement.priority}`}>
              {announcement.priority}
            </span>
            <h2>{announcement.title}</h2>
            <p>{announcement.message}</p>
            <small>Available until {dateFormat.format(announcement.endsAt)} UTC</small>
          </div>
          <button
            aria-label={`Dismiss announcement: ${announcement.title}`}
            disabled={pendingId === announcement.id}
            onClick={() => dismiss(announcement.id)}
            type="button"
          >
            <X aria-hidden="true" size={17} />
          </button>
        </article>
      ))}
      {error && <p className="announcement-feed-error" role="alert">{error}</p>}
    </section>
  );
}
