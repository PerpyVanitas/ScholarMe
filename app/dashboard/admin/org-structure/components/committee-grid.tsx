import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Users } from "lucide-react";
import { MAIN_COMMITTEES, ESAS_COMMITTEES, assignKey, Member, OrgTerm, AssignmentMap } from "./shared";
import { AssignmentRow } from "./assignment-row";

export function MainCommittees({
  term,
  members,
  assignmentMap,
  updateAssignment,
}: {
  term: OrgTerm;
  members: Member[];
  assignmentMap: AssignmentMap;
  updateAssignment: (position: string, committee: string | null, userId: string | null) => void;
}) {
  return (
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
              value={assignmentMap[assignKey("committee_head", c.key)] ?? null}
              onChange={(uid) => updateAssignment("committee_head", c.key, uid)}
            />
            <AssignmentRow
              label="Asst. Committee Head"
              positionKey="assistant_committee_head"
              committee={c.key}
              termStart={term.term_start}
              termEnd={term.term_end}
              members={members}
              value={
                assignmentMap[assignKey("assistant_committee_head", c.key)] ?? null
              }
              onChange={(uid) => updateAssignment("assistant_committee_head", c.key, uid)}
            />
            <Separator className="mt-3 opacity-40" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function EsasCommittees({
  term,
  members,
  assignmentMap,
  updateAssignment,
}: {
  term: OrgTerm;
  members: Member[];
  assignmentMap: AssignmentMap;
  updateAssignment: (position: string, committee: string | null, userId: string | null) => void;
}) {
  return (
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
              value={assignmentMap[assignKey("committee_head", c.key)] ?? null}
              onChange={(uid) => updateAssignment("committee_head", c.key, uid)}
            />
            <AssignmentRow
              label="Asst. Committee Head"
              positionKey="assistant_committee_head"
              committee={c.key}
              termStart={term.term_start}
              termEnd={term.term_end}
              members={members}
              value={
                assignmentMap[assignKey("assistant_committee_head", c.key)] ?? null
              }
              onChange={(uid) => updateAssignment("assistant_committee_head", c.key, uid)}
            />
            <Separator className="mt-3 opacity-40" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
