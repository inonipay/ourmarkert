import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Search, TriangleAlert } from "lucide-react";
import ProductReportActions from "@/components/super-admin/product-report-actions";
import { getSuperAdminProductReports } from "@/lib/data-access/super-admin-product-management";

export const metadata: Metadata = { title: "Reported Products | ILPhotoX Shop", robots: { index: false, follow: false } };

export default async function ReportedProductsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; page?: string | string[] }> }) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim().slice(0, 100);
  const pageValue = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Math.max(1, Math.min(500, Number.parseInt(pageValue ?? "1", 10) || 1));
  const data = await getSuperAdminProductReports(query, page);
  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading"><div><div className="super-admin-breadcrumb">Workspace / Product Management / Reported Products</div><h1>Reported Products</h1><p>Review customer and staff reports against marketplace listings.</p></div><TriangleAlert size={25} /></div>
      <section aria-label="Report summary" className="super-admin-records-summary"><article className="super-admin-summary-card is-active"><span>Pending</span><strong>{data.pending.toLocaleString("en-RW")}</strong></article><article className="super-admin-summary-card"><span>Reviewed</span><strong>{data.reviewed.toLocaleString("en-RW")}</strong></article><article className="super-admin-summary-card"><span>Dismissed</span><strong>{data.dismissed.toLocaleString("en-RW")}</strong></article></section>
      <section className="super-admin-panel super-admin-records-panel"><div className="super-admin-records-toolbar"><div><h2>Product reports</h2><p>{data.total.toLocaleString("en-RW")} matching reports</p></div><form action="/super-admin/products/reported-products" className="super-admin-record-search" role="search"><Search size={17} /><input aria-label="Search reports" defaultValue={query} name="q" maxLength={100} placeholder="Search product, reporter, or reason" type="search" /><button type="submit">Search</button></form></div>
        {data.rows.length ? <div className="super-admin-records-table-wrap"><table className="super-admin-records-table"><thead><tr><th>Product</th><th>Reporter</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead><tbody>{data.rows.map((row) => <tr key={row.id}><td><strong>{row.product.name}</strong><Link className="super-admin-audit-secondary" href={`/super-admin/records/products/${encodeURIComponent(row.product.id)}`}><Eye size={12} /> View product</Link></td><td>{row.reporter.name}</td><td>{row.reason}</td><td>{row.status}</td><td>{row.status === "pending" ? <ProductReportActions reportId={row.id} /> : row.reviewedBy?.name ?? "Reviewed"}</td></tr>)}</tbody></table></div> : <div className="super-admin-records-empty"><TriangleAlert size={26} /><strong>No reported products</strong><span>Submitted reports will appear here.</span></div>}
      </section>
    </div>
  );
}
