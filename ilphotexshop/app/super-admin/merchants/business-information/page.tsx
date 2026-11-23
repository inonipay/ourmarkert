import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Eye, Search } from "lucide-react";
import SuperAdminCsvExportButton from "@/components/super-admin/csv-export-button";
import {
  BUSINESS_INFORMATION_PAGE_SIZE,
  getSuperAdminBusinessInformation,
} from "@/lib/data-access/super-admin-business-information";

export const metadata: Metadata = {
  title: "Business Information | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

const dateFormat = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export default async function BusinessInformationPage({
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
  const data = await getSuperAdminBusinessInformation(query, page);
  const pageCount = Math.max(1, Math.ceil(data.total / BUSINESS_INFORMATION_PAGE_SIZE));

  if (page > pageCount) {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    search.set("page", String(pageCount));
    redirect(`/super-admin/merchants/business-information?${search.toString()}`);
  }

  const pageHref = (nextPage: number) => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    search.set("page", String(nextPage));
    return `/super-admin/merchants/business-information?${search.toString()}`;
  };
  const exportRows = [
    [
      "Business name",
      "Owner",
      "Account email",
      "Business address",
      "Tax ID",
      "KYC status",
      "Submitted",
      "Reviewed",
      "Account access",
    ],
    ...data.rows.map((row) => [
      row.businessName,
      row.ownerFullName,
      row.user.email,
      row.businessAddress,
      row.taxId ?? "",
      row.status,
      dateFormat.format(row.submittedAt),
      row.reviewedAt ? dateFormat.format(row.reviewedAt) : "",
      row.user.isAnonymized
        ? "Anonymized"
        : row.user.isSuspended
          ? "Suspended"
          : "Active",
    ]),
  ];

  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">
            Workspace / Merchant Management / Business Information
          </div>
          <h1>Business Information</h1>
          <p>Business details submitted through merchant verification.</p>
        </div>
        <Building2 aria-hidden="true" size={25} />
      </div>

      <section aria-label="Business information totals" className="super-admin-records-summary">
        {[
          ["Matching applications", data.total],
          ["Pending verification", data.pending],
          ["Approved merchants", data.approved],
        ].map(([label, count]) => (
          <article className="super-admin-summary-card" key={label}>
            <span>{label}</span>
            <strong>{Number(count).toLocaleString("en-RW")}</strong>
          </article>
        ))}
      </section>

      <p className="super-admin-data-note" role="note">
        Rejected applications are omitted because applicant business data is
        erased after rejection. Tax and address details are visible only to
        authorized Super Admins.
      </p>

      <section className="super-admin-panel super-admin-records-panel">
        <div className="super-admin-records-toolbar">
          <div>
            <h2>Business records</h2>
            <p>{data.total.toLocaleString("en-RW")} matching applications</p>
          </div>
          <form
            action="/super-admin/merchants/business-information"
            className="super-admin-record-search"
            role="search"
          >
            <Search aria-hidden="true" size={17} />
            <input
              aria-label="Search business information"
              defaultValue={query}
              maxLength={100}
              name="q"
              placeholder="Search business, owner, address, or tax ID"
              type="search"
            />
            <button type="submit">Search</button>
          </form>
          <SuperAdminCsvExportButton
            fileName={`business-information-page-${data.page}`}
            label="Export page CSV"
            rows={exportRows}
          />
        </div>

        {data.rows.length ? (
          <>
            <div className="super-admin-records-table-wrap">
              <table className="super-admin-records-table">
                <thead>
                  <tr>
                    <th scope="col">Business / owner</th>
                    <th scope="col">Account</th>
                    <th scope="col">Business address</th>
                    <th scope="col">Tax ID</th>
                    <th scope="col">Verification</th>
                    <th scope="col">Submitted</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.businessName}</strong>
                        <span className="super-admin-audit-secondary">{row.ownerFullName}</span>
                      </td>
                      <td>{row.user.email}</td>
                      <td>{row.businessAddress}</td>
                      <td>{row.taxId ?? "Not provided"}</td>
                      <td>
                        <span className={`super-admin-merchant-access-status${row.status === "pending" ? "" : " is-approved"}`}>
                          {row.status}
                        </span>
                      </td>
                      <td>{dateFormat.format(row.submittedAt)}</td>
                      <td>
                        <Link
                          aria-label={`View ${row.businessName} verification`}
                          className="super-admin-view-action"
                          href={`/super-admin/merchants/kyc/${encodeURIComponent(row.id)}`}
                        >
                          <Eye aria-hidden="true" size={15} /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.total > data.pageSize && (
              <nav aria-label="Business information pagination" className="super-admin-pagination">
                <span>
                  Showing {(data.page - 1) * data.pageSize + 1}–
                  {Math.min(data.page * data.pageSize, data.total)} of {data.total}
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
            <Building2 aria-hidden="true" size={25} />
            <strong>No business records found</strong>
            <span>Try changing or clearing the search.</span>
          </div>
        )}
      </section>
    </div>
  );
}
