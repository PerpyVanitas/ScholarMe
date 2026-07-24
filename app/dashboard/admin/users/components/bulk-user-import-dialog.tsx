"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface BulkUserImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

type ParsedUser = {
  email: string;
  full_name: string;
  role_name: string;
};

// Robust CSV parser
function parseCSV(text: string) {
  const result: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let val = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i+1] === '"') { val += '"'; i++; }
      else if (char === '"') { inQuotes = false; }
      else { val += char; }
    } else {
      if (char === '"') { inQuotes = true; }
      else if (char === ',') { row.push(val.trim()); val = ''; }
      else if (char === '\n' || char === '\r') {
        if (char === '\r' && text[i+1] === '\n') i++; 
        row.push(val.trim()); val = '';
        if (row.length > 1 || row[0] !== '') result.push(row);
        row = [];
      } else {
        val += char;
      }
    }
  }
  if (val !== '' || row.length > 0) {
    row.push(val.trim());
    result.push(row);
  }
  return result;
}

export function BulkUserImportDialog({
  open,
  onOpenChange,
  onImported,
}: BulkUserImportDialogProps) {
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setParsedUsers([]);
    setFile(null);
    setIsImporting(false);
    setProgress(0);
    setResults(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
      toast.error("Please upload a valid CSV file");
      return;
    }

    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseCSV(text);
      
      if (rows.length < 2) {
        toast.error("CSV file is empty or missing headers");
        return;
      }

      // Find column indices
      const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const emailIdx = headers.findIndex(h => h.includes('email'));
      const nameIdx = headers.findIndex(h => h.includes('name'));
      const roleIdx = headers.findIndex(h => h.includes('role'));

      if (emailIdx === -1 || nameIdx === -1) {
        toast.error("CSV must contain 'email' and 'name' columns");
        return;
      }

      const users: ParsedUser[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length <= Math.max(emailIdx, nameIdx)) continue;
        
        const email = row[emailIdx];
        const full_name = row[nameIdx];
        if (!email || !full_name) continue;

        let role_name = "learner"; // default
        if (roleIdx !== -1 && row[roleIdx]) {
          role_name = row[roleIdx].toLowerCase().replace(/[^a-z_]/g, '');
        }

        users.push({ email, full_name, role_name });
      }

      setParsedUsers(users);
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (parsedUsers.length === 0) return;
    setIsImporting(true);
    setProgress(0);

    try {
      const res = await fetch("/api/v1/admin/users/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: parsedUsers }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || "Failed to process import");
        setIsImporting(false);
        return;
      }

      setProgress(100);
      setResults({ success: data.successCount, failed: data.failedCount });
      
      if (data.failedCount > 0) {
        toast.warning(`Import completed with ${data.failedCount} failures. Check console for details.`);
        console.warn("Bulk import failures:", data.failures);
      } else {
        toast.success("All users imported successfully!");
      }
      
      onImported();
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred during import");
      setIsImporting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isImporting) {
      resetState();
      onOpenChange(false);
    } else if (isOpen) {
      onOpenChange(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk User Import</DialogTitle>
          <DialogDescription>
            Upload a CSV file to create multiple users at once. The file must contain <strong>email</strong> and <strong>name</strong> columns. An optional <strong>role</strong> column can be provided.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-6 py-4">
          {!file && !results && (
            <div 
              className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Click to upload CSV</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Expected headers: <code>email, full_name, role</code>
              </p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv,text/csv" 
                onChange={handleFileChange}
              />
            </div>
          )}

          {file && !results && !isImporting && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{parsedUsers.length} valid rows found</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={resetState}>Remove</Button>
              </div>

              {parsedUsers.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedUsers.slice(0, 5).map((u, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{u.full_name}</TableCell>
                          <TableCell className="text-muted-foreground">{u.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{u.role_name}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {parsedUsers.length > 5 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-4">
                            + {parsedUsers.length - 5} more rows
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {isImporting && !results && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <div className="text-center">
                <h3 className="font-semibold text-lg">Importing users...</h3>
                <p className="text-sm text-muted-foreground">Please do not close this window</p>
              </div>
              <Progress value={progress} className="w-full max-w-md mt-4" />
            </div>
          )}

          {results && (
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              {results.failed === 0 ? (
                <div className="bg-success/20 p-4 rounded-full text-success mb-2">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
              ) : (
                <div className="bg-warning/20 p-4 rounded-full text-warning mb-2">
                  <XCircle className="h-12 w-12" />
                </div>
              )}
              <h3 className="font-bold text-2xl">Import Complete</h3>
              <div className="flex gap-4 mt-2">
                <div className="flex flex-col items-center bg-muted/50 p-4 rounded-lg min-w-[120px]">
                  <span className="text-3xl font-semibold text-success">{results.success}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-1">Successful</span>
                </div>
                <div className="flex flex-col items-center bg-muted/50 p-4 rounded-lg min-w-[120px]">
                  <span className="text-3xl font-semibold text-destructive">{results.failed}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-1">Failed</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {!results && (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isImporting}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={parsedUsers.length === 0 || isImporting}>
                {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Import {parsedUsers.length} Users
              </Button>
            </>
          )}
          {results && (
            <Button onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
