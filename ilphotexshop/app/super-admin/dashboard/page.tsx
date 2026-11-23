import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  ArrowUpRight,
  ClipboardList,
  CreditCard,
  Eye,
  Megaphone,
  PackageCheck,
  Plus,
  ShoppingBag,
  ShieldCheck,
  Store,
  Users,
  UserRound,
} from "lucide-react";
import { getSuperAdminDashboardData } from "@/lib/data-access/super-admin-dashboard";
import SuperAdminRecordRowActions from "@/components/super-admin/record-row-actions";

export const metadata: Metadata = {
  title: "Dashboard | ILPhotoX Shop",
};

const numberFormat = new Intl.NumberFormat("en-RW");
const shortDateFormat = new Intl.DateTimeFormat("en-RW", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatOrderStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function OrderActivityChart({
  data,
}: {
  data: { day: string; count: number }[];
}) {
  const width = 620;
  const height = 220;
  const left = 54;
  const right = 596;
  const top = 18;
  const bottom = 158;
  const maximum = Math.max(...data.map((point) => point.count), 0);
  const scaleMaximum = Math.max(4, Math.ceil(maximum / 4) * 4);
  const ticks = Array.from({ length: 5 }, (_, index) => ({
    value: scaleMaximum - (scaleMaximum * index) / 4,
    y: top + ((bottom - top) * index) / 4,
  }));
  const points = data.map((point, index) => ({
    ...point,
    x: left + (index * (right - left)) / Math.max(data.length - 1, 1),
    y: bottom - (point.count / scaleMaximum) * (bottom - top),
  }));
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${right} ${bottom} L ${left} ${bottom} Z`;

  return (
    <div className="super-admin-chart-wrap">
      <svg
        aria-labelledby="order-activity-title"
        className="super-admin-line-chart"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <title id="order-activity-title">Orders created over the last seven days</title>
        <defs>
          <linearGradient id="order-chart-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--admin-blue)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--admin-blue)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => (
          <g key={tick.value}>
            <line
              className="super-admin-chart-gridline"
              x1={left}
              x2={right}
              y1={tick.y}
              y2={tick.y}
            />
            <text
              className="super-admin-chart-axis-label"
              textAnchor="end"
              x={left - 10}
              y={tick.y + 3}
            >
              {numberFormat.format(tick.value)}
            </text>
          </g>
        ))}
        <path d={areaPath} fill="url(#order-chart-fill)" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--admin-blue)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        {points.map((point) => (
          <g key={point.day}>
            <circle
              cx={point.x}
              cy={point.y}
              fill="var(--surface)"
              r="4"
              stroke="var(--primary)"
              strokeWidth="2"
            >
              <title>{`${point.count} orders on ${point.day}`}</title>
            </circle>
          </g>
        ))}
        {points.map((point) => (
          <text
            className="super-admin-chart-label"
            key={`label-${point.day}`}
            textAnchor="middle"
            x={point.x}
            y="198"
          >
            {point.day}
          </text>
        ))}
      </svg>
    </div>
  );
}

function RegistrationGrowthChart({
  merchants,
  customers,
}: {
  merchants: { day: string; count: number }[];
  customers: { day: string; count: number }[];
}) {
  const width = 620;
  const height = 220;
  const left = 54;
  const right = 596;
  const top = 18;
  const bottom = 158;
  const series = [
    {
      label: "Merchants",
      data: merchants,
      color: "#27835f",
      fillId: "merchant-growth-fill",
    },
    {
      label: "Customers",
      data: customers,
      color: "#1d5ca7",
      fillId: "customer-growth-fill",
    },
  ];
  const maximum = Math.max(
    ...series.flatMap(({ data }) => data.map((point) => point.count)),
    0,
  );
  const scaleMaximum = Math.max(4, Math.ceil(maximum / 4) * 4);
  const ticks = Array.from({ length: 5 }, (_, index) => ({
    value: scaleMaximum - (scaleMaximum * index) / 4,
    y: top + ((bottom - top) * index) / 4,
  }));
  const plottedSeries = series.map((entry) => {
    const points = entry.data.map((point, index) => ({
      ...point,
      x: left + (index * (right - left)) / Math.max(entry.data.length - 1, 1),
      y: bottom - (point.count / scaleMaximum) * (bottom - top),
    }));
    const path = points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
    return {
      ...entry,
      points,
      path,
      areaPath: `${path} L ${right} ${bottom} L ${left} ${bottom} Z`,
    };
  });

  return (
    <div className="super-admin-registration-chart-wrap">
      <svg
        aria-labelledby="registration-growth-title"
        className="super-admin-line-chart"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <title id="registration-growth-title">
          Daily merchant and customer registrations over the last seven days
        </title>
        <defs>
          {series.map((entry) => (
            <linearGradient
              id={entry.fillId}
              key={entry.fillId}
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop offset="0%" stopColor={entry.color} stopOpacity="0.16" />
              <stop offset="100%" stopColor={entry.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((tick) => (
          <g key={tick.value}>
            <line
              className="super-admin-chart-gridline"
              x1={left}
              x2={right}
              y1={tick.y}
              y2={tick.y}
            />
            <text
              className="super-admin-chart-axis-label"
              textAnchor="end"
              x={left - 10}
              y={tick.y + 3}
            >
              {numberFormat.format(tick.value)}
            </text>
          </g>
        ))}
        {plottedSeries.map((entry) => (
          <g key={entry.label}>
            <path d={entry.areaPath} fill={`url(#${entry.fillId})`} />
            <path
              d={entry.path}
              fill="none"
              stroke={entry.color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />
            {entry.points.map((point) => (
              <circle
                cx={point.x}
                cy={point.y}
                fill="var(--surface)"
                key={point.day}
                r="4"
                stroke={entry.color}
                strokeWidth="2"
              >
                <title>{`${point.count} ${entry.label.toLowerCase()} on ${point.day}`}</title>
              </circle>
            ))}
          </g>
        ))}
        {plottedSeries[0].points.map((point) => (
          <text
            className="super-admin-chart-label"
            key={point.day}
            textAnchor="middle"
            x={point.x}
            y="198"
          >
            {point.day}
          </text>
        ))}
      </svg>
      <div className="super-admin-registration-legend">
        {series.map((entry) => (
          <span key={entry.label}>
            <i aria-hidden="true" style={{ backgroundColor: entry.color }} />
            <span>{entry.label}</span>
            <strong>
              {numberFormat.format(
                entry.data.reduce((total, point) => total + point.count, 0),
              )}
            </strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function CatalogHealthChart({
  published,
  unpublished,
}: {
  published: number;
  unpublished: number;
}) {
  const total = published + unpublished;
  const publishedPercent = total ? Math.round((published / total) * 100) : 0;
  const circumference = 2 * Math.PI * 48;
  const publishedLength = (circumference * publishedPercent) / 100;

  return (
    <div className="super-admin-catalog-chart">
      <div className="super-admin-donut-wrap">
        <svg
          aria-label={`${published} of ${total} products published (${publishedPercent} percent); ${unpublished} unpublished`}
          className="super-admin-donut"
          role="img"
          viewBox="0 0 120 120"
        >
          <circle
            className="super-admin-donut-track"
            cx="60"
            cy="60"
            r="48"
            strokeWidth="11"
          />
          <circle
            className="super-admin-donut-published"
            cx="60"
            cy="60"
            r="48"
            strokeDasharray={`${publishedLength} ${circumference}`}
            strokeWidth="11"
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="super-admin-donut-center">
          <strong>{publishedPercent}%</strong>
          <span>published</span>
        </div>
      </div>
      <div className="super-admin-chart-legend">
        <div>
          <span className="super-admin-legend-dot is-published" />
          <span>Published</span>
          <strong>{numberFormat.format(published)}</strong>
        </div>
        <div>
          <span className="super-admin-legend-dot is-unpublished" />
          <span>Unpublished</span>
          <strong>{numberFormat.format(unpublished)}</strong>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminDashboardPage() {
  return (
    <Suspense fallback={<div className="super-admin-loading">Loading dashboard data…</div>}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  await connection();
  const data = await getSuperAdminDashboardData();
  const { stats } = data;

  const metrics = [
    {
      label: "Total users",
      value: stats.totalUsers,
      detail: `${numberFormat.format(stats.totalCustomers)} customers`,
      icon: Users,
      tone: "green",
      href: "/super-admin/users",
    },
    {
      label: "Merchants",
      value: stats.totalMerchants,
      detail: "Registered seller accounts",
      icon: Store,
      tone: "yellow",
      href: "/super-admin/merchants",
    },
    {
      label: "Customers",
      value: stats.totalCustomers,
      detail: "Registered customer accounts",
      icon: UserRound,
      tone: "green",
      href: "/super-admin/users/customers",
    },
    {
      label: "Pending KYC",
      value: stats.pendingKycApplications,
      detail: "Applications awaiting review",
      icon: ClipboardList,
      tone: "red",
      href: "/super-admin/merchants/merchant-verification-kyc",
    },
    {
      label: "Pending merchants",
      value: stats.pendingKycApplications,
      detail: "Seller applications awaiting approval",
      icon: Store,
      tone: "yellow",
      href: "/super-admin/merchants/pending-applications",
    },
    {
      label: "Products",
      value: stats.totalProducts,
      detail: `${numberFormat.format(stats.publishedProducts)} published`,
      icon: PackageCheck,
      tone: "blue",
      href: "/super-admin/products",
    },
    {
      label: "Pending products",
      value: stats.pendingProducts,
      detail: "Listings awaiting moderation",
      icon: ClipboardList,
      tone: "yellow",
      href: "/super-admin/products/pending-approval",
    },
    {
      label: "Unpublished products",
      value: stats.unpublishedProducts,
      detail: "Draft or awaiting review",
      icon: ClipboardList,
      tone: "yellow",
      href: "/super-admin/products/draft-products",
    },
    {
      label: "Total orders",
      value: stats.totalOrders,
      detail: `${numberFormat.format(stats.pendingOrders)} pending`,
      icon: ShoppingBag,
      tone: "red",
      href: "/super-admin/orders",
    },
    {
      label: "Pending payment proofs",
      value: stats.pendingPaymentProofs,
      detail: "Receipts awaiting verification",
      icon: CreditCard,
      tone: "yellow",
      href: "/super-admin/payments/payment-proofs?status=pending",
    },
  ];

  return (
    <div className="super-admin-dashboard">
      <div className="super-admin-page-heading">
        <div>
          <div className="super-admin-breadcrumb">Workspace / Overview</div>
          <h1>Dashboard overview</h1>
          <p>Here&apos;s what&apos;s happening across your marketplace today.</p>
        </div>
        <Link className="super-admin-primary-action" href="/super-admin/products/draft-products">
          <ClipboardList size={17} />
          View drafts
        </Link>
      </div>

      <div className="super-admin-data-note" role="note">
        <span className="super-admin-online-dot" />
        Live marketplace data
        <span>
          Receipt reviews are tracked; revenue and payout totals require payment integration.
        </span>
      </div>

      <section aria-label="Marketplace summary" className="super-admin-metrics">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Link
              className={`super-admin-metric-card super-admin-metric-card-link is-${metric.tone}`}
              href={metric.href}
              key={metric.label}
            >
              <div className={`super-admin-metric-icon is-${metric.tone}`}>
                <Icon aria-hidden="true" size={19} />
              </div>
              <div className="super-admin-metric-label">{metric.label}</div>
              <strong className="super-admin-metric-value">
                {numberFormat.format(metric.value)}
              </strong>
              <div className="super-admin-metric-detail">{metric.detail}</div>
            </Link>
          );
        })}
      </section>

      <section aria-label="Marketplace activity" className="super-admin-chart-layout">
        <article className="super-admin-panel super-admin-activity-panel">
          <div className="super-admin-panel-heading">
            <div>
              <h2>Order activity</h2>
              <p>Orders created during the last 7 days</p>
            </div>
            <span className="super-admin-period-label">Last 7 days</span>
          </div>
          <OrderActivityChart data={data.orderActivity} />
        </article>
        <article className="super-admin-panel super-admin-catalog-panel">
          <div className="super-admin-panel-heading">
            <div>
              <h2>Catalog health</h2>
              <p>Published and unpublished listings</p>
            </div>
            <Link
              aria-label="View all products"
              className="super-admin-panel-link"
              href="/super-admin/products"
            >
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <CatalogHealthChart
            published={stats.publishedProducts}
            unpublished={stats.unpublishedProducts}
          />
        </article>
      </section>

      <section
        aria-label="Registration growth"
        className="super-admin-panel super-admin-registration-panel"
      >
        <div className="super-admin-panel-heading">
          <div>
            <h2>Customer and merchant growth</h2>
            <p>Registrations during the last 7 days</p>
          </div>
          <span className="super-admin-period-label">Last 7 days</span>
        </div>
        <RegistrationGrowthChart
          customers={data.registrationActivity.customers}
          merchants={data.registrationActivity.merchants}
        />
      </section>

      <section className="super-admin-lower-grid">
        <article className="super-admin-panel super-admin-orders-panel">
          <div className="super-admin-panel-heading">
            <div>
              <h2>Recent orders</h2>
              <p>The latest orders placed on the marketplace</p>
            </div>
            <Link className="super-admin-text-link" href="/super-admin/orders">
              View all <ArrowUpRight size={15} />
            </Link>
          </div>
          {data.recentOrders.length ? (
            <div className="super-admin-table-wrap">
              <table className="super-admin-orders-table">
                <thead>
                  <tr>
                    <th scope="col">Order</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Items</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>#{order.id.slice(-8).toUpperCase()}</strong>
                        <span>{shortDateFormat.format(order.createdAt)}</span>
                      </td>
                      <td>
                        <strong>{order.customer.name}</strong>
                        <span>{order.customer.email}</span>
                      </td>
                      <td>{order.items.length}</td>
                      <td>{formatCurrency(order.subtotal, order.currency)}</td>
                      <td>
                        <span
                          className={`super-admin-status is-${order.status}`}
                        >
                          {formatOrderStatus(order.status)}
                        </span>
                      </td>
                      <td>
                        <div className="super-admin-table-actions">
                          <Link
                            aria-label={`View order ${order.id}`}
                            className="super-admin-view-action"
                            href={`/super-admin/records/orders/${encodeURIComponent(order.id)}`}
                          >
                            <Eye aria-hidden="true" size={16} />
                            View
                          </Link>
                          <SuperAdminRecordRowActions
                            id={order.id}
                            kind="orders"
                            status={order.status}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="super-admin-empty-state">
              <ShoppingBag aria-hidden="true" size={23} />
              <strong>No orders yet</strong>
              <span>New marketplace orders will show up here.</span>
            </div>
          )}
        </article>

        <aside className="super-admin-activity-column">
          <article className="super-admin-panel super-admin-list-panel">
            <div className="super-admin-panel-heading">
              <div>
                <h2>Latest products</h2>
                <p>Recently added listings</p>
              </div>
              <Link
                aria-label="Browse products"
                className="super-admin-panel-link"
                href="/super-admin/products"
              >
                <ArrowUpRight size={17} />
              </Link>
            </div>
            {data.recentProducts.length ? (
              <ul className="super-admin-compact-list">
                {data.recentProducts.map((product) => (
                  <li key={product.id}>
                    <span className="super-admin-list-icon">
                      <PackageCheck aria-hidden="true" size={17} />
                    </span>
                    <span className="super-admin-list-copy">
                      <strong>{product.name}</strong>
                      <small>{product.seller}</small>
                    </span>
                    <span
                      className={`super-admin-mini-status${product.isPublished ? " is-published" : ""}`}
                    >
                      {product.isPublished ? "Live" : "Unpublished"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="super-admin-inline-empty">No products have been added.</div>
            )}
          </article>

          <article className="super-admin-panel super-admin-list-panel">
            <div className="super-admin-panel-heading">
              <div>
                <h2>New merchants</h2>
                <p>Recently registered sellers</p>
              </div>
              <Link
                aria-label="Browse merchants"
                className="super-admin-panel-link"
                href="/super-admin/merchants"
              >
                <ArrowUpRight size={17} />
              </Link>
            </div>
            {data.recentMerchants.length ? (
              <ul className="super-admin-compact-list">
                {data.recentMerchants.map((merchant) => (
                  <li key={merchant.id}>
                    <span className="super-admin-merchant-avatar">
                      {merchant.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="super-admin-list-copy">
                      <strong>{merchant.name}</strong>
                      <small>{merchant.email}</small>
                    </span>
                    <span className="super-admin-list-date">
                      {shortDateFormat.format(merchant.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="super-admin-inline-empty">
                No merchants have registered yet.
              </div>
            )}
          </article>

          <article className="super-admin-panel super-admin-list-panel">
            <div className="super-admin-panel-heading">
              <div>
                <h2>Payment verification requests</h2>
                <p>{numberFormat.format(stats.pendingPaymentProofs)} awaiting review</p>
              </div>
              <Link
                aria-label="Review pending payment proofs"
                className="super-admin-panel-link"
                href="/super-admin/payments/payment-proofs?status=pending"
              >
                <ArrowUpRight size={17} />
              </Link>
            </div>
            {data.recentPaymentProofs.length ? (
              <ul className="super-admin-compact-list">
                {data.recentPaymentProofs.map((proof) => (
                  <li key={proof.id}>
                    <span className="super-admin-list-icon">
                      <CreditCard aria-hidden="true" size={17} />
                    </span>
                    <Link
                      className="super-admin-list-copy"
                      href="/super-admin/payments/payment-proofs?status=pending"
                    >
                      <strong>{proof.customer.name || proof.customer.email}</strong>
                      <small>
                        Order #{proof.order.id.slice(-8).toUpperCase()} ·{" "}
                        {formatCurrency(proof.amount, proof.currency)} ·{" "}
                        {proof.method === "bank_transfer" ? "Bank" : "Mobile money"}
                      </small>
                    </Link>
                    <span className="super-admin-list-date">
                      {shortDateFormat.format(proof.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="super-admin-inline-empty">
                No payment receipts are awaiting review.
              </div>
            )}
          </article>

          <article className="super-admin-panel super-admin-list-panel">
            <div className="super-admin-panel-heading">
              <div>
                <h2>Recent security activity</h2>
                <p>Audited role, merchant, and KYC decisions</p>
              </div>
              <Link
                aria-label="View security audit logs"
                className="super-admin-panel-link"
                href="/super-admin/security/audit-logs"
              >
                <ArrowUpRight size={17} />
              </Link>
            </div>
            {data.securityActivities.length ? (
              <ul className="super-admin-compact-list">
                {data.securityActivities.map((activity) => (
                  <li key={activity.id}>
                    <span className="super-admin-list-icon">
                      <ShieldCheck aria-hidden="true" size={17} />
                    </span>
                    <Link
                      className="super-admin-list-copy"
                      href={activity.href}
                    >
                      <strong>{activity.description}</strong>
                      <small>
                        By {activity.actorName} ·{" "}
                        {shortDateFormat.format(activity.createdAt)}
                      </small>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="super-admin-inline-empty">
                No security activity has been recorded.
              </div>
            )}
          </article>
        </aside>
      </section>

      <section aria-label="Quick actions" className="super-admin-quick-actions">
        <div>
          <div className="super-admin-quick-icon">
            <Plus aria-hidden="true" size={18} />
          </div>
          <span>
            <strong>Quick actions</strong>
            <small>Jump to a common task</small>
          </span>
        </div>
        <Link href="/super-admin/users/administrators">
          <Users size={16} /> Manage administrators
        </Link>
        <Link href="/super-admin/merchants/pending-applications">
          <Store size={16} /> Review merchants
        </Link>
        <Link href="/super-admin/products/draft-products">
          <ClipboardList size={16} /> View drafts
        </Link>
        <Link href="/super-admin/orders">
          <ShoppingBag size={16} /> Manage orders
        </Link>
        <Link href="/super-admin/payments/payment-proofs?status=pending">
          <CreditCard size={16} /> Verify payments
        </Link>
        <Link href="/super-admin/communication/announcements">
          <Megaphone size={16} /> Send announcement
        </Link>
      </section>
    </div>
  );
}
