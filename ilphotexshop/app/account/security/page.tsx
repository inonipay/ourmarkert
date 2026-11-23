import { Suspense } from "react";
import { redirect } from "next/navigation";
import TwoFactorSettings from "@/components/account/two-factor-settings";
import SecurityRecordActionButton from "@/components/super-admin/security-record-action";
import { getAuthenticatedUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { getAccountSecuritySessions } from "@/lib/data-access/super-admin-security";

export const metadata = {
  title: "Account Security | ILPhotoX Shop",
  robots: { index: false, follow: false },
};
const dateFormat = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export default function AccountSecurityPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl px-4 py-10">Loading account security…</main>}>
      <AccountSecurityContent />
    </Suspense>
  );
}

async function AccountSecurityContent() {
  const user = await getAuthenticatedUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent("/account/security")}`);
  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { twoFactorEnabled: true },
  });
  const sessions = await getAccountSecuritySessions(user.id);
  const now = new Date();
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">Account security</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Protect {user.email} with an authenticator app.
        </p>
      </div>
      <TwoFactorSettings enabled={account?.twoFactorEnabled ?? false} />
      <section className="super-admin-panel super-admin-security-settings">
        <h2>Devices &amp; sessions</h2>
        <p>These are your recorded login sessions. Revoking one prevents its next authenticated request.</p>
        <div className="super-admin-records-table-wrap">
          <table className="super-admin-records-table">
            <thead>
              <tr>
                <th scope="col">Device</th>
                <th scope="col">IP address</th>
                <th scope="col">Last seen (UTC)</th>
                <th scope="col">Expires (UTC)</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => {
                const active = !session.isRevoked && session.expiresAt > now;
                return (
                  <tr key={session.id}>
                    <td>{session.deviceName ?? "Unknown device"}</td>
                    <td>{session.ipAddress}</td>
                    <td>{dateFormat.format(session.lastSeenAt)}</td>
                    <td>{dateFormat.format(session.expiresAt)}</td>
                    <td>{active ? "Active" : session.isRevoked ? "Revoked" : "Expired"}</td>
                    <td>
                      {active && (
                        <SecurityRecordActionButton
                          action={{
                            label: "Revoke",
                            endpoint: `/api/security/sessions/${encodeURIComponent(session.id)}`,
                            method: "DELETE",
                          }}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!sessions.length && <p>No sessions have been recorded for this account yet.</p>}
      </section>
    </main>
  );
}
