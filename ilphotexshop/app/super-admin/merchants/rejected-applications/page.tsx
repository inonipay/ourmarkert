import { Suspense } from "react";
import type { Metadata } from "next";
import MerchantKycList from "@/components/super-admin/merchant-kyc-list";

export const metadata: Metadata = {
  title: "Rejected merchant applications | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

export default function RejectedMerchantApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading decisions…</div>}>
      <MerchantKycList
        searchParams={searchParams}
        status="rejected"
        title="Rejected Applications"
      />
    </Suspense>
  );
}
