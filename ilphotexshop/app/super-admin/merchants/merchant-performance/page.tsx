import { Suspense } from "react";
import type { Metadata } from "next";
import SuperAdminAnalyticsReportAlias from "@/components/super-admin/analytics-report-alias";

export const metadata: Metadata = {
  title: "Merchant Performance | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

export default function MerchantPerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[]; to?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading merchant performance…</div>}>
      <SuperAdminAnalyticsReportAlias
        breadcrumb="Merchant Management / Performance"
        path="/super-admin/merchants/merchant-performance"
        reportKey="merchant-analytics"
        searchParams={searchParams}
        title="Merchant Performance"
      />
    </Suspense>
  );
}
