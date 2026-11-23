import { notFound } from "next/navigation";
import { LifeBuoy } from "lucide-react";
import SupportTicketDetailActions from "@/components/super-admin/support-ticket-detail-actions";
import { getSupportTicketDetails } from "@/lib/data-access/super-admin-communication";

export default async function SupportTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await getSupportTicketDetails(id);
  if (!ticket) notFound();
  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">Workspace / Communication Center / Support Tickets / Ticket</div>
          <h1>{ticket.subject}</h1>
          <p>{ticket.status} · {ticket.priority} · {ticket.category}</p>
        </div>
        <LifeBuoy size={25} />
      </div>
      <section className="super-admin-panel super-admin-conversation-thread">
        <SupportTicketDetailActions
          ticketId={ticket.id}
          status={ticket.status}
          assigneeEmail={ticket.assignee?.email ?? ""}
        />
        <div className="super-admin-conversation-messages">
          <article className="super-admin-conversation-message">
            <strong>{ticket.requester?.name ?? ticket.guestName ?? "Guest requester"}</strong>
            <small>{ticket.createdAt.toISOString()}</small>
            <p>{ticket.description}</p>
          </article>
          {ticket.messages.map((message) => (
            <article className="super-admin-conversation-message" key={message.id}>
              <strong>{message.sender?.name ?? "Unknown user"}</strong>
              <small>{message.createdAt.toISOString()}</small>
              <p>{message.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
