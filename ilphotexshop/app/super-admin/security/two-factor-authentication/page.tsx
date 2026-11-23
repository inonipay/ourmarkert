import { Suspense } from "react";
import SecurityRecordsPage from "@/components/super-admin/security-records-page";
import { getSecurityTwoFactorUsers } from "@/lib/data-access/super-admin-security";
import { parseSecurityPageParams } from "@/lib/security-page-params";

export default function TwoFactorAuthenticationPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading two-factor status…</div>}>
      <TwoFactorAuthenticationContent searchParams={searchParams} />
    </Suspense>
  );
}

async function TwoFactorAuthenticationContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  const { query, page } = await parseSecurityPageParams(searchParams);
  const data = await getSecurityTwoFactorUsers(query, page);
  return (
    <SecurityRecordsPage
      description="Account enrollment status. Users enable or disable their own authenticator in account security."
      headers={["Name", "Email", "Role", "Two-factor status"]}
      href="/super-admin/security/two-factor-authentication"
      page={data.page}
      pageCount={Math.max(1, Math.ceil(data.total / data.pageSize))}
      query={query}
      rows={data.rows.map((row) => ({
        id: row.id,
        cells: [
          row.name,
          row.email,
          row.role.replaceAll("_", " "),
          row.twoFactorEnabled ? "Enabled" : "Not enabled",
        ],
      }))}
      stats={[
        { label: "Accounts", value: data.total },
        { label: "Two-factor enabled", value: data.enabled },
      ]}
      note="TOTP secrets are encrypted at rest. Configure SECURITY_TOTP_ENCRYPTION_KEY before users can enroll. Super administrators cannot view or reset a user's authenticator secret."
      title="Two-Factor Authentication"
      total={data.total}
    />
  );
}
