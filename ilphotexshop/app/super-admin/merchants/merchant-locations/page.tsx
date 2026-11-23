import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, MapPin, Search } from "lucide-react";
import SuperAdminCsvExportButton from "@/components/super-admin/csv-export-button";
import {
  getSuperAdminMerchantLocations,
  MERCHANT_LOCATION_PAGE_SIZE,
} from "@/lib/data-access/super-admin-merchant-locations";

export const metadata: Metadata = {
  title: "Merchant Locations | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

export default async function MerchantLocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "")
    .trim()
    .slice(0, 100);
  const pageValue = Array.isArray(params.page) ? params.page[0] : params.page;
  const parsedPage = Number.parseInt(pageValue ?? "1", 10);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0
    ? Math.min(parsedPage, 1000)
    : 1;
  const data = await getSuperAdminMerchantLocations(query, page);
  const pageCount = Math.max(1, Math.ceil(data.locationCount / MERCHANT_LOCATION_PAGE_SIZE));

  if (page > pageCount) {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    search.set("page", String(pageCount));
    redirect(`/super-admin/merchants/merchant-locations?${search.toString()}`);
  }

  const pageHref = (nextPage: number) => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    search.set("page", String(nextPage));
    return `/super-admin/merchants/merchant-locations?${search.toString()}`;
  };
  const exportRows = [
    ["Submitted address", "Businesses", "Approved applications", "Pending applications"],
    ...data.locations.map((location) => [
      location.address,
      String(location.businessCount),
      String(location.approvedCount),
      String(location.pendingCount),
    ]),
  ];

  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">
            Workspace / Merchant Management / Merchant Locations
          </div>
          <h1>Merchant Locations</h1>
          <p>Submitted business addresses grouped by exact address text.</p>
        </div>
        <MapPin aria-hidden="true" size={25} />
      </div>

      <section aria-label="Merchant location totals" className="super-admin-records-summary">
        {[
          ["Matching addresses", data.locationCount],
          ["Business applications", data.businessCount],
          ["Approved merchants", data.approvedCount],
          ["Pending applications", data.pendingCount],
        ].map(([label, count]) => (
          <article className="super-admin-summary-card" key={label}>
            <span>{label}</span>
            <strong>{Number(count).toLocaleString("en-RW")}</strong>
          </article>
        ))}
      </section>

      <p className="super-admin-data-note" role="note">
        Addresses come from merchant KYC submissions and are not geocoded or
        verified. No third-party map is used. Rejected applicant data is omitted
        because it is erased after rejection.
      </p>

      <section className="super-admin-panel super-admin-records-panel">
        <div className="super-admin-records-toolbar">
          <div>
            <h2>Submitted locations</h2>
            <p>{data.locationCount.toLocaleString("en-RW")} matching addresses</p>
          </div>
          <form
            action="/super-admin/merchants/merchant-locations"
            className="super-admin-record-search"
            role="search"
          >
            <Search aria-hidden="true" size={17} />
            <input
              aria-label="Search merchant locations"
              defaultValue={query}
              maxLength={100}
              name="q"
              placeholder="Search address, business, owner, or email"
              type="search"
            />
            <button type="submit">Search</button>
          </form>
          <SuperAdminCsvExportButton
            fileName={`merchant-locations-page-${data.page}`}
            label="Export page CSV"
            rows={exportRows}
          />
        </div>

        {data.locations.length ? (
          <>
            <div className="super-admin-records-table-wrap">
              <table className="super-admin-records-table">
                <thead>
                  <tr>
                    <th scope="col">Submitted address</th>
                    <th scope="col">Businesses</th>
                    <th scope="col">Approved</th>
                    <th scope="col">Pending</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.locations.map((location) => (
                    <tr key={location.address}>
                      <td><strong>{location.address}</strong></td>
                      <td>{location.businessCount.toLocaleString("en-RW")}</td>
                      <td>{location.approvedCount.toLocaleString("en-RW")}</td>
                      <td>{location.pendingCount.toLocaleString("en-RW")}</td>
                      <td>
                        <Link
                          className="super-admin-view-action"
                          href={`/super-admin/merchants/business-information?q=${encodeURIComponent(location.address)}`}
                        >
                          <Building2 aria-hidden="true" size={15} /> View businesses
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.locationCount > data.pageSize && (
              <nav aria-label="Merchant location pagination" className="super-admin-pagination">
                <span>
                  Showing {(data.page - 1) * data.pageSize + 1}–
                  {Math.min(data.page * data.pageSize, data.locationCount)} of {data.locationCount}
                  <strong>Page {data.page} of {pageCount}</strong>
                </span>
                <div>
                  {data.page > 1 ? (
                    <Link className="super-admin-back-action" href={pageHref(data.page - 1)}>
                      Previous
                    </Link>
                  ) : (
                    <span className="super-admin-page-disabled">Previous</span>
                  )}
                  {data.page < pageCount ? (
                    <Link className="super-admin-primary-action" href={pageHref(data.page + 1)}>
                      Next
                    </Link>
                  ) : (
                    <span className="super-admin-page-disabled">Next</span>
                  )}
                </div>
              </nav>
            )}
          </>
        ) : (
          <div className="super-admin-records-empty">
            <MapPin aria-hidden="true" size={25} />
            <strong>No submitted locations found</strong>
            <span>New merchant KYC addresses will appear here.</span>
          </div>
        )}
      </section>
    </div>
  );
}
