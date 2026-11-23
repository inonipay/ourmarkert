"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type MerchantKycReviewActionsProps = {
  applicationId: string;
};

export default function MerchantKycReviewActions({
  applicationId,
}: MerchantKycReviewActionsProps) {
  const router = useRouter();
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitDecision() {
    if (!decision) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/super-admin/merchants/kyc/${encodeURIComponent(applicationId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: decision,
            ...(reason.trim() ? { reason: reason.trim() } : {}),
          }),
        },
      );
      const result = (await response.json().catch(() => null)) as
        | { error?: string; status?: string }
        | null;
      if (!response.ok) {
        throw new Error(result?.error ?? "The application could not be reviewed.");
      }
      router.push(
        decision === "approve"
          ? "/super-admin/merchants/approved-merchants"
          : "/super-admin/merchants/rejected-applications",
      );
      router.refresh();
    } catch (caught) {
      console.error("Could not review merchant KYC application", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "The application could not be reviewed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="super-admin-kyc-review">
      {decision ? (
        <>
          <label>
            <span>
              {decision === "reject"
                ? "Reason for declining (required)"
                : "Approval note (optional)"}
            </span>
            <textarea
              maxLength={500}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              value={reason}
            />
          </label>
          {decision === "reject" && (
            <small>
              Keep this note factual and do not include ID numbers or other
              personal document details; the note remains in the audit log.
            </small>
          )}
          <p>
            {decision === "approve"
              ? "Approval grants the applicant the seller role. Uploaded KYC documents are retained."
              : "Declining deletes this application and both uploaded files. A non-document audit entry is retained."}
          </p>
          <div className="super-admin-detail-actions">
            <button
              className={decision === "approve" ? "super-admin-primary-action" : "super-admin-row-action is-danger"}
              disabled={
                busy || (decision === "reject" && reason.trim().length < 3)
              }
              onClick={submitDecision}
              type="button"
            >
              {busy
                ? "Saving…"
                : decision === "approve"
                  ? "Confirm approval"
                  : "Confirm decline"}
            </button>
            <button
              className="super-admin-back-action"
              disabled={busy}
              onClick={() => setDecision(null)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="super-admin-detail-actions">
          <button
            className="super-admin-primary-action"
            onClick={() => {
              setError("");
              setDecision("approve");
            }}
            type="button"
          >
            Review approval
          </button>
          <button
            className="super-admin-row-action is-danger"
            onClick={() => {
              setError("");
              setDecision("reject");
            }}
            type="button"
          >
            Review decline
          </button>
        </div>
      )}
      <p aria-live="polite" className="super-admin-row-action-error">
        {error}
      </p>
    </div>
  );
}
