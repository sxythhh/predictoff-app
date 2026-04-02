"use client";

import { useMemo } from "react";
import type { GameData } from "@azuro-org/toolkit";
import { useImageColor, darkenColor, lightenColor, colorFromName, hslToRgb } from "../useImageColor";
import { useTheme } from "@/components/ui/theme";

/** Custom gradient colors for specific teams (takes priority over extracted/derived colors) */
const TEAM_COLOR_OVERRIDES: Record<string, string> = {
  "Liverpool": "rgb(200, 16, 46)",        // deep red
  "Real Madrid": "rgb(218, 165, 32)",     // gold
};

export function getTeamColorOverride(name: string): string | undefined {
  // Try exact match first, then case-insensitive substring match
  if (TEAM_COLOR_OVERRIDES[name]) return TEAM_COLOR_OVERRIDES[name];
  const lower = name.toLowerCase();
  for (const [key, color] of Object.entries(TEAM_COLOR_OVERRIDES)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return color;
    }
  }
  return undefined;
}

/**
 * Extracts team colors and builds a radial gradient background
 * matching the LiveTopEvents card style.
 */
export function useTeamGradient(game: GameData | undefined) {
  const team1 = game?.participants?.[0]?.name ?? "Team 1";
  const team2 = game?.participants?.[1]?.name ?? "Team 2";
  const team1Img = game?.participants?.[0]?.image;
  const team2Img = game?.participants?.[1]?.image;

  const imgColor1 = useImageColor(team1Img);
  const imgColor2 = useImageColor(team2Img);
  const nameColor1 = hslToRgb(colorFromName(team1));
  const nameColor2 = hslToRgb(colorFromName(team2));
  const c1 = getTeamColorOverride(team1) ?? imgColor1 ?? nameColor1;
  const c2 = getTeamColorOverride(team2) ?? imgColor2 ?? nameColor2;

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const gradient = useMemo(() => {
    const base = isDark ? "#0e0e0e" : "#ffffff";
    const g1 = isDark ? darkenColor(c1, 0.4) : lightenColor(c1, 0.55);
    const g2 = isDark ? darkenColor(c2, 0.4) : lightenColor(c2, 0.55);
    const a1 = g1.replace("rgb(", "rgba(").replace(")", ",");
    const a2 = g2.replace("rgb(", "rgba(").replace(")", ",");
    return `radial-gradient(circle at 0% 0%, ${a1}0.9) 0%, ${a1}0.5) 20%, ${a1}0.15) 40%, transparent 60%), radial-gradient(circle at 100% 0%, ${a2}0.9) 0%, ${a2}0.5) 20%, ${a2}0.15) 40%, transparent 60%), ${base}`;
  }, [c1, c2, isDark]);

  const color1 = isDark ? darkenColor(c1, 0.3) : c1;
  const color2 = isDark ? darkenColor(c2, 0.3) : c2;

  return { gradient, color1, color2 };
}
