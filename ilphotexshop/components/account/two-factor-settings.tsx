"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export default function TwoFactorSettings({ enabled }: { enabled: boolean }) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpAuthUrl] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(action: "setup" | "enable" | "disable") {
    setPending(true);
    setMessage("");
    try {
      const body = action === "setup"
        ? { action }
        : action === "enable"
          ? { action, code }
          : { action, code, password };
      const response = await fetch("/api/security/two-factor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json() as {
        error?: string;
        secret?: string;
        otpauthUrl?: string;
        enabled?: boolean;
      };
      if (!response.ok) throw new Error(result.error ?? "Two-factor update failed");
      if (action === "setup") {
        setSecret(result.secret ?? "");
        setOtpAuthUrl(result.otpauthUrl ?? "");
        setMessage("Add this authenticator secret to your app, then enter its current six-digit code to enable two-factor authentication.");
      } else if (action === "enable") {
        setIsEnabled(true);
        setSecret("");
        setOtpAuthUrl("");
        setCode("");
        setMessage("Two-factor authentication is enabled.");
      } else {
        setIsEnabled(false);
        setPassword("");
        setCode("");
        setMessage("Two-factor authentication was disabled. Your sessions were revoked; signing out.");
        await signOut({ callbackUrl: "/login" });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Two-factor update failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="super-admin-panel super-admin-security-settings">
      <h2>Authenticator app</h2>
      <p>
        {isEnabled
          ? "Two-factor authentication is enabled for this account."
          : "Two-factor authentication is not enabled for this account."}
      </p>
      {isEnabled ? (
        <div className="super-admin-security-settings-form">
          <label>
            Current authenticator code
            <input autoComplete="one-time-code" inputMode="numeric" maxLength={6} onChange={(event) => setCode(event.target.value)} pattern="[0-9]{6}" value={code} />
          </label>
          <label>
            Current password
            <input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
          </label>
          <button className="super-admin-row-action is-warning" disabled={pending || code.length !== 6 || !password} onClick={() => submit("disable")} type="button">
            {pending ? "Updating…" : "Disable two-factor"}
          </button>
        </div>
      ) : (
        <>
          <button className="super-admin-primary-action" disabled={pending || Boolean(secret)} onClick={() => submit("setup")} type="button">
            {pending ? "Starting setup…" : "Set up authenticator"}
          </button>
          {secret && (
            <div className="super-admin-security-settings-form">
              <p>Secret: <code>{secret}</code></p>
              <p>Authenticator URI: <code>{otpauthUrl}</code></p>
              <label>
                Six-digit authenticator code
                <input autoComplete="one-time-code" inputMode="numeric" maxLength={6} onChange={(event) => setCode(event.target.value)} pattern="[0-9]{6}" value={code} />
              </label>
              <button className="super-admin-primary-action" disabled={pending || code.length !== 6} onClick={() => submit("enable")} type="button">
                {pending ? "Verifying…" : "Verify and enable"}
              </button>
            </div>
          )}
        </>
      )}
      <p aria-live="polite" role={message && message.includes("failed") ? "alert" : undefined}>{message}</p>
    </section>
  );
}
