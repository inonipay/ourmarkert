"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { SuperAdminAnnouncementItem } from "@/lib/data-access/super-admin-announcements";
import type {
  announcementAudienceSchema,
  announcementPrioritySchema,
} from "@/lib/validation/announcements";
import type { z } from "zod";

type Audience = z.infer<typeof announcementAudienceSchema>;
type Priority = z.infer<typeof announcementPrioritySchema>;

const audienceLabels: Record<Audience, string> = {
  all_users: "All users",
  merchants: "Merchants",
  customers: "Customers",
  admins: "Administrators",
  specific_users: "Specific users",
};

const priorityLabels: Record<Priority, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
};

const dateTimeFormat = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function toUtcIso(value: string) {
  const [date, time] = value.split("T");
  return date && time ? new Date(`${date}T${time}:00.000Z`).toISOString() : "";
}

export default function SuperAdminAnnouncementManager({
  announcements,
  defaultStartsAt,
  defaultEndsAt,
}: {
  announcements: SuperAdminAnnouncementItem[];
  defaultStartsAt: string;
  defaultEndsAt: string;
}) {
  const router = useRouter();
  const [audience, setAudience] = useState<Audience>("all_users");
  const [pending, setPending] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFeedback(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const startsAt = toUtcIso(String(formData.get("startsAt") ?? ""));
      const endsAt = toUtcIso(String(formData.get("endsAt") ?? ""));
      if (!startsAt || !endsAt) {
        setFeedback({ type: "error", text: "Enter valid start and end times in UTC." });
        return;
      }

      const recipientEmails =
        audience === "specific_users"
          ? String(formData.get("recipientEmails") ?? "")
              .split(/[\s,;]+/)
              .map((email) => email.trim())
              .filter(Boolean)
          : [];
      const response = await fetch("/api/super-admin/communication/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(formData.get("title") ?? ""),
          message: String(formData.get("message") ?? ""),
          audience,
          priority: String(formData.get("priority") ?? "normal"),
          startsAt,
          endsAt,
          recipientEmails,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Announcement could not be created.");
      }

      form.reset();
      setAudience("all_users");
      setFeedback({ type: "success", text: "Announcement scheduled successfully." });
      router.refresh();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "Announcement could not be created.",
      });
    } finally {
      setPending(false);
    }
  }

  async function cancelAnnouncement(id: string) {
    setCancellingId(id);
    setFeedback(null);
    try {
      const response = await fetch(
        `/api/super-admin/communication/announcements/${encodeURIComponent(id)}`,
        { method: "PATCH" },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Announcement could not be cancelled.");
      }
      setConfirmingId(null);
      setFeedback({ type: "success", text: "Announcement cancelled." });
      router.refresh();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "Announcement could not be cancelled.",
      });
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <>
      <section className="super-admin-panel super-admin-announcement-form-panel">
        <div className="super-admin-panel-heading">
          <div>
            <h2>Create an in-app announcement</h2>
            <p>It will appear only to signed-in users in the selected audience during the scheduled period.</p>
          </div>
        </div>
        <form className="super-admin-announcement-form" onSubmit={handleSubmit}>
          <label>
            Title
            <input maxLength={160} minLength={3} name="title" required />
          </label>
          <label>
            Message
            <textarea maxLength={4000} minLength={3} name="message" required rows={4} />
          </label>
          <div className="super-admin-announcement-form-grid">
            <label>
              Audience
              <select
                name="audience"
                onChange={(event) => setAudience(event.target.value as Audience)}
                value={audience}
              >
                {Object.entries(audienceLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select defaultValue="normal" name="priority">
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              Starts at (UTC)
              <input
                defaultValue={defaultStartsAt}
                name="startsAt"
                required
                type="datetime-local"
              />
            </label>
            <label>
              Ends at (UTC)
              <input
                defaultValue={defaultEndsAt}
                name="endsAt"
                required
                type="datetime-local"
              />
            </label>
          </div>
          {audience === "specific_users" && (
            <label>
              Recipient emails
              <textarea
                autoComplete="off"
                name="recipientEmails"
                placeholder="one@example.com, two@example.com"
                required
                rows={3}
              />
              <small>Enter up to 100 active account emails, separated by spaces, commas, or semicolons.</small>
            </label>
          )}
          {feedback && (
            <p
              className={`super-admin-announcement-feedback is-${feedback.type}`}
              role={feedback.type === "error" ? "alert" : "status"}
            >
              {feedback.text}
            </p>
          )}
          <button className="super-admin-primary-action" disabled={pending} type="submit">
            {pending ? "Scheduling…" : "Schedule announcement"}
          </button>
        </form>
      </section>

      <section className="super-admin-panel super-admin-announcement-list-panel">
        <div className="super-admin-panel-heading">
          <div>
            <h2>Announcement history</h2>
            <p>Latest {announcements.length} announcements</p>
          </div>
        </div>
        {announcements.length ? (
          <div className="super-admin-announcement-list">
            {announcements.map((announcement) => {
              const status = announcement.status;
              return (
                <article className="super-admin-announcement-row" key={announcement.id}>
                  <div className="super-admin-announcement-row-heading">
                    <div>
                      <h3>{announcement.title}</h3>
                      <p>{announcement.message}</p>
                    </div>
                    <span className={`super-admin-announcement-status is-${status}`}>
                      {status[0].toUpperCase() + status.slice(1)}
                    </span>
                  </div>
                  <div className="super-admin-announcement-meta">
                    <span>{audienceLabels[announcement.audience]}</span>
                    <span>{priorityLabels[announcement.priority]} priority</span>
                    {announcement.audience === "specific_users" && (
                      <span>{announcement.recipientCount} recipients</span>
                    )}
                    <span>
                      {dateTimeFormat.format(announcement.startsAt)} –{" "}
                      {dateTimeFormat.format(announcement.endsAt)} UTC
                    </span>
                    <span>Created by {announcement.createdByName}</span>
                  </div>
                  {status === "live" || status === "scheduled" ? (
                    <div className="super-admin-announcement-actions">
                      {confirmingId === announcement.id ? (
                        <>
                          <span>Stop showing this announcement?</span>
                          <button
                            disabled={cancellingId === announcement.id}
                            onClick={() => cancelAnnouncement(announcement.id)}
                            type="button"
                          >
                            {cancellingId === announcement.id ? "Cancelling…" : "Confirm cancellation"}
                          </button>
                          <button
                            onClick={() => setConfirmingId(null)}
                            type="button"
                          >
                            Keep it
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmingId(announcement.id)}
                          type="button"
                        >
                          Cancel announcement
                        </button>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="super-admin-records-empty">
            <strong>No announcements yet</strong>
            <span>Scheduled announcements will appear here.</span>
          </div>
        )}
      </section>
    </>
  );
}
