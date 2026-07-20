"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function AdminForumsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadReports() {
    try {
      const response = await fetch("/api/admin/forums/reports");
      const data = await response.json();
      if (response.ok && data.success) {
        setReports(data.data.reports || []);
      }
    } catch (error) {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function handleUpdateStatus(reportId: string, status: string) {
    // We would make an API call here to update the report status
    // For now, let's just do a mock update
    toast.info(`Marked report as ${status}`);
    setReports(reports.map(r => r.id === reportId ? { ...r, status } : r));
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ShieldAlert className="h-8 w-8 text-primary" />
          Forum Moderation
        </h1>
        <p className="text-muted-foreground mt-1">
          Review and manage user reports on forum posts and replies.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <ShieldAlert className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium">No pending reports</p>
              <p className="text-sm text-muted-foreground mt-1">
                The community is looking good!
              </p>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      Report on Post: {report.forum_posts?.title || "Unknown Post"}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant={report.status === 'pending' ? 'destructive' : 'secondary'}>
                        {report.status}
                      </Badge>
                      <span>•</span>
                      <span>Reported {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  {report.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(report.id, 'dismissed')}>
                        Dismiss
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(report.id, 'reviewed')}>
                        Take Action
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="py-2 pb-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Reason for Report</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {report.reason}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Post Content</h4>
                    <p className="text-sm text-muted-foreground border p-3 rounded-md line-clamp-3">
                      {report.forum_posts?.content || "Content unavailable"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
