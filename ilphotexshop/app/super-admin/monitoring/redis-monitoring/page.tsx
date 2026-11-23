import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Clock3, Database, Zap } from "lucide-react";
import { getSuperAdminRedisMonitoring } from "@/lib/data-access/super-admin-redis-monitoring";

export const metadata: Metadata = {
  title: "Redis Monitoring | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

const dateFormat = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export default async function RedisMonitoringPage() {
  const redis = await getSuperAdminRedisMonitoring();
  const connected = redis.status === "connected";
  const notConfigured = redis.status === "not-configured";
  const statusLabel = connected
    ? "Connected"
    : notConfigured
      ? "Not configured"
      : "Unavailable";

  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">
            Workspace / System Monitoring / Redis Monitoring
          </div>
          <h1>Redis Monitoring</h1>
          <p>Current Upstash Redis connectivity used by application rate limits.</p>
        </div>
        <Zap aria-hidden="true" size={25} />
      </div>

      <section aria-label="Redis status" className="super-admin-records-summary">
        <article className={`super-admin-summary-card${connected ? " is-approved" : notConfigured ? "" : " is-rejected"}`}>
          <span><Database aria-hidden="true" size={16} /> Connection</span>
          <strong>{statusLabel}</strong>
        </article>
        <article className="super-admin-summary-card">
          <span><Activity aria-hidden="true" size={16} /> Ping response</span>
          <strong>{redis.latency === null ? "—" : `${redis.latency} ms`}</strong>
        </article>
        <article className="super-admin-summary-card">
          <span><Clock3 aria-hidden="true" size={16} /> Last checked (UTC)</span>
          <strong>{dateFormat.format(redis.checkedAt)}</strong>
        </article>
      </section>

      <section className="super-admin-panel super-admin-health-panel">
        <div className="super-admin-panel-heading">
          <div>
            <h2>Monitoring details</h2>
            <p>A live ping is performed when this page loads.</p>
          </div>
        </div>
        <dl className="super-admin-health-details">
          <div>
            <dt>Redis status</dt>
            <dd>{statusLabel}</dd>
          </div>
          <div>
            <dt>Rate-limit service</dt>
            <dd>{connected ? "Redis ping succeeded" : notConfigured ? "Configuration required" : "Health check failed"}</dd>
          </div>
          <div>
            <dt>Memory usage</dt>
            <dd>Not collected by this application</dd>
          </div>
          <div>
            <dt>Historical latency</dt>
            <dd>Not stored; only this check is shown</dd>
          </div>
        </dl>

        {redis.status === "unavailable" && (
          <p className="super-admin-health-error" role="status">
            Redis did not respond. Rate-limited operations may fail; review server logs and provider status.
          </p>
        )}
        {notConfigured && (
          <p className="super-admin-health-error" role="status">
            Redis credentials are not configured. Production rate-limited requests fail closed until Redis is configured.
          </p>
        )}
        <p className="super-admin-data-note" role="note">
          Memory and historical performance metrics are not exposed here. See{" "}
          <Link href="/super-admin/monitoring/system-health">System Health</Link>{" "}
          for the combined application and database checks.
        </p>
      </section>
    </div>
  );
}
