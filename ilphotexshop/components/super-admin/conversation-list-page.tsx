import { MessageSquare } from "lucide-react";
import Link from "next/link";
import ConversationManager from "@/components/super-admin/conversation-manager";
import { getCommunicationConversations } from "@/lib/data-access/super-admin-communication";

type ConversationKind = "customer" | "merchant" | "staff";

export default async function ConversationListPage({
  kind,
  title,
  live = false,
}: {
  kind: ConversationKind;
  title: string;
  live?: boolean;
}) {
  const conversations = await getCommunicationConversations(kind);
  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">Workspace / Communication Center / {title}</div>
          <h1>{title}</h1>
          <p>{live ? "Internal real-time-style conversation threads." : `Internal ${kind} communication threads.`}</p>
        </div>
        <MessageSquare size={25} />
      </div>
      <ConversationManager live={live} type={kind} />
      <section className="super-admin-panel super-admin-records-panel">
        <div className="super-admin-records-toolbar">
          <div><h2>{title} records</h2><p>{conversations.length} matching threads</p></div>
        </div>
        {conversations.length ? (
          <div className="super-admin-records-table-wrap">
            <table className="super-admin-records-table">
              <thead><tr><th>Subject</th><th>Participants</th><th>Status</th><th>Messages</th><th>Action</th></tr></thead>
              <tbody>
                {conversations.map((conversation) => (
                  <tr key={conversation.id}>
                    <td><strong>{conversation.subject}</strong></td>
                    <td>{conversation.participants.map((participant) => participant.name).join(", ") || "None"}</td>
                    <td>{conversation.status}</td>
                    <td>{conversation._count.messages}</td>
                    <td>
                      <Link
                        className="super-admin-view-action"
                        href={`/super-admin/communication/conversations/${encodeURIComponent(conversation.id)}`}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="super-admin-records-empty">
            <MessageSquare size={26} />
            <strong>No {title.toLowerCase()}</strong>
            <span>Create the first thread above.</span>
          </div>
        )}
      </section>
    </div>
  );
}
