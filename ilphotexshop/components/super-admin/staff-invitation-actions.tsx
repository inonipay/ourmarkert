"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function CreateStaffInvitation() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [acceptUrl, setAcceptUrl] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/super-admin/users/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role: "admin" }),
      });
      const body = (await response.json().catch(() => null)) as
        | { error?: string; acceptUrl?: string }
        | null;
      if (!response.ok) throw new Error(body?.error || "Invitation could not be created");
      setName("");
      setEmail("");
      setAcceptUrl(body?.acceptUrl ?? "");
      setMessage("Invitation created. Copy the secure link below.");
      router.refresh();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Invitation could not be created");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="super-admin-announcement-form-grid" onSubmit={submit}>
      <label>
        Staff name
        <input
          maxLength={100}
          minLength={2}
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
      </label>
      <label>
        Email
        <input
          maxLength={254}
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>
      <div className="super-admin-confirm-actions">
        <button className="super-admin-primary-action" disabled={busy} type="submit">
          {busy ? "Creating…" : "Create invitation"}
        </button>
        {message && <span className="super-admin-row-action-error">{message}</span>}
          {acceptUrl && (
            <input
              aria-label="Staff invitation link"
              onFocus={(event) => event.currentTarget.select()}
              readOnly
              value={acceptUrl}
            />
          )}
      </div>
    </form>
  );
}

export function CancelStaffInvitation({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function cancel() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/super-admin/users/invitations/${encodeURIComponent(invitationId)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error || "Invitation could not be cancelled");
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invitation could not be cancelled");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="super-admin-featured-product-action">
      <button
        className="super-admin-row-action is-danger"
        disabled={busy}
        onClick={cancel}
        type="button"
      >
        {busy ? "Cancelling…" : "Cancel"}
      </button>
      {error && <span>{error}</span>}
    </span>
  );
}
