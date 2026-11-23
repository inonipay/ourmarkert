import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import SuperAdminChangePasswordForm from "@/components/super-admin/change-password-form";

export const metadata: Metadata = {
  title: "Change Password | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

export default function SuperAdminChangePasswordPage() {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading password settings…</div>}>
      <div className="super-admin-record-detail-page">
        <div className="super-admin-page-heading">
          <div>
            <div className="super-admin-breadcrumb">Profile &amp; Account / Security</div>
            <h1>Change Password</h1>
            <p>Verify your current password before setting a new one.</p>
          </div>
          <Link className="super-admin-back-action" href="/super-admin/account">
            <ArrowLeft size={16} /> My profile
          </Link>
        </div>
        <section className="super-admin-panel super-admin-profile-edit-panel">
          <div className="super-admin-panel-heading">
            <div>
              <h2><KeyRound aria-hidden="true" size={17} /> Update account password</h2>
              <p>Use a unique password with at least 12 characters.</p>
            </div>
          </div>
          <SuperAdminChangePasswordForm />
          <p className="super-admin-password-session-note">
            Changing your password invalidates active sessions. Sign in again with your new password.
          </p>
        </section>
      </div>
    </Suspense>
  );
}
