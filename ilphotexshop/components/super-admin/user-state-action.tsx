"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type UserStateActionProps = {
  userId: string;
  action: "activate" | "deactivate" | "archive" | "restore";
  label: string;
};

export default function SuperAdminUserStateAction({
  userId,
  action,
  label,
}: UserStateActionProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function updateState() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/super-admin/users/state?id=${encodeURIComponent(userId)}`,
        {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
        },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error || "Account state could not be updated");
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="super-admin-featured-product-action">
      <button
        className={`super-admin-row-action${action === "archive" ? " is-danger" : ""}`}
        disabled={busy}
        onClick={updateState}
        type="button"
      >
        {busy ? "Saving…" : label}
      </button>
      {error && <span>{error}</span>}
    </span>
  );
}
