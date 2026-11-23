import { Suspense } from "react";
import Link from "next/link";
import { getSecurityReport } from "@/lib/data-access/super-admin-security";

const numberFormat = new Intl.NumberFormat("en-RW");
const dateFormat = new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeZone: "UTC" });

export default function SecurityReportsPage() {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading security report…</div>}>
      <SecurityReportsContent />
    </Suspense>
  );
}

async function SecurityReportsContent() {
  const report = await getSecurityReport();
  const stats = [
    ["Login events, 30 days", report.total],
    ["Successful sign-ins", report.success],
    ["Failed sign-ins", report.failed],
    ["Blocked sign-ins", report.blocked],
    ["Open / investigating alerts", report.openAlerts],
    ["Active sessions", report.activeSessions],
    ["Accounts with 2FA", report.twoFactorEnabled],
    ["Active accounts", report.totalUsers],
  ] as const;
  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">Workspace / Security &amp; Audit / Reports</div>
          <h1>Security Reports</h1>
          <p>Operational counts from persisted authentication, alert, session, and account data.</p>
        </div>
        <Link className="super-admin-back-action" href="/super-admin/security">All audit logs</Link>
      </div>
      <div className="super-admin-data-note" role="note">
        Sign-in counts cover {dateFormat.format(report.since)} through now. They are event counts, not unique users or a threat score.
      </div>
      <section aria-label="Security report metrics" className="super-admin-records-summary">
        {stats.map(([label, value]) => (
          <article className="super-admin-summary-card" key={label}>
            <span>{label}</span>
            <strong>{numberFormat.format(value)}</strong>
          </article>
        ))}
      </section>
    </div>
  );
}
