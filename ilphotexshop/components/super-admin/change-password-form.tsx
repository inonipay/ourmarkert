"use client";

import { useState, type FormEvent } from "react";

type PasswordUpdateResponse = {
  error?: string;
  details?: { fieldErrors?: Record<string, string[]> };
};

export default function SuperAdminChangePasswordForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setError("");
    setNotice("");

    const formData = new FormData(form);
    const body = {
      currentPassword: String(formData.get("currentPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    };

    try {
      const response = await fetch("/api/super-admin/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json().catch(() => null)) as
        | PasswordUpdateResponse
        | null;

      if (!response.ok) {
        const detail = Object.values(result?.details?.fieldErrors ?? {})
          .flat()
          .find(Boolean);
        throw new Error(detail || result?.error || "Password could not be updated.");
      }

      form.reset();
      setNotice("Password updated successfully.");
    } catch (caught) {
      console.error("Could not update Super Admin password", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "Password could not be updated.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="super-admin-profile-form" onSubmit={handleSubmit}>
      <div className="super-admin-profile-form-grid">
        <div className="super-admin-profile-field">
          <label htmlFor="super-admin-current-password">Current password</label>
          <input
            autoComplete="current-password"
            id="super-admin-current-password"
            maxLength={72}
            name="currentPassword"
            required
            type="password"
          />
        </div>
        <div className="super-admin-profile-field">
          <label htmlFor="super-admin-new-password">New password</label>
          <input
            autoComplete="new-password"
            id="super-admin-new-password"
            maxLength={72}
            minLength={12}
            name="newPassword"
            required
            type="password"
          />
        </div>
        <div className="super-admin-profile-field">
          <label htmlFor="super-admin-confirm-password">Confirm new password</label>
          <input
            autoComplete="new-password"
            id="super-admin-confirm-password"
            maxLength={72}
            minLength={12}
            name="confirmPassword"
            required
            type="password"
          />
        </div>
      </div>
      <p className="super-admin-password-hint">
        Use a password with at least 12 characters.
      </p>
      <div className="super-admin-profile-form-footer">
        <div aria-live="polite">
          {error && <p className="is-error">{error}</p>}
          {notice && <p className="is-success">{notice}</p>}
        </div>
        <button className="super-admin-primary-action" disabled={busy} type="submit">
          {busy ? "Updating…" : "Update password"}
        </button>
      </div>
    </form>
  );
}
