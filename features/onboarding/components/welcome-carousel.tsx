"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Profile, UserRole } from "@/lib/types";

export function WelcomeCarousel() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>("learner");

  // Form State
  const [bio, setBio] = useState("");
  const [degreeProgram, setDegreeProgram] = useState("");

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("*, roles(*)")
        .eq("id", user.id)
        .single();

      if (prof) {
        setProfile(prof);
        const userRole = (prof.roles?.name || "learner") as UserRole;
        setRole(userRole);
        if (!prof.onboarding_completed) {
          setOpen(true);
        }
      }
    }
    init();
  }, []);

  const handleComplete = async () => {
    if (!profile) return;
    setLoading(true);
    const supabase = createClient();

    // Update profiles table
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true, degree_program: degreeProgram })
      .eq("id", profile.id);

    if (profileError) {
      toast.error("Failed to complete onboarding");
      setLoading(false);
      return;
    }

    if (role === "tutor") {
      await supabase.from("tutors").update({ bio }).eq("user_id", profile.id);
    }

    toast.success("Welcome to ScholarMe!");
    setOpen(false);
    setLoading(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Welcome to ScholarMe! 🎉
          </DialogTitle>
          <DialogDescription>
            Let's quickly set up your profile so you can get the most out of the
            platform.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="degree">Degree / Program</Label>
            <Input
              id="degree"
              placeholder="e.g. BS Computer Science"
              value={degreeProgram}
              onChange={(e) => setDegreeProgram(e.target.value)}
            />
          </div>

          {role === "tutor" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="bio">Tutor Bio</Label>
              <Textarea
                id="bio"
                placeholder="What subjects do you excel at?"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleComplete}
            disabled={loading || !degreeProgram}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Complete Setup"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
