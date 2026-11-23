"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CommunicationCampaignManager({
  type,
}: {
  type: "email" | "sms";
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState("all_users");
  const [scheduledAt, setScheduledAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function createCampaign() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/super-admin/communication/${type}-campaigns`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            type === "email"
              ? { subject: title, content, audience, scheduledAt: scheduledAt || undefined }
              : { name: title, message: content, audience, scheduledAt: scheduledAt || undefined },
          ),
        },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Campaign could not be created.");
      }
      setTitle("");
      setContent("");
      setScheduledAt("");
      router.refresh();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Campaign could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="super-admin-panel super-admin-records-panel">
      <div className="super-admin-records-toolbar"><div><h2>Create {type.toUpperCase()} campaign</h2><p>Campaigns are stored and scheduled in the marketplace. No external provider is contacted automatically.</p></div></div>
      <div className="super-admin-communication-form">
        <label>{type === "email" ? "Subject" : "Campaign name"}<input maxLength={type === "email" ? 200 : 160} onChange={(event) => setTitle(event.target.value)} value={title} /></label>
        <label>{type === "email" ? "Email content" : "SMS message"}<textarea maxLength={type === "email" ? 4000 : 1600} onChange={(event) => setContent(event.target.value)} rows={5} value={content} /></label>
        <label>Audience<select onChange={(event) => setAudience(event.target.value)} value={audience}><option value="all_users">All users</option><option value="merchants">Merchants</option><option value="customers">Customers</option><option value="admins">Admins</option></select></label>
        <label>Schedule (UTC)<input type="datetime-local" onChange={(event) => setScheduledAt(event.target.value ? new Date(event.target.value).toISOString() : "")} /></label>
        <button className="super-admin-primary-action" disabled={busy || title.trim().length < 3 || content.trim().length < 3} onClick={createCampaign} type="button">{busy ? "Saving…" : scheduledAt ? "Schedule campaign" : "Save draft"}</button>
        {message && <p className="super-admin-row-action-error" role="alert">{message}</p>}
      </div>
    </section>
  );
}
