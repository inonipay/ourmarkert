import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, Search, SearchCheck } from "lucide-react";
import {
  getSuperAdminMerchantKycList,
  MERCHANT_KYC_PAGE_SIZE,
} from "@/lib/data-access/merchant-kyc";
import type { MerchantKycStatus } from "@/lib/validation/merchant-kyc";

type MerchantKycListProps = {
  status: MerchantKycStatus | "rejected";
  title: string;
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
};

const dateFormat = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export default async function MerchantKycList({
  status,
  title,
  searchParams,
}: MerchantKycListProps) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "")
    .trim()
    .slice(0, 100);
  const pageValue = Array.isArray(params.page) ? params.page[0] : params.page;
  const parsedPage = Number.parseInt(pageValue ?? "1", 10);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0
    ? Math.min(parsedPage, 1000)
    : 1;
  const data = await getSuperAdminMerchantKycList(status, query, page);
  const pageCount = Math.max(1, Math.ceil(data.total / MERCHANT_KYC_PAGE_SIZE));

  if (page > pageCount) {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    search.set("page", String(pageCount));
    redirect(`${pathForStatus(status)}?${search.toString()}`);
  }

  const statusHref = (path: string) => {
    if (!query) return path;
    return `${path}?${new URLSearchParams({ q: query }).toString()}`;
  };
  const pageHref = (nextPage: number) => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    search.set("page", String(nextPage));
    return `${pathForStatus(status)}?${search.toString()}`;
  };
  const summaries = [
    {
      label: "Pending review",
      state: "pending",
      value: data.summary.pending,
      href: statusHref("/super-admin/merchants/pending-applications"),
      active: status === "pending",
    },
    {
      label: "Approved",
      state: "approved",
      value: data.summary.approved,
      href: statusHref("/super-admin/merchants/approved-merchants"),
      active: status === "approved",
    },
    {
      label: "Rejected",
      state: "rejected",
      value: data.summary.rejected,
      href: statusHref("/super-admin/merchants/rejected-applications"),
      active: status === "rejected",
    },
  ];

  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">Workspace / Merchant Management / {title}</div>
          <h1>{title}</h1>
          <p>Business information and verification files are accessible only to super admins.</p>
        </div>
        <Link className="super-admin-back-action" href="/super-admin/merchants">
          <ArrowLeft size={16} /> All merchants
        </Link>
      </div>

      <section aria-label={`${title} summary`} className="super-admin-records-summary">
        {summaries.map((summary) => (
          <Link
            aria-current={summary.active ? "page" : undefined}
            className={`super-admin-summary-card is-${summary.state}${summary.active ? " is-active" : ""}`}
            href={summary.href}
            key={summary.label}
          >
            <span>{summary.label}</span>
            <strong>{summary.value.toLocaleString("en-RW")}</strong>
          </Link>
        ))}
      </section>

      <section className="super-admin-panel super-admin-audit-panel">
        <div className="super-admin-records-toolbar">
          <div>
            <h2>{title}</h2>
            <p>
              {data.total.toLocaleString("en-RW")} matching{" "}
              {status === "rejected" ? "decisions" : "applications"}
            </p>
          </div>
          <form
            action={pathForStatus(status)}
            className="super-admin-record-search"
            role="search"
          >
            <Search aria-hidden="true" size={17} />
            <input
              aria-label={`Search ${title.toLowerCase()}`}
              defaultValue={query}
              maxLength={100}
              name="q"
              placeholder={
                status === "rejected"
                  ? "Search decision reasons"
                  : "Search business, owner, email, or reason"
              }
              type="search"
            />
            <button type="submit">Search</button>
          </form>
        </div>
        {data.rows.length ? (
          <>
            <div className="super-admin-records-table-wrap">
              <table className="super-admin-records-table">
                <thead>
                  <tr>
                    <th scope="col">Applicant</th>
                    <th scope="col">Business</th>
                    <th scope="col">Status</th>
                    <th scope="col">{status === "rejected" ? "Decision reason" : "Submitted"}</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => {
                    const href = row.isAuditRecord
                      ? `/super-admin/merchants/kyc/audit/${encodeURIComponent(row.id)}`
                      : `/super-admin/merchants/kyc/${encodeURIComponent(row.id)}`;
                    return (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.applicantName}</strong>
                          <span className="super-admin-audit-secondary">{row.applicantEmail}</span>
                        </td>
                        <td>{row.businessName || "Removed after rejection"}</td>
                        <td>
                          <span className={`super-admin-merchant-access-status${row.status === "rejected" ? " is-suspended" : ""}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className={status === "rejected" ? "super-admin-audit-reason" : undefined}>
                          {status === "rejected"
                            ? row.reason ?? "No decision note"
                            : dateFormat.format(row.createdAt)}
                        </td>
                        <td>
                          <Link
                            aria-label={`View ${status} merchant application`}
                            className="super-admin-view-action"
                            href={href}
                          >
                            <Eye aria-hidden="true" size={15} /> View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {data.total > data.pageSize && (
              <nav aria-label={`${title} pagination`} className="super-admin-pagination">
                <span>
                  Showing {(data.page - 1) * data.pageSize + 1}–
                  {Math.min(data.page * data.pageSize, data.total)} of {data.total}
                  <strong>Page {data.page} of {pageCount}</strong>
                </span>
                <div>
                  {data.page > 1 ? (
                    <Link className="super-admin-back-action" href={pageHref(data.page - 1)}>
                      <ArrowLeft size={15} /> Previous
                    </Link>
                  ) : (
                    <span className="super-admin-page-disabled">Previous</span>
                  )}
                  {data.page < pageCount ? (
                    <Link className="super-admin-primary-action" href={pageHref(data.page + 1)}>
                      Next <ArrowRight size={15} />
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
            {query ? <Search aria-hidden="true" size={26} /> : <SearchCheck aria-hidden="true" size={26} />}
            <strong>{status === "rejected" ? "No decisions found" : "No applications found"}</strong>
            <span>{query ? "Try changing or clearing the search." : "New submissions will appear here for review."}</span>
          </div>
        )}
      </section>
    </div>
  );
}

function pathForStatus(status: MerchantKycStatus | "rejected") {
  return {
    pending: "/super-admin/merchants/pending-applications",
    approved: "/super-admin/merchants/approved-merchants",
    rejected: "/super-admin/merchants/rejected-applications",
  }[status];
}
