"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Paintbrush, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Profile } from "@/lib/types";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface SkillTreeProps {
  profile: Profile;
}

const THEMES = [
  {
    id: "default",
    name: "Classic Scholar",
    cost: 0,
    color: "hsl(221.2 83.2% 53.3%)",
  },
  {
    id: "emerald",
    name: "Emerald Scholar",
    cost: 1000,
    color: "hsl(142.1 76.2% 36.3%)",
  },
  {
    id: "violet",
    name: "Arcane Void",
    cost: 2500,
    color: "hsl(262.1 83.3% 57.8%)",
  },
  {
    id: "rose",
    name: "Crimson Dawn",
    cost: 5000,
    color: "hsl(346.8 77.2% 49.8%)",
  },
  {
    id: "amber",
    name: "Golden Prestige",
    cost: 10000,
    color: "hsl(37.7 92.1% 50.2%)",
  },
];

export function SkillTree({ profile }: SkillTreeProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const xp = profile.total_xp || 0;

  async function unlockTheme(theme: (typeof THEMES)[0]) {
    if (xp < theme.cost) {
      toast.error("Not enough XP to unlock this theme!");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Deduct XP by inserting a negative XP log entry (DB trigger updates profile total)
    if (theme.cost > 0) {
      const { error: xpError } = await supabase.from("xp_logs").insert({
        profile_id: profile.id,
        amount: -theme.cost,
        reason: `Equipped theme: ${theme.name}`,
      });

      if (xpError) {
        toast.error("Failed to deduct XP for theme");
        setLoading(false);
        return;
      }
    }

    // Save the equipped theme
    const { error: themeError } = await supabase
      .from("profiles")
      .update({ profile_theme_color: theme.id })
      .eq("id", profile.id);

    if (themeError) {
      toast.error("Failed to apply theme");
    } else {
      toast.success(
        `Theme "${theme.name}" equipped! −${theme.cost.toLocaleString()} XP`,
      );
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" /> Profile Themes (Skill Tree)
        </CardTitle>
        <CardDescription>
          Spend your hard-earned XP to unlock exclusive UI themes. Your current
          XP:{" "}
          <span className="font-semibold text-primary">
            {xp.toLocaleString()}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {THEMES.map((theme) => {
            const isEquipped =
              profile.profile_theme_color === theme.id ||
              (!profile.profile_theme_color && theme.id === "default");
            const canAfford = xp >= theme.cost;
            return (
              <div
                key={theme.id}
                className="relative flex flex-col gap-3 rounded-lg border p-4 shadow-sm transition-all hover:border-primary/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-full border shadow-inner"
                    style={{ backgroundColor: theme.color }}
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{theme.name}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {theme.cost > 0 ? (
                        <>
                          <Zap className="h-3 w-3 text-orange-500 fill-orange-500" />{" "}
                          {theme.cost.toLocaleString()} XP
                        </>
                      ) : (
                        "Free"
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  {isEquipped ? (
                    <Button variant="secondary" className="w-full" disabled>
                      Equipped
                    </Button>
                  ) : canAfford ? (
                    theme.cost > 0 ? (
                      <ConfirmDialog
                        title={`Equip ${theme.name}?`}
                        description={`This will deduct ${theme.cost.toLocaleString()} XP from your account. Proceed?`}
                        onConfirm={() => unlockTheme(theme)}
                        trigger={
                          <Button
                            variant="default"
                            className="w-full"
                            disabled={loading}
                          >
                            <Paintbrush className="h-4 w-4 mr-2" /> Equip (−
                            {theme.cost.toLocaleString()} XP)
                          </Button>
                        }
                      />
                    ) : (
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() => unlockTheme(theme)}
                        disabled={loading}
                      >
                        <Paintbrush className="h-4 w-4 mr-2" /> Equip (Free)
                      </Button>
                    )
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      <Lock className="h-4 w-4 mr-2" /> Need{" "}
                      {(theme.cost - xp).toLocaleString()} more XP
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
