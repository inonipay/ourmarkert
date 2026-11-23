"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type ProfileFormProps = {
  name: string;
  phone: string | null;
};

type ProfileUpdateResponse = {
  error?: string;
  details?: { fieldErrors?: Record<string, string[]> };
};

export default function MerchantProfileForm({
  name,
  phone,
}: ProfileFormProps) {
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
      const response = await fetch("/api/seller/profile", {
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
      console.error("Could not update seller profile", caught);
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
    <form
      className="merchant-product-form merchant-profile-form"
      onSubmit={handleSubmit}
    >
      <div className="merchant-form-grid">
        <div className="merchant-form-field">
          <label htmlFor="merchant-profile-name">Full name</label>
          <input
            autoComplete="name"
            defaultValue={name}
            id="merchant-profile-name"
            maxLength={100}
            minLength={2}
            name="name"
            required
          />
        </div>
        <div className="merchant-form-field">
          <label htmlFor="merchant-profile-phone">Phone number</label>
          <input
            autoComplete="tel"
            defaultValue={phone ?? ""}
            id="merchant-profile-phone"
            maxLength={32}
            name="phone"
            pattern="^\+?[0-9][0-9 ()-]*$"
            type="tel"
          />
        </div>
      </div>
      <div className="merchant-form-footer">
        {error && (
          <p aria-live="polite" className="merchant-form-error">
            {error}
          </p>
        )}
        {notice && (
          <p aria-live="polite" className="merchant-form-success">
            {notice}
          </p>
        )}
        <button
          className="merchant-primary-action"
          disabled={busy}
          type="submit"
        >
          {busy ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}
