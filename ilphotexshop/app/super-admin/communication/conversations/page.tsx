import { MessageSquare } from "lucide-react";
import Link from "next/link";
import ConversationManager from "@/components/super-admin/conversation-manager";
import { getCommunicationConversations } from "@/lib/data-access/super-admin-communication";

export default async function AllConversationsPage() {
  const conversations = await getCommunicationConversations();
  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div><div className="super-admin-breadcrumb">Workspace / Communication Center / All Conversations</div><h1>All Conversations</h1><p>Internal customer, merchant, and staff message threads.</p></div>
        <MessageSquare size={25} />
      </div>
      <ConversationManager />
      <ConversationsList conversations={conversations} />
    </div>
  );
}

function ConversationsList({ conversations }: { conversations: Awaited<ReturnType<typeof getCommunicationConversations>> }) {
  return (
    <section className="super-admin-panel super-admin-records-panel">
      <div className="super-admin-records-toolbar"><div><h2>Conversation records</h2><p>{conversations.length} threads</p></div></div>
      {conversations.length ? (
        <div className="super-admin-records-table-wrap">
          <table className="super-admin-records-table">
            <thead><tr><th>Subject</th><th>Type</th><th>Participants</th><th>Status</th><th>Messages</th><th>Action</th></tr></thead>
            <tbody>
              {conversations.map((conversation) => (
                <tr key={conversation.id}>
                  <td><strong>{conversation.subject}</strong></td>
                  <td>{conversation.type}</td>
                  <td>{conversation.participants.map((participant) => participant.name).join(", ") || "None"}</td>
                  <td>{conversation.status}</td>
                  <td>{conversation._count.messages}</td>
                  <td>
                    <Link className="super-admin-view-action" href={`/super-admin/communication/conversations/${encodeURIComponent(conversation.id)}`}>Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="super-admin-records-empty"><MessageSquare size={26} /><strong>No conversations</strong><span>Create the first conversation above.</span></div>
      )}
    </section>
  );
}
