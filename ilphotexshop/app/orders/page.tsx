import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, ShoppingBag } from "lucide-react";
import { requireCustomerPageUser } from "@/lib/authorization";
import { getCustomerOrders } from "@/lib/data-access/orders";
import { listOrdersQuerySchema } from "@/lib/validation/orders";
import AnnouncementFeed from "@/components/announcements/announcement-feed";

export const metadata: Metadata = {
  title: "My orders | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

const pageSize = 20;
const dateFormat = new Intl.DateTimeFormat("en-RW", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const amountFormat = new Intl.NumberFormat("en-RW");
const statuses = ["pending", "confirmed", "fulfilled", "cancelled"] as const;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function CustomerOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<div className="customer-orders-loading">Loading your orders…</div>}>
      <CustomerOrdersContent searchParams={searchParams} />
    </Suspense>
  );
}

async function CustomerOrdersContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [customer, params] = await Promise.all([
    requireCustomerPageUser(),
    searchParams,
  ]);
  const query = listOrdersQuerySchema.safeParse({
    status: typeof params.status === "string" ? params.status : undefined,
    limit: pageSize,
    offset: typeof params.offset === "string" ? params.offset : 0,
  });
  const filters = query.success
    ? query.data
    : listOrdersQuerySchema.parse({ limit: pageSize, offset: 0 });
  const result = await getCustomerOrders(customer.id, filters);

  function pageHref(offset: number, status = filters.status) {
    const search = new URLSearchParams();
    if (status) search.set("status", status);
    if (offset > 0) search.set("offset", String(offset));
    const queryString = search.toString();
    return queryString ? `/orders?${queryString}` : "/orders";
  }

  return (
    <div className="customer-orders-page">
      <div className="customer-orders-heading">
        <div>
          <span className="customer-orders-breadcrumb">Account / Orders</span>
          <h1>My orders</h1>
          <p>Review your order status, delivery details, and items.</p>
        </div>
        <Link className="customer-orders-back" href="/">
          <ArrowLeft aria-hidden="true" size={16} /> Continue shopping
        </Link>
      </div>

      <AnnouncementFeed userId={customer.id} />

      <div className="customer-orders-notice" role="note">
        Orders are recorded here. Payment is not collected by ILPhotoX Shop and
        is handled separately.
      </div>

      <section className="customer-orders-panel">
        <nav aria-label="Filter orders" className="customer-orders-filters">
          <Link
            aria-current={!filters.status ? "page" : undefined}
            className={!filters.status ? "is-active" : ""}
            href="/orders"
          >
            All orders
          </Link>
          {statuses.map((status) => (
            <Link
              aria-current={filters.status === status ? "page" : undefined}
              className={filters.status === status ? "is-active" : ""}
              href={pageHref(0, status)}
              key={status}
            >
              {status[0].toUpperCase() + status.slice(1)}
            </Link>
          ))}
        </nav>

        {result.orders.length ? (
          <div className="customer-orders-table-wrap">
            <table className="customer-orders-table">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Placed</th>
                  <th scope="col">Items</th>
                  <th scope="col">Subtotal</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {result.orders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>#{order.id.slice(-8).toUpperCase()}</strong></td>
                    <td>{dateFormat.format(order.createdAt)}</td>
                    <td>
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </td>
                    <td>{amountFormat.format(order.subtotal)} {order.currency}</td>
                    <td>
                      <span className={`customer-order-status is-${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        aria-label={`View order ${order.id}`}
                        className="customer-order-view"
                        href={`/orders/${encodeURIComponent(order.id)}`}
                      >
                        <Eye aria-hidden="true" size={15} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="customer-orders-empty">
            <ShoppingBag aria-hidden="true" size={28} />
            <strong>No orders found</strong>
            <span>
              {filters.status
                ? `You do not have any ${filters.status} orders.`
                : "Orders you place will appear here."}
            </span>
            {!filters.status && (
              <Link className="customer-orders-next" href="/">
                Start shopping <ArrowRight aria-hidden="true" size={16} />
              </Link>
            )}
          </div>
        )}

        {result.total > pageSize && (
          <div className="customer-orders-pagination">
            <span>
              Showing {filters.offset + 1}–
              {Math.min(filters.offset + pageSize, result.total)} of {result.total}
            </span>
            <div>
              {filters.offset > 0 && (
                <Link
                  className="customer-orders-back"
                  href={pageHref(Math.max(0, filters.offset - pageSize))}
                >
                  <ArrowLeft aria-hidden="true" size={15} /> Previous
                </Link>
              )}
              {filters.offset + pageSize < result.total && (
                <Link
                  className="customer-orders-next"
                  href={pageHref(filters.offset + pageSize)}
                >
                  Next <ArrowRight aria-hidden="true" size={15} />
                </Link>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
