import { Suspense } from "react";
import SecurityRecordsPage from "@/components/super-admin/security-records-page";
import { getSecurityDevices } from "@/lib/data-access/super-admin-security";
import { parseSecurityPageParams } from "@/lib/security-page-params";
import type { SecurityRecordAction } from "@/components/super-admin/security-record-action";

const dateFormat = new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

export default function DeviceManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading device records…</div>}>
      <DeviceManagementContent searchParams={searchParams} />
    </Suspense>
  );
}

async function DeviceManagementContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  const { query, page } = await parseSecurityPageParams(searchParams);
  const data = await getSecurityDevices(query, page);
  return (
    <SecurityRecordsPage
      description="Block a device to deny future sign-ins from the same browser user-agent fingerprint."
      headers={["Account", "Device", "Last IP", "Trusted label", "Blocked", "Last seen", "Action"]}
      href="/super-admin/security/device-management"
      page={data.page}
      pageCount={Math.max(1, Math.ceil(data.total / data.pageSize))}
      query={query}
      rows={data.rows.map((row) => {
        const action: SecurityRecordAction = {
          label: row.blocked ? "Unblock" : "Block",
          endpoint: `/api/super-admin/security/devices/${encodeURIComponent(row.id)}`,
          method: "PATCH",
          body: { action: row.blocked ? "unblock" : "block" },
        };
        return {
          id: row.id,
          cells: [
            `${row.user.name ?? "Unknown"} (${row.user.email})`,
            row.deviceName,
            row.lastIpAddress,
            row.trusted ? "Trusted" : "Not trusted",
            row.blocked ? "Blocked" : "Allowed",
            dateFormat.format(row.lastSeenAt),
          ],
          actions: [
            action,
            {
              label: row.trusted ? "Remove trusted label" : "Mark trusted",
              endpoint: `/api/super-admin/security/devices/${encodeURIComponent(row.id)}`,
              method: "PATCH",
              body: { action: row.trusted ? "untrust" : "trust" },
            },
          ],
        };
      })}
      stats={[
        { label: "Matching devices", value: data.total },
        { label: "Trusted labels", value: data.trusted },
        { label: "Blocked", value: data.blocked },
      ]}
      note="Trusted is an administrative label only; blocked devices are enforced during sign-in. Device identity is based on the browser user-agent and is not a hardware identifier."
      title="Device Management"
      total={data.total}
    />
  );
}
