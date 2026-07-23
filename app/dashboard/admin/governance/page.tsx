import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, FileText, Download } from "lucide-react";

export default async function GovernancePage() {
  const supabase = await createClient();

  const { data: documents, error } = await supabase
    .from("governance_documents")
    .select("*, uploaded_by(full_name)")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Governance Repository
          </h1>
          <p className="text-muted-foreground">
            Manage organizational bylaws, policies, and minutes.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No governance documents found.
                </TableCell>
              </TableRow>
            )}
            {documents?.map(
              (doc: {
                id: string;
                title: string;
                document_type: string;
                uploaded_by?: { full_name?: string };
                created_at: string;
                file_url?: string;
              }) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {doc.title}
                  </TableCell>
                  <TableCell className="capitalize">
                    {doc.document_type}
                  </TableCell>
                  <TableCell>
                    {doc.uploaded_by?.full_name || "Unknown"}
                  </TableCell>
                  <TableCell>
                    {new Date(doc.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
