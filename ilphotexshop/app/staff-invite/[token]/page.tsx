import type { Metadata } from "next";
import Image from "next/image";
import { createHash } from "node:crypto";
import { connection } from "next/server";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import StaffInvitationAcceptanceForm from "@/components/auth/staff-invitation-acceptance-form";

export const metadata: Metadata = {
  title: "Accept Staff Invitation | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

export default async function StaffInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense fallback={<main className="auth-shell"><section className="auth-card"><h1>Loading invitation…</h1></section></main>}>
      <StaffInvitationContent params={params} />
    </Suspense>
  );
}

async function StaffInvitationContent({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await connection();
  const { token } = await params;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const invitation = await prisma.staffInvitation.findUnique({
    where: { tokenHash },
    select: {
      name: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
    },
  });
  const valid =
    invitation &&
    invitation.status === "pending";

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand">
          <Image alt="" height={44} src="/ilphotox-shop-logo.png" width={44} />
          <strong>ILPhotoX Shop</strong>
        </div>
        {valid ? (
          <>
            <h1>Accept staff invitation</h1>
            <p>Create your administrator account for {invitation.email}.</p>
            <StaffInvitationAcceptanceForm
              name={invitation.name}
              token={token}
            />
          </>
        ) : (
          <>
            <h1>Invitation unavailable</h1>
            <p>This invitation is invalid, cancelled, expired, or already accepted.</p>
          </>
        )}
      </section>
    </main>
  );
}
