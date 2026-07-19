import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";

export default async function ElectionsPage() {
  const supabase = await createClient();
  
  const { data: elections, error } = await supabase
    .from("elections")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Internal Elections</h1>
          <p className="text-muted-foreground">Manage organization elections and voting.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Election
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {elections?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No elections found.
                </TableCell>
              </TableRow>
            )}
            {elections?.map((election) => (
              <TableRow key={election.id}>
                <TableCell className="font-medium">{election.title}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    election.status === 'active' ? 'bg-green-100 text-green-800' :
                    election.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {election.status}
                  </span>
                </TableCell>
                <TableCell>{new Date(election.start_date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(election.end_date).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Manage</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
