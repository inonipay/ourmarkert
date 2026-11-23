import { Suspense } from "react";
import type { Metadata } from "next";
import SuperAdminAnalyticsReportAlias from "@/components/super-admin/analytics-report-alias";

export const metadata: Metadata = {
  title: "Product Performance | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

export default function ProductPerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[]; to?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading product performance…</div>}>
      <SuperAdminAnalyticsReportAlias
        breadcrumb="Product Management / Performance"
        path="/super-admin/products/product-performance"
        reportKey="product-analytics"
        searchParams={searchParams}
        title="Product Performance"
      />
    </Suspense>
  );
}
