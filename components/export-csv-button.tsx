"use client";

import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface ExportCsvButtonProps {
  /** The data rows to export */
  data: Record<string, unknown>[];
  /** The filename without extension */
  filename?: string;
  /** Optional label override */
  label?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "outline" | "default" | "ghost" | "secondary";
}

/**
 * One-click CSV export button.
 * Serializes `data` into a CSV string and triggers a browser file download.
 *
 * @example
 * <ExportCsvButton
 *   data={timesheetRows}
 *   filename="timesheets_sem1_2026"
 *   label="Export CSV"
 * />
 */
export function ExportCsvButton({
  data,
  filename = "export",
  label = "Export CSV",
  size = "sm",
  variant = "outline",
}: ExportCsvButtonProps) {
  const [loading, setLoading] = useState(false);

  function handleExport() {
    if (!data || data.length === 0) {
      toast.error("No data to export.");
      return;
    }

    setLoading(true);
    try {
      const headers = Object.keys(data[0]);
      const escape = (v: unknown) => {
        const str = v === null || v === undefined ? "" : String(v);
        // Wrap in quotes if contains comma, quote, or newline
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      };

      const csvRows = [
        headers.join(","),
        ...data.map((row) => headers.map((h) => escape(row[h])).join(",")),
      ];

      const blob = new Blob([csvRows.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("CSV exported successfully.");
    } catch {
      toast.error("Failed to export CSV.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={loading || !data?.length}
    >
      {loading ? (
        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="mr-2 h-3.5 w-3.5" />
      )}
      {label}
    </Button>
  );
}
