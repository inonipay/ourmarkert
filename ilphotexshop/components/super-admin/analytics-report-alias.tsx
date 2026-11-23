import { notFound } from "next/navigation";
import SuperAdminAnalyticsReport from "@/components/super-admin/analytics-report";
import { getSuperAdminAnalyticsReport } from "@/lib/data-access/super-admin-analytics";
import { resolveAnalyticsDateRange } from "@/lib/validation/super-admin-analytics";

type AnalyticsReportAliasProps = {
  reportKey: "merchant-analytics" | "product-analytics";
  title: string;
  breadcrumb: string;
  path: string;
  searchParams: Promise<{
    from?: string | string[];
    to?: string | string[];
  }>;
};

export default async function SuperAdminAnalyticsReportAlias({
  reportKey,
  title,
  breadcrumb,
  path,
  searchParams,
}: AnalyticsReportAliasProps) {
  const search = await searchParams;
  const dateRange = resolveAnalyticsDateRange(search.from, search.to);
  const report = await getSuperAdminAnalyticsReport(
    ["analytics", reportKey],
    title,
    dateRange.range,
  );
  if (!report) notFound();

  return (
    <SuperAdminAnalyticsReport
      actionPath={path}
      breadcrumb={breadcrumb}
      dateRangeError={dateRange.error}
      report={report}
    />
  );
}
