import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, PackageSearch, Search } from "lucide-react";
import {
  getSuperAdminOrders,
  SUPER_ADMIN_ORDERS_PAGE_SIZE,
  type SuperAdminOrderStatus,
} from "@/lib/data-access/super-admin-orders";

export const metadata: Metadata = {
  title: "All Orders | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

const dateFormat = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "medium",
  timeZone: "UTC",
});
const numberFormat = new Intl.NumberFormat("en-RW");
const statusLabels: Record<SuperAdminOrderStatus, string> = {
  all: "All",
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusClass(status: string) {
  return status.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export default async function AllOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    page?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "")
    .trim()
    .slice(0, 100);
  const statusValue = Array.isArray(params.status)
    ? params.status[0]
    : params.status;
  const status: SuperAdminOrderStatus =
    statusValue && statusValue in statusLabels
      ? (statusValue as SuperAdminOrderStatus)
      : "all";
  const pageValue = Array.isArray(params.page) ? params.page[0] : params.page;
  const parsedPage = Number.parseInt(pageValue ?? "1", 10);
  const page =
    Number.isSafeInteger(parsedPage) && parsedPage > 0
      ? Math.min(parsedPage, 500)
      : 1;
  const data = await getSuperAdminOrders(query, status, page);
  const pageCount = Math.max(
    1,
    Math.ceil(data.total / SUPER_ADMIN_ORDERS_PAGE_SIZE),
  );

  if (page > pageCount) {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (status !== "all") search.set("status", status);
    search.set("page", String(pageCount));
    redirect(`/super-admin/orders?${search.toString()}`);
  }

  function pageHref(nextPage: number) {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (status !== "all") search.set("status", status);
    search.set("page", String(nextPage));
    return `/super-admin/orders?${search.toString()}`;
  }

  const summaryCards = [
    ["All orders", data.summary.totalOrders, "all"],
    ["Pending", data.summary.pendingOrders, "pending"],
    ["Confirmed", data.summary.confirmedOrders, "confirmed"],
    ["Fulfilled", data.summary.fulfilledOrders, "fulfilled"],
    ["Cancelled", data.summary.cancelledOrders, "cancelled"],
  ] as const;

  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">
            Workspace / Order Management / All Orders
          </div>
          <h1>All Orders</h1>
          <p>Review marketplace orders and open complete order records.</p>
        </div>
        <PackageSearch aria-hidden="true" size={25} />
      </div>

      <section aria-label="Order status summary" className="super-admin-records-summary">
        {summaryCards.map(([label, count, filter]) => (
          <Link
            className={`super-admin-summary-card${status === filter ? " is-active" : ""}`}
            href={
              filter === "all"
                ? "/super-admin/orders"
                : `/super-admin/orders?status=${filter}`
            }
            key={label}
          >
            <span>{label}</span>
            <strong>{numberFormat.format(count)}</strong>
          </Link>
        ))}
      </section>

      <section className="super-admin-panel super-admin-records-panel">
        <div className="super-admin-records-toolbar">
          <div>
            <h2>Order records</h2>
            <p>
              {numberFormat.format(data.total)} matching orders · page {data.page} of {pageCount}
            </p>
          </div>
          <form
            action="/super-admin/orders"
            className="super-admin-record-search"
            role="search"
          >
            {status !== "all" && (
              <input name="status" type="hidden" value={status} />
            )}
            <Search aria-hidden="true" size={17} />
            <input
              aria-label="Search orders"
              defaultValue={query}
              maxLength={100}
              name="q"
              placeholder="Search order, customer, or phone"
              type="search"
            />
            <button type="submit">Search</button>
          </form>
        </div>

        {data.rows.length ? (
          <>
            <div className="super-admin-records-table-wrap">
              <table className="super-admin-records-table">
                <thead>
                  <tr>
                    <th scope="col">Order</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Items</th>
                    <th scope="col">Subtotal</th>
                    <th scope="col">Status</th>
                    <th scope="col">Placed</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>#{order.id.slice(-8).toUpperCase()}</strong>
                        <span className="super-admin-audit-secondary">
                          {order.items.length} seller line
                          {order.items.length === 1 ? "" : "s"}
                        </span>
                      </td>
                      <td>
                        <strong>{order.deliveryName}</strong>
                        <span className="super-admin-audit-secondary">
                          {order.customer.email}
                        </span>
                      </td>
                      <td>{numberFormat.format(order.items.reduce((sum, item) => sum + item.quantity, 0))}</td>
                      <td>{formatCurrency(order.subtotal, order.currency)}</td>
                      <td>
                        <span className={`super-admin-status is-${statusClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>{dateFormat.format(order.createdAt)}</td>
                      <td>
                        <Link
                          aria-label={`View order ${order.id}`}
                          className="super-admin-view-action"
                          href={`/super-admin/records/orders/${encodeURIComponent(order.id)}`}
                        >
                          <Eye aria-hidden="true" size={15} /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.total > data.pageSize && (
              <nav aria-label="Order pagination" className="super-admin-pagination">
                <span>
                  Showing {(data.page - 1) * data.pageSize + 1}–
                  {Math.min(data.page * data.pageSize, data.total)} of {data.total}
                  <strong>Page {data.page} of {pageCount}</strong>
                </span>
                <div>
                  {data.page > 1 ? (
                    <Link className="super-admin-back-action" href={pageHref(data.page - 1)}>
                      <ArrowLeft size={15} /> Previous
                    </Link>
                  ) : (
                    <span className="super-admin-page-disabled">Previous</span>
                  )}
                  {data.page < pageCount ? (
                    <Link className="super-admin-primary-action" href={pageHref(data.page + 1)}>
                      Next <ArrowRight size={15} />
                    </Link>
                  ) : (
                    <span className="super-admin-page-disabled">Next</span>
                  )}
                </div>
              </nav>
            )}
          </>
        ) : (
          <div className="super-admin-records-empty">
            <PackageSearch aria-hidden="true" size={26} />
            <strong>No matching orders</strong>
            <span>Change the status or search value to try again.</span>
          </div>
        )}
      </section>
    </div>
  );
}
