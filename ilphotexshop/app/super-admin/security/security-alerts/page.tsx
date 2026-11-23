import { Suspense } from "react";
import SecurityRecordsPage from "@/components/super-admin/security-records-page";
import { getSecurityAlerts } from "@/lib/data-access/super-admin-security";
import { parseSecurityPageParams } from "@/lib/security-page-params";

const dateFormat = new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

export default function SecurityAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading security alerts…</div>}>
      <SecurityAlertsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SecurityAlertsContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  const { query, page } = await parseSecurityPageParams(searchParams);
  const data = await getSecurityAlerts(query, page);
  return (
    <SecurityRecordsPage
      description="Repeated failed sign-ins are grouped into deduplicated alerts for investigation."
      headers={["Alert", "Description", "Account", "IP address", "Status", "Created", "Action"]}
      href="/super-admin/security/security-alerts"
      page={data.page}
      pageCount={Math.max(1, Math.ceil(data.total / data.pageSize))}
      query={query}
      rows={data.rows.map((row) => ({
        id: row.id,
        cells: [
          row.title,
          row.description,
          row.user?.name ?? "Unknown account",
          row.ipAddress ?? "—",
          row.status,
          dateFormat.format(row.createdAt),
        ],
        actions: row.status === "open"
          ? [{ label: "Investigate", endpoint: `/api/super-admin/security/alerts/${encodeURIComponent(row.id)}`, method: "PATCH" as const, body: { status: "investigating" } }]
          : row.status === "investigating"
            ? [{ label: "Resolve", endpoint: `/api/super-admin/security/alerts/${encodeURIComponent(row.id)}`, method: "PATCH" as const, body: { status: "resolved" } }]
            : [{ label: "Reopen", endpoint: `/api/super-admin/security/alerts/${encodeURIComponent(row.id)}`, method: "PATCH" as const, body: { status: "open" } }],
      }))}
      stats={[
        { label: "Matching alerts", value: data.total },
        { label: "Open alerts", value: data.open },
      ]}
      title="Security Alerts"
      total={data.total}
    />
  );
}
