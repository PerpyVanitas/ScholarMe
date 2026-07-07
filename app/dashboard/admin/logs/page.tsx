import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert } from "lucide-react";
import { ExportCsvButton } from "@/components/export-csv-button";

export const dynamic = "force-dynamic";

export default async function SystemLogsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Optional: check admin role (assuming only super_admin has access to this based on sidebar)
  const { data: hasRole } = await supabase.rpc("has_role", {
    user_id: user.id,
    allowed_roles: ["super_admin", "administrator"],
  });

  if (!hasRole) {
    redirect("/dashboard");
  }

  // Fetch logs using admin client to bypass RLS
  const supabaseAdmin = await createAdminClient();
  const { data: logs, error } = await supabaseAdmin
    .from("analytics_logs")
    .select(
      `
      *,
      profiles:user_id(full_name, email)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const formattedLogsForExport =
    logs?.map((log) => ({
      Time: format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
      User: log.profiles?.full_name || "System",
      Email: log.profiles?.email || "N/A",
      Action: log.action,
      "Entity Type": log.entity_type || "",
      "Entity ID": log.entity_id || "",
      Metadata: log.metadata ? JSON.stringify(log.metadata) : "",
    })) || [];

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">System Logs</h2>
        <ExportCsvButton
          data={formattedLogsForExport}
          filename="system_audit_logs"
          label="Export Logs"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Audit & System Logs
          </CardTitle>
          <CardDescription>
            Recent system events, analytics actions, and audit trails. Showing
            the last 100 entries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Metadata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!logs || logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {error
                        ? `Error loading logs: ${error.message}`
                        : "No logs found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(
                          new Date(log.created_at),
                          "MMM d, yyyy HH:mm:ss",
                        )}
                      </TableCell>
                      <TableCell>
                        {log.profiles ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {log.profiles.full_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {log.profiles.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            System / Unknown
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="font-mono text-xs font-normal"
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {log.entity_type || "-"}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {log.entity_id
                          ? `${log.entity_id.substring(0, 8)}...`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {log.metadata ? (
                          <pre className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                            {JSON.stringify(log.metadata)}
                          </pre>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
