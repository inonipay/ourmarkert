import { Suspense } from "react";
import SecurityRecordsPage from "@/components/super-admin/security-records-page";
import { getSecuritySessions } from "@/lib/data-access/super-admin-security";
import { parseSecurityPageParams } from "@/lib/security-page-params";

const dateFormat = new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

export default function ActiveSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading sessions…</div>}>
      <ActiveSessionsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ActiveSessionsContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  const { query, page } = await parseSecurityPageParams(searchParams);
  const data = await getSecuritySessions(query, page);
  const now = new Date();
  return (
    <SecurityRecordsPage
      description="JWT-backed sessions. Revoking a session invalidates its next authenticated request."
      headers={["Account", "IP address", "Device", "Last seen", "Expires", "Status", "Action"]}
      href="/super-admin/security/active-sessions"
      page={data.page}
      pageCount={Math.max(1, Math.ceil(data.total / data.pageSize))}
      query={query}
      rows={data.rows.map((row) => {
        const active = !row.isRevoked && row.expiresAt > now;
        return {
          id: row.id,
          cells: [
            `${row.user.name ?? "Unknown"} (${row.user.email})`,
            row.ipAddress,
            row.deviceName ?? "Unknown device",
            dateFormat.format(row.lastSeenAt),
            dateFormat.format(row.expiresAt),
            active ? "Active" : row.isRevoked ? "Revoked" : "Expired",
          ],
          actions: active ? [{
            label: "Revoke",
            endpoint: `/api/super-admin/security/sessions/${encodeURIComponent(row.id)}`,
            method: "DELETE" as const,
          }] : [],
        };
      })}
      stats={[
        { label: "Matching sessions", value: data.total },
        { label: "Active sessions", value: data.active },
      ]}
      title="Active Sessions"
      total={data.total}
    />
  );
}
