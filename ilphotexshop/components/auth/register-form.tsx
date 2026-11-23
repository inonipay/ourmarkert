"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type RegistrationResponse = {
  error?: string;
  message?: string;
};

export default function RegisterForm() {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      const result = (await response.json()) as RegistrationResponse;

      if (!response.ok) {
        setMessage(result.error ?? "Registration could not be completed.");
        return;
      }

      setMessage(result.message ?? "You can now sign in.");
      form.reset();
    } catch {
      setMessage("Registration is temporarily unavailable. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-lg sm:p-9">
        <Link className="text-sm font-semibold text-[var(--primary)]" href="/">
          ILPhotoX Shop
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-[var(--text-primary)]">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Register as a customer to get started.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Name</span>
            <input
              autoComplete="name"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[var(--text-primary)]"
              maxLength={100}
              minLength={2}
              name="name"
              required
            />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Email</span>
            <input
              autoComplete="email"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[var(--text-primary)]"
              maxLength={254}
              name="email"
              required
              type="email"
            />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Password</span>
            <input
              autoComplete="new-password"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[var(--text-primary)]"
              maxLength={72}
              minLength={12}
              name="password"
              required
              type="password"
            />
            <span className="block text-xs font-normal text-[var(--text-secondary)]">
              Use at least 12 characters.
            </span>
          </label>

          <button
            className="button button-primary w-full"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
          <p aria-live="polite" className="min-h-5 text-sm text-[var(--text-secondary)]">
            {message}
          </p>
        </form>

        <p className="mt-3 text-center text-sm text-[var(--text-secondary)]">
          Already registered?{" "}
          <Link className="font-semibold text-[var(--primary)]" href="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
