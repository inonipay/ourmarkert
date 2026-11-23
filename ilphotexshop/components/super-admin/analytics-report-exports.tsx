"use client";

import { zipSync } from "fflate";
import { jsPDF } from "jspdf";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";
import type { SuperAdminAnalyticsReport } from "@/lib/data-access/super-admin-analytics";

const xlsxMime =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function safeFileName(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "analytics-report"
  );
}

export function getCsvRows(report: SuperAdminAnalyticsReport) {
  return [
    ["Report", report.title],
    ["Description", report.description],
    ["Date range", `${report.dateRange.from} to ${report.dateRange.to}`],
    ["Note", report.notice],
    [],
    ["Metric", "Value", "Details"],
    ...report.metrics.map((metric) => [
      metric.label,
      String(metric.value),
      metric.detail,
    ]),
    [],
    report.columns,
    ...report.rows.map((row) => [
      row.label,
      row.detail,
      row.indicator,
      row.metric,
    ]),
    ...(report.activity
      ? [
          [],
          [report.activityTitle ?? "Daily activity", "Count"],
          ...report.activity.map((point) => [point.day, String(point.count)]),
        ]
      : []),
    ...(report.categories
      ? [
          [],
          ["Category", "Products"],
          ...report.categories.map((category) => [
            category.label,
            String(category.count),
          ]),
        ]
      : []),
  ];
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function createPdf(report: SuperAdminAnalyticsReport) {
  const pdf = new jsPDF({ orientation: "landscape", format: "a4", unit: "mm" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(report.title, margin, y);
  y += 7;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  const intro = pdf.splitTextToSize(
    `${report.description}\nDate range: ${report.dateRange.from} to ${report.dateRange.to}\n${report.notice}`,
    contentWidth,
  );
  pdf.text(intro, margin, y);
  y += intro.length * 4 + 4;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("Summary", margin, y);
  y += 5;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  for (const metric of report.metrics) {
    const lines = pdf.splitTextToSize(
      `${metric.label}: ${metric.value.toLocaleString("en-RW")} — ${metric.detail}`,
      contentWidth,
    );
    if (y + lines.length * 4 > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(lines, margin, y);
    y += lines.length * 4;
  }
  y += 3;

  const columnWidths = [
    contentWidth * 0.2,
    contentWidth * 0.42,
    contentWidth * 0.2,
    contentWidth * 0.18,
  ];
  const headers = report.columns;
  const drawRows = (
    rows: string[][],
    widths: number[],
    rowHeaders: string[],
  ) => {
    const rowWidth = widths.reduce((sum, width) => sum + width, 0);
    const drawHeader = () => {
      pdf.setFillColor(29, 92, 167);
      pdf.rect(margin, y, rowWidth, 8, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(255, 255, 255);
      let x = margin;
      rowHeaders.forEach((header, index) => {
        pdf.text(
          pdf.splitTextToSize(header, widths[index] - 4),
          x + 2,
          y + 5,
        );
        x += widths[index];
      });
      pdf.setTextColor(0, 0, 0);
      y += 8;
    };

    drawHeader();
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    for (const row of rows) {
      const cells = row.map((cell, index) =>
        pdf.splitTextToSize(cell, widths[index] - 4),
      );
      const rowHeight = Math.max(7, ...cells.map((cell) => cell.length * 3.5 + 2));
      if (y + rowHeight > pageHeight - margin) {
        pdf.addPage();
        y = margin;
        drawHeader();
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
      }
      let x = margin;
      cells.forEach((cell, index) => {
        pdf.text(cell, x + 2, y + 4);
        x += widths[index];
      });
      pdf.setDrawColor(220, 227, 235);
      pdf.line(margin, y + rowHeight, margin + rowWidth, y + rowHeight);
      y += rowHeight;
    }
  };

  if (y + 8 > pageHeight - margin) {
    pdf.addPage();
    y = margin;
  }
  drawRows(
    report.rows.map((row) => [row.label, row.detail, row.indicator, row.metric]),
    columnWidths,
    headers,
  );

  if (report.activity?.length) {
    y += 7;
    if (y + 16 > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(report.activityTitle ?? "Daily activity", margin, y);
    y += 5;
    drawRows(
      report.activity.map((point) => [point.day, String(point.count)]),
      [contentWidth * 0.7, contentWidth * 0.3],
      ["Day", report.activityUnit ?? "Count"],
    );
  }

  if (report.categories?.length) {
    y += 7;
    if (y + 16 > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("Products by category", margin, y);
    y += 5;
    drawRows(
      report.categories.map((category) => [
        category.label,
        String(category.count),
      ]),
      [contentWidth * 0.7, contentWidth * 0.3],
      ["Category", "Products"],
    );
  }

  return pdf;
}

type SpreadsheetValue = string | number | undefined;

function columnName(index: number) {
  let value = index + 1;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function xmlEscape(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function worksheetXml(
  rows: SpreadsheetValue[][],
  widths: number[],
  frozenRows: number,
) {
  const maxColumns = Math.max(widths.length, ...rows.map((row) => row.length), 1);
  const columns = Array.from({ length: maxColumns }, (_, index) => {
    const width = widths[index] ?? 18;
    return `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`;
  }).join("");
  const rowXml = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, columnIndex) => {
          if (value === undefined) return "";
          const reference = `${columnName(columnIndex)}${rowIndex + 1}`;
          if (typeof value === "number" && Number.isFinite(value)) {
            return `<c r="${reference}"><v>${value}</v></c>`;
          }
          return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(String(value))}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");
  const views = frozenRows
    ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${frozenRows}" topLeftCell="A${frozenRows + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A${frozenRows + 1}" sqref="A${frozenRows + 1}"/></sheetView></sheetViews>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${views}<cols>${columns}</cols><sheetData>${rowXml}</sheetData></worksheet>`;
}

export function createExcelWorkbook(report: SuperAdminAnalyticsReport) {
  const recordValues = report.rows.map((row) => [
    row.label,
    row.detail,
    row.indicator,
    row.metric,
  ]);
  const sheets: {
    name: string;
    rows: SpreadsheetValue[][];
    widths: number[];
    frozenRows: number;
  }[] = [
    {
      name: "Summary",
      rows: [
        ["Report", report.title],
        ["Description", report.description],
        ["Date range", `${report.dateRange.from} to ${report.dateRange.to}`],
        ["Note", report.notice],
        [],
        ["Metric", "Value", "Details"],
        ...report.metrics.map((metric) => [
          metric.label,
          metric.value,
          metric.detail,
        ]),
      ],
      widths: [28, 24, 64],
      frozenRows: 6,
    },
    {
      name: "Records",
      rows: [report.columns, ...recordValues],
      widths: report.columns.map((_, index) =>
        Math.min(
          52,
          Math.max(
            14,
            report.columns[index].length,
            ...recordValues.map((row) => String(row[index] ?? "").length),
          ),
        ),
      ),
      frozenRows: 1,
    },
  ];

  if (report.activity) {
    sheets.push({
      name: "Daily Activity",
      rows: [
        ["Day", report.activityUnit ?? "Count"],
        ...report.activity.map((point) => [point.day, point.count]),
      ],
      widths: [18, 24],
      frozenRows: 1,
    });
  }

  if (report.categories) {
    sheets.push({
      name: "Categories",
      rows: [
        ["Category", "Products"],
        ...report.categories.map((category) => [
          category.label,
          category.count,
        ]),
      ],
      widths: [26, 16],
      frozenRows: 1,
    });
  }

  const files: Record<string, Uint8Array> = {};
  const sheetOverrides = sheets
    .map(
      (_, index) =>
        `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join("");
  files["[Content_Types].xml"] = new TextEncoder().encode(
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheetOverrides}</Types>`,
  );
  files["_rels/.rels"] = new TextEncoder().encode(
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  );
  files["xl/workbook.xml"] = new TextEncoder().encode(
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((sheet, index) => `<sheet name="${xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("")}</sheets></workbook>`,
  );
  files["xl/_rels/workbook.xml.rels"] = new TextEncoder().encode(
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("")}</Relationships>`,
  );
  sheets.forEach((sheet, index) => {
    files[`xl/worksheets/sheet${index + 1}.xml`] = new TextEncoder().encode(
      worksheetXml(sheet.rows, sheet.widths, sheet.frozenRows),
    );
  });
  return zipSync(files, { level: 6 });
}

export default function SuperAdminAnalyticsReportExports({
  report,
}: {
  report: SuperAdminAnalyticsReport;
}) {
  const [busy, setBusy] = useState<"pdf" | "excel" | null>(null);
  const [error, setError] = useState("");
  const baseFileName = safeFileName(
    `${report.title}-${report.dateRange.from}-${report.dateRange.to}`,
  );

  async function handleExport(format: "pdf" | "excel") {
    setBusy(format);
    setError("");
    try {
      if (format === "pdf") {
        const pdf = createPdf(report);
        pdf.save(`${baseFileName}.pdf`);
      } else {
        const bytes = createExcelWorkbook(report);
        const buffer = new ArrayBuffer(bytes.byteLength);
        new Uint8Array(buffer).set(bytes);
        downloadBlob(
          new Blob([buffer], { type: xlsxMime }),
          `${baseFileName}.xlsx`,
        );
      }
    } catch (caught) {
      console.error(`Could not export analytics report as ${format}`, caught);
      setError(`${format.toUpperCase()} export failed. Please try again.`);
    } finally {
      setBusy(null);
    }
  }

  const csvRows = getCsvRows(report);
  return (
    <div className="super-admin-analytics-export">
      <div className="super-admin-analytics-export-actions">
        <button
          className="super-admin-export-action"
          disabled={busy !== null}
          onClick={() => void handleExport("pdf")}
          type="button"
        >
          <FileText aria-hidden="true" size={15} />
          {busy === "pdf" ? "Creating PDF…" : "PDF"}
        </button>
        <button
          className="super-admin-export-action"
          disabled={busy !== null}
          onClick={() => void handleExport("excel")}
          type="button"
        >
          <FileSpreadsheet aria-hidden="true" size={15} />
          {busy === "excel" ? "Creating Excel…" : "Excel"}
        </button>
        <CsvDownloadButton
          disabled={busy !== null}
          fileName={baseFileName}
          onError={(message) => setError(message)}
          rows={csvRows}
        />
      </div>
      {error && <span aria-live="polite">{error}</span>}
    </div>
  );
}

function csvCell(value: string) {
  const startsWithFormula = /^[\t\r\n ]*[=+\-@]/.test(value);
  const safeValue = startsWithFormula ? `'${value}` : value;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

function CsvDownloadButton({
  disabled,
  fileName,
  onError,
  rows,
}: {
  disabled: boolean;
  fileName: string;
  onError: (message: string) => void;
  rows: readonly (readonly string[])[];
}) {
  function handleDownload() {
    try {
      const csv = `\uFEFF${rows
        .map((row) => row.map(csvCell).join(","))
        .join("\r\n")}`;
      downloadBlob(
        new Blob([csv], { type: "text/csv;charset=utf-8" }),
        `${fileName}.csv`,
      );
    } catch (caught) {
      console.error("Could not export analytics report as CSV", caught);
      onError("CSV export failed. Please try again.");
    }
  }

  return (
    <button
      className="super-admin-export-action"
      disabled={disabled}
      onClick={handleDownload}
      type="button"
    >
      <Download aria-hidden="true" size={15} />
      CSV
    </button>
  );
}
