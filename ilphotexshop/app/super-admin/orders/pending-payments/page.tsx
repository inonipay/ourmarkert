import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard, Eye, Search } from "lucide-react";
import SuperAdminCsvExportButton from "@/components/super-admin/csv-export-button";
import {
  getSuperAdminPendingPayments,
  PENDING_PAYMENT_PAGE_SIZE,
} from "@/lib/data-access/super-admin-pending-payments";

export const metadata: Metadata = {
  title: "Pending Payments | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

const dateFormat = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "medium",
  timeZone: "UTC",
});
const numberFormat = new Intl.NumberFormat("en-RW");

export default async function PendingPaymentsPage({
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
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0
    ? Math.min(parsedPage, 1000)
    : 1;
  const data = await getSuperAdminPendingPayments(query, page);
  const pageCount = Math.max(1, Math.ceil(data.total / PENDING_PAYMENT_PAGE_SIZE));

  if (page > pageCount) {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    search.set("page", String(pageCount));
    redirect(`/super-admin/orders/pending-payments?${search.toString()}`);
  }

  const pageHref = (nextPage: number) => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    search.set("page", String(nextPage));
    return `/super-admin/orders/pending-payments?${search.toString()}`;
  };
  const exportRows = [
    [
      "Order ID",
      "Customer",
      "Customer email",
      "Order subtotal",
      "Currency",
      "Payment proof status",
      "Transaction reference",
      "Proof submitted",
      "Review reason",
      "Order placed",
    ],
    ...data.rows.map((order) => {
      const proof = order.paymentProofs[0];
      return [
        order.id,
        order.customer.name,
        order.customer.email,
        String(order.subtotal),
        order.currency.trim(),
        proof?.status === "pending"
          ? "Awaiting verification"
          : proof?.status === "rejected"
            ? "Proof rejected"
            : "No proof submitted",
        proof?.transactionReference ?? "",
        proof ? dateFormat.format(proof.createdAt) : "",
        proof?.reviewReason ?? "",
        dateFormat.format(order.createdAt),
      ];
    }),
  ];

  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">
            Workspace / Order Management / Pending Payments
          </div>
          <h1>Pending Payments</h1>
          <p>Pending orders without an approved payment proof.</p>
        </div>
        <CreditCard aria-hidden="true" size={25} />
      </div>

      <section aria-label="Pending payment totals" className="super-admin-records-summary">
        {[
          ["Matching orders", data.total],
          ["Awaiting proof verification", data.awaitingVerification],
          ["Rejected proofs", data.rejectedProofs],
          ["No proof submitted", data.noProofs],
        ].map(([label, count]) => (
          <article className="super-admin-summary-card" key={label}>
            <span>{label}</span>
            <strong>{Number(count).toLocaleString("en-RW")}</strong>
          </article>
        ))}
      </section>

      <p className="super-admin-data-note" role="note">
        Orders with an approved proof are excluded. Pending or rejected receipts
        are not payment confirmation; orders with an approved proof still
        require an administrator to confirm the order.
      </p>

      <section className="super-admin-panel super-admin-records-panel">
        <div className="super-admin-records-toolbar">
          <div>
            <h2>Unverified payment orders</h2>
            <p>{data.total.toLocaleString("en-RW")} matching pending orders</p>
          </div>
          <form
            action="/super-admin/orders/pending-payments"
            className="super-admin-record-search"
            role="search"
          >
            <Search aria-hidden="true" size={17} />
            <input
              aria-label="Search pending payment orders"
              defaultValue={query}
              maxLength={100}
              name="q"
              placeholder="Search order, customer, or reference"
              type="search"
            />
            <button type="submit">Search</button>
          </form>
          <SuperAdminCsvExportButton
            fileName={`pending-payments-page-${data.page}`}
            label="Export page CSV"
            rows={exportRows}
          />
        </div>

        {data.rows.length ? (
          <>
            <div className="super-admin-records-table-wrap">
              <table className="super-admin-records-table">
                <thead>
                  <tr>
                    <th scope="col">Order / customer</th>
                    <th scope="col">Order subtotal</th>
                    <th scope="col">Receipt status</th>
                    <th scope="col">Transaction reference</th>
                    <th scope="col">Placed</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((order) => {
                    const proof = order.paymentProofs[0];
                    const proofStatus = proof?.status === "pending"
                      ? "Awaiting verification"
                      : proof?.status === "rejected"
                        ? "Rejected"
                        : "No proof submitted";
                    return (
                      <tr key={order.id}>
                        <td>
                          <strong>#{order.id.slice(-8).toUpperCase()}</strong>
                          <span className="super-admin-audit-secondary">
                            {order.customer.name} · {order.customer.email}
                          </span>
                        </td>
                        <td>{numberFormat.format(order.subtotal)} {order.currency.trim()}</td>
                        <td>
                          <span className={`super-admin-merchant-access-status${proof?.status === "pending" ? "" : " is-suspended"}`}>
                            {proofStatus}
                          </span>
                          {proof?.reviewReason && (
                            <span className="super-admin-audit-secondary">
                              {proof.reviewReason}
                            </span>
                          )}
                        </td>
                        <td>{proof?.transactionReference ?? "—"}</td>
                        <td>{dateFormat.format(order.createdAt)}</td>
                        <td>
                          <Link
                            aria-label={`View order ${order.id}`}
                            className="super-admin-view-action"
                            href={`/super-admin/records/orders/${encodeURIComponent(order.id)}`}
                          >
                            <Eye aria-hidden="true" size={15} /> View order
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {data.total > data.pageSize && (
              <nav aria-label="Pending payment pagination" className="super-admin-pagination">
                <span>
                  Showing {(data.page - 1) * data.pageSize + 1}–
                  {Math.min(data.page * data.pageSize, data.total)} of {data.total}
                  <strong>Page {data.page} of {pageCount}</strong>
                </span>
                <div>
                  {data.page > 1 ? (
                    <Link className="super-admin-back-action" href={pageHref(data.page - 1)}>
                      Previous
                    </Link>
                  ) : (
                    <span className="super-admin-page-disabled">Previous</span>
                  )}
                  {data.page < pageCount ? (
                    <Link className="super-admin-primary-action" href={pageHref(data.page + 1)}>
                      Next
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
            <CreditCard aria-hidden="true" size={25} />
            <strong>No pending payment orders found</strong>
            <span>Try changing or clearing the search.</span>
          </div>
        )}
      </section>
    </div>
  );
}
