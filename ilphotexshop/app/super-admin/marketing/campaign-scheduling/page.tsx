import type { Metadata } from "next";
import { CalendarClock } from "lucide-react";
import { getCampaigns } from "@/lib/data-access/super-admin-marketing";
export const metadata: Metadata = { title: "Campaign Scheduling | ILPhotoX Shop", robots: { index: false, follow: false } };
const dateFormat = new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
export default async function CampaignSchedulingPage() {
  const data = await getCampaigns("", 1);
  return <div className="super-admin-records-page"><div className="super-admin-records-heading"><div><div className="super-admin-breadcrumb">Workspace / Marketing &amp; Promotions / Campaign Scheduling</div><h1>Campaign Scheduling</h1><p>Review campaign start and end times.</p></div><CalendarClock size={25} /></div><section className="super-admin-panel super-admin-records-panel"><div className="super-admin-records-toolbar"><div><h2>Scheduled campaigns</h2><p>{data.total.toLocaleString("en-RW")} campaigns</p></div></div>{data.rows.length ? <div className="super-admin-records-table-wrap"><table className="super-admin-records-table"><thead><tr><th>Campaign</th><th>Kind</th><th>Starts</th><th>Ends</th><th>Status</th></tr></thead><tbody>{data.rows.map((row) => <tr key={row.id}><td><strong>{row.name}</strong></td><td>{row.kind}</td><td>{dateFormat.format(row.startsAt)}</td><td>{dateFormat.format(row.endsAt)}</td><td>{row.status}</td></tr>)}</tbody></table></div> : <div className="super-admin-records-empty"><CalendarClock size={26} /><strong>No campaigns scheduled</strong><span>Create campaigns in Discount Campaigns.</span></div>}</section></div>;
}
