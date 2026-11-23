import type { Metadata } from "next";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { BannerCreator, MarketingStatusToggle } from "@/components/super-admin/marketing-actions";
import { getBanners } from "@/lib/data-access/super-admin-marketing";

export const metadata: Metadata = { title: "Homepage Banners | ILPhotoX Shop", robots: { index: false, follow: false } };
const dateFormat = new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeZone: "UTC" });

export default async function HomepageBannersPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim().slice(0, 100);
  const data = await getBanners(query, 1);
  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading"><div><div className="super-admin-breadcrumb">Workspace / Marketing &amp; Promotions / Homepage Banners</div><h1>Homepage Banners</h1><p>Create scheduled promotional banners for storefront placements.</p></div><ImageIcon size={25} /></div>
      <section aria-label="Banner summary" className="super-admin-records-summary"><article className="super-admin-summary-card is-active"><span>Banners</span><strong>{data.total.toLocaleString("en-RW")}</strong></article></section>
      <section className="super-admin-panel super-admin-announcement-create-panel"><div className="super-admin-panel-heading"><div><h2>Create banner</h2><p>Image URLs must be valid HTTPS or allowed application URLs</p></div></div><BannerCreator /></section>
      <section className="super-admin-panel super-admin-records-panel"><div className="super-admin-records-toolbar"><div><h2>Banner list</h2><p>{data.total.toLocaleString("en-RW")} matching banners</p></div><form action="/super-admin/marketing/homepage-banners" className="super-admin-record-search" role="search"><input aria-label="Search banners" defaultValue={query} name="q" maxLength={100} placeholder="Search title or subtitle" type="search" /><button type="submit">Search</button></form></div>
        {data.rows.length ? <div className="super-admin-records-table-wrap"><table className="super-admin-records-table"><thead><tr><th>Banner</th><th>Placement</th><th>Position</th><th>Validity</th><th>Status</th><th>Action</th></tr></thead><tbody>{data.rows.map((banner) => <tr key={banner.id}><td><div className="super-admin-featured-product-cell"><Image alt="" height={44} src={banner.imageUrl} unoptimized width={44} /><strong>{banner.title}</strong></div></td><td>{banner.placement}</td><td>{banner.position}</td><td>{dateFormat.format(banner.startsAt)}–{dateFormat.format(banner.endsAt)}</td><td>{banner.status}</td><td><MarketingStatusToggle kind="banner" id={banner.id} status={banner.status} /></td></tr>)}</tbody></table></div> : <div className="super-admin-records-empty"><ImageIcon size={26} /><strong>No banners</strong><span>Create the first banner above.</span></div>}
      </section>
    </div>
  );
}
