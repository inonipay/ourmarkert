import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import MerchantKycReviewActions from "@/components/super-admin/merchant-kyc-review-actions";
import SuperAdminRecordActions from "@/components/super-admin/record-actions";
import { getSuperAdminMerchantKycDetail } from "@/lib/data-access/merchant-kyc";
import { merchantKycIdSchema } from "@/lib/validation/merchant-kyc";

export const metadata: Metadata = {
  title: "Merchant verification | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

const dateFormat = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "UTC",
});

export default function MerchantKycDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading application…</div>}>
      <MerchantKycDetailContent params={params} />
    </Suspense>
  );
}

async function MerchantKycDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsedId = merchantKycIdSchema.safeParse(id);
  if (!parsedId.success) notFound();

  const application = await getSuperAdminMerchantKycDetail(parsedId.data);
  if (!application) notFound();
  const title = `Merchant application: ${application.businessName}`;
  const fields = [
    { label: "Applicant", value: application.applicantName },
    { label: "Account email", value: application.applicantEmail },
    { label: "Business name", value: application.businessName },
    { label: "Business address", value: application.businessAddress },
    { label: "Tax ID", value: application.taxId ?? "Not provided" },
    { label: "Status", value: application.status },
    { label: "Submitted at (UTC)", value: dateFormat.format(application.submittedAt) },
    {
      label: "Reviewed at (UTC)",
      value: application.reviewedAt
        ? dateFormat.format(application.reviewedAt)
        : "Not reviewed",
    },
    { label: "Review note", value: application.reviewReason ?? "None" },
  ];

  return (
    <div className="super-admin-record-detail-page">
      <div className="super-admin-record-detail-heading">
        <div>
          <div className="super-admin-breadcrumb">
            Workspace / Merchant Management / Verification / Application
          </div>
          <h1>{application.businessName}</h1>
          <p>{application.applicantName} · {application.applicantEmail}</p>
        </div>
        <Link className="super-admin-back-action" href="/super-admin/merchants/pending-applications">
          <ArrowLeft size={16} /> Applications
        </Link>
      </div>
      <article className="super-admin-panel super-admin-record-detail-panel">
        <header className="super-admin-record-brand">
          <Image alt="" height={44} src="/ilphotox-shop-logo.png" width={44} />
          <div>
            <strong>ILPhotoX Shop</strong>
            <span>Super Admin · Private KYC application</span>
          </div>
        </header>
        <dl className="super-admin-record-fields">
          {fields.map((field) => (
            <div className="super-admin-record-field" key={field.label}>
              <dt>{field.label}</dt>
              <dd>{field.value}</dd>
            </div>
          ))}
        </dl>
        <section aria-label="Private KYC documents" className="super-admin-kyc-documents">
          <h2>Verification documents</h2>
          <a
            className="super-admin-primary-action"
            href={`/api/super-admin/merchants/kyc/${encodeURIComponent(application.id)}/documents/registration`}
          >
            <Download aria-hidden="true" size={15} />
            Download business registration · {application.registrationDocumentName}
          </a>
          <a
            className="super-admin-primary-action"
            href={`/api/super-admin/merchants/kyc/${encodeURIComponent(application.id)}/documents/identity`}
          >
            <Download aria-hidden="true" size={15} />
            Download owner identity · {application.identityDocumentName}
          </a>
          <p>Documents are downloaded through a super-admin-only endpoint and are never publicly linked.</p>
        </section>
        {application.status === "pending" && (
          <MerchantKycReviewActions applicationId={application.id} />
        )}
        <SuperAdminRecordActions
          fields={fields}
          recordId={application.id}
          title={title}
        />
      </article>
    </div>
  );
}
