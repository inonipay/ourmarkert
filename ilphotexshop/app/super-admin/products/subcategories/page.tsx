import type { Metadata } from "next";
import { Layers3 } from "lucide-react";
import ProductSubcategoryManager, { ProductSubcategoryStatusAction } from "@/components/super-admin/product-subcategory-manager";
import { getProductSubcategories } from "@/lib/data-access/super-admin-product-management";

export const metadata: Metadata = { title: "Product Subcategories | ILPhotoX Shop", robots: { index: false, follow: false } };

export default async function ProductSubcategoriesPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim().slice(0, 100);
  const data = await getProductSubcategories(query);
  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading"><div><div className="super-admin-breadcrumb">Workspace / Product Management / Subcategories</div><h1>Product Subcategories</h1><p>Create and manage subcategories inside fixed marketplace categories.</p></div><Layers3 size={25} /></div>
      <section aria-label="Subcategory summary" className="super-admin-records-summary"><article className="super-admin-summary-card is-active"><span>Active</span><strong>{data.active.toLocaleString("en-RW")}</strong></article><article className="super-admin-summary-card"><span>Inactive</span><strong>{data.inactive.toLocaleString("en-RW")}</strong></article></section>
      <section className="super-admin-panel super-admin-announcement-create-panel"><div className="super-admin-panel-heading"><div><h2>Add subcategory</h2><p>Unique within a parent category</p></div></div><ProductSubcategoryManager /></section>
      <section className="super-admin-panel super-admin-records-panel"><div className="super-admin-records-toolbar"><div><h2>Subcategory catalog</h2><p>{data.rows.length.toLocaleString("en-RW")} matching subcategories</p></div><form action="/super-admin/products/subcategories" className="super-admin-record-search" role="search"><input aria-label="Search subcategories" defaultValue={query} name="q" maxLength={100} placeholder="Search name or slug" type="search" /><button type="submit">Search</button></form></div>
        {data.rows.length ? <div className="super-admin-records-table-wrap"><table className="super-admin-records-table"><thead><tr><th>Name</th><th>Category</th><th>Slug</th><th>Products</th><th>Status</th><th>Action</th></tr></thead><tbody>{data.rows.map((row) => <tr key={row.id}><td><strong>{row.name}</strong></td><td>{row.category}</td><td><code>{row.slug}</code></td><td>{row._count.products}</td><td>{row.isActive ? "Active" : "Inactive"}</td><td><ProductSubcategoryStatusAction id={row.id} isActive={row.isActive} /></td></tr>)}</tbody></table></div> : <div className="super-admin-records-empty"><Layers3 size={26} /><strong>No subcategories</strong><span>Create the first subcategory above.</span></div>}
      </section>
    </div>
  );
}
