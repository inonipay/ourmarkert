import type { Metadata } from "next";
import { MessageCircleWarning, Search } from "lucide-react";
import { getSuperAdminDisputes } from "@/lib/data-access/super-admin-orders";
import OrderDisputeActions from "@/components/super-admin/order-dispute-actions";

export const metadata: Metadata = { title: "Order Disputes | ILPhotoX Shop", robots: { index: false, follow: false } };

export default async function OrderDisputesPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; page?: string | string[] }> }) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Math.min(500, Number.parseInt(Array.isArray(params.page) ? params.page[0] ?? "1" : params.page ?? "1", 10) || 1));
  const data = await getSuperAdminDisputes(query, page);
  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading"><div><div className="super-admin-breadcrumb">Workspace / Order Management / Disputes</div><h1>Order Disputes</h1><p>Review and resolve customer order disputes.</p></div><MessageCircleWarning size={25} /></div>
      <section className="super-admin-panel super-admin-records-panel"><div className="super-admin-records-toolbar"><div><h2>Dispute records</h2><p>{data.total.toLocaleString("en-RW")} matching disputes</p></div><form action="/super-admin/orders/disputes" className="super-admin-record-search" role="search"><Search size={17} /><input aria-label="Search disputes" defaultValue={query} name="q" maxLength={100} placeholder="Search order or reason" type="search" /><button type="submit">Search</button></form></div>
        {data.rows.length ? <div className="super-admin-records-table-wrap"><table className="super-admin-records-table"><thead><tr><th>Order</th><th>Reason</th><th>Resolution</th><th>Status</th><th>Action</th></tr></thead><tbody>{data.rows.map((dispute) => <tr key={dispute.id}><td><strong>#{dispute.orderId.slice(-8).toUpperCase()}</strong></td><td>{dispute.reason}</td><td>{dispute.resolution ?? "—"}</td><td>{dispute.status}</td><td><OrderDisputeActions disputeId={dispute.id} status={dispute.status} /></td></tr>)}</tbody></table></div> : <div className="super-admin-records-empty"><MessageCircleWarning size={26} /><strong>No order disputes</strong><span>Customer dispute requests will appear here.</span></div>}
      </section>
    </div>
  );
}
