"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OrderRefundActions({ refundId, status }: { refundId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function update(action: "approve" | "reject" | "refund" | "cancel") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/super-admin/orders/refunds/${encodeURIComponent(refundId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Refund request could not be updated.");
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Refund request could not be updated.");
    } finally {
      setBusy(false);
    }
  }
  if (status !== "requested" && status !== "approved") return null;
  return (
    <span className="super-admin-confirm-actions">
      {status === "requested" && <button className="super-admin-row-action" disabled={busy} onClick={() => update("approve")} type="button">Approve</button>}
      {status === "requested" && <button className="super-admin-row-action is-danger" disabled={busy} onClick={() => update("reject")} type="button">Reject</button>}
      {status === "approved" && <button className="super-admin-row-action" disabled={busy} onClick={() => update("refund")} type="button">Mark refunded</button>}
      {error && <span aria-live="polite" className="super-admin-row-action-error">{error}</span>}
    </span>
  );
}
