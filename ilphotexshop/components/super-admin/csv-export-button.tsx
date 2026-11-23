"use client";

import { useState } from "react";
import { Download } from "lucide-react";

function csvCell(value: string) {
  const startsWithFormula = /^[\t\r\n ]*[=+\-@]/.test(value);
  const safeValue = startsWithFormula ? `'${value}` : value;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

export default function SuperAdminCsvExportButton({
  fileName,
  rows,
  label = "Download CSV",
}: {
  fileName: string;
  rows: readonly (readonly string[])[];
  label?: string;
}) {
  const [error, setError] = useState("");

  function handleDownload() {
    try {
      const csv = `\uFEFF${rows
        .map((row) => row.map(csvCell).join(","))
        .join("\r\n")}`;
      const file = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      const safeFileName = fileName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      link.href = url;
      link.download = `${safeFileName || "export"}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setError("");
    } catch (caught) {
      console.error("Could not export CSV", caught);
      setError("CSV export failed. Please try again.");
    }
  }

  return (
    <div className="super-admin-analytics-export">
      <button
        className="super-admin-export-action"
        onClick={handleDownload}
        type="button"
      >
        <Download aria-hidden="true" size={15} />
        {label}
      </button>
      {error && <span aria-live="polite">{error}</span>}
    </div>
  );
}
