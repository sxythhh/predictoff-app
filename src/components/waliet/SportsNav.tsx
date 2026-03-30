"use client";

import { useMemo } from "react";
import { useSports, useLive } from "@azuro-org/sdk";
import { GameOrderBy } from "@azuro-org/toolkit";
import Link from "next/link";

const SPORT_ICONS: Record<string, string> = {
  football: "⚽",
  basketball: "🏀",
  tennis: "🎾",
  "ice-hockey": "🏒",
  baseball: "⚾",
  mma: "🥊",
  boxing: "🥊",
  cricket: "🏏",
  "american-football": "🏈",
  "rugby-union": "🏉",
  "rugby-league": "🏉",
  politics: "🏛️",
  esports: "🎮",
};

export function SportsNav({ activeSport }: { activeSport?: string }) {
  const { isLive } = useLive();
  const { data: sports, isFetching } = useSports({
    gameOrderBy: GameOrderBy.Turnover,
    isLive,
  });

  if (isFetching) {
    return (
      <div className="flex flex-col gap-1 px-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-10 rounded-lg animate-pulse"
            style={{ background: "var(--border-subtle)" }}
          />
        ))}
      </div>
    );
  }

  const sportsList = useMemo(() => {
    if (!sports?.length) return null;
    return sports.map((sport) => {
      const isActive = activeSport === sport.slug;
      const icon = SPORT_ICONS[sport.slug] ?? "🏅";
      const gameCount = sport.countries.reduce(
        (sum, c) => sum + c.leagues.reduce((s, l) => s + l.games.length, 0),
        0
      );

      return (
        <Link
          key={sport.slug}
          href={`/${sport.slug}`}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            isActive
              ? "bg-bg-active text-text-primary"
              : "text-text-secondary hover:bg-bg-input hover:text-text-primary/80"
          }`}
        >
          <span className="text-base w-5 text-center">{icon}</span>
          <span className="text-[13px] font-medium flex-1">{sport.name}</span>
          <span
            className={`text-[12px] font-semibold tabular-nums ${
              isActive ? "text-text-secondary" : "text-text-muted"
            }`}
          >
            {gameCount}
          </span>
        </Link>
      );
    });
  }, [sports, activeSport]);

  if (!sportsList) return null;

  return (
    <div className="flex flex-col gap-0.5 px-2">
      {sportsList}
    </div>
  );
}
