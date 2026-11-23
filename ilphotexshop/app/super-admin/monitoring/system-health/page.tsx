import type { Metadata } from "next";
import { Activity, Database, Server, Zap } from "lucide-react";
import { getSuperAdminSystemHealth } from "@/lib/data-access/super-admin-system-health";

export const metadata: Metadata = {
  title: "System Health | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

const dateFormat = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export default async function SystemHealthPage() {
  const { checkedAt, database, redis } = await getSuperAdminSystemHealth();
  const databaseAvailable = database.status === "connected";
  const redisLabel =
    redis.status === "connected"
      ? "Connected"
      : redis.status === "unavailable"
        ? "Unavailable"
        : "Not configured";
  const redisTone =
    redis.status === "connected"
      ? "is-approved"
      : redis.status === "unavailable"
        ? "is-rejected"
        : "is-pending";

  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">Workspace / System Monitoring / System Health</div>
          <h1>System Health</h1>
          <p>Current application, database, and Redis connectivity.</p>
        </div>
      </div>

      <section aria-label="System status" className="super-admin-records-summary">
        <article className="super-admin-summary-card is-approved">
          <span><Server aria-hidden="true" size={16} /> Application</span>
          <strong>Available</strong>
        </article>
        <article className={`super-admin-summary-card${databaseAvailable ? " is-approved" : " is-rejected"}`}>
          <span><Database aria-hidden="true" size={16} /> PostgreSQL</span>
          <strong>{databaseAvailable ? "Connected" : "Unavailable"}</strong>
        </article>
        <article className={`super-admin-summary-card ${redisTone}`}>
          <span><Zap aria-hidden="true" size={16} /> Redis</span>
          <strong>{redisLabel}</strong>
        </article>
        <article className="super-admin-summary-card">
          <span><Activity aria-hidden="true" size={16} /> Database response</span>
          <strong>{database.latency === null ? "—" : `${database.latency} ms`}</strong>
        </article>
      </section>

      <section className="super-admin-panel super-admin-health-panel">
        <div className="super-admin-panel-heading">
          <div>
            <h2>Connectivity checks</h2>
            <p>PostgreSQL query and Redis ping</p>
          </div>
        </div>
        <dl className="super-admin-health-details">
          <div>
            <dt>Checked at (UTC)</dt>
            <dd>{dateFormat.format(checkedAt)}</dd>
          </div>
          <div>
            <dt>Database status</dt>
            <dd>{databaseAvailable ? "Connection successful" : "Connection failed"}</dd>
          </div>
          {database.serverTime && (
            <div>
              <dt>Database server time (UTC)</dt>
              <dd>{dateFormat.format(database.serverTime)}</dd>
            </div>
          )}
          <div>
            <dt>Redis status</dt>
            <dd>{redisLabel}</dd>
          </div>
          {redis.latency !== null && (
            <div>
              <dt>Redis response</dt>
              <dd>{redis.latency} ms</dd>
            </div>
          )}
        </dl>
        {!databaseAvailable && (
          <p className="super-admin-health-error" role="status">
            PostgreSQL did not respond to the health check. Review server logs for details.
          </p>
        )}
        {redis.status === "unavailable" && (
          <p className="super-admin-health-error" role="status">
            Redis did not respond to the health check. Review server logs for details.
          </p>
        )}
        {redis.status === "not-configured" && (
          <p className="super-admin-health-error" role="status">
            Redis is not configured. Production rate-limited requests will be rejected until it is configured.
          </p>
        )}
      </section>
    </div>
  );
}
