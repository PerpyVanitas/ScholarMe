"use client";


import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Pencil, Send, Download } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ExportFinanceCsv } from "@/features/finance/components/finance-export-csv";
import { Scard } from "../types";
import { toast } from "sonner";
import {
  saveScards,
  submitScardsForReview,
  updateScardsReport,
  cosignScards,
} from "@/features/finance/actions/finance-actions";

interface Props {
  canSubmit: boolean;
  canAudit: boolean;
  scards: Scard[] | null;
}

export function ScardsTab({ canSubmit, canAudit, scards }: Props) {
  const handleExportPdf = async (report: Scard) => {
    // Generate a temporary hidden div for the report
    const div = document.createElement("div");
    div.style.position = "absolute";
    div.style.left = "-9999px";
    div.style.padding = "40px";
    div.style.width = "800px";
    div.style.background = "white";
    div.style.color = "black";
    div.style.fontFamily = "sans-serif";

    div.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h2>Official SCARDS Report</h2>
        <p>Event ID: <strong>${report.event_id}</strong> (v${report.version})</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="border: 1px solid #ccc; padding: 10px;"><strong>Status</strong></td><td style="border: 1px solid #ccc; padding: 10px;">${report.status.toUpperCase()}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 10px;"><strong>Date Submitted</strong></td><td style="border: 1px solid #ccc; padding: 10px;">${new Date(report.created_at).toLocaleDateString()}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 10px;"><strong>Total Receipts</strong></td><td style="border: 1px solid #ccc; padding: 10px;">P${report.receipts_total}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 10px;"><strong>Total Disbursements</strong></td><td style="border: 1px solid #ccc; padding: 10px;">P${report.disbursements_total}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 10px;"><strong>Final Balance</strong></td><td style="border: 1px solid #ccc; padding: 10px;"><strong>P${report.balance}</strong></td></tr>
      </table>
      ${report.status === "cosigned" ? `<p style="margin-top: 30px;">Co-signed by Auditor on ${new Date(report.cosigned_at!).toLocaleDateString()}</p>` : ""}
      <p style="margin-top: ${report.status === "cosigned" ? "10px" : "30px"};">Certified by Finance Officer</p>
    `;

    document.body.appendChild(div);

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(div, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`SCARDS_${report.event_id}_v${report.version}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      document.body.removeChild(div);
    }
  };

  return (
    <div className="space-y-6">
      {canSubmit && (
        <Card>
          <CardHeader>
            <CardTitle>Submit SCARDS Report</CardTitle>
            <CardDescription>
              Report total receipts and disbursements for an event.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={saveScards} className="space-y-4 max-w-xl">
              <div className="flex flex-col gap-2">
                <Label htmlFor="event_id">Event Name or ID</Label>
                <Input
                  id="event_id"
                  name="event_id"
                  placeholder="e.g. General Assembly 2026"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="receipts_total">Total Receipts (₱)</Label>
                  <Input
                    id="receipts_total"
                    type="number"
                    name="receipts_total"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="disbursements_total">
                    Total Disbursements (₱)
                  </Label>
                  <Input
                    id="disbursements_total"
                    type="number"
                    name="disbursements_total"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="scards_attachment">
                  Official SCARDS Report (PDF/Excel)
                </Label>
                <Input
                  id="scards_attachment"
                  name="attachment"
                  type="file"
                  accept=".pdf,.xls,.xlsx"
                  required
                />
              </div>
              <Button type="submit">Submit Draft SCARDS</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold mt-8">SCARDS Reports</h2>
        <ExportFinanceCsv
          data={(scards || []).map((r) => ({
            Event: r.event_id,
            Version: r.version,
            "Receipts (PHP)": r.receipts_total,
            "Disbursements (PHP)": r.disbursements_total,
            "Balance (PHP)": r.balance,
            Status: r.status,
            Date: new Date(r.created_at).toLocaleDateString(),
          }))}
          filename="scards"
        />
      </div>
      {!scards || scards.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No SCARDS Reports"
          description="No SCARDS reports have been submitted."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {scards.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle>{report.event_id}</CardTitle>
                <CardDescription>
                  v{report.version} • Created{" "}
                  {new Date(report.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Receipts</p>
                    <p className="font-semibold">₱{report.receipts_total}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Disbursements</p>
                    <p className="font-semibold">
                      ₱{report.disbursements_total}
                    </p>
                  </div>
                </div>
                {report.attachment_url && (
                  <a
                    href={`/api/v1/finance/attachment?path=${encodeURIComponent(report.attachment_url)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary text-sm flex items-center gap-1 mt-2 hover:underline"
                  >
                    <FileText className="w-4 h-4" /> View Official Report
                  </a>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportPdf(report)}
                    className="w-full mt-2"
                  >
                    <Download className="w-4 h-4 mr-2" /> Export to PDF
                  </Button>
                </div>

                <div className="p-3 bg-muted rounded-md flex justify-between items-center mt-4">
                  <span className="font-medium">Balance</span>
                  <span
                    className={`font-bold ${
                      report.balance >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    ₱{report.balance}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span
                    className={`px-2 py-1 rounded text-xs uppercase tracking-wider font-semibold ${
                      report.status === "cosigned"
                        ? "bg-primary/10 text-primary"
                        : report.status === "auditor_review"
                          ? "bg-blue-500/10 text-blue-600"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {report.status}
                  </span>

                  <div className="flex gap-2">
                    {report.status === "draft" && canSubmit && (
                      <form
                        action={async (fd: FormData) => {
                          fd.append("scard_id", report.id);
                          await updateScardsReport(fd);
                        }}
                      >
                        <input
                          type="hidden"
                          name="receipts_total"
                          value={report.receipts_total}
                        />
                        <input
                          type="hidden"
                          name="disbursements_total"
                          value={report.disbursements_total}
                        />
                        <Button size="sm" variant="outline" type="submit">
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit Draft
                        </Button>
                      </form>
                    )}
                    {report.status === "draft" && canSubmit && (
                      <form
                        action={async () => {
                          await submitScardsForReview(report.id);
                        }}
                      >
                        <Button size="sm" variant="default" type="submit">
                          <Send className="h-3 w-3 mr-1" />
                          Submit for Review
                        </Button>
                      </form>
                    )}
                    {canAudit && report.status === "auditor_review" && (
                      <form
                        action={async () => {
                          await cosignScards(report.id);
                        }}
                      >
                        <Button size="sm" variant="outline">
                          Co-sign Report
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
                {report.status === "cosigned" && report.cosigned_by && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Co-signed{" "}
                    {report.cosigned_at
                      ? `on ${new Date(report.cosigned_at).toLocaleDateString()}`
                      : ""}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
