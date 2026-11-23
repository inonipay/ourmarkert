"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProductModerationAction({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  async function moderate(action: "approve" | "reject") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/super-admin/products/${encodeURIComponent(productId)}/moderate`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...(action === "reject" ? { reason } : {}) }),
        },
      );
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) throw new Error(body?.error || "Product moderation failed");
      setRejecting(false);
      setReason("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Product moderation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="super-admin-featured-product-action">
      {rejecting ? (
        <>
          <textarea
            aria-label={`Rejection reason for ${productName}`}
            maxLength={500}
            minLength={3}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Rejection reason (required)"
            rows={2}
            value={reason}
          />
          <span className="super-admin-confirm-actions">
            <button
              className="super-admin-row-action is-danger"
              disabled={busy || reason.trim().length < 3}
              onClick={() => moderate("reject")}
              type="button"
            >
              Confirm reject
            </button>
            <button
              className="super-admin-row-action is-muted"
              disabled={busy}
              onClick={() => setRejecting(false)}
              type="button"
            >
              Cancel
            </button>
          </span>
        </>
      ) : (
        <span className="super-admin-confirm-actions">
          <button
            className="super-admin-row-action"
            disabled={busy}
            onClick={() => moderate("approve")}
            type="button"
          >
            {busy ? "Saving…" : "Approve"}
          </button>
          <button
            className="super-admin-row-action is-danger"
            disabled={busy}
            onClick={() => setRejecting(true)}
            type="button"
          >
            Reject
          </button>
        </span>
      )}
      {error && <span>{error}</span>}
    </span>
  );
}
