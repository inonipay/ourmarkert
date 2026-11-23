import Link from "next/link";
import SecurityRecordActionButton, {
  type SecurityRecordAction,
} from "@/components/super-admin/security-record-action";

export type SecurityRecordRow = {
  id: string;
  cells: string[];
  actions?: SecurityRecordAction[];
};

export default function SecurityRecordsPage({
  title,
  description,
  href,
  query,
  page,
  pageCount,
  total,
  headers,
  rows,
  stats = [],
  note,
}: {
  title: string;
  description: string;
  href: string;
  query: string;
  page: number;
  pageCount: number;
  total: number;
  headers: string[];
  rows: SecurityRecordRow[];
  stats?: { label: string; value: string | number }[];
  note?: string;
}) {
  function pageHref(nextPage: number) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("page", String(nextPage));
    return `${href}?${params.toString()}`;
  }

  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">Workspace / Security &amp; Audit / {title}</div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <Link className="super-admin-back-action" href="/super-admin/security">
          All audit logs
        </Link>
      </div>

      {stats.length > 0 && (
        <section aria-label={`${title} summary`} className="super-admin-records-summary">
          {stats.map((stat) => (
            <article className="super-admin-summary-card" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          ))}
        </section>
      )}

      {note && <div className="super-admin-data-note" role="note">{note}</div>}

      <section className="super-admin-panel super-admin-audit-panel">
        <div className="super-admin-records-toolbar">
          <div>
            <h2>{title}</h2>
            <p>{total} records · page {page} of {pageCount} · timestamps in UTC</p>
          </div>
          <form action={href} className="super-admin-record-search" role="search">
            <input
              aria-label={`Search ${title}`}
              defaultValue={query}
              maxLength={100}
              name="q"
              placeholder="Search"
              type="search"
            />
            <button type="submit">Search</button>
          </form>
        </div>

        {rows.length ? (
          <>
            <div className="super-admin-records-table-wrap">
              <table className="super-admin-records-table">
                <thead>
                  <tr>{headers.map((header) => <th key={header} scope="col">{header}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      {row.cells.map((cell, index) => <td key={`${row.id}-${index}`}>{cell}</td>)}
                      {headers.includes("Action") && (
                        <td>
                          <div className="super-admin-security-actions">
                            {row.actions?.map((action) => (
                              <SecurityRecordActionButton action={action} key={action.label} />
                            ))}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > 20 && (
              <nav aria-label={`${title} pagination`} className="super-admin-pagination">
                <span>Page {page} of {pageCount}</span>
                <div>
                  {page > 1 ? <Link className="super-admin-back-action" href={pageHref(page - 1)}>Previous</Link> : <span className="super-admin-page-disabled">Previous</span>}
                  {page < pageCount ? <Link className="super-admin-primary-action" href={pageHref(page + 1)}>Next</Link> : <span className="super-admin-page-disabled">Next</span>}
                </div>
              </nav>
            )}
          </>
        ) : (
          <div className="super-admin-records-empty">
            <strong>No matching records</strong>
            <span>{query ? "Try a different search." : "Events will appear here as the system records them."}</span>
          </div>
        )}
      </section>
    </div>
  );
}
