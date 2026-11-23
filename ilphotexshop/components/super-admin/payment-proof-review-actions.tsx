"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SuperAdminPaymentProofReviewActions({
  id,
}: {
  id: string;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function review(action: "approve" | "reject") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/super-admin/payments/payment-proofs/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            action === "approve" ? { action } : { action, reason },
          ),
        },
      );
      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(result?.error || "Payment proof could not be reviewed.");
      }
      router.refresh();
    } catch (caught) {
      console.error("Could not review payment proof", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "Payment proof could not be reviewed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="super-admin-payment-proof-actions">
      <button
        className="super-admin-row-action"
        disabled={busy}
        onClick={() => review("approve")}
        type="button"
      >
        {busy ? "Saving…" : "Approve"}
      </button>
      <label>
        Rejection reason
        <input
          maxLength={500}
          minLength={3}
          onChange={(event) => setReason(event.target.value)}
          value={reason}
        />
      </label>
      <button
        className="super-admin-row-action is-warning"
        disabled={busy || reason.trim().length < 3}
        onClick={() => review("reject")}
        type="button"
      >
        Reject
      </button>
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
