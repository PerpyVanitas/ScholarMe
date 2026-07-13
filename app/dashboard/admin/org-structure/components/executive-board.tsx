import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { EXECUTIVE_POSITIONS, assignKey, Member, OrgTerm, AssignmentMap } from "./shared";
import { AssignmentRow } from "./assignment-row";

export function ExecutiveBoard({
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
  );
}
