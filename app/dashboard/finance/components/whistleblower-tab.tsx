"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Lock, EyeOff, ShieldCheck } from "lucide-react";
import { WhistleblowerReport } from "../types";

interface Props {
  reports: WhistleblowerReport[] | null;
}

export function WhistleblowerTab({ reports }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [assignedOffice, setAssignedOffice] = useState<
    "auditor" | "president" | "finance_committee" | "adviser" | "investigation_committee"
  >("auditor");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/finance/whistleblower", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          is_anonymous: isAnonymous,
          assigned_office: assignedOffice,
        }),
      });

      if (res.ok) {
        setTitle("");
        setDescription("");
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-indigo-600" />
            Confidential Whistleblower Intake Portal
          </CardTitle>
          <CardDescription>
            Report financial irregularities, fraud, or policy breaches under full identity protection (Policy Section X).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="title">Report Title</Label>
              <Input
                id="title"
                placeholder="Brief summary of concern"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="office">Target Receiving Authority</Label>
              <select
                id="office"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={assignedOffice}
                onChange={(e) =>
                  setAssignedOffice(
                    e.target.value as
                      | "auditor"
                      | "president"
                      | "finance_committee"
                      | "adviser"
                      | "investigation_committee"
                  )
                }
              >
                <option value="auditor">The Auditor</option>
                <option value="president">The President</option>
                <option value="finance_committee">Committee on Finance</option>
                <option value="adviser">Faculty Adviser</option>
                <option value="investigation_committee">Committee on Investigation</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Detailed Account & Evidence Notes</Label>
              <Textarea
                id="description"
                placeholder="State relevant dates, names, transaction IDs, and specific details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-md border">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <Label htmlFor="anonymous" className="text-xs flex items-center gap-1.5 cursor-pointer">
                <EyeOff className="h-4 w-4 text-muted-foreground" />
                Submit Anonymously (Mask submitter ID at database level)
              </Label>
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Confidential Report"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Whistleblower Submissions Ledger</CardTitle>
          <CardDescription>Confidential case registry for receiving authorities.</CardDescription>
        </CardHeader>
        <CardContent>
          {!reports || reports.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No confidential reports logged.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div key={rep.id} className="p-4 border rounded-lg flex items-start justify-between bg-card">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-muted rounded">
                        {rep.report_number}
                      </span>
                      <span className="text-sm font-semibold">{rep.title}</span>
                      {rep.is_anonymous && (
                        <Badge variant="outline" className="text-[10px]">
                          Anonymous
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{rep.description}</p>
                  </div>
                  <Badge variant="secondary">{rep.status.toUpperCase()}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
