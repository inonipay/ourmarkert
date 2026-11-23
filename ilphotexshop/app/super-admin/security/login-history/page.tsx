import { Suspense } from "react";
import SecurityRecordsPage from "@/components/super-admin/security-records-page";
import { getSecurityLoginHistory } from "@/lib/data-access/super-admin-security";
import { parseSecurityPageParams } from "@/lib/security-page-params";

const dateFormat = new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
const numberFormat = new Intl.NumberFormat("en-RW");

export default function LoginHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading login history…</div>}>
      <LoginHistoryContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginHistoryContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  const { query, page } = await parseSecurityPageParams(searchParams);
  const data = await getSecurityLoginHistory(query, page);
  return (
    <SecurityRecordsPage
      description="Recorded successful, failed, and blocked sign-in events."
      headers={["Email", "Account", "Outcome", "Reason", "IP address", "Device", "Time"]}
      href="/super-admin/security/login-history"
      page={data.page}
      pageCount={Math.max(1, Math.ceil(data.total / data.pageSize))}
      query={query}
      rows={data.rows.map((row) => ({
        id: row.id,
        cells: [
          row.email,
          row.user?.name ?? "Unknown account",
          row.outcome,
          row.reason ?? "—",
          row.ipAddress,
          row.deviceName ?? "Unknown device",
          dateFormat.format(row.createdAt),
        ],
      }))}
      stats={[
        { label: "Matching events", value: numberFormat.format(data.total) },
        { label: "Successful", value: numberFormat.format(data.success) },
        { label: "Failed", value: numberFormat.format(data.failed) },
        { label: "Blocked", value: numberFormat.format(data.blocked) },
      ]}
      title="Login History"
      total={data.total}
    />
  );
}
