import type { Metadata } from "next";
import { TicketPercent } from "lucide-react";
import { CouponCreator, MarketingStatusToggle } from "@/components/super-admin/marketing-actions";
import { getCoupons } from "@/lib/data-access/super-admin-marketing";

export const metadata: Metadata = { title: "Coupons & Discount Codes | ILPhotoX Shop", robots: { index: false, follow: false } };
const dateFormat = new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeZone: "UTC" });

export default async function CouponsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; page?: string | string[] }> }) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Math.min(500, Number.parseInt(Array.isArray(params.page) ? params.page[0] ?? "1" : params.page ?? "1", 10) || 1));
  const data = await getCoupons(query, page);
  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading"><div><div className="super-admin-breadcrumb">Workspace / Marketing &amp; Promotions / Coupons</div><h1>Coupons &amp; Discount Codes</h1><p>Create codes and control usage limits.</p></div><TicketPercent size={25} /></div>
      <section aria-label="Coupon summary" className="super-admin-records-summary"><article className="super-admin-summary-card is-active"><span>Coupons</span><strong>{data.total.toLocaleString("en-RW")}</strong></article><article className="super-admin-summary-card"><span>Redemptions</span><strong>{data.redemptions.toLocaleString("en-RW")}</strong></article></section>
      <section className="super-admin-panel super-admin-announcement-create-panel"><div className="super-admin-panel-heading"><div><h2>Create coupon</h2><p>Coupon rules are validated before creation</p></div></div><CouponCreator /></section>
      <section className="super-admin-panel super-admin-records-panel"><div className="super-admin-records-toolbar"><div><h2>Coupon list</h2><p>{data.total.toLocaleString("en-RW")} matching coupons</p></div><form action="/super-admin/marketing/coupons-discount-codes" className="super-admin-record-search" role="search"><input aria-label="Search coupons" defaultValue={query} name="q" maxLength={100} placeholder="Search code or name" type="search" /><button type="submit">Search</button></form></div>
        {data.rows.length ? <div className="super-admin-records-table-wrap"><table className="super-admin-records-table"><thead><tr><th>Code</th><th>Name</th><th>Discount</th><th>Validity</th><th>Usage</th><th>Status</th><th>Action</th></tr></thead><tbody>{data.rows.map((coupon) => <tr key={coupon.id}><td><code>{coupon.code}</code></td><td>{coupon.name}</td><td>{coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString("en-RW")} RWF`}</td><td>{dateFormat.format(coupon.startsAt)}–{dateFormat.format(coupon.endsAt)}</td><td>{coupon._count.redemptions}/{coupon.usageLimit ?? "Unlimited"}</td><td>{coupon.status}</td><td><MarketingStatusToggle kind="coupon" id={coupon.id} status={coupon.status} /></td></tr>)}</tbody></table></div> : <div className="super-admin-records-empty"><TicketPercent size={26} /><strong>No coupons</strong><span>Create the first discount code above.</span></div>}
      </section>
    </div>
  );
}
