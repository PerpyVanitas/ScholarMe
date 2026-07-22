import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";

export default async function MembershipsPage() {
  const supabase = await createClient();
  
  const { data: memberships, error } = await supabase
    .from("memberships")
    .select("*, user:user_id(full_name, email)")
    .order("joined_at", { ascending: false });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Membership Tracking</h1>
          <p className="text-muted-foreground">Track active vs. inactive members, dues, and classifications.</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead>Dues Paid Until</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!memberships || memberships.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No membership records found.
                </TableCell>
              </TableRow>
            )}
            {memberships?.map((membership: Record<string, unknown>) => (
              <TableRow key={membership.id}>
                <TableCell className="font-medium">{membership.user?.full_name}</TableCell>
                <TableCell>{membership.user?.email}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    membership.status === 'active' ? 'bg-green-100 text-green-800' :
                    membership.status === 'suspended' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {membership.status}
                  </span>
                </TableCell>
                <TableCell className="capitalize">{membership.classification}</TableCell>
                <TableCell>
                  {membership.dues_paid_until 
                    ? new Date(membership.dues_paid_until).toLocaleDateString() 
                    : "Not Paid"}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
