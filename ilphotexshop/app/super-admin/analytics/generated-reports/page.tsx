import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, FileSpreadsheet, FileText } from "lucide-react";
import { requireSuperAdminPageUser } from "@/lib/authorization";
import { resolveAnalyticsDateRange } from "@/lib/validation/super-admin-analytics";

export const metadata: Metadata = {
  title: "Generated Reports | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

const availableReports = [
  {
    title: "Sales Analytics",
    href: "/super-admin/analytics/sales-analytics",
    description:
      "Order counts and daily order activity for the selected date range.",
  },
  {
    title: "Merchant Analytics",
    href: "/super-admin/analytics/merchant-analytics",
    description:
      "Merchant registrations and non-cancelled order quantities.",
  },
  {
    title: "Customer Analytics",
    href: "/super-admin/analytics/customer-analytics",
    description:
      "Customer registrations and marketplace order counts.",
  },
  {
    title: "Product Analytics",
    href: "/super-admin/analytics/product-analytics",
    description:
      "Current catalog status and best-selling products for the selected period.",
  },
  {
    title: "Best Selling Products",
    href: "/super-admin/analytics/best-selling-products",
    description:
      "Product quantities from non-cancelled orders in the selected period.",
  },
  {
    title: "Category Performance",
    href: "/super-admin/analytics/category-performance",
    description:
      "Current product counts and catalog share by supported category.",
  },
];

type GeneratedReportsPageProps = {
  searchParams: Promise<{
    from?: string | string[];
    to?: string | string[];
  }>;
};

export default async function GeneratedReportsPage({
  searchParams,
}: GeneratedReportsPageProps) {
  await requireSuperAdminPageUser("/super-admin/analytics/generated-reports");
  const search = await searchParams;
  const dateRange = resolveAnalyticsDateRange(search.from, search.to);
  const params = new URLSearchParams({
    from: dateRange.range.from,
    to: dateRange.range.to,
  });

  return (
    <div className="super-admin-analytics-page">
      <div className="super-admin-page-heading">
        <div>
          <div className="super-admin-breadcrumb">Workspace / Analytics & Reports</div>
          <h1>Generated Reports</h1>
          <p>Choose a data-backed report and download it in your preferred format.</p>
        </div>
        <BarChart3 aria-hidden="true" size={25} />
      </div>

      <form
        action="/super-admin/analytics/generated-reports"
        className="super-admin-analytics-date-filter"
        method="get"
      >
        <label>
          From
          <input
            defaultValue={dateRange.range.from}
            max={dateRange.range.max}
            name="from"
            required
            type="date"
          />
        </label>
        <label>
          To
          <input
            defaultValue={dateRange.range.to}
            max={dateRange.range.max}
            name="to"
            required
            type="date"
          />
        </label>
        <button type="submit">Apply range</button>
      </form>

      {dateRange.error && (
        <p className="super-admin-analytics-range-error" role="alert">
          {dateRange.error} Showing the default 30-day period.
        </p>
      )}

      <p className="super-admin-data-note" role="note">
        Reports are generated on demand from existing marketplace records.
        Revenue, traffic, and other data not collected by this system are not
        estimated. Exports are available only to authorized Super Admins.
      </p>

      <section
        aria-label="Available analytics reports"
        className="super-admin-generated-reports-grid"
      >
        {availableReports.map((report) => (
          <article className="super-admin-panel" key={report.href}>
            <div className="super-admin-panel-heading">
              <div>
                <h2>{report.title}</h2>
                <p>{report.description}</p>
              </div>
            </div>
            <div className="super-admin-generated-report-formats">
              <span><FileText aria-hidden="true" size={15} /> PDF</span>
              <span><FileSpreadsheet aria-hidden="true" size={15} /> Excel</span>
              <span>CSV</span>
            </div>
            <Link
              className="super-admin-generated-report-link"
              href={`${report.href}?${params.toString()}`}
            >
              Open report
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
