import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import SuperAdminAppShell from "@/components/super-admin/app-shell";
import AnnouncementFeed from "@/components/announcements/announcement-feed";
import { requireSuperAdminPageUser } from "@/lib/authorization";
import "./super-admin.css";

export const metadata: Metadata = {
  title: "Super Admin | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

export default async function SuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading your workspace…</div>}>
      <AuthenticatedSuperAdminLayout>{children}</AuthenticatedSuperAdminLayout>
    </Suspense>
  );
}

async function AuthenticatedSuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection();
  const user = await requireSuperAdminPageUser();

  return (
    <SuperAdminAppShell userEmail={user.email} userName={user.name}>
      <AnnouncementFeed userId={user.id} />
      {children}
    </SuperAdminAppShell>
  );
}
