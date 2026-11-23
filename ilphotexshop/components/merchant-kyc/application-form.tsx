"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type KycApplication = {
  id: string;
  businessName: string;
  businessAddress: string;
  taxId: string | null;
  status: "pending" | "approved";
  reviewReason: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
};

type MerchantKycApplicationFormProps = {
  ownerName: string;
  application: KycApplication | null;
};

const dateFormat = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "long",
  timeZone: "UTC",
});

export default function MerchantKycApplicationForm({
  ownerName,
  application,
}: MerchantKycApplicationFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/merchant-kyc", {
        method: "POST",
        body: new FormData(event.currentTarget),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(result.error ?? "Application could not be submitted.");
        return;
      }
      setMessage("Application submitted for review.");
      router.refresh();
    } catch (error) {
      console.error("Could not submit merchant verification", error);
      setMessage("Application could not be submitted. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="merchant-kyc-page">
      <header className="merchant-kyc-header">
        <Link href="/">ILPhotoX Shop</Link>
        <span>Merchant verification</span>
      </header>
      <main className="merchant-kyc-main">
        <div className="merchant-kyc-intro">
          <span className="merchant-kyc-kicker">SELL WITH US</span>
          <h1>Merchant application</h1>
          <p>
            Submit your business information and two verification documents.
            Only authorized super administrators can review your application.
          </p>
        </div>

        {application ? (
          <section aria-live="polite" className="merchant-kyc-status-card">
            <span
              className={`merchant-kyc-status is-${application.status}`}
            >
              {application.status}
            </span>
            <h2>{application.businessName}</h2>
            <p>
              Submitted {dateFormat.format(application.submittedAt)} ·{" "}
              {application.businessAddress}
            </p>
            {application.status === "pending" ? (
              <p>Your application is waiting for super-admin review.</p>
            ) : (
              <>
                <p>
                  Your seller access has been approved. Your products remain
                  subject to the existing publication review process.
                </p>
                <Link className="merchant-kyc-primary" href="/merchant">
                  Open merchant workspace
                </Link>
              </>
            )}
            {application.reviewReason && (
              <p className="merchant-kyc-review-note">
                Review note: {application.reviewReason}
              </p>
            )}
          </section>
        ) : (
          <form
            className="merchant-kyc-form"
            encType="multipart/form-data"
            onSubmit={handleSubmit}
          >
            <label>
              <span>Owner / applicant full name</span>
              <input
                autoComplete="name"
                defaultValue={ownerName}
                maxLength={100}
                minLength={2}
                name="ownerFullName"
                required
              />
            </label>
            <label>
              <span>Business name</span>
              <input
                autoComplete="organization"
                maxLength={160}
                minLength={2}
                name="businessName"
                required
              />
            </label>
            <label>
              <span>Business address</span>
              <textarea
                autoComplete="street-address"
                maxLength={500}
                minLength={3}
                name="businessAddress"
                required
                rows={3}
              />
            </label>
            <label>
              <span>Tax identification number (optional)</span>
              <input maxLength={64} name="taxId" />
            </label>
            <label>
              <span>Business registration certificate</span>
              <input
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                name="registrationDocument"
                required
                type="file"
              />
              <small>PDF, JPEG, or PNG · maximum 2 MB</small>
            </label>
            <label>
              <span>Owner identity document</span>
              <input
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                name="identityDocument"
                required
                type="file"
              />
              <small>PDF, JPEG, or PNG · maximum 2 MB</small>
            </label>
            <p className="merchant-kyc-privacy-note">
              Files are stored in the protected KYC database table. Rejected
              application data and files are deleted; only an audit entry without
              applicant details is retained. Approved KYC data remains until a
              super admin removes it.
            </p>
            <button
              className="merchant-kyc-primary"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Submitting…" : "Submit for review"}
            </button>
            <p aria-live="polite" className="merchant-kyc-message">
              {message}
            </p>
          </form>
        )}
      </main>
    </div>
  );
}
