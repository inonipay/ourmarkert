"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CampaignActions({
  type,
  campaignId,
  status,
}: {
  type: "email" | "sms";
  campaignId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function cancelCampaign() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/super-admin/communication/${type}-campaigns/${encodeURIComponent(campaignId)}`,
        { method: "PATCH" },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Campaign could not be cancelled.");
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Campaign could not be cancelled.");
    } finally {
      setBusy(false);
    }
  }

  if (status !== "draft" && status !== "scheduled") return null;
  return (
    <span className="super-admin-confirm-actions">
      <button
        className="super-admin-row-action is-danger"
        disabled={busy}
        onClick={cancelCampaign}
        type="button"
      >
        Cancel
      </button>
      {error && <span className="super-admin-row-action-error" role="alert">{error}</span>}
    </span>
  );
}
