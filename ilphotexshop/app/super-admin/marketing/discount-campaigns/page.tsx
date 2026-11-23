import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { CampaignCreator, MarketingStatusToggle } from "@/components/super-admin/marketing-actions";
import { getCampaigns } from "@/lib/data-access/super-admin-marketing";

export const metadata: Metadata = { title: "Discount Campaigns | ILPhotoX Shop", robots: { index: false, follow: false } };
const dateFormat = new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeZone: "UTC" });

export default async function DiscountCampaignsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim().slice(0, 100);
  const data = await getCampaigns(query, 1);
  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading"><div><div className="super-admin-breadcrumb">Workspace / Marketing &amp; Promotions / Discount Campaigns</div><h1>Discount Campaigns</h1><p>Schedule platform-wide promotional campaigns.</p></div><Megaphone size={25} /></div>
      <section aria-label="Campaign summary" className="super-admin-records-summary"><article className="super-admin-summary-card is-active"><span>Campaigns</span><strong>{data.total.toLocaleString("en-RW")}</strong></article></section>
      <section className="super-admin-panel super-admin-announcement-create-panel"><div className="super-admin-panel-heading"><div><h2>Create campaign</h2><p>Campaign dates and status are persisted</p></div></div><CampaignCreator /></section>
      <section className="super-admin-panel super-admin-records-panel"><div className="super-admin-records-toolbar"><div><h2>Campaign list</h2><p>{data.total.toLocaleString("en-RW")} matching campaigns</p></div><form action="/super-admin/marketing/discount-campaigns" className="super-admin-record-search" role="search"><input aria-label="Search campaigns" defaultValue={query} name="q" maxLength={100} placeholder="Search campaign or kind" type="search" /><button type="submit">Search</button></form></div>
        {data.rows.length ? <div className="super-admin-records-table-wrap"><table className="super-admin-records-table"><thead><tr><th>Name</th><th>Kind</th><th>Validity</th><th>Status</th><th>Events</th><th>Action</th></tr></thead><tbody>{data.rows.map((campaign) => <tr key={campaign.id}><td><strong>{campaign.name}</strong></td><td>{campaign.kind}</td><td>{dateFormat.format(campaign.startsAt)}–{dateFormat.format(campaign.endsAt)}</td><td>{campaign.status}</td><td>{campaign._count.events}</td><td><MarketingStatusToggle kind="campaign" id={campaign.id} status={campaign.status} /></td></tr>)}</tbody></table></div> : <div className="super-admin-records-empty"><Megaphone size={26} /><strong>No campaigns</strong><span>Create the first campaign above.</span></div>}
      </section>
    </div>
  );
}
