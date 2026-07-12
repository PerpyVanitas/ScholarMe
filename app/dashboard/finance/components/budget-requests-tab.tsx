"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ExportFinanceCsv } from "@/features/finance/components/finance-export-csv";
import { BudgetRequest } from "../types";
import {
  createBudgetRequest,
  submitBudgetRequestForReview,
  updateBudgetRequestStatus,
} from "@/features/finance/actions/finance-actions";

import { FinanceVendor } from "@/lib/types";

interface Props {
  canSubmit: boolean;
  canReview: boolean;
  canApprove: boolean;
  budgetReqs: BudgetRequest[] | null;
  vendors?: FinanceVendor[];
}

export function BudgetRequestsTab({
  canSubmit,
  canReview,
  canApprove,
  budgetReqs,
  vendors,
}: Props) {
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  return (
    <div className="space-y-6">
      {canSubmit && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Budget Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={createBudgetRequest}
              className="space-y-4 max-w-xl"
              onChange={() => setIsDirty(true)}
              onSubmit={() => setIsDirty(false)}
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
                <Label htmlFor="vendor_id">Preferred Vendor (Optional)</Label>
                <select
                  name="vendor_id"
                  id="vendor_id"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">-- Select Vendor --</option>
                  {vendors?.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
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
              <div className="flex gap-2">
                <SubmitButton
                  type="submit"
                  name="action_type"
                  value="submit"
                  variant="default"
                  loadingText="Submitting..."
                >
                  Submit Request
                </SubmitButton>
                <SubmitButton
                  type="submit"
                  name="action_type"
                  value="draft"
                  variant="outline"
                  loadingText="Saving..."
                >
                  Save Draft
                </SubmitButton>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold mt-8">Recent Requests</h2>
        <ExportFinanceCsv
          data={(budgetReqs || []).map((r) => ({
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
          {budgetReqs.map((req) => (
            <Card key={req.id}>
              <CardHeader>
                <CardTitle>{req.activity_title}</CardTitle>
                <CardDescription>By {req.profiles?.full_name}</CardDescription>
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

                {req.status === "draft" && (
                  <div className="flex gap-2 mt-4">
                    <form
                      action={async () => {
                        await submitBudgetRequestForReview(req.id);
                      }}
                    >
                      <SubmitButton
                        size="sm"
                        variant="default"
                        loadingText="Submitting..."
                      >
                        Submit for Review
                      </SubmitButton>
                    </form>
                  </div>
                )}
                {canReview && req.status === "pending" && (
                  <div className="flex gap-2 mt-4">
                    <form
                      action={async () => {
                        await updateBudgetRequestStatus(
                          req.id,
                          "finance_review",
                        );
                      }}
                    >
                      <SubmitButton
                        size="sm"
                        variant="outline"
                        loadingText="Starting..."
                      >
                        Start Review
                      </SubmitButton>
                    </form>
                    <form
                      action={async () => {
                        await updateBudgetRequestStatus(req.id, "rejected");
                      }}
                    >
                      <SubmitButton
                        size="sm"
                        variant="destructive"
                        loadingText="Rejecting..."
                      >
                        Reject
                      </SubmitButton>
                    </form>
                  </div>
                )}
                {canApprove && req.status === "finance_review" && (
                  <div className="flex gap-2 mt-4">
                    <form
                      action={async () => {
                        await updateBudgetRequestStatus(
                          req.id,
                          "president_approved",
                        );
                      }}
                    >
                      <SubmitButton
                        size="sm"
                        variant="default"
                        loadingText="Approving..."
                      >
                        President Approve
                      </SubmitButton>
                    </form>
                    <form
                      action={async () => {
                        await updateBudgetRequestStatus(req.id, "rejected");
                      }}
                    >
                      <SubmitButton
                        size="sm"
                        variant="destructive"
                        loadingText="Rejecting..."
                      >
                        Reject
                      </SubmitButton>
                    </form>
                  </div>
                )}
                {canReview && req.status === "president_approved" && (
                  <div className="flex gap-2 mt-4">
                    <form
                      action={async () => {
                        await updateBudgetRequestStatus(req.id, "released");
                      }}
                    >
                      <SubmitButton
                        size="sm"
                        variant="default"
                        loadingText="Releasing..."
                      >
                        Release Funds
                      </SubmitButton>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
