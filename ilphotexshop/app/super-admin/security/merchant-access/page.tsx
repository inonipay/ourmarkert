import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Eye, History, ShieldCheck } from "lucide-react";
import { getSuperAdminMerchantAccessAuditLogs } from "@/lib/data-access/super-admin-merchants";

export const metadata: Metadata = {
  title: "Merchant access audit | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

const dateFormat = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});
const numberFormat = new Intl.NumberFormat("en-RW");

export default function MerchantAccessAuditPage() {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading merchant audit…</div>}>
      <MerchantAccessAuditContent />
    </Suspense>
  );
}

async function MerchantAccessAuditContent() {
  const data = await getSuperAdminMerchantAccessAuditLogs();

  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">Workspace / Security / Merchant access audit</div>
          <h1>Merchant access audit</h1>
          <p>Review merchant suspensions and reactivations.</p>
        </div>
        <span className="super-admin-audit-access">
          <ShieldCheck aria-hidden="true" size={17} /> Super-admin only
        </span>
      </div>

      <section aria-label="Merchant access audit summary" className="super-admin-records-summary">
        <article className="super-admin-summary-card">
          <span>Total access changes</span>
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
                  <th scope="col">Merchant</th>
                  <th scope="col">Action</th>
                  <th scope="col">Reason</th>
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
                      <span
                        className={`super-admin-merchant-access-status${row.action === "suspended" ? " is-suspended" : ""}`}
                      >
                        {row.action}
                      </span>
                    </td>
                    <td className="super-admin-audit-reason">
                      {row.reason ?? "—"}
                    </td>
                    <td>{dateFormat.format(row.createdAt)}</td>
                    <td>
                      <Link
                        aria-label={`View access audit for ${row.targetName}`}
                        className="super-admin-view-action"
                        href={`/super-admin/security/merchant-access/${encodeURIComponent(row.id)}`}
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
            <strong>No merchant access changes recorded</strong>
            <span>Suspensions and reactivations will appear here.</span>
          </div>
        )}
      </section>
    </div>
  );
}
