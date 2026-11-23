import { Suspense } from "react";
import type { Metadata } from "next";
import { Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import MerchantProfileForm from "@/components/merchant/profile-form";
import { requireMerchantPageUser } from "@/lib/authorization";
import { getMerchantProfile } from "@/lib/data-access/merchant-dashboard";

export const metadata: Metadata = {
  title: "My account | Merchant portal",
};

const dateFormat = new Intl.DateTimeFormat("en-RW", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default function MerchantProfilePage() {
  return (
    <Suspense fallback={<div className="merchant-loading">Loading your account…</div>}>
      <MerchantProfileContent />
    </Suspense>
  );
}

async function MerchantProfileContent() {
  const seller = await requireMerchantPageUser();
  const profile = await getMerchantProfile(seller);

  return (
    <div className="merchant-page">
      <div className="merchant-page-heading">
        <div>
          <div className="merchant-breadcrumb">Workspace / My account</div>
          <h1>My account</h1>
          <p>View the details associated with your seller account.</p>
        </div>
      </div>
      <section className="merchant-panel merchant-profile-card">
        <div className="merchant-profile-avatar">
          <UserRound aria-hidden="true" size={28} />
        </div>
        <div className="merchant-profile-heading">
          <h2>{profile?.name ?? seller.name}</h2>
          <span><ShieldCheck aria-hidden="true" size={15} /> Seller account</span>
        </div>
        <dl className="merchant-profile-details">
          <div>
            <dt><Mail aria-hidden="true" size={16} /> Email</dt>
            <dd>{profile?.email ?? seller.email}</dd>
          </div>
          <div>
            <dt><Phone aria-hidden="true" size={16} /> Phone</dt>
            <dd>{profile?.phone || "Not provided"}</dd>
          </div>
          <div>
            <dt>Member since</dt>
            <dd>{profile ? dateFormat.format(profile.createdAt) : "—"}</dd>
          </div>
        </dl>
      </section>
      <section className="merchant-panel merchant-form-panel">
        <div className="merchant-panel-heading">
          <div>
            <h2>Edit profile</h2>
            <p>Update the name and phone number for your seller account.</p>
          </div>
        </div>
        <MerchantProfileForm
          name={profile?.name ?? seller.name}
          phone={profile?.phone ?? null}
        />
      </section>
    </div>
  );
}
