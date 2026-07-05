import { SyncTabs } from "@/components/sync-tabs";
import { EmptyState } from "@/components/empty-state";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Clock,
  Receipt,
  FileText,
  Save,
  Send,
  Pencil,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createBudgetRequest,
  createPettyCash,
  updateBudgetRequestStatus,
  submitLiquidation,
  saveScards,
  cosignScards,
  submitScardsForReview,
  updateScardsReport,
} from "@/app/actions/finance";
import { redirect } from "next/navigation";
import { Label } from "@/components/ui/label";
import { TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ExportFinanceCsv } from "@/components/finance-export-csv";
import { Badge } from "@/components/ui/badge";

export default async function FinanceDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: isManager } = await supabase.rpc("has_role", {
    user_id: user.id,
    allowed_roles: ["finance_manager", "administrator"],
  });

  const { data: canSubmit } = await supabase.rpc("has_role", {
    user_id: user.id,
    allowed_roles: [
      "finance_manager",
      "administrator",
      "committee_head",
      "president",
    ],
  });

  const { data: budgetReqs } = await supabase
    .from("finance_budget_requests")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false });
  const { data: pettyCash } = await supabase
    .from("finance_petty_cash")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false });
  const { data: lateLiquidations } = await supabase
    .from("finance_liquidations")
    .select(
      "*, finance_budget_requests(activity_title, amount), profiles(full_name)",
    )
    .eq("is_late", true)
    .order("submitted_at", { ascending: true });

  const { data: approvedRequests } = await supabase
    .from("finance_budget_requests")
    .select("*")
    .eq("status", "president_approved")
    .order("created_at", { ascending: false });
  const { data: allLiquidations } = await supabase
    .from("finance_liquidations")
    .select("*, finance_budget_requests(activity_title), profiles(full_name)")
    .order("submitted_at", { ascending: false });
  const { data: scards } = await supabase
    .from("finance_scards")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col items-start gap-2">
        <h1 className="text-3xl font-bold">Financial Management</h1>
        {isManager && (
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
            Finance Manager Access
          </span>
        )}
      </div>

      <SyncTabs defaultValue="requests" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="requests">Budget Requests</TabsTrigger>
          <TabsTrigger value="petty_cash">Petty Cash</TabsTrigger>
          <TabsTrigger value="liquidations">Liquidations</TabsTrigger>
          <TabsTrigger value="scards">SCARDS & Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          {canSubmit && (
            <Card>
              <CardHeader>
                <CardTitle>Submit Budget Request</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  action={createBudgetRequest}
                  className="space-y-4 max-w-xl"
                >
                  <Input
                    name="activity_title"
                    placeholder="Activity Title"
                    required
                  />
                  <Textarea name="objectives" placeholder="Objectives" />
                  <Input
                    type="number"
                    name="amount"
                    placeholder="Total Amount (PHP)"
                    required
                  />
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="attachment">
                      Budget Request Document (PDF/DOCX)
                    </Label>
                    <Input
                      id="attachment"
                      name="attachment"
                      type="file"
                      accept=".pdf,.docx,.doc"
                      required
                    />
                  </div>
                  <Button type="submit">Submit Request</Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold mt-8">Recent Requests</h2>
            <ExportFinanceCsv
              data={(budgetReqs || []).map((r: any) => ({
                Activity: r.activity_title,
                "Submitted By": r.profiles?.full_name ?? "",
                "Amount (PHP)": r.amount,
                Status: r.status,
                Date: new Date(r.created_at).toLocaleDateString(),
              }))}
              filename="budget_requests"
            />
          </div>
          {!budgetReqs || budgetReqs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No Budget Requests"
              description="There are no budget requests submitted yet."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {budgetReqs.map((req: any) => (
                <Card key={req.id}>
                  <CardHeader>
                    <CardTitle>{req.activity_title}</CardTitle>
                    <CardDescription>
                      By {req.profiles?.full_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold text-lg">₱{req.amount}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      Status: {req.status.replace("_", " ")}
                    </p>
                    {req.attachment_url && (
                      <a
                        href={`/api/finance/attachment?path=${encodeURIComponent(req.attachment_url)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary text-sm flex items-center gap-1 mt-2 hover:underline"
                      >
                        <FileText className="w-4 h-4" /> View Document
                      </a>
                    )}

                    {isManager && req.status === "pending" && (
                      <div className="flex gap-2 mt-4">
                        <form
                          action={async () => {
                            "use server";
                            await updateBudgetRequestStatus(
                              req.id,
                              "finance_review",
                            );
                          }}
                        >
                          <Button size="sm" variant="outline">
                            Start Review
                          </Button>
                        </form>
                        <form
                          action={async () => {
                            "use server";
                            await updateBudgetRequestStatus(
                              req.id,
                              "president_approved",
                            );
                          }}
                        >
                          <Button size="sm" variant="default">
                            Approve
                          </Button>
                        </form>
                        <form
                          action={async () => {
                            "use server";
                            await updateBudgetRequestStatus(req.id, "rejected");
                          }}
                        >
                          <Button size="sm" variant="destructive">
                            Reject
                          </Button>
                        </form>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="petty_cash" className="space-y-6">
          {canSubmit && (
            <Card>
              <CardHeader>
                <CardTitle>Request Petty Cash</CardTitle>
                <CardDescription>Maximum ₱300 per transaction.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={createPettyCash} className="space-y-4 max-w-xl">
                  <Input
                    type="number"
                    name="amount"
                    placeholder="Amount (PHP)"
                    max="300"
                    required
                  />
                  <Textarea
                    name="justification"
                    placeholder="Justification"
                    required
                  />
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="pc_attachment">
                      Petty Cash Voucher (PDF/Image)
                    </Label>
                    <Input
                      id="pc_attachment"
                      name="attachment"
                      type="file"
                      accept=".pdf,.jpeg,.jpg,.png"
                      required
                    />
                  </div>
                  <Button type="submit">Submit Petty Cash</Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold mt-8">Petty Cash Log</h2>
            <ExportFinanceCsv
              data={(pettyCash || []).map((r: any) => ({
                "Submitted By": r.profiles?.full_name ?? "",
                "Amount (PHP)": r.amount,
                Justification: r.justification,
                Status: r.status,
                Date: new Date(r.created_at).toLocaleDateString(),
              }))}
              filename="petty_cash"
            />
          </div>
          {!pettyCash || pettyCash.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No Petty Cash"
              description="There are no petty cash requests logged."
            />
          ) : (
            <div className="space-y-4">
              {pettyCash.map((req: any) => (
                <div
                  key={req.id}
                  className="p-4 border rounded flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">
                      ₱{req.amount} - {req.profiles?.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {req.justification}
                    </p>
                    {req.attachment_url && (
                      <a
                        href={`/api/finance/attachment?path=${encodeURIComponent(req.attachment_url)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary text-xs flex items-center gap-1 mt-1 hover:underline"
                      >
                        <FileText className="w-3 h-3" /> View Voucher
                      </a>
                    )}
                  </div>
                  <div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${req.status === "pending" ? "bg-yellow-100 text-yellow-800" : req.status === "approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {req.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="liquidations" className="space-y-6">
          {canSubmit && (
            <Card>
              <CardHeader>
                <CardTitle>Submit Liquidation</CardTitle>
                <CardDescription>
                  Liquidate approved budget requests.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={submitLiquidation} className="space-y-4 max-w-xl">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="request_id">Select Budget Request</Label>
                    <select
                      id="request_id"
                      name="request_id"
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Select an approved request...</option>
                      {approvedRequests?.map((req: any) => (
                        <option key={req.id} value={req.id}>
                          {req.activity_title} - ₱{req.amount}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="receipts">
                      Official Receipts (Images/PDFs)
                    </Label>
                    <Input
                      id="receipts"
                      name="receipts"
                      type="file"
                      accept=".pdf,.jpeg,.jpg,.png"
                      multiple
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="proofs">
                      Proofs of Payment (Images/PDFs)
                    </Label>
                    <Input
                      id="proofs"
                      name="proofs"
                      type="file"
                      accept=".pdf,.jpeg,.jpg,.png"
                      multiple
                      required
                    />
                  </div>
                  <Button type="submit">Submit Liquidation</Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold mt-8">Recent Liquidations</h2>
            <ExportFinanceCsv
              data={(allLiquidations || []).map((l: any) => ({
                Activity: l.finance_budget_requests?.activity_title ?? "",
                "Submitted By": l.profiles?.full_name ?? "",
                Submitted: new Date(l.submitted_at).toLocaleDateString(),
                Late: l.is_late ? "Yes" : "No",
              }))}
              filename="liquidations"
            />
          </div>
          {!allLiquidations || allLiquidations.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No Liquidations"
              description="No liquidations have been submitted yet."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {allLiquidations.map((liq: any) => (
                <Card key={liq.id}>
                  <CardHeader>
                    <CardTitle>
                      {liq.finance_budget_requests?.activity_title ||
                        "Unknown Request"}
                    </CardTitle>
                    <CardDescription>
                      Submitted by {liq.profiles?.full_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Submitted:{" "}
                      {new Date(liq.submitted_at).toLocaleDateString()}
                    </p>

                    <div className="flex gap-4">
                      {liq.receipt_urls && liq.receipt_urls.length > 0 && (
                        <a
                          href={`/api/finance/attachment?path=${encodeURIComponent(liq.receipt_urls[0])}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary text-sm flex items-center gap-1 hover:underline"
                        >
                          <Receipt className="w-4 h-4" /> Receipts
                        </a>
                      )}
                      {liq.proof_of_payment_urls &&
                        liq.proof_of_payment_urls.length > 0 && (
                          <a
                            href={`/api/finance/attachment?path=${encodeURIComponent(liq.proof_of_payment_urls[0])}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary text-sm flex items-center gap-1 hover:underline"
                          >
                            <FileText className="w-4 h-4" /> Proofs
                          </a>
                        )}
                    </div>

                    <div className="flex gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${liq.is_late ? "bg-destructive/10 text-destructive" : "bg-green-100 text-green-800"}`}
                      >
                        {liq.is_late ? "Late Submission" : "On Time"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Late Liquidations Flagged
              </CardTitle>
              <CardDescription>
                Users who have exceeded the 7-day liquidation limit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!lateLiquidations || lateLiquidations.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="All clear"
                  description="There are no late liquidations."
                />
              ) : (
                <div className="space-y-3">
                  {lateLiquidations.map((liq: any) => (
                    <div
                      key={liq.id}
                      className="flex justify-between items-center p-3 bg-background rounded-md border border-destructive/20"
                    >
                      <div>
                        <p className="font-medium text-destructive">
                          {liq.profiles?.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {liq.finance_budget_requests?.activity_title} — ₱
                          {liq.finance_budget_requests?.amount}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-destructive uppercase tracking-wider block">
                          Overdue
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Due:{" "}
                          {new Date(
                            new Date(liq.submitted_at).getTime() +
                              7 * 24 * 60 * 60 * 1000,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scards" className="space-y-6">
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
              data={(scards || []).map((r: any) => ({
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
              {scards.map((report: any) => (
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
                        <p className="font-semibold">
                          ₱{report.receipts_total}
                        </p>
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
                        href={`/api/finance/attachment?path=${encodeURIComponent(report.attachment_url)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary text-sm flex items-center gap-1 mt-2 hover:underline"
                      >
                        <FileText className="w-4 h-4" /> View Official Report
                      </a>
                    )}
                    <div className="p-3 bg-muted rounded-md flex justify-between items-center mt-4">
                      <span className="font-medium">Balance</span>
                      <span
                        className={`font-bold ${report.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                      >
                        ₱{report.balance}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <span
                        className={`px-2 py-1 rounded text-xs uppercase tracking-wider font-semibold ${
                          report.status === "cosigned"
                            ? "bg-primary/10 text-primary"
                            : report.status === "submitted"
                              ? "bg-blue-500/10 text-blue-600"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {report.status}
                      </span>

                      <div className="flex gap-2">
                        {/* Edit draft */}
                        {report.status === "draft" && canSubmit && (
                          <form
                            action={async (fd: FormData) => {
                              "use server";
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
                        {/* Submit draft for review */}
                        {report.status === "draft" && canSubmit && (
                          <form
                            action={async () => {
                              "use server";
                              await submitScardsForReview(report.id);
                            }}
                          >
                            <Button size="sm" variant="default" type="submit">
                              <Send className="h-3 w-3 mr-1" />
                              Submit for Review
                            </Button>
                          </form>
                        )}
                        {/* Co-sign submitted report */}
                        {isManager && report.status === "submitted" && (
                          <form
                            action={async () => {
                              "use server";
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
        </TabsContent>
      </SyncTabs>
    </div>
  );
}
