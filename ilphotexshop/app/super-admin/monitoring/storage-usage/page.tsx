import type { Metadata } from "next";
import { Database, HardDrive, TableProperties } from "lucide-react";
import { getSuperAdminStorageUsage } from "@/lib/data-access/super-admin-storage-usage";

export const metadata: Metadata = {
  title: "Storage Usage | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

const dateFormat = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function formatBytes(bytes: bigint) {
  if (bytes < BigInt(1024)) return `${bytes.toString()} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = Number(bytes);
  let unitIndex = -1;
  do {
    value /= 1024;
    unitIndex++;
  } while (value >= 1024 && unitIndex < units.length - 1);
  return `${new Intl.NumberFormat("en-RW", {
    maximumFractionDigits: 2,
  }).format(value)} ${units[unitIndex]}`;
}

export default async function StorageUsagePage() {
  const usage = await getSuperAdminStorageUsage();
  const available = usage.status === "available";
  const largestRelation = usage.relations[0];

  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">
            Workspace / System Monitoring / Storage Usage
          </div>
          <h1>Storage Usage</h1>
          <p>PostgreSQL database size and largest public relations.</p>
        </div>
        <HardDrive aria-hidden="true" size={25} />
      </div>

      <section aria-label="Database storage summary" className="super-admin-records-summary">
        <article className={`super-admin-summary-card${available ? " is-approved" : " is-rejected"}`}>
          <span><Database aria-hidden="true" size={16} /> Database size</span>
          <strong>{usage.databaseBytes === null ? "Unavailable" : formatBytes(BigInt(usage.databaseBytes))}</strong>
        </article>
        <article className="super-admin-summary-card">
          <span><TableProperties aria-hidden="true" size={16} /> Public tables</span>
          <strong>{usage.publicTableCount?.toLocaleString("en-RW") ?? "—"}</strong>
        </article>
        <article className="super-admin-summary-card">
          <span><HardDrive aria-hidden="true" size={16} /> Largest relation</span>
          <strong>{largestRelation ? formatBytes(BigInt(largestRelation.sizeBytes)) : "—"}</strong>
        </article>
      </section>

      {!available ? (
        <p className="super-admin-health-error" role="status">
          PostgreSQL storage information is unavailable. Review server logs for details.
        </p>
      ) : (
        <>
          <section className="super-admin-panel super-admin-health-panel">
            <div className="super-admin-panel-heading">
              <div>
                <h2>Largest database relations</h2>
                <p>Top {usage.relations.length} public tables by allocated relation size</p>
              </div>
            </div>
            {usage.relations.length ? (
              <div className="super-admin-records-table-wrap">
                <table className="super-admin-records-table">
                  <thead>
                    <tr>
                      <th scope="col">Table</th>
                      <th scope="col">Allocated size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usage.relations.map((relation) => (
                      <tr key={relation.name}>
                        <td><code>{relation.name}</code></td>
                        <td>{formatBytes(BigInt(relation.sizeBytes))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="super-admin-records-empty">
                <Database aria-hidden="true" size={24} />
                <strong>No public tables found</strong>
              </div>
            )}
            <p className="super-admin-data-note" role="note">
              Checked at {dateFormat.format(usage.checkedAt)} (UTC). Relation size
              includes table data, indexes, and associated TOAST data. This does
              not include external object storage or provider-level file usage.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
