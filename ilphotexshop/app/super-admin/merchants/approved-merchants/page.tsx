import { Suspense } from "react";
import type { Metadata } from "next";
import MerchantKycList from "@/components/super-admin/merchant-kyc-list";

export const metadata: Metadata = {
  title: "Approved merchant applications | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

export default function ApprovedMerchantApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading applications…</div>}>
      <MerchantKycList
        searchParams={searchParams}
        status="approved"
        title="Approved Merchants"
      />
    </Suspense>
  );
}
