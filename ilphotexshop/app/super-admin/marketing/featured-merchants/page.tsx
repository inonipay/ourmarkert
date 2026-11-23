import type { Metadata } from "next";
import { Store } from "lucide-react";
import { FeaturedMerchantManager, FeaturedMerchantToggle } from "@/components/super-admin/marketing-actions";
import { getFeaturedMerchants } from "@/lib/data-access/super-admin-marketing";

export const metadata: Metadata = { title: "Featured Merchants | ILPhotoX Shop", robots: { index: false, follow: false } };
const dateFormat = new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeZone: "UTC" });

export default async function FeaturedMerchantsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim().slice(0, 100);
  const data = await getFeaturedMerchants(query, 1);
  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading"><div><div className="super-admin-breadcrumb">Workspace / Marketing &amp; Promotions / Featured Merchants</div><h1>Featured Merchants</h1><p>Choose eligible merchants for storefront promotion.</p></div><Store size={25} /></div>
      <section aria-label="Featured merchant summary" className="super-admin-records-summary"><article className="super-admin-summary-card is-active"><span>Matching merchants</span><strong>{data.total.toLocaleString("en-RW")}</strong></article><article className="super-admin-summary-card"><span>Active featured</span><strong>{data.active.toLocaleString("en-RW")}</strong></article></section>
      <section className="super-admin-panel super-admin-announcement-create-panel"><div className="super-admin-panel-heading"><div><h2>Feature a merchant</h2><p>Suspended and anonymized accounts are excluded</p></div></div><FeaturedMerchantManager merchants={data.merchants.map(({ id, name, email, isFeaturedMerchant }) => ({ id, name, email, isFeaturedMerchant }))} /></section>
      <section className="super-admin-panel super-admin-records-panel"><div className="super-admin-records-toolbar"><div><h2>Merchant list</h2><p>{data.total.toLocaleString("en-RW")} matching merchants</p></div><form action="/super-admin/marketing/featured-merchants" className="super-admin-record-search" role="search"><input aria-label="Search merchants" defaultValue={query} name="q" maxLength={100} placeholder="Search merchant name or email" type="search" /><button type="submit">Search</button></form></div>
        {data.merchants.length ? <div className="super-admin-records-table-wrap"><table className="super-admin-records-table"><thead><tr><th>Merchant</th><th>Email</th><th>Position</th><th>Validity</th><th>Status</th><th>Action</th></tr></thead><tbody>{data.merchants.map((merchant) => { const listing = merchant.featuredMerchantListing; return <tr key={merchant.id}><td><strong>{merchant.name}</strong></td><td>{merchant.email}</td><td>{listing?.position ?? "—"}</td><td>{listing?.startsAt ? dateFormat.format(listing.startsAt) : "—"}{listing?.endsAt ? `–${dateFormat.format(listing.endsAt)}` : ""}</td><td>{merchant.isSuspended ? "Suspended" : listing?.isActive ? "Featured" : "Standard"}</td><td><FeaturedMerchantToggle merchantId={merchant.id} isFeatured={merchant.isFeaturedMerchant} /></td></tr>; })}</tbody></table></div> : <div className="super-admin-records-empty"><Store size={26} /><strong>No merchant accounts found</strong><span>Seller accounts will appear here.</span></div>}
      </section>
    </div>
  );
}
