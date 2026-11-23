import { CircleHelp } from "lucide-react";

const articles = [
  ["How do announcements work?", "Announcements appear in-app to signed-in users in the selected audience during the scheduled period."],
  ["How are support tickets managed?", "Tickets can be assigned, moved to in progress, resolved, or closed from Support Tickets."],
  ["Can email and SMS be sent now?", "Campaign content can be drafted and scheduled, but external email/SMS delivery requires a configured provider."],
  ["How do live chat threads work?", "Live Chat creates internal conversation threads that are stored and available to authorized staff."],
];

export default function HelpCenterPage() {
  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading"><div><div className="super-admin-breadcrumb">Workspace / Communication Center / Help Center</div><h1>Help Center</h1><p>Guidance for communication center workflows.</p></div><CircleHelp size={25} /></div>
      <section className="super-admin-panel super-admin-records-panel"><div className="super-admin-records-toolbar"><div><h2>Communication help</h2><p>{articles.length} articles</p></div></div><div className="super-admin-help-grid">{articles.map(([question, answer]) => <article className="super-admin-panel" key={question}><h3>{question}</h3><p>{answer}</p></article>)}</div></section>
    </div>
  );
}
