import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Profile } from "@/lib/types";
import {
  Award,
  FileText,
  History,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";

const roleColors: Record<string, string> = {
  super_admin: "bg-red-500/10 text-red-500 border-red-500/30",
  president: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  administrator: "bg-warning/10 text-warning-foreground border-warning/30",
  treasurer: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  auditor: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  finance_manager: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  committee_head: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  faculty_adviser: "bg-pink-500/10 text-pink-500 border-pink-500/30",
  tutor: "bg-primary/10 text-primary border-primary/30",
  learner: "bg-success/10 text-success border-success/30",
};

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getUserRoleName(roles: any): string {
  if (Array.isArray(roles) && roles.length > 0) return roles[0].name;
  if (roles && typeof roles === "object" && !Array.isArray(roles))
    return roles.name;
  return "learner";
}

export function UserActionsMenu({
  profile,
  onProfile,
  onEdit,
  onDelete,
  onLogs,
  onPrintId,
  onDesignations,
  onImpersonate,
  currentUserRole,
}: {
  profile: Profile;
  onProfile: (p: Profile) => void;
  onEdit: (p: Profile) => void;
  onDelete: (p: Profile) => void;
  onLogs: (p: Profile) => void;
  onPrintId: (p: Profile) => void;
  onDesignations: (p: Profile) => void;
  onImpersonate: (p: Profile) => void;
  currentUserRole: string | undefined;
}) {
  const isSuperAdmin = currentUserRole === "super_admin";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions for {profile.full_name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onProfile(profile)}>
          <Users className="mr-2 h-4 w-4" />
          View Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(profile)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onPrintId(profile)}>
          <FileText className="mr-2 h-4 w-4" />
          Print/Download ID
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onLogs(profile)}>
          <History className="mr-2 h-4 w-4" />
          View Activity
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDesignations(profile)}>
          <Award className="mr-2 h-4 w-4" />
          Manage Status
        </DropdownMenuItem>
        {isSuperAdmin && (
          <DropdownMenuItem onClick={() => onImpersonate(profile)}>
            <UserCog className="mr-2 h-4 w-4" />
            Impersonate User
          </DropdownMenuItem>
        )}
        {isSuperAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(profile)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete User
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface UsersDataTableProps {
  filtered: Profile[];
  selectedUserIds: Set<string>;
  toggleAllSelection: (filtered: Profile[]) => void;
  toggleUserSelection: (id: string) => void;
  openEdit: (p: Profile) => void;
  openProfile: (p: Profile) => void;
  openDelete: (p: Profile) => void;
  openLogs: (p: Profile) => void;
  openPrintId: (p: Profile) => void;
  openDesignations: (p: Profile) => void;
  handleImpersonate: (p: Profile) => void;
  handleQuickRoleEdit: (userId: string, newRole: string) => void;
  role: string | undefined;
}

export function UsersDataTable({
  filtered,
  selectedUserIds,
  toggleAllSelection,
  toggleUserSelection,
  openEdit,
  openProfile,
  openDelete,
  openLogs,
  openPrintId,
  openDesignations,
  handleImpersonate,
  handleQuickRoleEdit,
  role,
}: UsersDataTableProps) {
  if (filtered.length === 0) {
    return (
      <Card className="border-border/60">
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <div className="rounded-full bg-muted p-4">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No users found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {filtered.map((p) => (
          <Card key={p.id} className="border-border/60">
            <CardContent className="flex items-center gap-3 p-4">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getInitials(p.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="font-medium text-foreground truncate">
                  {p.full_name || "Unnamed"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {p.email}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${roleColors[getUserRoleName(p.roles)]}`}
                  >
                    {getUserRoleName(p.roles)}
                  </Badge>
                </div>
              </div>
              <UserActionsMenu
                profile={p}
                onProfile={openProfile}
                onEdit={openEdit}
                onDelete={openDelete}
                onLogs={openLogs}
                onPrintId={openPrintId}
                onDesignations={openDesignations}
                onImpersonate={handleImpersonate}
                currentUserRole={role}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="border-border/60 hidden md:block">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      filtered.length > 0 &&
                      selectedUserIds.size === filtered.length
                    }
                    onCheckedChange={() => toggleAllSelection(filtered)}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
               <TableRow
                 key={p.id}
                 onDoubleClick={() => openEdit(p)}
                 className="cursor-pointer hover:bg-muted/50"
               >
                 <TableCell>
                   <Checkbox
                     checked={selectedUserIds.has(p.id)}
                     onCheckedChange={() => toggleUserSelection(p.id)}
                     aria-label={`Select ${p.full_name}`}
                   />
                 </TableCell>
                 <TableCell>
                   <div className="flex items-center gap-3">
                     <Avatar className="h-8 w-8">
                       <AvatarFallback className="bg-primary/10 text-primary text-xs">
                         {getInitials(p.full_name)}
                       </AvatarFallback>
                     </Avatar>
                     <span className="font-medium text-foreground">
                       {p.full_name || "Unnamed"}
                     </span>
                   </div>
                 </TableCell>
                 <TableCell className="text-muted-foreground">
                   {p.email}
                 </TableCell>
                 <TableCell>
                   <Select
                     disabled={role !== "super_admin"}
                     value={getUserRoleName(p.roles)}
                     onValueChange={(val) => handleQuickRoleEdit(p.id, val)}
                   >
                     <SelectTrigger
                       className={`w-[130px] h-8 text-xs font-medium ${roleColors[getUserRoleName(p.roles)] || roleColors.learner}`}
                     >
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="learner">Learner</SelectItem>
                       <SelectItem value="tutor">Tutor</SelectItem>
                       {role === "super_admin" && (
                         <SelectItem value="administrator">
                           Administrator
                         </SelectItem>
                       )}
                       <SelectItem value="finance_manager">Finance</SelectItem>
                       <SelectItem value="auditor">Auditor</SelectItem>
                       <SelectItem value="president">President</SelectItem>
                       <SelectItem value="treasurer">Treasurer</SelectItem>
                       <SelectItem value="officer">Officer</SelectItem>
                       {role === "super_admin" && (
                         <SelectItem value="super_admin">Super Admin</SelectItem>
                       )}
                     </SelectContent>
                   </Select>
                 </TableCell>
                 <TableCell className="text-muted-foreground text-sm">
                   {new Date(p.created_at).toLocaleDateString("en-US", {
                     month: "short",
                     day: "numeric",
                     year: "numeric",
                   })}
                 </TableCell>
                 <TableCell>
                   <div className="flex items-center justify-end gap-2">
                     <Button
                       variant="secondary"
                       size="sm"
                       className="hidden md:flex"
                       onClick={() => openProfile(p)}
                     >
                       <Users className="h-3.5 w-3.5 mr-1.5" />
                       View Profile
                     </Button>
                     <UserActionsMenu
                       profile={p}
                       onProfile={openProfile}
                       onEdit={openEdit}
                       onDelete={openDelete}
                       onLogs={openLogs}
                       onPrintId={openPrintId}
                       onDesignations={openDesignations}
                       onImpersonate={handleImpersonate}
                       currentUserRole={role}
                     />
                   </div>
                 </TableCell>
               </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
