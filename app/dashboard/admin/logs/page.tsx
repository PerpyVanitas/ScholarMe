"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert, Loader2, RotateCcw } from "lucide-react";
import { ExportCsvButton } from "@/components/export-csv-button";
import { toast } from "sonner";

const DEFAULT_LIMIT = 100;

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchLogs = useCallback(
    async (currentLimit: number) => {
      const supabase = createClient();
      let query = supabase
        .from("analytics_logs")
        .select("*, profiles:user_id(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(currentLimit + 1);

      if (dateFrom) query = query.gte("created_at", dateFrom);
      if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59");

      const { data, error } = await query;
      if (error) {
        toast.error(`Failed to load logs: ${error.message}`);
        return;
      }

      if (data && data.length > currentLimit) {
        setHasMore(true);
        setLogs(data.slice(0, currentLimit));
      } else {
        setHasMore(false);
        setLogs(data || []);
      }
    },
    [dateFrom, dateTo],
  );

  useEffect(() => {
    setLoading(true);
    fetchLogs(DEFAULT_LIMIT).finally(() => setLoading(false));
  }, [fetchLogs]);

  async function loadMore() {
    setLoadingMore(true);
    const newLimit = limit + DEFAULT_LIMIT;
    setLimit(newLimit);
    await fetchLogs(newLimit);
    setLoadingMore(false);
  }

  async function loadAll() {
    setLoadingMore(true);
    const supabase = createClient();
    let query = supabase
      .from("analytics_logs")
      .select("*, profiles:user_id(full_name, email)")
      .order("created_at", { ascending: false });

    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59");

    const { data, error } = await query;
    if (error) {
      toast.error(`Failed to load all logs: ${error.message}`);
    } else {
      setLogs(data || []);
      setHasMore(false);
    }
    setLoadingMore(false);
  }

  const filtered = search
    ? logs.filter(
        (log) =>
          // @ts-ignore: Strict unknown type check
          log.action?.toLowerCase().includes(search.toLowerCase()) ||
          // @ts-ignore: Strict unknown type check
          log.profiles?.full_name
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||
          // @ts-ignore: Strict unknown type check
          log.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
          // @ts-ignore: Strict unknown type check
          log.entity_type?.toLowerCase().includes(search.toLowerCase()),
      )
    : logs;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedForExport = filtered.map((log: unknown) => ({
    // @ts-ignore: Strict unknown type check
    Time: format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
    // @ts-ignore: Strict unknown type check
    User: log.profiles?.full_name || "System",
    // @ts-ignore: Strict unknown type check
    Email: log.profiles?.email || "N/A",
    // @ts-ignore: Strict unknown type check
    Action: log.action,
    // @ts-ignore: Strict unknown type check
    "Entity Type": log.entity_type || "",
    // @ts-ignore: Strict unknown type check
    "Entity ID": log.entity_id || "",
    // @ts-ignore: Strict unknown type check
    Metadata: log.metadata ? JSON.stringify(log.metadata) : "",
  }));

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-3xl font-bold tracking-tight">System Logs</h2>
        <ExportCsvButton
          data={formattedForExport}
          filename="system_audit_logs"
          label="Export Logs"
        />
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-muted-foreground mb-1 block">
            Search
          </label>
          <Input
            placeholder="Search by user, action, or entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            From
          </label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 w-40"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">To</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 w-40"
          />
        </div>
        {(dateFrom || dateTo || search) && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 mt-4"
            onClick={() => {
              setSearch("");
              setDateFrom("");
              setDateTo("");
            }}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Audit &amp; System Logs
          </CardTitle>
          <CardDescription>
            {loading
              ? "Loading logs..."
              : `Showing ${filtered.length} of ${logs.length} loaded entries${hasMore ? " — more available" : " (full history)"}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
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
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No logs found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      filtered.map((log: Record<string, unknown>) => (
                        // @ts-ignore: Strict unknown type check
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {format(
                              // @ts-ignore: Strict unknown type check
                              new Date(log.created_at),
                              "MMM d, yyyy HH:mm:ss",
                            )}
                          </TableCell>
                          <TableCell>
                            // @ts-ignore: Strict unknown type check
                            {log.profiles ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  // @ts-ignore: Strict unknown type check
                                  {log.profiles.full_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  // @ts-ignore: Strict unknown type check
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
                              // @ts-ignore: Strict unknown type check
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            // @ts-ignore: Strict unknown type check
                            {log.entity_type || "-"}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            // @ts-ignore: Strict unknown type check
                            {log.entity_id
                              // @ts-ignore: Strict unknown type check
                              ? `${log.entity_id.substring(0, 8)}...`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            // @ts-ignore: Strict unknown type check
                            {log.metadata ? (
                              <pre className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                                // @ts-ignore: Strict unknown type check
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

              {hasMore && (
                <div className="mt-4 flex items-center gap-3 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Load {DEFAULT_LIMIT} More
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadAll}
                    disabled={loadingMore}
                  >
                    Show Full History
                  </Button>
                </div>
              )}
              {!hasMore && logs.length > 0 && (
                <p className="text-center text-xs text-muted-foreground mt-4">
                  All {logs.length} log entries loaded.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
