"use client";

import { useState, type FormEvent } from "react";

export default function StaffInvitationAcceptanceForm({
  name,
  token,
}: {
  name: string;
  token: string;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/staff-invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) throw new Error(body?.error || "Invitation could not be accepted");
      setMessage("Invitation accepted. You can now sign in.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Invitation could not be accepted");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label>
        Staff name
        <input disabled value={name} />
      </label>
      <label>
        Password
        <input
          autoComplete="new-password"
          minLength={10}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      <label>
        Confirm password
        <input
          autoComplete="new-password"
          minLength={10}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          type="password"
          value={confirmPassword}
        />
      </label>
      <button className="auth-primary-button" disabled={busy} type="submit">
        {busy ? "Creating account…" : "Accept invitation"}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
