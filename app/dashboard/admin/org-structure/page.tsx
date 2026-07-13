"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Printer,
  Plus,
  Save,
  Loader2,
  CalendarRange,
  Users,
  ShieldCheck,
  Network,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

// ── Constants ───────────────────────────────────────────────────────────────

const EXECUTIVE_POSITIONS = [
  { key: "president", label: "President", committee: null },
  { key: "vice_president", label: "Vice President", committee: null },
  { key: "secretary", label: "Secretary", committee: null },
  { key: "treasurer", label: "Treasurer", committee: null },
  { key: "auditor", label: "Auditor", committee: null },
];

const MAIN_COMMITTEES = [
  { key: "Secretariat", label: "Secretariat" },
  { key: "CSR", label: "Committee on Social Responsibility (CSR)" },
  { key: "COF", label: "Committee on Finance (COF)" },
  { key: "CIA", label: "Committee on Internal Affairs (CIA)" },
  { key: "CMSS", label: "Committee on Member Success & Scholarship (CMSS)" },
  { key: "CPR", label: "Committee on Public Relations (CPR)" },
  { key: "CRAR", label: "Committee on Rules & Regulations (CRAR)" },
  { key: "COD", label: "Committee on Documentations (COD)" },
  { key: "CFMR", label: "Committee on Facility Management & Reception (CFMR)" },
  { key: "COR", label: "Committee on Research (COR)" },
  { key: "CKA", label: "Committee on Knowledge & Archives (CKA)" },
];

const ESAS_COMMITTEES = [
  { key: "CHR", label: "Committee on Human Resources (CHR)" },
  { key: "COM", label: "Committee on Mentorship (COM)" },
  { key: "CEP", label: "Committee on Events & Planning (CEP)" },
  { key: "CNL", label: "Committee on Networks & Linkages (CNL)" },
  { key: "CMP", label: "Committee on Marketing & Procurement (CMP)" },
  { key: "CBAMM", label: "Committee on Branding & Media Management (CBAMM)" },
  { key: "COI", label: "Committee on Investigation (COI)" },
];

// ── Types ────────────────────────────────────────────────────────────────────

interface Member {
  id: string;
  full_name: string;
  email: string;
  esas_scholar: boolean;
  roles: { name: string } | { name: string }[];
}

interface Assignment {
  id: string;
  position: string;
  committee: string | null;
  user_id: string;
  profiles: {
    id: string;
    full_name: string;
    email: string;
    esas_scholar: boolean;
  };
}

interface OrgTerm {
  id: string;
  label: string;
  term_start: string;
  term_end: string;
  is_current: boolean;
}

// assignment map key: `${position}__${committee ?? "exec"}`
type AssignmentMap = Record<string, string | null>; // key → user_id | null

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  const dt = new Date(d + "T00:00:00Z");
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function assignKey(position: string, committee: string | null) {
  return `${position}__${committee ?? "exec"}`;
}

// ── Member Combobox ───────────────────────────────────────────────────────────

function MemberSelect({
  value,
  members,
  onChange,
  placeholder = "— Vacant —",
}: {
  value: string | null;
  members: Member[];
  onChange: (userId: string | null) => void;
  placeholder?: string;
}) {
  return (
    <Select
      value={value ?? "__vacant__"}
      onValueChange={(v) => onChange(v === "__vacant__" ? null : v)}
    >
      <SelectTrigger className="w-full border-border/70 bg-background text-sm h-9">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectItem value="__vacant__" className="text-muted-foreground italic">
          — Vacant —
        </SelectItem>
        {members.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            <div className="flex flex-col leading-tight">
              <span className="font-medium">{m.full_name}</span>
              <span className="text-[10px] text-muted-foreground">
                {m.email}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ── Row Component ─────────────────────────────────────────────────────────────

function AssignmentRow({
  label,
  positionKey,
  committee,
  termStart,
  termEnd,
  members,
  value,
  onChange,
}: {
  label: string;
  positionKey: string;
  committee: string | null;
  termStart: string;
  termEnd: string;
  members: Member[];
  value: string | null;
  onChange: (userId: string | null) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr_1fr_1fr] gap-3 items-center py-3 border-b border-border/40 last:border-0 group">
      {/* Label */}
      <div>
        <p className="text-sm font-medium text-foreground leading-tight">
          {label}
        </p>
        {committee && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {committee}
          </p>
        )}
      </div>

      {/* Member Select */}
      <MemberSelect value={value} members={members} onChange={onChange} />

      {/* Term Start */}
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-1 hidden md:block">
          Term Start
        </p>
        <div className="h-9 flex items-center px-3 rounded-md border border-border/50 bg-muted/40 text-xs text-muted-foreground font-mono">
          {fmtDate(termStart)}
        </div>
      </div>

      {/* Term End */}
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-1 hidden md:block">
          Term End
        </p>
        <div className="h-9 flex items-center px-3 rounded-md border border-border/50 bg-muted/40 text-xs text-muted-foreground font-mono">
          {fmtDate(termEnd)}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OrgStructurePage() {
  const [term, setTerm] = useState<OrgTerm | null>(null);
  const [allTerms, setAllTerms] = useState<OrgTerm[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [assignmentMap, setAssignmentMap] = useState<AssignmentMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [newTermOpen, setNewTermOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New term form state
  const [newLabel, setNewLabel] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [creatingTerm, setCreatingTerm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/org-structure");
      if (!res.ok) throw new Error("Failed to load org structure");
      const data = await res.json();

      setTerm(data.term);
      setAllTerms(data.allTerms || []);
      setMembers(data.members || []);

      // Build the assignment map from the fetched assignments
      const map: AssignmentMap = {};
      for (const a of data.assignments as Assignment[]) {
        map[assignKey(a.position, a.committee)] = a.user_id;
      }
      setAssignmentMap(map);
      setHasChanges(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to load org structure");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function updateAssignment(
    position: string,
    committee: string | null,
    userId: string | null,
  ) {
    const key = assignKey(position, committee);
    setAssignmentMap((prev) => ({ ...prev, [key]: userId }));
    setHasChanges(true);
  }

  async function handleSave() {
    if (!term) return;
    setSaving(true);
    setSuccessMsg(null);
    try {
      // Build the assignments array from the map
      const assignments: {
        position: string;
        committee: string | null;
        user_id: string | null;
      }[] = [];

      // Executive positions
      for (const ep of EXECUTIVE_POSITIONS) {
        const key = assignKey(ep.key, null);
        assignments.push({
          position: ep.key,
          committee: null,
          user_id: assignmentMap[key] ?? null,
        });
      }

      // Committee positions
      for (const c of [...MAIN_COMMITTEES, ...ESAS_COMMITTEES]) {
        const headKey = assignKey("committee_head", c.key);
        const asstKey = assignKey("assistant_committee_head", c.key);
        assignments.push({
          position: "committee_head",
          committee: c.key,
          user_id: assignmentMap[headKey] ?? null,
        });
        assignments.push({
          position: "assistant_committee_head",
          committee: c.key,
          user_id: assignmentMap[asstKey] ?? null,
        });
      }

      const res = await fetch("/api/admin/org-structure", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term_id: term.id, assignments }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save assignments");

      if (data.errors && data.errors.length > 0) {
        toast.warning(`Saved with ${data.errors.length} issue(s)`, {
          description: data.errors.join("; "),
        });
      } else {
        setSuccessMsg(`${data.updated} position(s) saved successfully.`);
        toast.success("Org structure saved!", {
          description: "User roles have been updated automatically.",
        });
      }
      setHasChanges(false);
      await fetchData();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateTerm() {
    if (!newLabel || !newStart || !newEnd) {
      toast.error("All fields are required");
      return;
    }
    setCreatingTerm(true);
    try {
      const res = await fetch("/api/admin/org-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newLabel,
          term_start: newStart,
          term_end: newEnd,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create term");

      toast.success("New term created!", {
        description: `${newLabel} is now the active term.`,
      });
      setNewTermOpen(false);
      setNewLabel("");
      setNewStart("");
      setNewEnd("");
      await fetchData();
    } catch (e: any) {
      toast.error(e.message || "Failed to create term");
    } finally {
      setCreatingTerm(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <Network className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Organizational Officer Assignment
            </h1>
            <p className="text-sm text-muted-foreground">
              Assign members to executive and committee positions. Changes
              automatically update user roles.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNewTermOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Term
          </Button>
        </div>
      </div>

      {/* ── Term Badge ── */}
      {term ? (
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/5 text-primary py-1.5 px-4 text-sm font-medium"
          >
            <CalendarRange className="mr-2 h-4 w-4" />
            Current: {fmtDate(term.term_start)} – {fmtDate(term.term_end)}
          </Badge>
          <span className="text-xs text-muted-foreground">{term.label}</span>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive">
              No Active Term
            </p>
            <p className="text-xs text-muted-foreground">
              Click "New Term" to create an org term before assigning positions.
            </p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-green-500/30 bg-green-500/5">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-400">
            {successMsg}
          </p>
        </div>
      )}

      {term && (
        <>
          {/* ── Column Headers (Desktop) ── */}
          <div className="hidden md:grid grid-cols-[2fr_3fr_1fr_1fr] gap-3 px-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Position
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Assigned Member
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Term Start
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Term End
            </p>
          </div>

          {/* ── Executive Board ── */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Executive Board
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {EXECUTIVE_POSITIONS.map((ep) => (
                <AssignmentRow
                  key={ep.key}
                  label={ep.label}
                  positionKey={ep.key}
                  committee={null}
                  termStart={term.term_start}
                  termEnd={term.term_end}
                  members={members}
                  value={assignmentMap[assignKey(ep.key, null)] ?? null}
                  onChange={(uid) => updateAssignment(ep.key, null, uid)}
                />
              ))}
            </CardContent>
          </Card>

          {/* ── Main Committees ── */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Main Committees (Constitutional)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {MAIN_COMMITTEES.map((c) => (
                <div key={c.key} className="mb-4 last:mb-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 mt-1">
                    {c.label}
                  </p>
                  <AssignmentRow
                    label="Committee Head"
                    positionKey="committee_head"
                    committee={c.key}
                    termStart={term.term_start}
                    termEnd={term.term_end}
                    members={members}
                    value={
                      assignmentMap[assignKey("committee_head", c.key)] ?? null
                    }
                    onChange={(uid) =>
                      updateAssignment("committee_head", c.key, uid)
                    }
                  />
                  <AssignmentRow
                    label="Asst. Committee Head"
                    positionKey="assistant_committee_head"
                    committee={c.key}
                    termStart={term.term_start}
                    termEnd={term.term_end}
                    members={members}
                    value={
                      assignmentMap[
                        assignKey("assistant_committee_head", c.key)
                      ] ?? null
                    }
                    onChange={(uid) =>
                      updateAssignment("assistant_committee_head", c.key, uid)
                    }
                  />
                  <Separator className="mt-3 opacity-40" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ── ESAS Committees ── */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-yellow-500" />
                ESAS Committees (Subordinate)
                <Badge
                  variant="outline"
                  className="text-[10px] border-yellow-500/30 text-yellow-600 dark:text-yellow-400"
                >
                  Scholars Only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {ESAS_COMMITTEES.map((c) => (
                <div key={c.key} className="mb-4 last:mb-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 mt-1">
                    {c.label}
                  </p>
                  <AssignmentRow
                    label="Committee Head"
                    positionKey="committee_head"
                    committee={c.key}
                    termStart={term.term_start}
                    termEnd={term.term_end}
                    members={members}
                    value={
                      assignmentMap[assignKey("committee_head", c.key)] ?? null
                    }
                    onChange={(uid) =>
                      updateAssignment("committee_head", c.key, uid)
                    }
                  />
                  <AssignmentRow
                    label="Asst. Committee Head"
                    positionKey="assistant_committee_head"
                    committee={c.key}
                    termStart={term.term_start}
                    termEnd={term.term_end}
                    members={members}
                    value={
                      assignmentMap[
                        assignKey("assistant_committee_head", c.key)
                      ] ?? null
                    }
                    onChange={(uid) =>
                      updateAssignment("assistant_committee_head", c.key, uid)
                    }
                  />
                  <Separator className="mt-3 opacity-40" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ── Sticky Save Bar ── */}
          {hasChanges && (
            <div className="sticky bottom-4 z-40 flex justify-end">
              <div className="flex items-center gap-3 bg-background/95 backdrop-blur border border-border/60 shadow-lg rounded-xl px-4 py-3">
                <span className="text-sm text-muted-foreground">
                  Unsaved changes
                </span>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  size="sm"
                  className="min-w-[120px]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Term History ── */}
      {allTerms.length > 1 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-muted-foreground" />
              Term History
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="divide-y divide-border/40">
              {allTerms.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      {t.label}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2 font-mono">
                      {fmtDate(t.term_start)} – {fmtDate(t.term_end)}
                    </span>
                  </div>
                  {t.is_current && (
                    <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px]">
                      Current
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── New Term Dialog ── */}
      <Dialog open={newTermOpen} onOpenChange={setNewTermOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Academic Term</DialogTitle>
            <DialogDescription>
              This will set the new term as the current active term. All
              existing assignments will be preserved as historical records for
              the previous term.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="term-label">Term Label</Label>
              <Input
                id="term-label"
                placeholder="e.g. A.Y. 2027-2028"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="term-start">Term Start</Label>
                <Input
                  id="term-start"
                  type="date"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="term-end">Term End</Label>
                <Input
                  id="term-end"
                  type="date"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Org positions expire on June 30 by convention. After expiry,
              members retain their current role until re-appointed or until the
              cron reverts them.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewTermOpen(false)}
              disabled={creatingTerm}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTerm} disabled={creatingTerm}>
              {creatingTerm ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Term
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
