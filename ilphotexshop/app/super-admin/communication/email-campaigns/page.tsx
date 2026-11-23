import { Mail } from "lucide-react";
import CommunicationCampaignManager from "@/components/super-admin/communication-campaign-manager";
import CampaignActions from "@/components/super-admin/campaign-actions";
import { getCommunicationCampaigns } from "@/lib/data-access/super-admin-communication";

export default async function EmailCampaignsPage() {
  const { email } = await getCommunicationCampaigns();
  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading"><div><div className="super-admin-breadcrumb">Workspace / Communication Center / Email Campaigns</div><h1>Email Campaigns</h1><p>Draft and schedule email campaign content.</p></div><Mail size={25} /></div>
      <CommunicationCampaignManager type="email" />
      <section className="super-admin-panel super-admin-records-panel"><div className="super-admin-records-toolbar"><div><h2>Campaign records</h2><p>{email.length} campaigns</p></div></div>{email.length ? <div className="super-admin-records-table-wrap"><table className="super-admin-records-table"><thead><tr><th>Subject</th><th>Audience</th><th>Recipients</th><th>Status</th><th>Scheduled</th><th>Action</th></tr></thead><tbody>{email.map((campaign) => <tr key={campaign.id}><td><strong>{campaign.subject}</strong><span className="super-admin-audit-secondary">{campaign.content.slice(0, 120)}</span></td><td>{campaign.audience}</td><td>{campaign.recipientCount}</td><td>{campaign.status}</td><td>{campaign.scheduledAt ? campaign.scheduledAt.toISOString() : "Not scheduled"}</td><td><CampaignActions type="email" campaignId={campaign.id} status={campaign.status} /></td></tr>)}</tbody></table></div> : <div className="super-admin-records-empty"><Mail size={26} /><strong>No email campaigns</strong><span>Create a draft or scheduled campaign above.</span></div>}</section>
    </div>
  );
}
