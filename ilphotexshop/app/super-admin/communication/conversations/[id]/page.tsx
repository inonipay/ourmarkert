import { notFound } from "next/navigation";
import { MessageSquare } from "lucide-react";
import ConversationActions from "@/components/super-admin/conversation-actions";
import { getConversationDetails } from "@/lib/data-access/super-admin-communication";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conversation = await getConversationDetails(id);
  if (!conversation) notFound();
  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div><div className="super-admin-breadcrumb">Workspace / Communication Center / Conversation</div><h1>{conversation.subject}</h1><p>{conversation.type} conversation · {conversation.status}</p></div>
        <MessageSquare size={25} />
      </div>
      <section className="super-admin-panel super-admin-conversation-thread">
        <ConversationActions conversationId={conversation.id} status={conversation.status} />
        <div className="super-admin-conversation-messages">
          {conversation.messages.map((message) => (
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
