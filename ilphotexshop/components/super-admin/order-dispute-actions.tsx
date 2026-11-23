"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OrderDisputeActions({ disputeId, status }: { disputeId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showResolution, setShowResolution] = useState(false);
  const [resolution, setResolution] = useState("");
  const [error, setError] = useState("");
  async function update(action: "review" | "resolve" | "close") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/super-admin/orders/disputes/${encodeURIComponent(disputeId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, resolution: resolution || undefined }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Dispute could not be updated.");
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Dispute could not be updated.");
    } finally {
      setBusy(false);
    }
  }
  if (status === "closed" || status === "resolved") return null;
  return (
    <span className="super-admin-confirm-actions">
      {status === "open" && <button className="super-admin-row-action" disabled={busy} onClick={() => update("review")} type="button">Review</button>}
      {showResolution ? (
        <>
          <textarea aria-label="Dispute resolution" maxLength={500} onChange={(event) => setResolution(event.target.value)} placeholder="Resolution note (required)" rows={2} value={resolution} />
          <button className="super-admin-row-action" disabled={busy || resolution.trim().length < 3} onClick={() => update("resolve")} type="button">Confirm resolution</button>
          <button className="super-admin-row-action is-muted" disabled={busy} onClick={() => setShowResolution(false)} type="button">Cancel</button>
        </>
      ) : (
        <button className="super-admin-row-action" disabled={busy} onClick={() => setShowResolution(true)} type="button">Resolve</button>
      )}
      <button className="super-admin-row-action is-muted" disabled={busy} onClick={() => update("close")} type="button">Close</button>
      {error && <span aria-live="polite" className="super-admin-row-action-error">{error}</span>}
    </span>
  );
}
