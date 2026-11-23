import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Layers3 } from "lucide-react";
import { getSuperAdminProductCategoryCounts } from "@/lib/data-access/super-admin-records";

export const metadata: Metadata = {
  title: "Product Categories | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

function formatCategory(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export default async function SuperAdminProductCategoriesPage() {
  const categories = await getSuperAdminProductCategoryCounts();

  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">
            Workspace / Product Management / Categories
          </div>
          <h1>Product categories</h1>
          <p>Browse catalog products grouped by the supported categories.</p>
        </div>
        <Layers3 aria-hidden="true" size={25} />
      </div>

      <p className="super-admin-data-note" role="note">
        Categories are currently fixed by the marketplace catalog. Adding or
        renaming categories is not available in this workspace.
      </p>

      <section
        aria-label="Product categories"
        className="super-admin-records-summary"
      >
        {categories.map(({ category, count }) => (
          <Link
            className="super-admin-summary-card"
            href={`/super-admin/products?category=${encodeURIComponent(category)}`}
            key={category}
          >
            <span>{formatCategory(category)}</span>
            <strong>{count.toLocaleString("en-RW")}</strong>
            <span>
              View products <ArrowUpRight aria-hidden="true" size={14} />
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
