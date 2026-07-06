"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface ExportFinanceCsvProps {
  data: Record<string, unknown>[];
  filename: string;
  label?: string;
}

export function ExportFinanceCsv({
  data,
  filename,
  label = "Export CSV",
}: ExportFinanceCsvProps) {
  function exportCSV() {
    if (!data.length) {
      toast.info("No data to export");
      return;
    }
    const headers = Object.keys(data[0]);
    const rows = [
      headers,
      ...data.map((row) => headers.map((h) => String(row[h] ?? ""))),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported successfully!");
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportCSV}
      className="gap-2 h-8 text-xs"
    >
      <Download className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
