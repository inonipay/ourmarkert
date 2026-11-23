import type { Metadata } from "next";
import { RotateCcw, Search } from "lucide-react";
import { getSuperAdminRefunds } from "@/lib/data-access/super-admin-orders";
import OrderRefundActions from "@/components/super-admin/order-refund-actions";

export const metadata: Metadata = { title: "Returns & Refund Requests | ILPhotoX Shop", robots: { index: false, follow: false } };

export default async function RefundRequestsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; page?: string | string[] }> }) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Math.min(500, Number.parseInt(Array.isArray(params.page) ? params.page[0] ?? "1" : params.page ?? "1", 10) || 1));
  const data = await getSuperAdminRefunds(query, page);
  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading"><div><div className="super-admin-breadcrumb">Workspace / Order Management / Returns &amp; Refund Requests</div><h1>Returns &amp; Refund Requests</h1><p>Review refund requests and record approved/refunded decisions.</p></div><RotateCcw size={25} /></div>
      <p className="super-admin-data-note" role="note">These actions record refund decisions only. No payout or payment gateway transfer is executed automatically.</p>
      <section className="super-admin-panel super-admin-records-panel"><div className="super-admin-records-toolbar"><div><h2>Refund requests</h2><p>{data.total.toLocaleString("en-RW")} matching requests</p></div><form action="/super-admin/orders/returns-refund-requests" className="super-admin-record-search" role="search"><Search size={17} /><input aria-label="Search refunds" defaultValue={query} name="q" maxLength={100} placeholder="Search order or reason" type="search" /><button type="submit">Search</button></form></div>
        {data.rows.length ? <div className="super-admin-records-table-wrap"><table className="super-admin-records-table"><thead><tr><th>Order</th><th>Amount</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead><tbody>{data.rows.map((refund) => <tr key={refund.id}><td><strong>#{refund.orderId.slice(-8).toUpperCase()}</strong></td><td>{refund.amount.toLocaleString("en-RW")} {refund.currency.trim()}</td><td>{refund.reason}</td><td>{refund.status}</td><td><OrderRefundActions refundId={refund.id} status={refund.status} /></td></tr>)}</tbody></table></div> : <div className="super-admin-records-empty"><RotateCcw size={26} /><strong>No refund requests</strong><span>Customer refund requests will appear here.</span></div>}
      </section>
    </div>
  );
}
