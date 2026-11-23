import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Wallet } from "lucide-react";
import { getSuperAdminFinancialOverview } from "@/lib/data-access/super-admin-finance";
import { resolveAnalyticsDateRange } from "@/lib/validation/super-admin-analytics";

export const metadata: Metadata = {
  title: "Financial Overview | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

type SearchParams = {
  from?: string | string[];
  to?: string | string[];
};

const numberFormat = new Intl.NumberFormat("en-RW");
const dateFormat = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "medium",
  timeZone: "UTC",
});

function formatCurrencyTotals(
  entries: { currency: string; amount: string }[],
) {
  const totals = new Map<string, bigint>();
  for (const entry of entries) {
    totals.set(
      entry.currency,
      (totals.get(entry.currency) ?? BigInt(0)) + BigInt(entry.amount),
    );
  }
  return [...totals.entries()]
    .map(([currency, amount]) => `${numberFormat.format(amount)} ${currency}`)
    .join(" · ") || "—";
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function SuperAdminFinancialOverviewPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { range, error } = resolveAnalyticsDateRange(params.from, params.to);
  const overview = await getSuperAdminFinancialOverview(range);
  const orderCount = overview.orders.reduce((sum, entry) => sum + entry.count, 0);
  const proofCount = overview.paymentProofs.reduce((sum, entry) => sum + entry.count, 0);
  const approvedProofs = overview.paymentProofs.filter(
    (entry) => entry.status === "approved",
  );
  const pendingProofCount = overview.paymentProofs
    .filter((entry) => entry.status === "pending")
    .reduce((sum, entry) => sum + entry.count, 0);

  return (
    <div className="super-admin-analytics-page">
      <div className="super-admin-page-heading">
        <div>
          <div className="super-admin-breadcrumb">Workspace / Finance &amp; Settlements</div>
          <h1>Financial Overview</h1>
          <p>Order values and receipt-review activity recorded by the marketplace.</p>
        </div>
        <div className="super-admin-analytics-controls">
          <span className="super-admin-analytics-period">
            <Wallet aria-hidden="true" size={16} />
            {dateFormat.format(range.start)} –{" "}
            {dateFormat.format(new Date(range.endExclusive.getTime() - 1))}
          </span>
          <form
            action="/super-admin/finance"
            className="super-admin-analytics-date-filter"
            method="get"
          >
            <label>
              From
              <input
                defaultValue={range.from}
                max={range.max}
                name="from"
                required
                type="date"
              />
            </label>
            <label>
              To
              <input
                defaultValue={range.to}
                max={range.max}
                name="to"
                required
                type="date"
              />
            </label>
            <button type="submit">Apply</button>
          </form>
        </div>
      </div>

      {error && (
        <p className="super-admin-analytics-range-error" role="alert">
          {error} Showing the default 30-day period.
        </p>
      )}

      <div className="super-admin-analytics-notice" role="note">
        <span aria-hidden="true" />
        Order subtotals are order-record values, not verified revenue. Approved receipts reflect
        manual proof review only; gateway settlements, commissions, taxes, refunds, and payouts
        are not tracked.
      </div>

      <section aria-label="Financial activity summary" className="super-admin-records-summary">
        <article className="super-admin-summary-card">
          <span>Orders in period</span>
          <strong>{numberFormat.format(orderCount)}</strong>
        </article>
        <article className="super-admin-summary-card">
          <span>Order subtotals by currency</span>
          <strong>{formatCurrencyTotals(
            overview.orders.map(({ currency, subtotal }) => ({
              currency,
              amount: subtotal,
            })),
          )}</strong>
        </article>
        <article className="super-admin-summary-card is-approved">
          <span>Approved receipt proofs</span>
          <strong>{numberFormat.format(
            approvedProofs.reduce((sum, entry) => sum + entry.count, 0),
          )}</strong>
        </article>
        <article className="super-admin-summary-card is-pending">
          <span>Receipts awaiting review</span>
          <strong>{numberFormat.format(pendingProofCount)}</strong>
        </article>
      </section>

      <div className="super-admin-payment-overview-grid">
        <section className="super-admin-panel">
          <div className="super-admin-panel-heading">
            <div>
              <h2>Order values by current status</h2>
              <p>{numberFormat.format(orderCount)} orders created in the selected period</p>
            </div>
          </div>
          {overview.orders.length ? (
            <div className="super-admin-payment-overview-list">
              {overview.orders.map((entry) => (
                <div key={`${entry.currency}-${entry.status}`}>
                  <span>{entry.currency} · {statusLabel(entry.status)}</span>
                  <strong>{numberFormat.format(BigInt(entry.subtotal))}</strong>
                  <small>{numberFormat.format(entry.count)} orders · subtotal value</small>
                </div>
              ))}
            </div>
          ) : (
            <div className="super-admin-records-empty">
              <Wallet aria-hidden="true" size={24} />
              <strong>No orders in this period</strong>
              <span>Order values will appear here when orders are recorded.</span>
            </div>
          )}
        </section>

        <section className="super-admin-panel">
          <div className="super-admin-panel-heading">
            <div>
              <h2>Receipt proofs by review status</h2>
              <p>{numberFormat.format(proofCount)} receipt proofs submitted in the selected period</p>
            </div>
          </div>
          {overview.paymentProofs.length ? (
            <div className="super-admin-payment-overview-list">
              {overview.paymentProofs.map((entry) => (
                <div key={`${entry.currency}-${entry.status}`}>
                  <span>{entry.currency} · {statusLabel(entry.status)}</span>
                  <strong>{numberFormat.format(BigInt(entry.amount))}</strong>
                  <small>{numberFormat.format(entry.count)} proofs · submitted amount</small>
                </div>
              ))}
            </div>
          ) : (
            <div className="super-admin-records-empty">
              <Wallet aria-hidden="true" size={24} />
              <strong>No receipt proofs in this period</strong>
              <span>Receipt submissions will appear here when customers upload them.</span>
            </div>
          )}
        </section>
      </div>

      <div className="super-admin-payment-overview-actions">
        <Link
          className="super-admin-primary-action"
          href="/super-admin/payments/payment-proofs"
        >
          Review payment proofs <ArrowUpRight aria-hidden="true" size={16} />
        </Link>
        <Link className="super-admin-back-action" href="/super-admin/finance/gross-sales">
          View gross sales
        </Link>
        <Link className="super-admin-back-action" href="/super-admin/payments/payment-reports">
          Payment reports
        </Link>
      </div>
    </div>
  );
}
