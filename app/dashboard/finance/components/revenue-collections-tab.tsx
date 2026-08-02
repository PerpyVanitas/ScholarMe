"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Coins, CheckCircle2, AlertCircle } from "lucide-react";
import { RevenueCollection } from "../types";

interface Props {
  canSubmit: boolean;
  collections: RevenueCollection[] | null;
}

export function RevenueCollectionsTab({ canSubmit, collections }: Props) {
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [officer2Id, setOfficer2Id] = useState("");
  const [depositRef, setDepositRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source || !amount || !officer2Id) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/finance/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          amount: Number(amount),
          officer_2_id: officer2Id,
          deposit_reference: depositRef || undefined,
        }),
      });

      if (res.ok) {
        setSource("");
        setAmount("");
        setOfficer2Id("");
        setDepositRef("");
        window.location.reload();
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {canSubmit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-600" />
              Record Organizational Income (Dual-Officer Verified)
            </CardTitle>
            <CardDescription>
              All revenue (fees, sponsorships, sales) must be co-verified by 2 authorized officers (Policy Section VII).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
              <div className="space-y-2">
                <Label htmlFor="source">Revenue Source / Activity</Label>
                <Input
                  id="source"
                  placeholder="e.g., Leadership Seminar Reg Fees, Membership Dues"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Total Amount Collected (₱ PHP)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Amount in PHP"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="officer2">Second Verifying Officer Profile ID</Label>
                <Input
                  id="officer2"
                  placeholder="Co-verifying Officer User UUID"
                  value={officer2Id}
                  onChange={(e) => setOfficer2Id(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit_ref">Bank Deposit Slip Reference (Optional)</Label>
                <Input
                  id="deposit_ref"
                  placeholder="e.g., BDO-TRANS-987654"
                  value={depositRef}
                  onChange={(e) => setDepositRef(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? "Logging..." : "Log Revenue Collection"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cash Receipts & Revenue Collection Record Sheet</CardTitle>
          <CardDescription>Collection records with verification officers and deposit status.</CardDescription>
        </CardHeader>
        <CardContent>
          {!collections || collections.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No revenue collections recorded.</p>
          ) : (
            <div className="space-y-3">
              {collections.map((col) => (
                <div key={col.id} className="p-4 border rounded-lg flex items-center justify-between bg-card">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-muted rounded">
                        {col.collection_number}
                      </span>
                      <span className="text-sm font-semibold">{col.source}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Amount: ₱{col.amount.toLocaleString()} | Date: {new Date(col.date_collected).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={col.deposited ? "default" : "outline"}>
                    {col.deposited ? "DEPOSITED" : "PENDING DEPOSIT"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
