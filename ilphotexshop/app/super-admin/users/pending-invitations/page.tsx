import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, MailPlus, Search } from "lucide-react";
import Link from "next/link";
import { CancelStaffInvitation, CreateStaffInvitation } from "@/components/super-admin/staff-invitation-actions";
import { getSuperAdminUserManagement, USER_MANAGEMENT_PAGE_SIZE } from "@/lib/data-access/super-admin-user-management";

export const metadata: Metadata = { title: "Pending Invitations | ILPhotoX Shop", robots: { index: false, follow: false } };
const dateFormat = new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeZone: "UTC" });

export default async function PendingInvitationsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; page?: string | string[] }> }) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim().slice(0, 100);
  const pageValue = Array.isArray(params.page) ? params.page[0] : params.page;
  const parsedPage = Number.parseInt(pageValue ?? "1", 10);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 500) : 1;
  const data = await getSuperAdminUserManagement("pending-invitations", query, page) as {
    rows: { id: string; name: string; email: string; role: string; status: string; expiresAt: Date; createdAt: Date; invitedBy: { name: string } }[];
    total: number; page: number; pageSize: number;
    summary: { pending: number; accepted: number; cancelled: number; expired: number };
  };
  const pageCount = Math.max(1, Math.ceil(data.total / USER_MANAGEMENT_PAGE_SIZE));
  if (page > pageCount) {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    search.set("page", String(pageCount));
    redirect(`/super-admin/users/pending-invitations?${search.toString()}`);
  }
  function pageHref(nextPage: number) {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    search.set("page", String(nextPage));
    return `/super-admin/users/pending-invitations?${search.toString()}`;
  }
  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading"><div><div className="super-admin-breadcrumb">Workspace / User Management / Pending Invitations</div><h1>Pending Invitations</h1><p>Create and track administrator invitations.</p></div><MailPlus aria-hidden="true" size={25} /></div>
      <p className="super-admin-data-note" role="note">Invitations are stored for 7 days. Email delivery is unavailable until an email provider is configured.</p>
      <section aria-label="Invitation summary" className="super-admin-records-summary"><article className="super-admin-summary-card is-active"><span>Pending</span><strong>{data.summary.pending.toLocaleString("en-RW")}</strong></article><article className="super-admin-summary-card"><span>Accepted</span><strong>{data.summary.accepted.toLocaleString("en-RW")}</strong></article><article className="super-admin-summary-card"><span>Cancelled</span><strong>{data.summary.cancelled.toLocaleString("en-RW")}</strong></article><article className="super-admin-summary-card"><span>Expired</span><strong>{data.summary.expired.toLocaleString("en-RW")}</strong></article></section>
      <section className="super-admin-panel super-admin-announcement-create-panel"><div className="super-admin-panel-heading"><div><h2>Create staff invitation</h2><p>Add an admin invite record</p></div></div><CreateStaffInvitation /></section>
      <section className="super-admin-panel super-admin-records-panel">
        <div className="super-admin-records-toolbar"><div><h2>Pending invitations</h2><p>{data.total.toLocaleString("en-RW")} matching invitations</p></div><form action="/super-admin/users/pending-invitations" className="super-admin-record-search" role="search"><Search aria-hidden="true" size={17} /><input aria-label="Search invitations" defaultValue={query} maxLength={100} name="q" placeholder="Search name or email" type="search" /><button type="submit">Search</button></form></div>
        {data.rows.length ? <>
          <div className="super-admin-records-table-wrap"><table className="super-admin-records-table"><thead><tr><th>Invitee</th><th>Role</th><th>Invited by</th><th>Expires</th><th>Created</th><th>Action</th></tr></thead><tbody>{data.rows.map((invitation) => <tr key={invitation.id}><td><strong>{invitation.name}</strong><span className="super-admin-audit-secondary">{invitation.email}</span></td><td>{invitation.role.replace("_", " ")}</td><td>{invitation.invitedBy.name}</td><td>{dateFormat.format(invitation.expiresAt)}</td><td>{dateFormat.format(invitation.createdAt)}</td><td><CancelStaffInvitation invitationId={invitation.id} /></td></tr>)}</tbody></table></div>
          {data.total > data.pageSize && <nav aria-label="Invitation pagination" className="super-admin-pagination"><span>Page {data.page} of {pageCount}</span><div>{data.page > 1 ? <Link className="super-admin-back-action" href={pageHref(data.page - 1)}><ArrowLeft size={15} /> Previous</Link> : <span className="super-admin-page-disabled">Previous</span>} {data.page < pageCount ? <Link className="super-admin-primary-action" href={pageHref(data.page + 1)}>Next <ArrowRight size={15} /></Link> : <span className="super-admin-page-disabled">Next</span>}</div></nav>}
        </> : <div className="super-admin-records-empty"><MailPlus size={26} /><strong>No pending invitations</strong><span>New staff invitations will appear here.</span></div>}
      </section>
    </div>
  );
}
