import type { Metadata } from "next";
import { ChartNoAxesCombined, Search } from "lucide-react";
import { getCampaignPerformance } from "@/lib/data-access/super-admin-marketing";

export const metadata: Metadata = { title: "Campaign Performance | ILPhotoX Shop", robots: { index: false, follow: false } };

export default async function CampaignPerformancePage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim().slice(0, 100);
  const data = await getCampaignPerformance(query, 1);
  const totalViews = data.rows.reduce((sum, row) => sum + row.views, 0);
  const totalClicks = data.rows.reduce((sum, row) => sum + row.clicks, 0);
  const totalConversions = data.rows.reduce((sum, row) => sum + row.conversions, 0);
  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading"><div><div className="super-admin-breadcrumb">Workspace / Marketing &amp; Promotions / Campaign Performance</div><h1>Campaign Performance</h1><p>Measured views, clicks and conversions recorded by campaign events.</p></div><ChartNoAxesCombined size={25} /></div>
      <section aria-label="Campaign performance summary" className="super-admin-records-summary">
        <article className="super-admin-summary-card is-active"><span>Views</span><strong>{totalViews.toLocaleString("en-RW")}</strong></article>
        <article className="super-admin-summary-card"><span>Clicks</span><strong>{totalClicks.toLocaleString("en-RW")}</strong></article>
        <article className="super-admin-summary-card"><span>Conversions</span><strong>{totalConversions.toLocaleString("en-RW")}</strong></article>
      </section>
      <section className="super-admin-panel super-admin-records-panel"><div className="super-admin-records-toolbar"><div><h2>Campaign metrics</h2><p>{data.total.toLocaleString("en-RW")} matching campaigns</p></div><form action="/super-admin/marketing/campaign-performance" className="super-admin-record-search" role="search"><Search size={17} /><input aria-label="Search campaign performance" defaultValue={query} name="q" maxLength={100} placeholder="Search campaign or kind" type="search" /><button type="submit">Search</button></form></div>
        {data.rows.length ? <div className="super-admin-records-table-wrap"><table className="super-admin-records-table"><thead><tr><th>Campaign</th><th>Kind</th><th>Views</th><th>Clicks</th><th>Conversions</th><th>Conversion value</th><th>Status</th></tr></thead><tbody>{data.rows.map((row) => <tr key={row.id}><td><strong>{row.name}</strong></td><td>{row.kind}</td><td>{row.views}</td><td>{row.clicks}</td><td>{row.conversions}</td><td>{row.conversionValue.toLocaleString("en-RW")}</td><td>{row.status}</td></tr>)}</tbody></table></div> : <div className="super-admin-records-empty"><ChartNoAxesCombined size={26} /><strong>No campaign data</strong><span>Metrics appear after campaign events are recorded.</span></div>}
      </section>
    </div>
  );
}
