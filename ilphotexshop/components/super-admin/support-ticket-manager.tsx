"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SupportTicketManager() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState("normal");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function createTicket() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/super-admin/communication/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, description, category, priority }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Support ticket could not be created.");
      }
      setSubject("");
      setDescription("");
      router.refresh();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Support ticket could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="super-admin-panel super-admin-records-panel">
      <div className="super-admin-records-toolbar"><div><h2>Create support ticket</h2><p>Record an issue for internal review.</p></div></div>
      <div className="super-admin-communication-form">
        <label>Subject<input maxLength={200} onChange={(event) => setSubject(event.target.value)} value={subject} /></label>
        <label>Description<textarea maxLength={4000} onChange={(event) => setDescription(event.target.value)} rows={4} value={description} /></label>
        <label>Category<input maxLength={100} onChange={(event) => setCategory(event.target.value)} value={category} /></label>
        <label>Priority<select onChange={(event) => setPriority(event.target.value)} value={priority}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
        <button className="super-admin-primary-action" disabled={busy || subject.trim().length < 3 || description.trim().length < 3} onClick={createTicket} type="button">{busy ? "Creating…" : "Create ticket"}</button>
        {message && <p className="super-admin-row-action-error" role="alert">{message}</p>}
      </div>
    </section>
  );
}
