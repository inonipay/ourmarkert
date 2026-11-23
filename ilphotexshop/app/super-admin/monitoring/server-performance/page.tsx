import type { Metadata } from "next";
import { Activity, Clock3, Cpu, MemoryStick, Server } from "lucide-react";
import { getSuperAdminServerPerformance } from "@/lib/data-access/super-admin-server-performance";

export const metadata: Metadata = {
  title: "Server Performance | ILPhotoX Shop",
  robots: { index: false, follow: false },
};

const dateFormat = new Intl.DateTimeFormat("en-RW", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

const numberFormat = new Intl.NumberFormat("en-RW", {
  maximumFractionDigits: 1,
});

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${numberFormat.format(value)} ${units[unitIndex]}`;
}

function formatDuration(seconds: number) {
  const totalSeconds = Math.floor(seconds);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const remainingSeconds = totalSeconds % 60;
  return [
    ...(days ? [`${days}d`] : []),
    ...(hours || days ? [`${hours}h`] : []),
    ...(minutes || hours || days ? [`${minutes}m`] : []),
    `${remainingSeconds}s`,
  ].join(" ");
}

export default async function ServerPerformancePage() {
  const snapshot = await getSuperAdminServerPerformance();
  const cpuTimeMs = (snapshot.cpuTime.user + snapshot.cpuTime.system) / 1000;

  return (
    <div className="super-admin-records-page">
      <div className="super-admin-records-heading">
        <div>
          <div className="super-admin-breadcrumb">
            Workspace / System Monitoring / Server Performance
          </div>
          <h1>Server Performance</h1>
          <p>Current resource snapshot for the Node.js process serving this page.</p>
        </div>
        <Activity aria-hidden="true" size={25} />
      </div>

      <section aria-label="Current process metrics" className="super-admin-records-summary">
        <article className="super-admin-summary-card">
          <span><Clock3 aria-hidden="true" size={16} /> Process uptime</span>
          <strong>{formatDuration(snapshot.uptimeSeconds)}</strong>
        </article>
        <article className="super-admin-summary-card">
          <span><MemoryStick aria-hidden="true" size={16} /> Resident memory</span>
          <strong>{formatBytes(snapshot.memory.rss)}</strong>
        </article>
        <article className="super-admin-summary-card">
          <span><MemoryStick aria-hidden="true" size={16} /> Heap in use</span>
          <strong>{formatBytes(snapshot.memory.heapUsed)}</strong>
        </article>
        <article className="super-admin-summary-card">
          <span><Cpu aria-hidden="true" size={16} /> CPU time since start</span>
          <strong>{numberFormat.format(cpuTimeMs)} ms</strong>
        </article>
      </section>

      <section className="super-admin-panel super-admin-health-panel">
        <div className="super-admin-panel-heading">
          <div>
            <h2>Runtime details</h2>
            <p>Captured at {dateFormat.format(snapshot.checkedAt)} (UTC)</p>
          </div>
          <Server aria-hidden="true" size={18} />
        </div>
        <dl className="super-admin-health-details">
          <div>
            <dt>Node.js</dt>
            <dd>{snapshot.runtime.nodeVersion}</dd>
          </div>
          <div>
            <dt>Platform / architecture</dt>
            <dd>{snapshot.runtime.platform} / {snapshot.runtime.architecture}</dd>
          </div>
          <div>
            <dt>Logical CPUs available</dt>
            <dd>{snapshot.runtime.logicalCpuCount}</dd>
          </div>
          <div>
            <dt>Heap allocated</dt>
            <dd>{formatBytes(snapshot.memory.heapTotal)}</dd>
          </div>
          <div>
            <dt>External memory</dt>
            <dd>{formatBytes(snapshot.memory.external)}</dd>
          </div>
          <div>
            <dt>Array buffer memory</dt>
            <dd>{formatBytes(snapshot.memory.arrayBuffers)}</dd>
          </div>
          <div>
            <dt>CPU user time</dt>
            <dd>{numberFormat.format(snapshot.cpuTime.user / 1000)} ms</dd>
          </div>
          <div>
            <dt>CPU system time</dt>
            <dd>{numberFormat.format(snapshot.cpuTime.system / 1000)} ms</dd>
          </div>
        </dl>
        <p className="super-admin-data-note" role="note">
          This is a point-in-time measurement for one Node.js process. It is not
          host-wide CPU utilization or historical monitoring; process restarts
          reset uptime and CPU time.
        </p>
      </section>
    </div>
  );
}
