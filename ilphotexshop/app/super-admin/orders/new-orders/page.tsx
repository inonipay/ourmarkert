import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, Inbox, Search } from "lucide-react";
import {
  getSuperAdminOrders,
  SUPER_ADMIN_ORDERS_PAGE_SIZE,
} from "@/lib/data-access/super-admin-orders";

export const metadata: Metadata = {
  title: "New Orders | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

const dateFormat = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "medium",
  timeZone: "UTC",
});
const numberFormat = new Intl.NumberFormat("en-RW");

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function NewOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "")
    .trim()
    .slice(0, 100);
  const pageValue = Array.isArray(params.page) ? params.page[0] : params.page;
  const parsedPage = Number.parseInt(pageValue ?? "1", 10);
  const page =
    Number.isSafeInteger(parsedPage) && parsedPage > 0
      ? Math.min(parsedPage, 500)
      : 1;
  const data = await getSuperAdminOrders(query, "pending", page);
  const pageCount = Math.max(
    1,
    Math.ceil(data.total / SUPER_ADMIN_ORDERS_PAGE_SIZE),
  );

  if (page > pageCount) {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    search.set("page", String(pageCount));
    redirect(`/super-admin/orders/new-orders?${search.toString()}`);
  }

  function pageHref(nextPage: number) {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    search.set("page", String(nextPage));
    return `/super-admin/orders/new-orders?${search.toString()}`;
  }

  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">
            Workspace / Order Management / New Orders
          </div>
          <h1>New Orders</h1>
          <p>Review newly placed orders that are waiting for the next step.</p>
        </div>
        <Inbox aria-hidden="true" size={25} />
      </div>

      <section aria-label="New order summary" className="super-admin-records-summary">
        <Link className="super-admin-summary-card is-active" href="/super-admin/orders/new-orders">
          <span>New pending orders</span>
          <strong>{numberFormat.format(data.summary.pendingOrders)}</strong>
        </Link>
        <Link className="super-admin-summary-card" href="/super-admin/orders/confirmed-orders">
          <span>Confirmed</span>
          <strong>{numberFormat.format(data.summary.confirmedOrders)}</strong>
        </Link>
        <Link className="super-admin-summary-card" href="/super-admin/orders">
          <span>All orders</span>
          <strong>{numberFormat.format(data.summary.totalOrders)}</strong>
        </Link>
      </section>

      <section className="super-admin-panel super-admin-records-panel">
        <div className="super-admin-records-toolbar">
          <div>
            <h2>Pending order queue</h2>
            <p>
              {numberFormat.format(data.total)} matching orders · page {data.page} of {pageCount}
            </p>
          </div>
          <form
            action="/super-admin/orders/new-orders"
            className="super-admin-record-search"
            role="search"
          >
            <Search aria-hidden="true" size={17} />
            <input
              aria-label="Search new orders"
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
                    <th scope="col">Delivery location</th>
                    <th scope="col">Items</th>
                    <th scope="col">Subtotal</th>
                    <th scope="col">Placed</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>#{order.id.slice(-8).toUpperCase()}</strong>
                        <span className="super-admin-audit-secondary">Pending</span>
                      </td>
                      <td>
                        <strong>{order.deliveryName}</strong>
                        <span className="super-admin-audit-secondary">
                          {order.deliveryPhone}
                        </span>
                      </td>
                      <td>{order.deliveryAddress}</td>
                      <td>
                        {numberFormat.format(
                          order.items.reduce((sum, item) => sum + item.quantity, 0),
                        )}
                      </td>
                      <td>{formatCurrency(order.subtotal, order.currency)}</td>
                      <td>{dateFormat.format(order.createdAt)}</td>
                      <td>
                        <Link
                          aria-label={`View new order ${order.id}`}
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
              <nav aria-label="New order pagination" className="super-admin-pagination">
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
            <Inbox aria-hidden="true" size={26} />
            <strong>No new orders</strong>
            <span>
              {query
                ? "No pending orders match the current search."
                : "Pending marketplace orders will appear here."}
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
