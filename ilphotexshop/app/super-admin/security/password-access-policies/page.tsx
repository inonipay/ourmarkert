import { Suspense } from "react";
import Link from "next/link";
import { requireSuperAdminPageUser } from "@/lib/authorization";

export const metadata = {
  title: "Password & Access Policies | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

export default function SecurityPoliciesPage() {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading access policies…</div>}>
      <SecurityPoliciesContent />
    </Suspense>
  );
}

async function SecurityPoliciesContent() {
  await requireSuperAdminPageUser("/super-admin/security/password-access-policies");
  const policies = [
    { name: "Minimum password length", value: "12 characters", source: "Enforced on account registration and password change" },
    { name: "Password maximum", value: "72 bytes", source: "Enforced by credential validation and bcrypt limits" },
    { name: "Session lifetime", value: "8 hours", source: "Enforced by NextAuth and the revocable session registry" },
    { name: "Login rate limits", value: "15 attempts per IP and 5 per email/IP pair per 15 minutes", source: "Requires configured Upstash Redis in production; sign-in fails closed if unavailable" },
    { name: "Inactive / suspended / archived accounts", value: "Sign-in denied", source: "Enforced during credentials authentication and session checks" },
    { name: "Authenticator app", value: "Optional per account", source: "Encrypted TOTP secrets; configure SECURITY_TOTP_ENCRYPTION_KEY before enrollment" },
    { name: "IP header trust", value: process.env.AUTH_TRUST_PROXY_HEADERS === "true" ? "Trusted proxy headers enabled" : "Proxy headers not trusted; IP recorded as unknown", source: "Set AUTH_TRUST_PROXY_HEADERS=true only behind a trusted proxy" },
  ];

  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">Workspace / Security &amp; Audit / Policies</div>
          <h1>Password &amp; Access Policies</h1>
          <p>Effective controls currently enforced by the application.</p>
        </div>
        <Link className="super-admin-back-action" href="/super-admin/security">All audit logs</Link>
      </div>
      <div className="super-admin-data-note" role="note">
        These are the effective application settings; this page does not expose editable values that are not wired into authentication.
      </div>
      <section className="super-admin-panel super-admin-audit-panel">
        <div className="super-admin-records-table-wrap">
          <table className="super-admin-records-table">
            <thead><tr><th scope="col">Policy</th><th scope="col">Effective value</th><th scope="col">Enforcement</th></tr></thead>
            <tbody>{policies.map((policy) => (
              <tr key={policy.name}><td><strong>{policy.name}</strong></td><td>{policy.value}</td><td>{policy.source}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
