"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Webhook,
  Key,
  FileSpreadsheet,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  getIntegrations,
  saveIntegration,
  deleteIntegration,
  getPayrollCsv,
} from "./actions";

export default function IntegrationsDashboard() {
  const [webhooks, setWebhooks] = useState<
    { id: string; url: string; secret: string }[]
  >([]);
  const [canvasUrl, setCanvasUrl] = useState("");
  const [canvasKey, setCanvasKey] = useState("");
  const [loading, setLoading] = useState(true);

  // Webhook form state
  const [addWebhookOpen, setAddWebhookOpen] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookSecret, setNewWebhookSecret] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, "")
      : "change_this_secret_" + Date.now()
  );

  useEffect(() => {
    async function loadData() {
      const data = await getIntegrations();
      const whs = [];
      for (const intg of data || []) {
        if (intg.integration_name === "canvas") {
          setCanvasUrl(intg.webhook_url || "");
          setCanvasKey(intg.api_key || "");
        } else if (intg.integration_name.startsWith("webhook_")) {
          whs.push({
            id: intg.integration_name,
            url: intg.webhook_url || "",
            secret: intg.api_key || "",
          });
        }
      }
      setWebhooks(whs);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSaveCanvas = async () => {
    const res = await saveIntegration("canvas", canvasUrl, canvasKey);
    if (res.success)
      toast.success("Canvas LMS configuration saved successfully.");
    else toast.error("Failed to save Canvas configuration");
  };

  const handleExportPayroll = async () => {
    toast.info("Generating payroll export...");
    const res = await getPayrollCsv();
    if (!res.success) {
      toast.error("Failed to generate payroll data");
      return;
    }
    const blob = new Blob([res.csv!], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Payroll data exported successfully.");
  };

  const handleAddWebhook = async () => {
    if (!newWebhookUrl) return;
    const name = `webhook_${Date.now()}`;

    const res = await saveIntegration(name, newWebhookUrl, newWebhookSecret);
    if (res.success) {
      setWebhooks([
        ...webhooks,
        { id: name, url: newWebhookUrl, secret: newWebhookSecret },
      ]);
      toast.success("Webhook added successfully");
      setAddWebhookOpen(false);
      setNewWebhookUrl("");
      setNewWebhookSecret(
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID().replace(/-/g, "")
          : "change_this_secret_" + Date.now()
      );
    } else {
      toast.error("Failed to add webhook");
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    const res = await deleteIntegration(id);
    if (res.success) {
      setWebhooks(webhooks.filter((w) => w.id !== id));
      toast.success("Webhook removed");
    } else {
      toast.error("Failed to remove webhook");
    }
  };

  if (loading) return <div>Loading configurations...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Integrations
        </h1>
        <p className="text-muted-foreground">
          Manage third-party connections, webhooks, and data exports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Canvas LMS Integration */}
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Canvas LMS Integration</CardTitle>
                <CardDescription>
                  Connect ScholarMe to your Canvas instance
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="canvas-url">Canvas URL</Label>
              <Input
                id="canvas-url"
                value={canvasUrl}
                onChange={(e) => setCanvasUrl(e.target.value)}
                placeholder="https://canvas.instructure.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="canvas-key">API Developer Key</Label>
              <Input
                id="canvas-key"
                type="password"
                value={canvasKey}
                onChange={(e) => setCanvasKey(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveCanvas}>Save Configuration</Button>
          </CardFooter>
        </Card>

        {/* Webhooks */}
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <Webhook className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Webhooks</CardTitle>
                  <CardDescription>
                    Trigger external services on events
                  </CardDescription>
                </div>
              </div>
              <Dialog open={addWebhookOpen} onOpenChange={setAddWebhookOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" /> Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Webhook</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Webhook URL</Label>
                      <Input
                        value={newWebhookUrl}
                        onChange={(e) => setNewWebhookUrl(e.target.value)}
                        placeholder="https://api.example.com/webhook"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Secret Key</Label>
                      <Input
                        value={newWebhookSecret}
                        onChange={(e) => setNewWebhookSecret(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddWebhook} className="w-full">
                      Save Webhook
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
              >
                <div className="flex flex-col overflow-hidden">
                  <span className="font-medium text-sm truncate">{wh.url}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    Secret: {wh.secret}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-green-500"
                    title="Active"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                  <ConfirmDialog
                    title="Delete Webhook"
                    description={`Are you sure you want to delete ${wh.url}?`}
                    onConfirm={() => handleDeleteWebhook(wh.id)}
                    trigger={
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Payroll Export */}
        <Card className="border-border/60 md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Payroll & Accounting</CardTitle>
                <CardDescription>
                  Export timesheet data for ADP, Gusto, or QuickBooks
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Generates a CSV file containing approved timesheets for the
              current pay period, formatted for standard payroll processors.
            </p>
            <Button onClick={handleExportPayroll} variant="secondary">
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Current Period
              CSV
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
