"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SupportTicketDetailActions({
  ticketId,
  status,
  assigneeEmail,
}: {
  ticketId: string;
  status: string;
  assigneeEmail: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [assignee, setAssignee] = useState(assigneeEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "closed") return;
    const interval = window.setInterval(() => router.refresh(), 10_000);
    return () => window.clearInterval(interval);
  }, [router, status]);

  async function update(action: "in_progress" | "resolved" | "closed") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/super-admin/communication/support-tickets/${encodeURIComponent(ticketId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action, assignedToEmail: assignee.trim() || undefined }),
        },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Ticket could not be updated.");
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ticket could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/super-admin/communication/support-tickets/${encodeURIComponent(ticketId)}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: message }),
        },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Message could not be added.");
      }
      setMessage("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Message could not be added.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="super-admin-conversation-actions">
      <label>
        Assignee email
        <input
          maxLength={254}
          onChange={(event) => setAssignee(event.target.value)}
          value={assignee}
        />
      </label>
      {status !== "closed" ? (
        <>
          <label>
            Ticket response
            <textarea
              maxLength={4000}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Add an internal response…"
              rows={4}
              value={message}
            />
          </label>
          <div className="super-admin-confirm-actions">
            <button className="super-admin-primary-action" disabled={busy || message.trim().length === 0} onClick={sendMessage} type="button">Add response</button>
            {status === "open" && <button className="super-admin-row-action" disabled={busy} onClick={() => update("in_progress")} type="button">Start</button>}
            {(status === "open" || status === "in_progress") && <button className="super-admin-row-action" disabled={busy} onClick={() => update("resolved")} type="button">Resolve</button>}
            <button className="super-admin-row-action is-muted" disabled={busy} onClick={() => update("closed")} type="button">Close</button>
          </div>
        </>
      ) : (
        <button className="super-admin-row-action" disabled={busy} onClick={() => update("in_progress")} type="button">Reopen</button>
      )}
      {error && <p className="super-admin-row-action-error" role="alert">{error}</p>}
    </div>
  );
}
