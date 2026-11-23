import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { getCampaigns } from "@/lib/data-access/super-admin-marketing";
export const metadata: Metadata = { title: "Special Offers | ILPhotoX Shop", robots: { index: false, follow: false } };
export default async function SpecialOffersPage() {
  const data = await getCampaigns("special_offer", 1);
  return <div className="super-admin-records-page"><div className="super-admin-records-heading"><div><div className="super-admin-breadcrumb">Workspace / Marketing &amp; Promotions / Special Offers</div><h1>Special Offers</h1><p>Campaigns classified as special offers.</p></div><Sparkles size={25} /></div><section className="super-admin-panel super-admin-records-panel"><div className="super-admin-records-toolbar"><div><h2>Special offers</h2><p>{data.total.toLocaleString("en-RW")} matching campaigns</p></div></div>{data.rows.length ? <div className="super-admin-records-table-wrap"><table className="super-admin-records-table"><thead><tr><th>Name</th><th>Status</th><th>Events</th></tr></thead><tbody>{data.rows.filter((row) => row.kind === "special_offer").map((row) => <tr key={row.id}><td><strong>{row.name}</strong></td><td>{row.status}</td><td>{row._count.events}</td></tr>)}</tbody></table></div> : <div className="super-admin-records-empty"><Sparkles size={26} /><strong>No special offers</strong><span>Create a special-offer campaign in Discount Campaigns.</span></div>}</section></div>;
}
