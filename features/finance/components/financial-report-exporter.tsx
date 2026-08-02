"use client";

import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { BudgetRequest, Scard, Liquidation } from "@/app/dashboard/finance/types";

interface FinancialReportExporterProps {
  budgetReqs: BudgetRequest[] | null;
  scards: Scard[] | null;
  liquidations: Liquidation[] | null;
}

export function FinancialReportExporter({
  budgetReqs,
  scards,
  liquidations,
}: FinancialReportExporterProps) {
  const handleExportSummaryCSV = () => {
    const headers = ["Category", "Transaction ID", "Title / Event", "Amount (PHP)", "Status", "Date"];
    const rows: string[][] = [];

    budgetReqs?.forEach((b) => {
      rows.push([
        "Budget Request",
        b.id,
        `"${b.activity_title.replace(/"/g, '""')}"`,
        b.amount.toString(),
        b.status,
        new Date(b.created_at).toLocaleDateString(),
      ]);
    });

    scards?.forEach((s) => {
      rows.push([
        "SCARDS",
        s.id,
        `"SCARDS Event ${s.event_id}"`,
        s.balance.toString(),
        s.status,
        new Date(s.created_at).toLocaleDateString(),
      ]);
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Financial_Summary_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleExportSummaryCSV} className="gap-2">
        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
        Export Financial CSV
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrintReport} className="gap-2">
        <Printer className="h-4 w-4 text-indigo-600" />
        Print Financial Summary
      </Button>
    </div>
  );
}
