import { MessageCircle } from "lucide-react";
import CommunicationCampaignManager from "@/components/super-admin/communication-campaign-manager";
import CampaignActions from "@/components/super-admin/campaign-actions";
import { getCommunicationCampaigns } from "@/lib/data-access/super-admin-communication";

export default async function SmsCampaignsPage() {
  const { sms } = await getCommunicationCampaigns();
  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading"><div><div className="super-admin-breadcrumb">Workspace / Communication Center / SMS Campaigns</div><h1>SMS Campaigns</h1><p>Draft and schedule SMS campaign content.</p></div><MessageCircle size={25} /></div>
      <CommunicationCampaignManager type="sms" />
      <section className="super-admin-panel super-admin-records-panel"><div className="super-admin-records-toolbar"><div><h2>Campaign records</h2><p>{sms.length} campaigns</p></div></div>{sms.length ? <div className="super-admin-records-table-wrap"><table className="super-admin-records-table"><thead><tr><th>Name</th><th>Audience</th><th>Recipients</th><th>Status</th><th>Scheduled</th><th>Action</th></tr></thead><tbody>{sms.map((campaign) => <tr key={campaign.id}><td><strong>{campaign.name}</strong><span className="super-admin-audit-secondary">{campaign.message}</span></td><td>{campaign.audience}</td><td>{campaign.recipientCount}</td><td>{campaign.status}</td><td>{campaign.scheduledAt ? campaign.scheduledAt.toISOString() : "Not scheduled"}</td><td><CampaignActions type="sms" campaignId={campaign.id} status={campaign.status} /></td></tr>)}</tbody></table></div> : <div className="super-admin-records-empty"><MessageCircle size={26} /><strong>No SMS campaigns</strong><span>Create a draft or scheduled campaign above.</span></div>}</section>
    </div>
  );
}
