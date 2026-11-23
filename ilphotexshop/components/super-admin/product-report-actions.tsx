"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProductReportActions({
  reportId,
}: {
  reportId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function review(action: "review" | "dismiss") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/super-admin/products/reports/${encodeURIComponent(reportId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      if (!response.ok) throw new Error("Report action failed");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Report action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="super-admin-confirm-actions">
      <button className="super-admin-row-action" disabled={busy} onClick={() => review("review")} type="button">Mark reviewed</button>
      <button className="super-admin-row-action is-muted" disabled={busy} onClick={() => review("dismiss")} type="button">Dismiss</button>
      {error && <span className="super-admin-row-action-error">{error}</span>}
    </span>
  );
}
