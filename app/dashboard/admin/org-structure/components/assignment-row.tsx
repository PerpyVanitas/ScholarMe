import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Member, fmtDate } from "./shared";

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

export function AssignmentRow({
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
