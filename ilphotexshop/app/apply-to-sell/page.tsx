import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import "./kyc.css";
import MerchantKycApplicationForm from "@/components/merchant-kyc/application-form";
import { getAuthenticatedUser } from "@/lib/authorization";
import { getOwnMerchantKycApplication } from "@/lib/data-access/merchant-kyc";

export const metadata: Metadata = {
  title: "Merchant application | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

export default function ApplyToSellPage() {
  return (
    <Suspense fallback={<div className="merchant-kyc-loading">Loading application…</div>}>
      <ApplyToSellContent />
    </Suspense>
  );
}

async function ApplyToSellContent() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login?callbackUrl=%2Fapply-to-sell");
  }
  if (user.role !== "customer" && user.role !== "seller") redirect("/");

  const { application } = await getOwnMerchantKycApplication(user.id);
  return (
    <MerchantKycApplicationForm
      application={application}
      ownerName={user.name}
    />
  );
}
