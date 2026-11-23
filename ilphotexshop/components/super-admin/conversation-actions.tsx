"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ConversationActions({
  conversationId,
  status,
}: {
  conversationId: string;
  status: "open" | "closed";
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "open") return;
    const interval = window.setInterval(() => router.refresh(), 10_000);
    return () => window.clearInterval(interval);
  }, [router, status]);

  async function sendMessage() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/super-admin/communication/conversations/${encodeURIComponent(conversationId)}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        },
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Message could not be sent.");
      }
      setBody("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Message could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  async function changeState(action: "close" | "reopen") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/super-admin/communication/conversations/${encodeURIComponent(conversationId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Conversation could not be updated.");
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Conversation could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="super-admin-conversation-actions">
      {status === "open" ? (
        <>
          <label>
            Message
            <textarea
              maxLength={4000}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write a message…"
              rows={4}
              value={body}
            />
          </label>
          <div className="super-admin-confirm-actions">
            <button
              className="super-admin-primary-action"
              disabled={busy || body.trim().length === 0}
              onClick={sendMessage}
              type="button"
            >
              Send message
            </button>
            <button
              className="super-admin-row-action is-muted"
              disabled={busy}
              onClick={() => changeState("close")}
              type="button"
            >
              Close conversation
            </button>
          </div>
        </>
      ) : (
        <button
          className="super-admin-row-action"
          disabled={busy}
          onClick={() => changeState("reopen")}
          type="button"
        >
          Reopen conversation
        </button>
      )}
      {error && <p className="super-admin-row-action-error" role="alert">{error}</p>}
    </div>
  );
}
