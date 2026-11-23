import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import CheckoutFlow from "@/components/marketplace/checkout-flow";
import { getAuthenticatedUser } from "@/lib/authorization";
import { getActivePaymentAccounts } from "@/lib/data-access/order-payment-proofs";

export const metadata: Metadata = {
  title: "Checkout | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  return (
    <Suspense fallback={<div className="checkout-loading">Loading checkout…</div>}>
      <CheckoutContent />
    </Suspense>
  );
}

async function CheckoutContent() {
  await connection();
  const user = await getAuthenticatedUser();
  const isCustomer = user?.role === "customer";
  const accounts = isCustomer ? await getActivePaymentAccounts() : [];
  return (
    <CheckoutFlow
      accounts={accounts}
      customerName={user?.name ?? ""}
      isAuthenticated={isCustomer}
    />
  );
}
