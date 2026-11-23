import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, PauseCircle, Search } from "lucide-react";
import SuperAdminUserStateAction from "@/components/super-admin/user-state-action";
import { getSuperAdminUserManagement, USER_MANAGEMENT_PAGE_SIZE } from "@/lib/data-access/super-admin-user-management";

export const metadata: Metadata = { title: "Inactive Users | ILPhotoX Shop", robots: { index: false, follow: false } };
const dateFormat = new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeZone: "UTC" });

export default async function InactiveUsersPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; page?: string | string[] }> }) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim().slice(0, 100);
  const pageValue = Array.isArray(params.page) ? params.page[0] : params.page;
  const parsedPage = Number.parseInt(pageValue ?? "1", 10);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 500) : 1;
  const data = await getSuperAdminUserManagement("inactive-users", query, page) as {
    rows: { id: string; name: string; email: string; phone: string | null; role: string; isActive: boolean; archivedAt: Date | null; lastLoginAt: Date | null; isSuspended: boolean; isAnonymized: boolean; createdAt: Date }[];
    total: number; page: number; pageSize: number;
    summary: { staffCount: number; inactiveCount: number; archivedCount: number };
  };
  const pageCount = Math.max(1, Math.ceil(data.total / USER_MANAGEMENT_PAGE_SIZE));
  if (page > pageCount) {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    search.set("page", String(pageCount));
    redirect(`/super-admin/users/inactive-users?${search.toString()}`);
  }
  function pageHref(nextPage: number) {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    search.set("page", String(nextPage));
    return `/super-admin/users/inactive-users?${search.toString()}`;
  }
  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading"><div><div className="super-admin-breadcrumb">Workspace / User Management / Inactive Users</div><h1>Inactive Users</h1><p>Accounts suspended from sign-in without being archived.</p></div><PauseCircle aria-hidden="true" size={25} /></div>
      <section aria-label="Inactive summary" className="super-admin-records-summary"><article className="super-admin-summary-card is-active"><span>Inactive accounts</span><strong>{data.summary.inactiveCount.toLocaleString("en-RW")}</strong></article><Link className="super-admin-summary-card" href="/super-admin/users/archived-users"><span>Archived accounts</span><strong>{data.summary.archivedCount.toLocaleString("en-RW")}</strong></Link></section>
      <section className="super-admin-panel super-admin-records-panel">
        <div className="super-admin-records-toolbar"><div><h2>Inactive accounts</h2><p>{data.total.toLocaleString("en-RW")} matching accounts</p></div><form action="/super-admin/users/inactive-users" className="super-admin-record-search" role="search"><Search aria-hidden="true" size={17} /><input aria-label="Search inactive users" defaultValue={query} maxLength={100} name="q" placeholder="Search name, email, or phone" type="search" /><button type="submit">Search</button></form></div>
        {data.rows.length ? <>
          <div className="super-admin-records-table-wrap"><table className="super-admin-records-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Last login</th><th>Registered</th><th>Actions</th></tr></thead><tbody>{data.rows.map((user) => <tr key={user.id}><td><strong>{user.name}</strong></td><td>{user.email}</td><td>{user.role.replace("_", " ")}</td><td>{user.lastLoginAt ? dateFormat.format(user.lastLoginAt) : "Not recorded"}</td><td>{dateFormat.format(user.createdAt)}</td><td><div className="super-admin-table-actions"><Link className="super-admin-view-action" href={`/super-admin/records/users/${encodeURIComponent(user.id)}`}><Eye size={15} /> View</Link><SuperAdminUserStateAction action="activate" label="Activate" userId={user.id} /><SuperAdminUserStateAction action="archive" label="Archive" userId={user.id} /></div></td></tr>)}</tbody></table></div>
          {data.total > data.pageSize && <nav aria-label="Inactive user pagination" className="super-admin-pagination"><span>Page {data.page} of {pageCount}</span><div>{data.page > 1 ? <Link className="super-admin-back-action" href={pageHref(data.page - 1)}><ArrowLeft size={15} /> Previous</Link> : <span className="super-admin-page-disabled">Previous</span>} {data.page < pageCount ? <Link className="super-admin-primary-action" href={pageHref(data.page + 1)}>Next <ArrowRight size={15} /></Link> : <span className="super-admin-page-disabled">Next</span>}</div></nav>}
        </> : <div className="super-admin-records-empty"><PauseCircle size={26} /><strong>No inactive users</strong><span>Inactive account records will appear here.</span></div>}
      </section>
    </div>
  );
}
