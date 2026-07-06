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

interface Props {
  canSubmit: boolean;
  isManager: boolean;
  budgetReqs: BudgetRequest[] | null;
}

export function BudgetRequestsTab({ canSubmit, isManager, budgetReqs }: Props) {
  return (
    <div className="space-y-6">
      {canSubmit && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Budget Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createBudgetRequest} className="space-y-4 max-w-xl">
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
              <div className="flex gap-2">
                <Button
                  type="submit"
                  name="action_type"
                  value="submit"
                  variant="default"
                >
                  Submit Request
                </Button>
                <Button
                  type="submit"
                  name="action_type"
                  value="draft"
                  variant="outline"
                >
                  Save Draft
                </Button>
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
                        "use server";
                        await submitBudgetRequestForReview(req.id);
                      }}
                    >
                      <Button size="sm" variant="default">
                        Submit for Review
                      </Button>
                    </form>
                  </div>
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
    </div>
  );
}
