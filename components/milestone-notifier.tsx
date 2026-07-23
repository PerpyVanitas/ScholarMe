"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import confetti from "canvas-confetti";
import { toast } from "sonner";

interface MilestoneNotifierProps {
  profile: Profile;
}

export function MilestoneNotifier({ profile }: MilestoneNotifierProps) {
  const supabase = createClient();

  useEffect(() => {
    async function checkMilestones() {
      try {
        // Fetch already achieved milestone keys
        const { data: achieved } = await supabase
          .from("milestone_events")
          .select("milestone_key")
          .eq("user_id", profile.id);

        const achievedKeys = new Set(achieved?.map((a) => a.milestone_key) || []);

        // 1. Milestone: 100 Tutoring Hours
        if (!achievedKeys.has("100_tutoring_hours")) {
          const { data: sessions } = await supabase
            .from("sessions")
            .select("id")
            .eq("tutor_id", profile.id)
            .eq("status", "completed");

          if ((sessions?.length || 0) >= 100) {
            await triggerMilestone("100_tutoring_hours", "Milestone Reached: 100 Tutoring Hours Completed! 🚀");
            achievedKeys.add("100_tutoring_hours");
          }
        }

        // 2. Milestone: First Endorsement Received
        if (!achievedKeys.has("first_endorsement_received")) {
          const { data: endos } = await supabase
            .from("tutor_endorsements")
            .select("id")
            .eq("learner_id", profile.id)
            .limit(1);

          if (endos && endos.length > 0) {
            await triggerMilestone("first_endorsement_received", "Milestone Reached: Received Your First Tutor Endorsement! 🌟");
            achievedKeys.add("first_endorsement_received");
          }
        }

        // 3. Milestone: Leadership Term Completed
        if (!achievedKeys.has("officer_term_completed")) {
          const { data: desigs } = await supabase
            .from("hs_designations")
            .select("id")
            .eq("user_id", profile.id);

          if (desigs && desigs.length > 0) {
            await triggerMilestone("officer_term_completed", "Milestone Reached: Completed an Official Org Leadership Term! 🎓");
            achievedKeys.add("officer_term_completed");
          }
        }
      } catch (err) {
        console.error("Error checking milestone events:", err);
      }
    }

    async function triggerMilestone(key: string, message: string) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      toast.success(message, { duration: 5000 });

      await supabase.from("milestone_events").insert({
        user_id: profile.id,
        milestone_key: key,
      });
    }

    checkMilestones();
  }, [profile.id, supabase]);

  return null;
}
