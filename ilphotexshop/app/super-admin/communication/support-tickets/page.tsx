import { LifeBuoy } from "lucide-react";
import Link from "next/link";
import SupportTicketManager from "@/components/super-admin/support-ticket-manager";
import SupportTicketActions from "@/components/super-admin/support-ticket-actions";
import { getSupportTickets } from "@/lib/data-access/super-admin-communication";

export default async function SupportTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim();
  const tickets = await getSupportTickets(query);
  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div><div className="super-admin-breadcrumb">Workspace / Communication Center / Support Tickets</div><h1>Support Tickets</h1><p>Track customer and merchant support requests.</p></div>
        <LifeBuoy size={25} />
      </div>
      <SupportTicketManager />
      <section className="super-admin-panel super-admin-records-panel">
        <div className="super-admin-records-toolbar"><div><h2>Ticket records</h2><p>{tickets.length} matching tickets</p></div></div>
        {tickets.length ? (
          <div className="super-admin-records-table-wrap">
            <table className="super-admin-records-table">
              <thead><tr><th>Ticket</th><th>Requester</th><th>Category</th><th>Priority</th><th>Status</th><th>Assignee</th><th>Action</th></tr></thead>
              <tbody>{tickets.map((ticket) => <tr key={ticket.id}><td><strong>{ticket.subject}</strong><span className="super-admin-audit-secondary">{ticket.description}</span></td><td><strong>{ticket.requester?.name ?? ticket.guestName ?? "Guest"}</strong>{(ticket.requester?.email ?? ticket.guestEmail) && <span className="super-admin-audit-secondary">{ticket.requester?.email ?? ticket.guestEmail}</span>}</td><td>{ticket.category}</td><td>{ticket.priority}</td><td>{ticket.status}</td><td>{ticket.assignee?.name ?? "Unassigned"}</td><td><Link className="super-admin-view-action" href={`/super-admin/communication/support-tickets/${encodeURIComponent(ticket.id)}`}>Open</Link> <SupportTicketActions ticketId={ticket.id} status={ticket.status} /></td></tr>)}</tbody>
            </table>
          </div>
        ) : <div className="super-admin-records-empty"><LifeBuoy size={26} /><strong>No support tickets</strong><span>Create the first ticket above.</span></div>}
      </section>
    </div>
  );
}
