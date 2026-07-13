"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Table as TableIcon, FileSpreadsheet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const TABLES = {
  profiles: {
    label: "Users & Profiles",
    columns: [
      "id",
      "full_name",
      "email",
      "degree_program",
      "year_level",
      "total_xp",
      "current_level",
      "created_at",
    ],
  },
  study_sets: {
    label: "Study Sets & Flashcards",
    columns: [
      "id",
      "title",
      "description",
      "generation_mode",
      "is_public",
      "user_id",
      "created_at",
    ],
  },
  finance_budget_requests: {
    label: "Budget Requests (Finance)",
    columns: [
      "id",
      "activity_title",
      "amount",
      "status",
      "submitted_by",
      "created_at",
    ],
  },
  sessions: {
    label: "Tutoring Sessions",
    columns: [
      "id",
      "tutor_id",
      "learner_id",
      "status",
      "scheduled_date",
      "start_time",
      "end_time",
      "created_at",
    ],
  },
};

export default function CustomExportPage() {
  const [selectedTable, setSelectedTable] = useState<keyof typeof TABLES | "">(
    "",
  );
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  const handleTableChange = (val: string) => {
    setSelectedTable(val as keyof typeof TABLES);
    // Default select all columns for the new table
    setSelectedColumns(TABLES[val as keyof typeof TABLES].columns);
  };

  const handleColumnToggle = (col: string) => {
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col],
    );
  };

  const handleExport = async () => {
    if (!selectedTable || selectedColumns.length === 0) {
      toast.error("Please select a table and at least one column");
      return;
    }

    try {
      setExporting(true);
      toast.loading("Preparing CSV export...", { id: "csv_export" });

      const supabase = createClient();
      const { data, error } = await supabase
        .from(selectedTable)
        .select(selectedColumns.join(","));

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error("No data found for the selected criteria", {
          id: "csv_export",
        });
        return;
      }

      // Build CSV string
      const headerRow = selectedColumns.join(",");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dataRows = data.map((row: any) =>
        selectedColumns
          .map((col) => {
            let val = row[col];
            if (val === null || val === undefined) val = "";
            if (typeof val === "string") val = `"${val.replace(/"/g, '""')}"`;
            return val;
          })
          .join(","),
      );

      const csvString = [headerRow, ...dataRows].join("\n");

      // Download
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `scholarme_export_${selectedTable}_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Successfully exported ${data.length} rows`, {
        id: "csv_export",
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to export data", { id: "csv_export" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
          Custom Data Export
        </h1>
        <p className="text-muted-foreground mt-1">
          Build and download custom CSV reports from the database
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TableIcon className="h-5 w-5" /> Source Data
          </CardTitle>
          <CardDescription>
            Select which table you want to export data from.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2 max-w-md">
              <Label>Database Table</Label>
              <Select value={selectedTable} onValueChange={handleTableChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a table..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TABLES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label} ({key})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTable && (
              <div className="pt-4 border-t mt-6">
                <Label className="text-base mb-4 block">
                  Select Columns to Include
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {TABLES[selectedTable as keyof typeof TABLES].columns.map(
                    (col) => (
                      <div
                        key={col}
                        className="flex items-center space-x-2 bg-muted/30 p-3 rounded-md border"
                      >
                        <Checkbox
                          id={`col_${col}`}
                          checked={selectedColumns.includes(col)}
                          onCheckedChange={() => handleColumnToggle(col)}
                        />
                        <Label
                          htmlFor={`col_${col}`}
                          className="cursor-pointer font-medium"
                        >
                          {col}
                        </Label>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleExport}
          disabled={!selectedTable || selectedColumns.length === 0 || exporting}
          className="w-full sm:w-auto"
        >
          {exporting ? (
            "Generating CSV..."
          ) : (
            <>
              <Download className="mr-2 h-5 w-5" />
              Download CSV Report
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
