import { Suspense } from "react";
import SecurityRecordsPage from "@/components/super-admin/security-records-page";
import { getFailedLoginAttempts } from "@/lib/data-access/super-admin-security";
import { parseSecurityPageParams } from "@/lib/security-page-params";

const dateFormat = new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

export default function FailedLoginAttemptsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading failed attempts…</div>}>
      <FailedLoginAttemptsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function FailedLoginAttemptsContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  const { query, page } = await parseSecurityPageParams(searchParams);
  const data = await getFailedLoginAttempts(query, page);
  return (
    <SecurityRecordsPage
      description="Failed credentials, invalid authenticator codes, and blocked sign-in attempts."
      headers={["Email", "Outcome", "Reason", "IP address", "Device", "Time"]}
      href="/super-admin/security/failed-login-attempts"
      page={data.page}
      pageCount={Math.max(1, Math.ceil(data.total / data.pageSize))}
      query={query}
      rows={data.rows.map((row) => ({
        id: row.id,
        cells: [
          row.email,
          row.outcome,
          row.reason ?? "—",
          row.ipAddress,
          row.deviceName ?? "Unknown device",
          dateFormat.format(row.createdAt),
        ],
      }))}
      stats={[{ label: "Failed / blocked attempts", value: data.total }]}
      title="Failed Login Attempts"
      total={data.total}
    />
  );
}
