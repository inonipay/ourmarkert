import type { Metadata } from "next";
import { Database } from "lucide-react";
import { getSuperAdminDatabaseMonitoring } from "@/lib/data-access/super-admin-database-monitoring";

export const metadata: Metadata = {
  title: "Database Monitoring | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

const dateFormat = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

const numberFormat = new Intl.NumberFormat("en-RW");

function formatBytes(value: string | null) {
  if (value === null) return "—";
  let bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  while (bytes >= 1024 && unitIndex < units.length - 1) {
    bytes /= 1024;
    unitIndex += 1;
  }
  return `${bytes.toFixed(unitIndex === 0 || bytes >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export default async function SuperAdminDatabaseMonitoringPage() {
  const data = await getSuperAdminDatabaseMonitoring();
  const connected = data.status === "connected";
  const metrics = [
    { label: "PostgreSQL", value: connected ? "Connected" : "Unavailable" },
    {
      label: "Response time",
      value: data.latencyMs === null ? "—" : `${data.latencyMs} ms`,
    },
    { label: "Database size", value: formatBytes(data.databaseSizeBytes) },
    { label: "Server version", value: data.serverVersion ?? "—" },
  ];
  const recordCounts: { label: string; count: number }[] = data.recordCounts
    ? [
        { label: "Users", count: data.recordCounts.users },
        { label: "Products", count: data.recordCounts.products },
        { label: "Orders", count: data.recordCounts.orders },
        { label: "Payment proofs", count: data.recordCounts.paymentProofs },
      ]
    : [];

  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">
            Workspace / System Monitoring / Database Monitoring
          </div>
          <h1>Database monitoring</h1>
          <p>Read-only PostgreSQL connection and storage snapshot.</p>
        </div>
        <Database aria-hidden="true" size={25} />
      </div>

      <div className="super-admin-data-note" role="note">
        This page reports a live snapshot only. Slow-query history and connection-pool metrics are not currently collected.
      </div>

      <section aria-label="Database status" className="super-admin-records-summary">
        {metrics.map((metric, index) => (
          <article
            className={`super-admin-summary-card${index === 0 ? connected ? " is-approved" : " is-rejected" : ""}`}
            key={metric.label}
          >
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      <section className="super-admin-panel super-admin-database-monitoring-panel">
        <div className="super-admin-panel-heading">
          <div>
            <h2>Database record counts</h2>
            <p>Snapshot checked {dateFormat.format(data.checkedAt)} UTC</p>
          </div>
        </div>
        {data.status === "connected" ? (
          <dl className="super-admin-health-details">
            {recordCounts.map(({ label, count }) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{numberFormat.format(count)}</dd>
              </div>
            ))}
            {data.serverTime && (
              <div>
                <dt>Database server time (UTC)</dt>
                <dd>{dateFormat.format(data.serverTime)}</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="super-admin-health-error" role="status">
            PostgreSQL did not respond. Counts and size are unavailable; review server logs for details.
          </p>
        )}
      </section>
    </div>
  );
}
