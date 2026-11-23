import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import SuperAdminRecordActions from "@/components/super-admin/record-actions";
import { getSuperAdminRoleAuditDetail } from "@/lib/data-access/super-admin-users";
import { userIdSchema } from "@/lib/validation/users";

export const metadata: Metadata = {
  title: "Role change details | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

const dateFormat = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "UTC",
});

export default function SuperAdminRoleAuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading audit entry…</div>}>
      <SuperAdminRoleAuditDetailContent params={params} />
    </Suspense>
  );
}

async function SuperAdminRoleAuditDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsedId = userIdSchema.safeParse(id);
  if (!parsedId.success) notFound();

  const entry = await getSuperAdminRoleAuditDetail(parsedId.data);
  if (!entry) notFound();
  const title = `Role change for ${entry.targetName}`;
  const fields = [
    { label: "Audit entry ID", value: entry.id },
    { label: "Changed by", value: entry.actorName },
    { label: "Administrator email", value: entry.actorEmail },
    { label: "Affected account", value: entry.targetName },
    { label: "Account email", value: entry.targetEmail },
    { label: "Previous role", value: entry.previousRole.replace("_", " ") },
    { label: "New role", value: entry.newRole.replace("_", " ") },
    { label: "Changed at (UTC)", value: dateFormat.format(entry.createdAt) },
  ];

  return (
    <div className="super-admin-record-detail-page">
      <div className="super-admin-record-detail-heading">
        <div>
          <div className="super-admin-breadcrumb">
            Workspace / Security / Audit logs / Entry
          </div>
          <h1>{title}</h1>
          <p>Role changes are restricted to authenticated super administrators.</p>
        </div>
        <Link className="super-admin-back-action" href="/super-admin/security">
          <ArrowLeft size={16} /> Back to audit log
        </Link>
      </div>
      <article className="super-admin-panel super-admin-record-detail-panel">
        <header className="super-admin-record-brand">
          <Image alt="" height={44} src="/ilphotox-shop-logo.png" width={44} />
          <div>
            <strong>ILPhotoX Shop</strong>
            <span>Super Admin · Security audit record</span>
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
        <SuperAdminRecordActions
          fields={fields}
          recordId={entry.id}
          title={title}
        />
      </article>
    </div>
  );
}
