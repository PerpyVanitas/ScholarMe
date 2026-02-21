/**
 * ==========================================================================
 * PROFILE PAGE - View and Edit User Profile
 * ==========================================================================
 *
 * PURPOSE: Shows the current user's profile with their avatar, name, email,
 * role badge, and member-since date. The user can edit their full name.
 *
 * DEMO MODE: If no authenticated user is found, it creates a fake demo profile
 * based on the "dev_role" cookie. This allows the profile page to render
 * properly when using the DevRoleSwitcher.
 *
 * NOTE: Email and role cannot be changed by the user -- email changes require
 * admin action, and roles are set by administrators.
 *
 * ROUTE: /dashboard/profile
 * ==========================================================================
 */
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Save, UserCircle } from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/lib/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*, roles(*)")
          .eq("id", user.id)
          .single();

        if (data) {
          setProfile(data);
          setFullName(data.full_name || "");
          setLoading(false);
          return;
        }
      }

      // Demo mode fallback
      const devRole = document.cookie
        .split("; ")
        .find((c) => c.startsWith("dev_role="))
        ?.split("=")[1] || "administrator";
      const demoNames: Record<string, string> = {
        learner: "Learner Demo",
        tutor: "Tutor Demo",
        administrator: "Admin Demo",
      };
      setProfile({
        id: "demo",
        full_name: demoNames[devRole],
        email: "demo@scholarme.org",
        avatar_url: null,
        created_at: new Date().toISOString(),
        role_id: "demo-role",
        roles: { id: "demo-role", name: devRole },
      } as Profile);
      setFullName(demoNames[devRole]);
      setLoading(false);
    }
    loadProfile();
  }, []);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", profile.id);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully");
      setProfile({ ...profile, full_name: fullName });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) return null;

  const initials = profile.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const roleLabel = profile.roles?.name === "administrator"
    ? "Administrator"
    : profile.roles?.name === "tutor"
    ? "Tutor"
    : "Learner";

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings.</p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <CardTitle>{profile.full_name || "User"}</CardTitle>
              <CardDescription>{profile.email}</CardDescription>
              <Badge variant="secondary" className="w-fit">
                {roleLabel}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Contact your administrator to change your email.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Member Since</Label>
            <p className="text-sm text-muted-foreground">
              {new Date(profile.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-fit">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
