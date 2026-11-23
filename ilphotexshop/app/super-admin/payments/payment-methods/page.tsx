import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Smartphone } from "lucide-react";
import { PaymentAccountType } from "@prisma/client";
import { getSuperAdminPaymentMethodStatuses } from "@/lib/data-access/super-admin-payment-accounts";

export const metadata: Metadata = {
  title: "Payment Methods | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

const numberFormat = new Intl.NumberFormat("en-RW");

export default async function SuperAdminPaymentMethodsPage() {
  const methods = await getSuperAdminPaymentMethodStatuses();

  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">
            Workspace / Payment Management / Payment Methods
          </div>
          <h1>Payment methods</h1>
          <p>Availability is determined by the active destination accounts.</p>
        </div>
      </div>

      <div className="super-admin-data-note" role="note">
        This controls which manual receipt methods customers can select. It does not connect to a bank or payment gateway.
      </div>

      <section aria-label="Payment method availability" className="super-admin-payment-method-grid">
        {methods.map((method) => {
          const isBank = method.type === PaymentAccountType.bank;
          const Icon = isBank ? Building2 : Smartphone;
          const label = isBank ? "Bank transfer" : "Mobile money";
          const accountsHref = isBank
            ? "/super-admin/payments/bank-accounts?type=bank"
            : "/super-admin/payments/bank-accounts?type=mobile_money";

          return (
            <article className="super-admin-panel super-admin-payment-method-card" key={method.type}>
              <div className="super-admin-payment-method-heading">
                <span className="super-admin-payment-method-icon">
                  <Icon aria-hidden="true" size={20} />
                </span>
                <div>
                  <h2>{label}</h2>
                  <span className={`super-admin-merchant-access-status${method.active ? "" : " is-suspended"}`}>
                    {method.active ? "Available to customers" : "Unavailable"}
                  </span>
                </div>
              </div>
              <dl>
                <div>
                  <dt>Configured accounts</dt>
                  <dd>{numberFormat.format(method.configured)}</dd>
                </div>
                <div>
                  <dt>Active accounts</dt>
                  <dd>{numberFormat.format(method.active)}</dd>
                </div>
              </dl>
              <Link className="super-admin-back-action" href={accountsHref}>
                Manage {isBank ? "bank" : "mobile-money"} accounts
              </Link>
            </article>
          );
        })}
      </section>
    </div>
  );
}
