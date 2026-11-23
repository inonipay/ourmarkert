import { Suspense } from "react";
import type { Metadata } from "next";
import MerchantKycList from "@/components/super-admin/merchant-kyc-list";

export const metadata: Metadata = {
  title: "Pending merchant applications | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

export default function PendingMerchantApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading applications…</div>}>
      <MerchantKycList
        searchParams={searchParams}
        status="pending"
        title="Pending Applications"
      />
    </Suspense>
  );
}
