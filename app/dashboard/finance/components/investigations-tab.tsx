"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gavel, FileText } from "lucide-react";
import { InvestigationCase } from "../types";

interface Props {
  cases: InvestigationCase[] | null;
}

export function InvestigationsTab({ cases }: Props) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-purple-600" />
            Committee on Investigation Case Management
          </CardTitle>
          <CardDescription>
            Formal financial investigation referrals, evidence evaluation, and Executive Committee recommendations (Policy Section XIII).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!cases || cases.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">No active investigation cases referred.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cases.map((c) => (
                <div key={c.id} className="p-4 border rounded-lg flex items-start justify-between bg-card">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-purple-500/10 text-purple-700 rounded">
                        {c.case_number}
                      </span>
                      <span className="text-sm font-semibold">Status: {c.status.toUpperCase()}</span>
                    </div>
                    {c.recommendation && (
                      <p className="text-xs text-muted-foreground">Recommendation: {c.recommendation}</p>
                    )}
                    <span className="text-[10px] text-muted-foreground block">
                      Opened: {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge variant="outline">{c.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
