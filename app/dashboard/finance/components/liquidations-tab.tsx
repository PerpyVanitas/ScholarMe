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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Receipt, FileText, AlertTriangle, Clock, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ExportFinanceCsv } from "@/features/finance/components/finance-export-csv";
import { Liquidation, BudgetRequest } from "../types";
import { submitLiquidation } from "@/features/finance/actions/finance-actions";
import { toast } from "sonner";

interface Props {
  canSubmit: boolean;
  approvedRequests:
    Pick<BudgetRequest, "id" | "activity_title" | "amount">[] | null;
  allLiquidations: Liquidation[] | null;
  lateLiquidations: Liquidation[] | null;
}

export function LiquidationsTab({
  canSubmit,
  approvedRequests,
  allLiquidations,
  lateLiquidations,
}: Props) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [returnedAmount, setReturnedAmount] = useState<number>(0);

  const handleExtractAI = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const fileInput = document.getElementById("receipts") as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) {
      toast.error("Please select a receipt file first.");
      return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("receipt", file);

    try {
      setIsExtracting(true);
      toast.info("Extracting receipt data...");
      const res = await fetch("/api/v1/finance/ocr", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to extract");

      const data = await res.json();
      toast.success(`Extracted: ${data.vendorName} - ₱${data.totalAmount}`);
      
      // Auto-calculate returned amount if we have a selected request
      const reqSelect = document.getElementById("request_id") as HTMLSelectElement;
      if (reqSelect.value) {
        const req = approvedRequests?.find(r => r.id === reqSelect.value);
        if (req && req.amount) {
          const diff = req.amount - data.totalAmount;
          if (diff >= 0) {
            setReturnedAmount(diff);
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to extract data using AI.");
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-6">
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
                  {approvedRequests?.map((req) => (
                    <option key={req.id} value={req.id}>
                      {req.activity_title} - ₱{req.amount}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="receipts">Official Receipts (Images/PDFs)</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={handleExtractAI} disabled={isExtracting}>
                    <Sparkles className="w-3 h-3 mr-1" /> {isExtracting ? "Extracting..." : "Extract with AI"}
                  </Button>
                </div>
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
                <Label htmlFor="returned_amount">Returned Unspent Amount (PHP)</Label>
                <Input
                  id="returned_amount"
                  name="returned_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={returnedAmount}
                  onChange={(e) => setReturnedAmount(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="proofs">Proofs of Payment / Return (Images/PDFs)</Label>
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
          data={(allLiquidations || []).map((l) => ({
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
          {allLiquidations.map((liq) => (
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
                  Submitted: {new Date(liq.submitted_at).toLocaleDateString()}
                </p>

                <div className="flex gap-4">
                  {liq.receipt_urls && liq.receipt_urls.length > 0 && (
                    <a
                      href={`/api/v1/finance/attachment?path=${encodeURIComponent(liq.receipt_urls[0])}`}
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
                        href={`/api/finance/attachment?path=${encodeURIComponent(
                          liq.proof_of_payment_urls[0],
                        )}`}
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
                    className={`px-2 py-1 rounded text-xs ${
                      liq.is_late
                        ? "bg-destructive/10 text-destructive"
                        : "bg-green-100 text-green-800"
                    }`}
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
              {lateLiquidations.map((liq) => (
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
    </div>
  );
}
