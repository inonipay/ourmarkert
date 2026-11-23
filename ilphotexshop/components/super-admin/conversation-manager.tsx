"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ConversationType = "customer" | "merchant" | "staff";

export default function ConversationManager({
  type,
  live = false,
}: {
  type?: ConversationType;
  live?: boolean;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [emails, setEmails] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function createConversation() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/super-admin/communication/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          type: type ?? "customer",
          participantEmails: emails
            .split(/[,\n]/)
            .map((email) => email.trim())
            .filter(Boolean),
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Conversation could not be created.");
      }
      setSubject("");
      setEmails("");
      router.refresh();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Conversation could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="super-admin-panel super-admin-records-panel">
      <div className="super-admin-records-toolbar">
        <div>
          <h2>{live ? "Live chat thread" : "Start a conversation"}</h2>
          <p>Create an internal marketplace conversation and add participant emails.</p>
        </div>
      </div>
      <div className="super-admin-communication-form">
        <label>
          Subject
          <input
            maxLength={200}
            onChange={(event) => setSubject(event.target.value)}
            value={subject}
          />
        </label>
        <label>
          Participant emails
          <textarea
            maxLength={2000}
            onChange={(event) => setEmails(event.target.value)}
            placeholder="customer@example.com, merchant@example.com"
            rows={3}
            value={emails}
          />
        </label>
        <button
          className="super-admin-primary-action"
          disabled={busy || subject.trim().length < 3}
          onClick={createConversation}
          type="button"
        >
          {busy ? "Creating…" : "Create conversation"}
        </button>
        {message && <p className="super-admin-row-action-error" role="alert">{message}</p>}
      </div>
    </section>
  );
}
