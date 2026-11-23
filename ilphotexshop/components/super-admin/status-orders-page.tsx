import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, PackageSearch, Search } from "lucide-react";
import { getSuperAdminOrders, SUPER_ADMIN_ORDERS_PAGE_SIZE, type SuperAdminOrderStatus } from "@/lib/data-access/super-admin-orders";

const dateFormat = new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeZone: "UTC" });

export default async function StatusOrdersPage({
  status,
  title,
  searchParams,
}: {
  status: SuperAdminOrderStatus;
  title: string;
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim().slice(0, 100);
  const parsedPage = Number.parseInt(Array.isArray(params.page) ? params.page[0] ?? "1" : params.page ?? "1", 10);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 500) : 1;
  const data = await getSuperAdminOrders(query, status, page);
  const pageCount = Math.max(1, Math.ceil(data.total / SUPER_ADMIN_ORDERS_PAGE_SIZE));
  const statusPath = `/super-admin/orders/${status}-orders`;
  if (page > pageCount) redirect(statusPath);
  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading"><div><div className="super-admin-breadcrumb">Workspace / Order Management / {title}</div><h1>{title}</h1><p>Review orders currently at the {status} stage.</p></div><PackageSearch size={25} /></div>
      <section aria-label={`${title} summary`} className="super-admin-records-summary">
        <article className="super-admin-summary-card is-active"><span>Matching orders</span><strong>{data.total.toLocaleString("en-RW")}</strong></article>
      </section>
      <section className="super-admin-panel super-admin-records-panel">
        <div className="super-admin-records-toolbar"><div><h2>{title} records</h2><p>{data.total.toLocaleString("en-RW")} matching orders</p></div><form action={statusPath} className="super-admin-record-search" role="search"><Search size={17} /><input aria-label={`Search ${title}`} defaultValue={query} name="q" maxLength={100} placeholder="Search order or customer" type="search" /><button type="submit">Search</button></form></div>
        {data.rows.length ? <>
          <div className="super-admin-records-table-wrap"><table className="super-admin-records-table"><thead><tr><th>Order</th><th>Customer</th><th>Subtotal</th><th>Status</th><th>Placed</th><th>Action</th></tr></thead><tbody>{data.rows.map((order) => <tr key={order.id}><td><strong>#{order.id.slice(-8).toUpperCase()}</strong></td><td><strong>{order.deliveryName}</strong><span className="super-admin-audit-secondary">{order.customer.email}</span></td><td>{order.subtotal.toLocaleString("en-RW")} {order.currency.trim()}</td><td><span className={`super-admin-status is-${order.status}`}>{order.status}</span></td><td>{dateFormat.format(order.createdAt)}</td><td><Link className="super-admin-view-action" href={`/super-admin/records/orders/${encodeURIComponent(order.id)}`}><Eye size={15} /> View</Link></td></tr>)}</tbody></table></div>
          {data.total > data.pageSize && <nav aria-label={`${title} pagination`} className="super-admin-pagination"><span>Page {data.page} of {pageCount}</span><div>{data.page > 1 ? <Link className="super-admin-back-action" href={`${statusPath}?page=${data.page - 1}`}><ArrowLeft size={15} /> Previous</Link> : null}{data.page < pageCount ? <Link className="super-admin-primary-action" href={`${statusPath}?page=${data.page + 1}`}>Next <ArrowRight size={15} /></Link> : null}</div></nav>}
        </> : <div className="super-admin-records-empty"><PackageSearch size={26} /><strong>No {status} orders</strong><span>Orders at this stage will appear here.</span></div>}
      </section>
    </div>
  );
}
