"use client";

import { useEffect } from "react";

export const PROFILE_THEMES = [
  {
    id: "default",
    name: "Classic Scholar",
    cost: 0,
    color: "", // Will just remove the style to use the default from globals.css
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

export function ThemeApplicator({
  profileThemeColor,
}: {
  profileThemeColor?: string;
}) {
  useEffect(() => {
    if (!profileThemeColor || profileThemeColor === "default") {
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--ring");
      return;
    }

    const theme = PROFILE_THEMES.find((t) => t.id === profileThemeColor);
    if (theme && theme.color) {
      document.documentElement.style.setProperty("--primary", theme.color);
      document.documentElement.style.setProperty("--ring", theme.color);
    }
  }, [profileThemeColor]);

  return null;
}
