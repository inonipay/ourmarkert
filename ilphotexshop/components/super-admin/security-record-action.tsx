"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type SecurityRecordAction = {
  label: string;
  endpoint: string;
  method: "PATCH" | "DELETE";
  body?: Record<string, string>;
};

export default function SecurityRecordActionButton({
  action,
}: {
  action: SecurityRecordAction;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(action.endpoint, {
        method: action.method,
        headers: action.body ? { "Content-Type": "application/json" } : undefined,
        body: action.body ? JSON.stringify(action.body) : undefined,
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Security action failed");
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Security action failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="super-admin-security-action">
      <button className="super-admin-row-action" disabled={pending} onClick={submit} type="button">
        {pending ? "Saving…" : action.label}
      </button>
      {error && <span role="alert">{error}</span>}
    </span>
  );
}
