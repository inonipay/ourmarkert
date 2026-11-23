import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Eye, History, ShieldCheck } from "lucide-react";
import { getSuperAdminRoleAuditLogs } from "@/lib/data-access/super-admin-users";

export const metadata: Metadata = {
  title: "Role audit log | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

const dateFormat = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});
const numberFormat = new Intl.NumberFormat("en-RW");

export default function SuperAdminSecurityPage() {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading audit log…</div>}>
      <SuperAdminSecurityContent />
    </Suspense>
  );
}

async function SuperAdminSecurityContent() {
  const data = await getSuperAdminRoleAuditLogs();

  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">Workspace / Security / Audit logs</div>
          <h1>Role change audit</h1>
          <p>Review role changes made by super administrators.</p>
        </div>
        <span className="super-admin-audit-access">
          <ShieldCheck aria-hidden="true" size={17} /> Super-admin only
        </span>
      </div>

      <section aria-label="Role audit summary" className="super-admin-records-summary">
        <article className="super-admin-summary-card">
          <span>Total role changes</span>
          <strong>{numberFormat.format(data.total)}</strong>
        </article>
        <article className="super-admin-summary-card">
          <span>Last 30 days</span>
          <strong>{numberFormat.format(data.recent)}</strong>
        </article>
      </section>

      <section className="super-admin-panel super-admin-audit-panel">
        <div className="super-admin-records-toolbar">
          <div>
            <h2>Recent changes</h2>
            <p>Up to 100 latest events · timestamps shown in UTC</p>
          </div>
        </div>
        {data.rows.length ? (
          <div className="super-admin-records-table-wrap">
            <table className="super-admin-records-table">
              <thead>
                <tr>
                  <th scope="col">Changed by</th>
                  <th scope="col">Account</th>
                  <th scope="col">Role change</th>
                  <th scope="col">Time</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.actorName}</strong>
                      <span className="super-admin-audit-secondary">{row.actorEmail}</span>
                    </td>
                    <td>
                      <strong>{row.targetName}</strong>
                      <span className="super-admin-audit-secondary">{row.targetEmail}</span>
                    </td>
                    <td>
                      <span className="super-admin-audit-role">
                        {row.previousRole.replace("_", " ")}
                        <ArrowUpRight aria-hidden="true" size={14} />
                        {row.newRole.replace("_", " ")}
                      </span>
                    </td>
                    <td>{dateFormat.format(row.createdAt)}</td>
                    <td>
                      <Link
                        aria-label={`View role change for ${row.targetName}`}
                        className="super-admin-view-action"
                        href={`/super-admin/security/audit/${encodeURIComponent(row.id)}`}
                      >
                        <Eye aria-hidden="true" size={15} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="super-admin-records-empty">
            <History aria-hidden="true" size={26} />
            <strong>No role changes recorded</strong>
            <span>Changes made through the super-admin workspace will be listed here.</span>
          </div>
        )}
      </section>
    </div>
  );
}
