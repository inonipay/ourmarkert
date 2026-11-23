import Link from "next/link";
import {
  BarChart3,
  Eye,
  Package,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import SuperAdminAnalyticsReportExports from "@/components/super-admin/analytics-report-exports";
import type {
  AnalyticsMetric,
  SuperAdminAnalyticsReport,
} from "@/lib/data-access/super-admin-analytics";

const numberFormat = new Intl.NumberFormat("en-RW");
const chartColors = ["#1d5ca7", "#27835f", "#f3b543", "#b94a52"];

function MetricCard({ metric }: { metric: AnalyticsMetric }) {
  return (
    <Link
      className={`super-admin-analytics-card is-${metric.tone}`}
      href={metric.href}
    >
      <span>{metric.label}</span>
      <strong>{numberFormat.format(metric.value)}</strong>
      <small>{metric.detail}</small>
    </Link>
  );
}

function ActivityChart({
  data,
  unit,
}: {
  data: { day: string; count: number }[];
  unit: string;
}) {
  const width = 720;
  const height = 220;
  const left = 48;
  const right = 672;
  const top = 20;
  const bottom = 170;
  const maxValue = Math.max(...data.map((point) => point.count), 0);
  const scaleMaximum = Math.max(4, Math.ceil(maxValue / 4) * 4);
  const ticks = Array.from({ length: 5 }, (_, index) => ({
    value: scaleMaximum - (scaleMaximum * index) / 4,
    y: top + ((bottom - top) * index) / 4,
  }));
  const points = data.map((point, index) => ({
    ...point,
    x: left + (index * (right - left)) / Math.max(data.length - 1, 1),
    y: bottom - (point.count / scaleMaximum) * (bottom - top),
  }));
  const path = points
    .map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`)
    .join(" ");
  const fill = `${path} L ${right} ${bottom} L ${left} ${bottom} Z`;
  const labelInterval = Math.max(1, Math.ceil(points.length / 7));

  return (
    <div className="super-admin-analytics-chart-wrap">
      <svg
        aria-label="Activity recorded per day during the selected date range"
        className="super-admin-analytics-line-chart"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          <linearGradient id="analytics-activity-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1d5ca7" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#1d5ca7" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => (
          <g key={tick.value}>
            <line
              className="super-admin-analytics-grid"
              x1={left}
              x2={right}
              y1={tick.y}
              y2={tick.y}
            />
            <text
              className="super-admin-analytics-axis-label"
              textAnchor="end"
              x={left - 9}
              y={tick.y + 4}
            >
              {numberFormat.format(tick.value)}
            </text>
          </g>
        ))}
        <path d={fill} fill="url(#analytics-activity-fill)" />
        <path
          d={path}
          fill="none"
          stroke="#1d5ca7"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        {points.map((point, index) => (
          <g key={point.day}>
            {(index % labelInterval === 0 || index === points.length - 1) && (
              <text
                className="super-admin-analytics-axis-label"
                textAnchor="middle"
                x={point.x}
                y="204"
              >
                {point.day}
              </text>
            )}
            <circle
              cx={point.x}
              cy={point.y}
              fill="#fff"
              r="3"
              stroke="#1d5ca7"
              strokeWidth="2"
            >
              <title>{`${point.count} ${unit} on ${point.day}`}</title>
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );
}

function CategoryChart({
  categories,
}: {
  categories: { label: string; count: number }[];
}) {
  const total = categories.reduce((sum, category) => sum + category.count, 0);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const segments = categories.map((category, index) => ({
    category,
    offset: categories
      .slice(0, index)
      .reduce(
        (sum, preceding) => sum + (preceding.count / Math.max(total, 1)) * circumference,
        0,
      ),
  }));

  return (
    <div className="super-admin-analytics-category-chart">
      {total ? (
        <div className="super-admin-analytics-donut-wrap">
          <svg
            aria-label={`Product count by category, ${total} products total`}
            className="super-admin-analytics-donut"
            role="img"
            viewBox="0 0 112 112"
          >
            <circle className="super-admin-analytics-donut-track" cx="56" cy="56" r={radius} />
            {segments.map(({ category, offset }, index) => {
              const segment = (category.count / total) * circumference;
              return (
                <circle
                  className="super-admin-analytics-donut-segment"
                  cx="56"
                  cy="56"
                  key={category.label}
                  r={radius}
                  stroke={chartColors[index % chartColors.length]}
                  strokeDasharray={`${segment} ${circumference - segment}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 56 56)"
                >
                  <title>{`${category.label}: ${category.count}`}</title>
                </circle>
              );
            })}
          </svg>
          <div className="super-admin-analytics-donut-center">
            <strong>{numberFormat.format(total)}</strong>
            <span>products</span>
          </div>
        </div>
      ) : (
        <div className="super-admin-analytics-empty-chart">
          <Package aria-hidden="true" size={24} />
          No catalog data yet
        </div>
      )}
      <ul className="super-admin-analytics-legend">
        {categories.map((category, index) => (
          <li key={category.label}>
            <span style={{ backgroundColor: chartColors[index % chartColors.length] }} />
            <span>{category.label}</span>
            <strong>{numberFormat.format(category.count)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReportIcon({ title }: { title: string }) {
  if (title.toLowerCase().includes("merchant")) return <Store aria-hidden="true" size={18} />;
  if (title.toLowerCase().includes("customer")) return <Users aria-hidden="true" size={18} />;
  if (title.toLowerCase().includes("product") || title.toLowerCase().includes("category")) {
    return <Package aria-hidden="true" size={18} />;
  }
  return <ShoppingBag aria-hidden="true" size={18} />;
}

export default function SuperAdminAnalyticsReport({
  report,
  breadcrumb = "Analytics",
  actionPath,
  dateRangeError,
}: {
  report: SuperAdminAnalyticsReport;
  breadcrumb?: string;
  actionPath: string;
  dateRangeError?: string | null;
}) {
  return (
    <div className="super-admin-analytics-page">
      <div className="super-admin-page-heading">
        <div>
          <div className="super-admin-breadcrumb">Workspace / {breadcrumb}</div>
          <h1>{report.title}</h1>
          <p>{report.description}</p>
        </div>
        <div className="super-admin-analytics-controls">
          <span className="super-admin-analytics-period">
            <BarChart3 aria-hidden="true" size={16} />
            {report.rangeLabel}
          </span>
          <form
            action={actionPath}
            className="super-admin-analytics-date-filter"
            method="get"
          >
            <label>
              From
              <input
                max={report.dateRange.max}
                name="from"
                required
                type="date"
                defaultValue={report.dateRange.from}
              />
            </label>
            <label>
              To
              <input
                max={report.dateRange.max}
                name="to"
                required
                type="date"
                defaultValue={report.dateRange.to}
              />
            </label>
            <button type="submit">Apply</button>
          </form>
        </div>
      </div>

      {dateRangeError && (
        <p className="super-admin-analytics-range-error" role="alert">
          {dateRangeError} Showing the default 30-day period.
        </p>
      )}

      <section aria-label={`${report.title} summary`} className="super-admin-analytics-metrics">
        {report.metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <div className="super-admin-analytics-notice" role="note">
        <span aria-hidden="true" />
        {report.notice}
      </div>

      {(report.activity || report.categories) && (
        <section aria-label="Analytics charts" className="super-admin-analytics-charts">
          {report.activity && (
            <article className="super-admin-panel super-admin-analytics-panel">
              <div className="super-admin-panel-heading">
                <div>
                  <h2>{report.activityTitle ?? "Daily activity"}</h2>
                  <p>{report.activityDescription ?? "Activity recorded each day"}</p>
                </div>
              </div>
              <ActivityChart
                data={report.activity}
                unit={report.activityUnit ?? "events"}
              />
            </article>
          )}
          {report.categories && (
            <article className="super-admin-panel super-admin-analytics-panel">
              <div className="super-admin-panel-heading">
                <div>
                  <h2>Products by category</h2>
                  <p>Current catalog distribution</p>
                </div>
              </div>
              <CategoryChart categories={report.categories} />
            </article>
          )}
        </section>
      )}

      <section className="super-admin-panel super-admin-analytics-table-panel">
        <div className="super-admin-panel-heading">
          <div>
            <h2><ReportIcon title={report.title} /> {report.title} records</h2>
            <p>Latest {report.rows.length} records available</p>
          </div>
          <SuperAdminAnalyticsReportExports report={report} />
        </div>
        {report.rows.length ? (
          <div className="super-admin-analytics-table-wrap">
            <table className="super-admin-analytics-table">
              <thead>
                <tr>
                  {report.columns.map((column) => (
                    <th key={column} scope="col">{column}</th>
                  ))}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.label}</strong>
                    </td>
                    <td>{row.detail}</td>
                    <td>
                      <span className="super-admin-analytics-indicator">
                        {row.indicator}
                      </span>
                    </td>
                    <td><strong>{row.metric}</strong></td>
                    <td>
                      <Link
                        aria-label={`View ${row.label}`}
                        className="super-admin-view-action"
                        href={row.href}
                      >
                        <Eye aria-hidden="true" size={15} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="super-admin-records-empty">
            <ReportIcon title={report.title} />
            <strong>No records to display</strong>
            <span>New marketplace activity will appear here.</span>
          </div>
        )}
      </section>
    </div>
  );
}
