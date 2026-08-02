"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertOctagon, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { AppealSubmissionModal } from "@/features/finance/components/appeal-submission-modal";
import { ComplianceFlag } from "../types";

interface Props {
  canAudit: boolean;
  flags: ComplianceFlag[] | null;
}

export function ComplianceRegisterTab({ canAudit, flags }: Props) {
  const [officerId, setOfficerId] = useState("");
  const [flagLevel, setFlagLevel] = useState<"yellow" | "orange" | "red">("yellow");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [appealFlag, setAppealFlag] = useState<ComplianceFlag | null>(null);

  const handleIssueFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerId || !reason) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/finance/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          officer_id: officerId,
          flag_level: flagLevel,
          reason,
        }),
      });

      if (res.ok) {
        setReason("");
        setOfficerId("");
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
      {appealFlag && (
        <AppealSubmissionModal
          isOpen={!!appealFlag}
          onClose={() => setAppealFlag(null)}
          flagId={appealFlag.id}
          flagLevel={appealFlag.flag_level}
          reason={appealFlag.reason}
        />
      )}

      {canAudit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              Issue Compliance Flag (Auditor Only)
            </CardTitle>
            <CardDescription>
              Document non-compliance, late liquidations, or procedural deficiencies in accordance with Policy Section XII.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIssueFlag} className="space-y-4 max-w-xl">
              <div className="space-y-2">
                <Label htmlFor="officer_id">Target Officer Profile ID</Label>
                <Input
                  id="officer_id"
                  placeholder="Officer User UUID"
                  value={officerId}
                  onChange={(e) => setOfficerId(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="flag_level">Compliance Flag Level</Label>
                <select
                  id="flag_level"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={flagLevel}
                  onChange={(e) => setFlagLevel(e.target.value as "yellow" | "orange" | "red")}
                >
                  <option value="yellow">Yellow Flag (Minor - 48h Correction Period)</option>
                  <option value="orange">Orange Flag (Moderate - Committee Referral)</option>
                  <option value="red">Red Flag (Major - Immediate Investigation)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Violation Details & Policy Reference</Label>
                <Textarea
                  id="reason"
                  placeholder="Describe specific audit finding or non-compliance..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? "Issuing..." : "Issue Compliance Flag"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Financial Compliance Register</CardTitle>
          <CardDescription>
            Active and historical compliance flags across all committees (Policy Section XVIII).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!flags || flags.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No compliance flags currently recorded.</p>
          ) : (
            <div className="space-y-3">
              {flags.map((flag) => (
                <div key={flag.id} className="p-4 border rounded-lg flex items-start justify-between bg-card">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          flag.flag_level === "red"
                            ? "destructive"
                            : flag.flag_level === "orange"
                            ? "secondary"
                            : "outline"
                        }
                        className={
                          flag.flag_level === "yellow" ? "bg-amber-500/10 text-amber-700 border-amber-500/30" : ""
                        }
                      >
                        {flag.flag_level.toUpperCase()} FLAG
                      </Badge>
                      <span className="text-sm font-semibold">
                        Officer: {flag.profiles?.full_name || flag.officer_id}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{flag.reason}</p>
                    <span className="text-xs text-muted-foreground block">
                      Issued: {new Date(flag.date_issued).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {flag.status === "active" && flag.flag_level !== "yellow" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setAppealFlag(flag)}
                      >
                        File Appeal
                      </Button>
                    )}
                    <Badge variant={flag.status === "active" ? "default" : "outline"}>
                      {flag.status.toUpperCase()}
                    </Badge>
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
