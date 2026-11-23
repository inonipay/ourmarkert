import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Search, Users } from "lucide-react";
import { AddMerchantStaff, SetMerchantStaffStatus } from "@/components/super-admin/merchant-management-actions";
import { getMerchantStaff, getMerchantStaffOptions, MERCHANT_MANAGEMENT_PAGE_SIZE } from "@/lib/data-access/super-admin-merchant-management";

export const metadata: Metadata = { title: "Merchant Staff | ILPhotoX Shop", robots: { index: false, follow: false } };
const dateFormat = new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeZone: "UTC" });

export default async function MerchantStaffPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; page?: string | string[] }> }) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim().slice(0, 100);
  const pageValue = Array.isArray(params.page) ? params.page[0] : params.page;
  const parsedPage = Number.parseInt(pageValue ?? "1", 10);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 500) : 1;
  const [data, options] = await Promise.all([getMerchantStaff(query, page), getMerchantStaffOptions()]);
  const pageCount = Math.max(1, Math.ceil(data.total / MERCHANT_MANAGEMENT_PAGE_SIZE));
  if (page > pageCount) {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    search.set("page", String(pageCount));
    redirect(`/super-admin/merchants/merchant-staff?${search.toString()}`);
  }
  function pageHref(nextPage: number) {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    search.set("page", String(nextPage));
    return `/super-admin/merchants/merchant-staff?${search.toString()}`;
  }
  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading"><div><div className="super-admin-breadcrumb">Workspace / Merchant Management / Merchant Staff</div><h1>Merchant Staff</h1><p>Assign supported users to merchant workspaces.</p></div><Users aria-hidden="true" size={25} /></div>
      <p className="super-admin-data-note" role="note">Merchant staff permissions are assigned here. Existing merchant staff authentication and per-action permissions require separate authorization workflows.</p>
      <section aria-label="Merchant staff summary" className="super-admin-records-summary"><article className="super-admin-summary-card is-active"><span>Active assignments</span><strong>{data.active.toLocaleString("en-RW")}</strong></article><article className="super-admin-summary-card"><span>Inactive assignments</span><strong>{data.inactive.toLocaleString("en-RW")}</strong></article><article className="super-admin-summary-card"><span>Merchant accounts</span><strong>{data.merchants.toLocaleString("en-RW")}</strong></article></section>
      <section className="super-admin-panel super-admin-announcement-create-panel"><div className="super-admin-panel-heading"><div><h2>Add staff assignment</h2><p>Assign an active account to a merchant</p></div></div><AddMerchantStaff merchants={options.merchants} users={options.users} /></section>
      <section className="super-admin-panel super-admin-records-panel">
        <div className="super-admin-records-toolbar"><div><h2>Staff assignments</h2><p>{data.total.toLocaleString("en-RW")} matching assignments</p></div><form action="/super-admin/merchants/merchant-staff" className="super-admin-record-search" role="search"><Search aria-hidden="true" size={17} /><input aria-label="Search merchant staff" defaultValue={query} maxLength={100} name="q" placeholder="Search staff or merchant" type="search" /><button type="submit">Search</button></form></div>
        {data.rows.length ? <>
          <div className="super-admin-records-table-wrap"><table className="super-admin-records-table"><thead><tr><th>Staff</th><th>Merchant</th><th>Role</th><th>Permissions</th><th>Status</th><th>Added</th><th>Action</th></tr></thead><tbody>{data.rows.map((row) => <tr key={row.id}><td><strong>{row.user.name}</strong><span className="super-admin-audit-secondary">{row.user.email}</span></td><td>{row.merchant.name}</td><td>{row.role}</td><td>{[
            row.canManageProducts ? "Products" : null,
            row.canManageOrders ? "Orders" : null,
            row.canManageStaff ? "Staff" : null,
            row.canManageFinancialProfile ? "Finance" : null,
          ].filter(Boolean).join(", ") || "None"}</td><td><span className={`super-admin-status${row.status === "active" ? " is-confirmed" : " is-cancelled"}`}>{row.status}</span></td><td>{dateFormat.format(row.createdAt)}</td><td><SetMerchantStaffStatus id={row.id} status={row.status} /></td></tr>)}</tbody></table></div>
          {data.total > data.pageSize && <nav aria-label="Merchant staff pagination" className="super-admin-pagination"><span>Page {data.page} of {pageCount}</span><div>{data.page > 1 ? <Link className="super-admin-back-action" href={pageHref(data.page - 1)}><ArrowLeft size={15} /> Previous</Link> : <span className="super-admin-page-disabled">Previous</span>} {data.page < pageCount ? <Link className="super-admin-primary-action" href={pageHref(data.page + 1)}>Next <ArrowRight size={15} /></Link> : <span className="super-admin-page-disabled">Next</span>}</div></nav>}
        </> : <div className="super-admin-records-empty"><Users size={26} /><strong>No merchant staff assignments</strong><span>Add the first assignment using the form above.</span></div>}
      </section>
    </div>
  );
}
