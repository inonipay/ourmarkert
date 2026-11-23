import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Eye, History, Search, ShieldCheck } from "lucide-react";
import SuperAdminCsvExportButton from "@/components/super-admin/csv-export-button";
import {
  getSuperAdminAuditLog,
  type SuperAdminAuditSource,
} from "@/lib/data-access/super-admin-audit";

export const metadata: Metadata = {
  title: "All audit logs | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

const dateFormat = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});
const numberFormat = new Intl.NumberFormat("en-RW");

type AuditLogSearchParams = {
  q?: string | string[];
  source?: string | string[];
};

export default function SuperAdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<AuditLogSearchParams>;
}) {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading audit logs…</div>}>
      <SuperAdminAuditLogsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SuperAdminAuditLogsContent({
  searchParams,
}: {
  searchParams: Promise<AuditLogSearchParams>;
}) {
  const search = await searchParams;
  const queryValue = Array.isArray(search.q) ? search.q[0] : search.q;
  const sourceValue = Array.isArray(search.source) ? search.source[0] : search.source;
  const query = queryValue?.trim().slice(0, 100) ?? "";
  const source: SuperAdminAuditSource | undefined =
    sourceValue === "role" || sourceValue === "merchant" || sourceValue === "kyc"
      ? sourceValue
      : undefined;
  const data = await getSuperAdminAuditLog(query, source);
  const auditCsvRows = [
    [
      "Module",
      "Actor",
      "Actor email",
      "Affected record",
      "Action",
      "Details",
      "Reason",
      "Time (UTC)",
    ],
    ...data.rows.map((row) => [
      row.module,
      row.actorName,
      row.actorEmail,
      row.subject,
      row.action,
      row.detail,
      row.reason ?? "",
      dateFormat.format(row.createdAt),
    ]),
  ];
  const summaries = [
    { label: "Total audit events", value: data.total },
    { label: "Last 30 days", value: data.recent },
    {
      label: "Role changes",
      value: data.roleChanges,
      href: "/super-admin/security",
    },
    {
      label: "Merchant access",
      value: data.merchantAccess,
      href: "/super-admin/security/merchant-access",
    },
    {
      label: "KYC decisions",
      value: data.kycDecisions,
      href: "/super-admin/security/merchant-kyc",
    },
  ];

  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">Workspace / Security / All audit logs</div>
          <h1>All audit logs</h1>
          <p>Combined history of role, merchant-access, and KYC decisions.</p>
        </div>
        <span className="super-admin-audit-access">
          <ShieldCheck aria-hidden="true" size={17} /> Super-admin only
        </span>
      </div>

      <section aria-label="Audit log summary" className="super-admin-records-summary">
        {summaries.map((summary) => {
          const content = (
            <>
              <span>{summary.label}</span>
              <strong>{numberFormat.format(summary.value)}</strong>
            </>
          );
          return summary.href ? (
            <Link
              className="super-admin-summary-card"
              href={summary.href}
              key={summary.label}
            >
              {content}
            </Link>
          ) : (
            <article className="super-admin-summary-card" key={summary.label}>
              {content}
            </article>
          );
        })}
      </section>

      <section className="super-admin-panel super-admin-audit-panel">
        <div className="super-admin-records-toolbar">
          <div>
            <h2>Recent security activity</h2>
            <p>
              {numberFormat.format(data.filteredTotal)} matching events · latest 200 shown
            </p>
          </div>
          <SuperAdminCsvExportButton
            fileName="audit-events"
            label="Export visible CSV"
            rows={auditCsvRows}
          />
          <form
            action="/super-admin/security/audit-logs"
            className="super-admin-record-search"
            role="search"
          >
            <Search aria-hidden="true" size={17} />
            <input
              aria-label="Search audit events"
              defaultValue={query}
              maxLength={100}
              name="q"
              placeholder="Search events"
              type="search"
            />
            <select
              aria-label="Filter audit events by module"
              defaultValue={source ?? ""}
              name="source"
            >
              <option value="">All modules</option>
              <option value="role">User roles</option>
              <option value="merchant">Merchant access</option>
              <option value="kyc">Merchant KYC</option>
            </select>
            <button type="submit">Filter</button>
          </form>
        </div>
        {data.rows.length ? (
          <div className="super-admin-records-table-wrap">
            <table className="super-admin-records-table">
              <thead>
                <tr>
                  <th scope="col">Module</th>
                  <th scope="col">Actor</th>
                  <th scope="col">Affected record</th>
                  <th scope="col">Action</th>
                  <th scope="col">Reason / details</th>
                  <th scope="col">Time</th>
                  <th scope="col">View</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => {
                  const detailHref =
                    row.source === "role"
                      ? `/super-admin/security/audit/${encodeURIComponent(row.id)}`
                      : row.source === "merchant"
                        ? `/super-admin/security/merchant-access/${encodeURIComponent(row.id)}`
                        : `/super-admin/merchants/kyc/audit/${encodeURIComponent(row.id)}`;
                  return (
                    <tr key={`${row.source}:${row.id}`}>
                      <td>{row.module}</td>
                      <td>
                        <strong>{row.actorName}</strong>
                        <span className="super-admin-audit-secondary">{row.actorEmail}</span>
                      </td>
                      <td>{row.subject}</td>
                      <td>
                        <strong>{row.action}</strong>
                        <span className="super-admin-audit-secondary">{row.detail}</span>
                      </td>
                      <td className="super-admin-audit-reason">{row.reason ?? "—"}</td>
                      <td>{dateFormat.format(row.createdAt)}</td>
                      <td>
                        <Link
                          aria-label={`View ${row.module} audit event`}
                          className="super-admin-view-action"
                          href={detailHref}
                        >
                          <Eye aria-hidden="true" size={15} /> View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="super-admin-records-empty">
            <History aria-hidden="true" size={26} />
            <strong>No audit events recorded</strong>
            <span>Role changes, access actions, and KYC decisions will appear here.</span>
          </div>
        )}
      </section>
    </div>
  );
}
