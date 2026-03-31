"use client";

import { useRef, useState, useEffect, memo } from "react";
import { type GameData } from "@azuro-org/toolkit";
import { GameCard } from "./GameCard";

/**
 * Wraps GameCard with IntersectionObserver — only renders the full card
 * (with its hooks: useActiveMarkets, useGameState, useSelectionOdds)
 * when the card is within 300px of the viewport. Shows a lightweight
 * placeholder skeleton otherwise.
 *
 * This avoids the N+1 query problem on initial load:
 * - Without: 15 cards × 4 hooks = 60 queries on mount
 * - With: only visible cards (~5-6) load = ~20-24 queries
 */
const IS_MOBILE = typeof window !== "undefined" && window.innerWidth < 1024;

export const LazyGameCard = memo(function LazyGameCard({
  game,
  leagueUrl,
}: {
  game: GameData;
  leagueUrl: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(!IS_MOBILE);

  useEffect(() => {
    // Skip lazy loading on desktop — render everything immediately
    if (!IS_MOBILE) return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {isNearViewport ? (
        <GameCard game={game} leagueUrl={leagueUrl} />
      ) : (
        <GameCardSkeleton game={game} />
      )}
    </div>
  );
});

/**
 * Lightweight placeholder that matches GameCard dimensions.
 * Shows team names and basic info but fires ZERO hooks/queries.
 * Uses data already available from the useSports response (no extra fetch).
 */
function GameCardSkeleton({ game }: { game: GameData }) {
  const team1 = game.participants?.[0]?.name ?? "Team 1";
  const team2 = game.participants?.[1]?.name ?? "Team 2";
  const startsAt = new Date(+game.startsAt * 1000);
  const timeStr = startsAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className="bg-bg-modal rounded-xl p-4 game-card-shadow min-h-[140px] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-text-muted">{timeStr}</span>
        <div className="w-12 h-3 rounded bg-border-subtle animate-pulse" />
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-border-subtle animate-pulse shrink-0" />
          <span className="text-[13px] text-text-primary truncate">{team1}</span>
        </div>
        <span className="text-[11px] text-text-muted shrink-0">vs</span>
        <div className="flex items-center gap-2 min-w-0 justify-end">
          <span className="text-[13px] text-text-primary truncate">{team2}</span>
          <div className="w-6 h-6 rounded-full bg-border-subtle animate-pulse shrink-0" />
        </div>
      </div>

      {/* Odds skeleton */}
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 h-9 rounded-lg animate-pulse"
            style={{ background: "var(--border-subtle)" }}
          />
        ))}
      </div>
    </div>
  );
}
