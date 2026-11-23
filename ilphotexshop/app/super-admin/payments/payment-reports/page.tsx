import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard, Download } from "lucide-react";
import SuperAdminAnalyticsReportExports from "@/components/super-admin/analytics-report-exports";
import type { SuperAdminAnalyticsReport } from "@/lib/data-access/super-admin-analytics";
import {
  getSuperAdminPaymentReport,
  PAYMENT_REPORT_PAGE_SIZE,
} from "@/lib/data-access/super-admin-payment-reports";
import { resolveAnalyticsDateRange } from "@/lib/validation/super-admin-analytics";

export const metadata: Metadata = {
  title: "Payment Reports | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

const numberFormat = new Intl.NumberFormat("en-RW");
const dateFormat = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "medium",
  timeZone: "UTC",
});
const methodLabels = {
  bank_transfer: "Bank transfer",
  mobile_money: "Mobile money",
};

export default async function SuperAdminPaymentReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string | string[];
    to?: string | string[];
    page?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const resolvedRange = resolveAnalyticsDateRange(params.from, params.to);
  const pageValue = Array.isArray(params.page) ? params.page[0] : params.page;
  const requestedPage = Number.parseInt(pageValue ?? "1", 10);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, 10000)
    : 1;
  const report = await getSuperAdminPaymentReport(
    resolvedRange.range,
    page,
  );
  const pageCount = Math.max(1, Math.ceil(report.total / PAYMENT_REPORT_PAGE_SIZE));
  if (page > pageCount) {
    redirect(
      `/super-admin/payments/payment-reports?from=${resolvedRange.range.from}&to=${resolvedRange.range.to}&page=${pageCount}`,
    );
  }
  const rangeLabel = `${dateFormat.format(resolvedRange.range.start)} – ${dateFormat.format(
    new Date(resolvedRange.range.endExclusive.getTime() - 1),
  )}`;
  const paymentExportReport: SuperAdminAnalyticsReport = {
    title: `Payment receipt report - page ${report.page}`,
    description: `Receipt submissions, page ${report.page} of ${pageCount} · ${rangeLabel}`,
    notice:
      "This export contains payment proofs only. It does not represent bank transactions, collected revenue, failed payments, or payouts.",
    rangeLabel,
    dateRange: {
      from: resolvedRange.range.from,
      to: resolvedRange.range.to,
      max: resolvedRange.range.max,
    },
    metrics: [
      {
        label: "Receipt submissions",
        value: report.total,
        detail: "All proof statuses in the selected date range",
        tone: "blue",
        href: "/super-admin/payments/payment-proofs",
      },
      {
        label: "Pending review",
        value: report.pending,
        detail: "Awaiting receipt verification",
        tone: "yellow",
        href: "/super-admin/payments/payment-proofs?status=pending",
      },
      {
        label: "Approved proofs",
        value: report.approved,
        detail: "Manually approved receipts",
        tone: "green",
        href: "/super-admin/payments/payment-proofs?status=approved",
      },
      {
        label: "Rejected proofs",
        value: report.rejected,
        detail: "Manually rejected receipts",
        tone: "red",
        href: "/super-admin/payments/payment-proofs?status=rejected",
      },
      ...report.approvedAmounts.map((entry) => ({
        label: `Approved ${entry.currency}`,
        value: entry.amount,
        detail: "Approved receipt proofs; not settlement totals",
        tone: "green" as const,
        href: "/super-admin/payments/payment-proofs?status=approved",
      })),
      ...report.methods.map((entry) => ({
        label: methodLabels[entry.method],
        value: entry.count,
        detail: "Receipt submissions",
        tone: "blue" as const,
        href: "/super-admin/payments/payment-proofs",
      })),
    ],
    columns: [
      "Customer / email",
      "Order · method · reference",
      "Status · submitted · review note",
      "Amount",
    ],
    rows: report.rows.map((proof) => ({
      id: proof.id,
      label: `${proof.customer.name || proof.customer.email} · ${proof.customer.email}`,
      detail: `${proof.order.id} · ${methodLabels[proof.method]} · ${proof.transactionReference}`,
      indicator: `${proof.status} · ${dateFormat.format(proof.createdAt)} · ${proof.reviewReason ?? "No review note"}`,
      metric: `${numberFormat.format(proof.amount)} ${proof.currency.trim()}`,
      href: `/super-admin/records/orders/${encodeURIComponent(proof.order.id)}`,
    })),
  };
  const pageHref = (nextPage: number) =>
    `/super-admin/payments/payment-reports?from=${resolvedRange.range.from}&to=${resolvedRange.range.to}&page=${nextPage}`;

  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">
            Workspace / Payment Management / Payment Reports
          </div>
          <h1>Payment receipt reports</h1>
          <p>Receipt review activity for {rangeLabel}.</p>
        </div>
        <CreditCard aria-hidden="true" size={25} />
      </div>

      <div className="super-admin-data-note" role="note">
        This report summarizes uploaded payment proofs, not bank transactions,
        failed payments, settled revenue, or payouts.
      </div>

      <form
        action="/super-admin/payments/payment-reports"
        className="super-admin-analytics-date-filter"
        method="get"
      >
        <label>
          From
          <input
            max={resolvedRange.range.max}
            name="from"
            required
            type="date"
            defaultValue={resolvedRange.range.from}
          />
        </label>
        <label>
          To
          <input
            max={resolvedRange.range.max}
            name="to"
            required
            type="date"
            defaultValue={resolvedRange.range.to}
          />
        </label>
        <button type="submit">Apply</button>
      </form>

      {resolvedRange.error && (
        <p className="super-admin-analytics-range-error" role="alert">
          {resolvedRange.error} Showing the default 30-day period.
        </p>
      )}

      <section aria-label="Payment proof totals" className="super-admin-records-summary">
        {[
          ["Receipts submitted", report.total],
          ["Pending review", report.pending],
          ["Approved proofs", report.approved],
          ["Rejected proofs", report.rejected],
        ].map(([label, count]) => (
          <article className="super-admin-summary-card" key={label}>
            <span>{label}</span>
            <strong>{Number(count).toLocaleString("en-RW")}</strong>
          </article>
        ))}
      </section>

      <div className="super-admin-payment-overview-grid">
        <section className="super-admin-panel">
          <div className="super-admin-panel-heading">
            <div>
              <h2>Approved proof amounts</h2>
              <p>Grouped by currency; not a settlement total</p>
            </div>
          </div>
          {report.approvedAmounts.length ? (
            <div className="super-admin-payment-overview-list">
              {report.approvedAmounts.map((entry) => (
                <div key={entry.currency}>
                  <span>{entry.currency}</span>
                  <strong>{numberFormat.format(entry.amount)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="super-admin-inline-empty">
              No approved proofs in this date range.
            </div>
          )}
        </section>

        <section className="super-admin-panel">
          <div className="super-admin-panel-heading">
            <div>
              <h2>Submission method</h2>
              <p>All receipt statuses in the selected period</p>
            </div>
          </div>
          {report.methods.length ? (
            <div className="super-admin-payment-overview-list">
              {report.methods.map((entry) => (
                <div key={entry.method}>
                  <span>{methodLabels[entry.method]}</span>
                  <strong>{numberFormat.format(entry.count)}</strong>
                  <small>receipt submissions</small>
                </div>
              ))}
            </div>
          ) : (
            <div className="super-admin-inline-empty">
              No receipt submissions in this date range.
            </div>
          )}
        </section>
      </div>

      <section className="super-admin-panel super-admin-payment-report-panel">
        <div className="super-admin-records-toolbar">
          <div>
            <h2>Receipt details</h2>
            <p>
              Showing {report.rows.length} of {report.total.toLocaleString("en-RW")} submissions
            </p>
          </div>
          <SuperAdminAnalyticsReportExports report={paymentExportReport} />
        </div>
        {report.rows.length ? (
          <>
            <div className="super-admin-records-table-wrap">
              <table className="super-admin-records-table">
                <thead>
                  <tr>
                    <th scope="col">Customer / Order</th>
                    <th scope="col">Method / Reference</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Status / Submitted</th>
                    <th scope="col">Review note</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((proof) => (
                    <tr key={proof.id}>
                      <td>
                        <strong>{proof.customer.name || proof.customer.email}</strong>
                        <br />
                        {proof.customer.email}
                        <br />
                        <code>{proof.order.id}</code>
                      </td>
                      <td>
                        {methodLabels[proof.method]}
                        <br />
                        <code>{proof.transactionReference}</code>
                      </td>
                      <td>{numberFormat.format(proof.amount)} {proof.currency.trim()}</td>
                      <td>
                        <span className={`super-admin-merchant-access-status${proof.status === "pending" ? "" : " is-suspended"}`}>
                          {proof.status}
                        </span>
                        <br />
                        {dateFormat.format(proof.createdAt)}
                      </td>
                      <td>{proof.reviewReason ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pageCount > 1 && (
              <nav aria-label="Payment report pagination" className="super-admin-payment-proof-pagination">
                <span>Page {report.page} of {pageCount}</span>
                <div>
                  {report.page > 1 && (
                    <Link href={pageHref(report.page - 1)}>Previous</Link>
                  )}
                  {report.page < pageCount && (
                    <Link href={pageHref(report.page + 1)}>Next</Link>
                  )}
                </div>
              </nav>
            )}
          </>
        ) : (
          <div className="super-admin-records-empty">
            <Download aria-hidden="true" size={25} />
            <strong>No receipts found</strong>
            <span>No payment-proof submissions match this date range.</span>
          </div>
        )}
      </section>
    </div>
  );
}
