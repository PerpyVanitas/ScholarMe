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
import { Receipt, FileText } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ExportFinanceCsv } from "@/features/finance/components/finance-export-csv";
import { PettyCash } from "../types";
import {
  createPettyCash,
  submitPettyCashForReview,
} from "@/features/finance/actions/finance-actions";

import { FinanceVendor } from "@/lib/types";

interface Props {
  canSubmit: boolean;
  pettyCash: PettyCash[] | null;
  vendors?: FinanceVendor[];
}

export function PettyCashTab({ canSubmit, pettyCash, vendors }: Props) {
  return (
    <div className="space-y-6">
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
                <Label htmlFor="pc_vendor_id">Preferred Vendor (Optional)</Label>
                <select 
                  name="vendor_id" 
                  id="pc_vendor_id"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">-- Select Vendor --</option>
                  {vendors?.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
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
              <div className="flex gap-2">
                <Button
                  type="submit"
                  name="action_type"
                  value="submit"
                  variant="default"
                >
                  Submit Petty Cash
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
        <h2 className="text-xl font-bold mt-8">Petty Cash Log</h2>
        <ExportFinanceCsv
          data={(pettyCash || []).map((r) => ({
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
          {pettyCash.map((req) => (
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
                  className={`px-2 py-1 rounded text-xs ${
                    req.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : req.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {req.status}
                </span>
                {req.status === "draft" && (
                  <div className="mt-2 text-right">
                    <form
                      action={async () => {
                        "use server";
                        await submitPettyCashForReview(req.id);
                      }}
                    >
                      <Button size="sm" variant="default">
                        Submit for Review
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
