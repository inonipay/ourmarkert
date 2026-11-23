import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, PackageX, Search } from "lucide-react";
import { getSuperAdminProductManagement, SUPER_ADMIN_PRODUCT_MANAGEMENT_PAGE_SIZE } from "@/lib/data-access/super-admin-product-management";

export const metadata: Metadata = { title: "Rejected Products | ILPhotoX Shop", robots: { index: false, follow: false } };

export default async function RejectedProductsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; page?: string | string[] }> }) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim().slice(0, 100);
  const parsedPage = Number.parseInt(Array.isArray(params.page) ? params.page[0] ?? "1" : params.page ?? "1", 10);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const data = await getSuperAdminProductManagement("rejected", query, page);
  const pageCount = Math.max(1, Math.ceil(data.total / SUPER_ADMIN_PRODUCT_MANAGEMENT_PAGE_SIZE));
  if (page > pageCount) redirect("/super-admin/products/rejected-products");
  return <div className="super-admin-records-page"><div className="super-admin-records-heading"><div><div className="super-admin-breadcrumb">Workspace / Product Management / Rejected Products</div><h1>Rejected Products</h1><p>Listings that failed moderation, with their recorded rejection reason.</p></div><PackageX size={25} /></div><section className="super-admin-panel super-admin-records-panel"><div className="super-admin-records-toolbar"><div><h2>Rejected listings</h2><p>{data.total.toLocaleString("en-RW")} matching products</p></div><form action="/super-admin/products/rejected-products" className="super-admin-record-search" role="search"><Search size={17} /><input aria-label="Search rejected products" defaultValue={query} name="q" maxLength={100} placeholder="Search product or merchant" type="search" /><button type="submit">Search</button></form></div>{data.rows.length ? <div className="super-admin-records-table-wrap"><table className="super-admin-records-table"><thead><tr><th>Product</th><th>Merchant</th><th>Reason</th><th>Action</th></tr></thead><tbody>{data.rows.map((product) => <tr key={product.id}><td><strong>{product.name}</strong></td><td>{product.seller}</td><td>{product.moderationReason ?? "No reason recorded"}</td><td><Link className="super-admin-view-action" href={`/super-admin/records/products/${encodeURIComponent(product.id)}`}><Eye size={15} /> View</Link></td></tr>)}</tbody></table></div> : <div className="super-admin-records-empty"><PackageX size={26} /><strong>No rejected products</strong><span>Rejected moderation decisions will appear here.</span></div>}</section></div>;
}
