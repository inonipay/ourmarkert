"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SuperAdminPaymentAccountStatusAction({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggleStatus() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/super-admin/payments/accounts/${encodeURIComponent(id)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !isActive }),
        },
      );
      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(result?.error || "Payment account status could not be changed.");
      }
      router.refresh();
    } catch (caught) {
      console.error("Could not change payment account status", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "Payment account status could not be changed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="super-admin-record-row-actions">
      <button
        className={`super-admin-row-action${isActive ? " is-warning" : ""}`}
        disabled={busy}
        onClick={toggleStatus}
        type="button"
      >
        {busy ? "Saving…" : isActive ? "Deactivate" : "Activate"}
      </button>
      {error && (
        <small className="super-admin-row-action-error" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
