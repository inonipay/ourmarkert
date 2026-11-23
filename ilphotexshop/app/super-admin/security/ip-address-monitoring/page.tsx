import { Suspense } from "react";
import SecurityRecordsPage from "@/components/super-admin/security-records-page";
import { getIpMonitoring } from "@/lib/data-access/super-admin-security";
import { parseSecurityPageParams } from "@/lib/security-page-params";

const numberFormat = new Intl.NumberFormat("en-RW");
const dateFormat = new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

export default function IpMonitoringPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading IP activity…</div>}>
      <IpMonitoringContent searchParams={searchParams} />
    </Suspense>
  );
}

async function IpMonitoringContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  const { query, page } = await parseSecurityPageParams(searchParams);
  const data = await getIpMonitoring(query, page);
  return (
    <SecurityRecordsPage
      description="IP activity grouped from recorded authentication events."
      headers={["IP address", "Successful sign-ins", "Failed / blocked", "Last seen"]}
      href="/super-admin/security/ip-address-monitoring"
      page={data.page}
      pageCount={Math.max(1, Math.ceil(data.total / data.pageSize))}
      query={query}
      rows={data.rows.map((row) => ({
        id: row.ipAddress,
        cells: [
          row.ipAddress,
          numberFormat.format(row.successCount),
          numberFormat.format(row.failedCount),
          dateFormat.format(row.lastSeenAt),
        ],
      }))}
      stats={[{ label: "IPs in results", value: numberFormat.format(data.total) }]}
      note="Client IP headers are used only when AUTH_TRUST_PROXY_HEADERS=true. Configure this only when requests pass through a trusted proxy; otherwise events are recorded with IP “unknown”."
      title="IP Address Monitoring"
      total={data.total}
    />
  );
}
