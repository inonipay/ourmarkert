import { Suspense } from "react";
import { notFound } from "next/navigation";
import SuperAdminRecordsTable from "@/components/super-admin/records-table";
import SuperAdminAnalyticsReport from "@/components/super-admin/analytics-report";
import { getSuperAdminNavigationMatch } from "@/components/super-admin/navigation";
import { getSuperAdminAnalyticsReport } from "@/lib/data-access/super-admin-analytics";
import {
  DEFAULT_SUPER_ADMIN_RECORD_PAGE_SIZE,
  getSuperAdminRecordList,
  SUPER_ADMIN_RECORD_PAGE_SIZES,
} from "@/lib/data-access/super-admin-records";
import { productCategorySchema } from "@/lib/validation/products";
import { resolveAnalyticsDateRange } from "@/lib/validation/super-admin-analytics";

type SuperAdminSectionPageProps = {
  params: Promise<{ section: string[] }>;
  searchParams: Promise<{
    q?: string | string[];
    page?: string | string[];
    pageSize?: string | string[];
    category?: string | string[];
    from?: string | string[];
    to?: string | string[];
  }>;
};

export default async function SuperAdminSectionPage({
  params,
  searchParams,
}: SuperAdminSectionPageProps) {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading section…</div>}>
      <SuperAdminSectionContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function SuperAdminSectionContent({
  params,
  searchParams,
}: SuperAdminSectionPageProps) {
  const { section } = await params;
  const path = `/super-admin/${section.join("/")}`;
  const match = getSuperAdminNavigationMatch(path);

  if (!match) notFound();
  const search = await searchParams;
  const query = Array.isArray(search.q) ? search.q[0] ?? "" : search.q ?? "";
  const pageValue = Array.isArray(search.page) ? search.page[0] : search.page;
  const pageSizeValue = Array.isArray(search.pageSize)
    ? search.pageSize[0]
    : search.pageSize;
  const categoryValue = Array.isArray(search.category)
    ? search.category[0]
    : search.category;
  const category = productCategorySchema.safeParse(categoryValue);
  const parsedPage = Number.parseInt(pageValue ?? "1", 10);
  const parsedPageSize = Number(pageSizeValue ?? DEFAULT_SUPER_ADMIN_RECORD_PAGE_SIZE);
  const pageSize =
    SUPER_ADMIN_RECORD_PAGE_SIZES.find((size) => size === parsedPageSize) ??
    DEFAULT_SUPER_ADMIN_RECORD_PAGE_SIZE;
  if (section[0] === "analytics") {
    const dateRange = resolveAnalyticsDateRange(search.from, search.to);
    const report = await getSuperAdminAnalyticsReport(
      section,
      match.item.label,
      dateRange.range,
    );
    if (report) {
      return (
        <SuperAdminAnalyticsReport
          actionPath={path}
          dateRangeError={dateRange.error}
          report={report}
        />
      );
    }
  }
  const data = await getSuperAdminRecordList(
    section,
    query.trim().slice(0, 100),
    Number.isFinite(parsedPage) ? parsedPage : 1,
    match.item.label,
    category.success ? category.data : undefined,
    pageSize,
  );

  if (data) {
    return (
      <SuperAdminRecordsTable
        category={category.success ? category.data : undefined}
        data={data}
        path={path}
        query={query.trim().slice(0, 100)}
      />
    );
  }

  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">
            Workspace / {match.section.label}
          </div>
          <h1>{match.item.label}</h1>
          <p>This section is not available in the current marketplace setup.</p>
        </div>
      </div>
      <p className="super-admin-data-note" role="status">
        {section[0] === "analytics" &&
        section[1] === "revenue-analytics"
          ? "Verified payment-provider data is not integrated. Order subtotals and receipt proofs are not reported as collected revenue."
          : section[0] === "analytics"
          ? "The data needed for this report is not collected, so reliable results cannot be generated."
          : "This section does not yet have a supported data source or workflow. No figures or actions are being simulated."}
      </p>
    </div>
  );
}
