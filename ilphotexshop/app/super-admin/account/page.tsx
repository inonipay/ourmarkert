import { Suspense } from "react";
import type { Metadata } from "next";
import { Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import SuperAdminProfileForm from "@/components/super-admin/profile-form";
import { getSuperAdminProfile } from "@/lib/data-access/super-admin-profile";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "My Profile | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

const dateFormat = new Intl.DateTimeFormat("en-RW", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default function SuperAdminProfilePage() {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading your profile…</div>}>
      <SuperAdminProfileContent />
    </Suspense>
  );
}

async function SuperAdminProfileContent() {
  const profile = await getSuperAdminProfile();
  if (!profile) notFound();

  const initials = profile.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="super-admin-record-detail-page">
      <div className="super-admin-page-heading">
        <div>
          <div className="super-admin-breadcrumb">Profile &amp; Account / My Profile</div>
          <h1>My Profile</h1>
          <p>Manage the personal details for your Super Admin account.</p>
        </div>
      </div>

      <section aria-label="Account details" className="super-admin-panel super-admin-profile-card">
        <div className="super-admin-profile-identity">
          <div aria-hidden="true" className="super-admin-profile-avatar">
            {initials || <UserRound size={24} />}
          </div>
          <div>
            <h2>{profile.name}</h2>
            <span><ShieldCheck aria-hidden="true" size={15} /> Super Administrator</span>
          </div>
        </div>
        <dl className="super-admin-profile-details">
          <div>
            <dt><Mail aria-hidden="true" size={16} /> Email</dt>
            <dd>{profile.email}</dd>
          </div>
          <div>
            <dt><Phone aria-hidden="true" size={16} /> Phone</dt>
            <dd>{profile.phone || "Not provided"}</dd>
          </div>
          <div>
            <dt>Member since</dt>
            <dd>{dateFormat.format(profile.createdAt)}</dd>
          </div>
        </dl>
        <p className="super-admin-profile-note">
          Email and account role are protected and cannot be changed here.
        </p>
      </section>

      <section className="super-admin-panel super-admin-profile-edit-panel">
        <div className="super-admin-panel-heading">
          <div>
            <h2>Edit profile</h2>
            <p>Update your name and contact phone number.</p>
          </div>
        </div>
        <SuperAdminProfileForm name={profile.name} phone={profile.phone} />
      </section>
    </div>
  );
}
