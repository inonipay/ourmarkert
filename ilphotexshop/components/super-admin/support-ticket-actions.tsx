"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SupportTicketActions({
  ticketId,
  status,
}: {
  ticketId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [assignee, setAssignee] = useState("");
  const [error, setError] = useState("");

  async function update(nextStatus: "open" | "in_progress" | "resolved" | "closed") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/super-admin/communication/support-tickets/${encodeURIComponent(ticketId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: nextStatus,
            assignedToEmail: assignee.trim() || undefined,
          }),
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

  return (
    <span className="super-admin-support-ticket-actions">
      <input
        aria-label="Assignee email"
        maxLength={254}
        onChange={(event) => setAssignee(event.target.value)}
        placeholder="Assignee email"
        value={assignee}
      />
      {status === "open" && <button className="super-admin-row-action" disabled={busy} onClick={() => update("in_progress")} type="button">Start</button>}
      {(status === "open" || status === "in_progress") && <button className="super-admin-row-action" disabled={busy} onClick={() => update("resolved")} type="button">Resolve</button>}
      {status !== "closed" && <button className="super-admin-row-action is-muted" disabled={busy} onClick={() => update("closed")} type="button">Close</button>}
      {error && <span className="super-admin-row-action-error">{error}</span>}
    </span>
  );
}
