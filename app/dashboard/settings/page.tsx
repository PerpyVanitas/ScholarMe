"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUser } from "@/lib/user-context";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SiteSettingsPage() {
  const { role } = useUser();
  const router = useRouter();
  const [resigning, setResigning] = useState(false);

  async function handleResignAdmin() {
    setResigning(true);
    try {
      const res = await fetch("/api/admin/resign-role", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resign role");
      toast.success("Role resigned successfully", {
        description: "Your role has been reverted to Tutor. Redirecting...",
      });
      // Force refresh to pick up new role
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (e: any) {
      toast.error(e.message || "Failed to resign role");
    } finally {
      setResigning(false);
    }
  }

  return (
    <div className="flex-1 space-y-4 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Site Settings</h2>
          <p className="text-muted-foreground">
            Manage your local application preferences.
          </p>
        </div>
      </div>
      <Separator />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Configure how you receive alerts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground">Coming soon</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Display</CardTitle>
            <CardDescription>Adjust visual preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground">
                See header options or profile settings.
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data &amp; Privacy</CardTitle>
            <CardDescription>Manage your connected data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground">Coming soon</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Administrator Resign Section — only shown to administrators */}
      {role === "administrator" && (
        <>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Administrator Role
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              You are currently an <strong>Administrator</strong>. As an
              administrator, you can manage users, view analytics, and configure
              platform settings. If you wish to step down from this role, you
              may voluntarily resign below. Your role will revert to{" "}
              <strong>Tutor</strong> and you will lose all administrative access
              immediately.
            </p>
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-base text-destructive flex items-center gap-2">
                  <ShieldOff className="h-4 w-4" />
                  Resign Administrator Role
                </CardTitle>
                <CardDescription>
                  This action cannot be undone. Only the Super Administrator can
                  restore your admin access.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={resigning}
                    >
                      {resigning ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShieldOff className="mr-2 h-4 w-4" />
                          Resign Admin Role
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        You are about to resign your{" "}
                        <strong>Administrator</strong> role. This will
                        immediately revert your account to{" "}
                        <strong>Tutor</strong> and you will lose all access to
                        the Admin panel, User Management, Analytics, and other
                        administrative features.
                        <br />
                        <br />
                        Only the <strong>Super Administrator</strong> can
                        restore your admin role.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleResignAdmin}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Yes, Resign My Role
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
