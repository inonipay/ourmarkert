import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { getSuperAdminFinancialOverview } from "@/lib/data-access/super-admin-finance";
import { resolveAnalyticsDateRange } from "@/lib/validation/super-admin-analytics";

export const metadata: Metadata = {
  title: "Gross Sales | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

const numberFormat = new Intl.NumberFormat("en-RW");
const dateFormat = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "medium",
  timeZone: "UTC",
});

function currencyTotals(entries: { currency: string; subtotal: string }[]) {
  const totals = new Map<string, bigint>();
  for (const entry of entries) {
    totals.set(
      entry.currency,
      (totals.get(entry.currency) ?? BigInt(0)) + BigInt(entry.subtotal),
    );
  }
  return [...totals.entries()];
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function SuperAdminGrossSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[]; to?: string | string[] }>;
}) {
  const params = await searchParams;
  const { range, error } = resolveAnalyticsDateRange(params.from, params.to);
  const overview = await getSuperAdminFinancialOverview(
    range,
    "/super-admin/finance/gross-sales",
  );
  const orderCount = overview.orders.reduce((sum, entry) => sum + entry.count, 0);
  const totals = currencyTotals(overview.orders);

  return (
    <div className="super-admin-analytics-page">
      <div className="super-admin-page-heading">
        <div>
          <div className="super-admin-breadcrumb">Workspace / Finance &amp; Settlements / Gross Sales</div>
          <h1>Gross Sales</h1>
          <p>Order subtotals recorded during the selected period, grouped by currency and current status.</p>
        </div>
        <Link className="super-admin-back-action" href="/super-admin/finance">
          <ArrowLeft aria-hidden="true" size={16} /> Financial overview
        </Link>
      </div>

      <div className="super-admin-analytics-controls">
        <span className="super-admin-analytics-period">
          <TrendingUp aria-hidden="true" size={16} />
          {dateFormat.format(range.start)} –{" "}
          {dateFormat.format(new Date(range.endExclusive.getTime() - 1))}
        </span>
        <form
          action="/super-admin/finance/gross-sales"
          className="super-admin-analytics-date-filter"
          method="get"
        >
          <label>
            From
            <input defaultValue={range.from} max={range.max} name="from" required type="date" />
          </label>
          <label>
            To
            <input defaultValue={range.to} max={range.max} name="to" required type="date" />
          </label>
          <button type="submit">Apply</button>
        </form>
      </div>

      {error && (
        <p className="super-admin-analytics-range-error" role="alert">
          {error} Showing the default 30-day period.
        </p>
      )}

      <div className="super-admin-analytics-notice" role="note">
        Gross sales here means order subtotal values only. These are not verified payments or
        collected revenue; current status may have changed since an order was created.
      </div>

      <section aria-label="Gross sales summary" className="super-admin-records-summary">
        <article className="super-admin-summary-card">
          <span>Orders in period</span>
          <strong>{numberFormat.format(orderCount)}</strong>
        </article>
        {totals.map(([currency, amount]) => (
          <article className="super-admin-summary-card" key={currency}>
            <span>Order subtotals · {currency}</span>
            <strong>{numberFormat.format(amount)}</strong>
          </article>
        ))}
      </section>

      <section className="super-admin-panel">
        <div className="super-admin-panel-heading">
          <div>
            <h2>Order subtotal by status</h2>
            <p>Order records created in the selected period</p>
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
            <TrendingUp aria-hidden="true" size={24} />
            <strong>No orders in this period</strong>
            <span>Order subtotals will appear here when orders are recorded.</span>
          </div>
        )}
      </section>
    </div>
  );
}
