"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type PaymentAccount = {
  id: string;
  type: "bank" | "mobile_money";
  provider: string;
  accountName: string;
  accountNumber: string;
  currency: string;
};

export default function CustomerPaymentProofForm({
  orderId,
  accounts,
}: {
  orderId: string;
  accounts: PaymentAccount[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const bankAccounts = accounts.filter((account) => account.type === "bank");
  const mobileAccounts = accounts.filter(
    (account) => account.type === "mobile_money",
  );
  const availableMethods = [
    ...(bankAccounts.length ? ["bank_transfer"] : []),
    ...(mobileAccounts.length ? ["mobile_money"] : []),
  ];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(orderId)}/payment-proofs`,
        { method: "POST", body: new FormData(form) },
      );
      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(result?.error || "Payment receipt could not be submitted.");
      }
      form.reset();
      setNotice("Payment receipt submitted for review.");
      router.refresh();
    } catch (caught) {
      console.error("Could not submit payment receipt", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "Payment receipt could not be submitted.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="customer-order-payment">
      <div className="customer-order-section-heading">
        <div>
          <h2>Payment instructions</h2>
          <p>Pay the order total, then upload your receipt for verification.</p>
        </div>
      </div>
      {accounts.map((account) => (
        <div className="customer-payment-account" key={account.id}>
          <strong>
            {account.type === "bank" ? "Bank transfer" : "Mobile money"} ·{" "}
            {account.provider}
          </strong>
          <span>{account.accountName}</span>
          <code>{account.accountNumber}</code>
          <span>{account.currency}</span>
        </div>
      ))}
      {availableMethods.length ? (
        <form className="customer-payment-proof-form" onSubmit={submit}>
          <div className="customer-payment-proof-fields">
            <label>
              Payment method
              <select defaultValue={availableMethods[0]} name="method">
                {bankAccounts.length > 0 && (
                  <option value="bank_transfer">Bank transfer</option>
                )}
                {mobileAccounts.length > 0 && (
                  <option value="mobile_money">Mobile money</option>
                )}
              </select>
            </label>
            <label>
              Transaction reference
              <input
                autoComplete="off"
                maxLength={120}
                minLength={3}
                name="transactionReference"
                required
              />
            </label>
            <label>
              Receipt (PDF, JPEG, or PNG; max 2 MB)
              <input
                accept="application/pdf,image/jpeg,image/png"
                name="document"
                required
                type="file"
              />
            </label>
          </div>
          <div className="customer-payment-proof-footer">
            <div aria-live="polite">
              {error && <p className="is-error">{error}</p>}
              {notice && <p className="is-success">{notice}</p>}
            </div>
            <button disabled={busy} type="submit">
              {busy ? "Submitting…" : "Submit payment receipt"}
            </button>
          </div>
        </form>
      ) : (
        <p className="customer-payment-proof-message" role="note">
          No payment method is currently available. Please contact support.
        </p>
      )}
    </section>
  );
}
