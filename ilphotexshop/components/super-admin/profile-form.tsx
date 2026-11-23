"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type ProfileUpdateResponse = {
  error?: string;
  details?: { fieldErrors?: Record<string, string[]> };
};

export default function SuperAdminProfileForm({
  name,
  phone,
}: {
  name: string;
  phone: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    const formData = new FormData(event.currentTarget);
    const body = {
      name: String(formData.get("name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
    };

    try {
      const response = await fetch("/api/super-admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json().catch(() => null)) as
        | ProfileUpdateResponse
        | null;

      if (!response.ok) {
        const detail = Object.values(result?.details?.fieldErrors ?? {})
          .flat()
          .find(Boolean);
        throw new Error(detail || result?.error || "Profile could not be updated.");
      }

      setNotice("Profile updated.");
      router.refresh();
    } catch (caught) {
      console.error("Could not update Super Admin profile", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "Profile could not be updated.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="super-admin-profile-form" onSubmit={handleSubmit}>
      <div className="super-admin-profile-form-grid">
        <div className="super-admin-profile-field">
          <label htmlFor="super-admin-profile-name">Full name</label>
          <input
            autoComplete="name"
            defaultValue={name}
            id="super-admin-profile-name"
            maxLength={100}
            minLength={2}
            name="name"
            required
          />
        </div>
        <div className="super-admin-profile-field">
          <label htmlFor="super-admin-profile-phone">Phone number</label>
          <input
            autoComplete="tel"
            defaultValue={phone ?? ""}
            id="super-admin-profile-phone"
            maxLength={32}
            name="phone"
            pattern="^\+?[0-9][0-9 ()-]*$"
            type="tel"
          />
        </div>
      </div>
      <div className="super-admin-profile-form-footer">
        <div aria-live="polite">
          {error && <p className="is-error">{error}</p>}
          {notice && <p className="is-success">{notice}</p>}
        </div>
        <button className="super-admin-primary-action" disabled={busy} type="submit">
          {busy ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}
