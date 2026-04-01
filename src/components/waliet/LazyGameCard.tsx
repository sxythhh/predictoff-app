"use client";

import { useRef, useState, useEffect, memo, useCallback } from "react";
import { type GameData } from "@azuro-org/toolkit";
import { GameCard } from "./GameCard";

/**
 * Shared IntersectionObserver — ONE instance observes ALL lazy cards.
 * Each card creates its own observer in the old code (30+ observers).
 * This reduces to 1 observer total.
 */
const IS_MOBILE = typeof window !== "undefined" && window.innerWidth < 1024;

let sharedObserver: IntersectionObserver | null = null;
const callbacks = new Map<Element, () => void>();

function getSharedObserver() {
  if (sharedObserver) return sharedObserver;
  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const cb = callbacks.get(entry.target);
          if (cb) {
            cb();
            callbacks.delete(entry.target);
            sharedObserver!.unobserve(entry.target);
          }
        }
      }
    },
    { rootMargin: "300px 0px" }
  );
  return sharedObserver;
}

function useNearViewport(ref: React.RefObject<HTMLElement | null>) {
  const [isNear, setIsNear] = useState(!IS_MOBILE);

  useEffect(() => {
    if (!IS_MOBILE) return;
    const el = ref.current;
    if (!el) return;

    const observer = getSharedObserver();
    callbacks.set(el, () => setIsNear(true));
    observer.observe(el);

    return () => {
      callbacks.delete(el);
      observer.unobserve(el);
    };
  }, [ref]);

  return isNear;
}

export const LazyGameCard = memo(function LazyGameCard({
  game,
  leagueUrl,
}: {
  game: GameData;
  leagueUrl: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isNearViewport = useNearViewport(ref);

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
 */
function GameCardSkeleton({ game }: { game: GameData }) {
  const team1 = game.participants?.[0]?.name ?? "Team 1";
  const team2 = game.participants?.[1]?.name ?? "Team 2";
  const startsAt = new Date(+game.startsAt * 1000);
  const timeStr = startsAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className="bg-bg-modal rounded-xl border border-border-subtle/50 p-3 flex flex-col game-card-shadow">
      {/* Time row — matches GameCard mb-2 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-semibold text-text-secondary">{timeStr}</span>
        <div className="w-6 h-6" />
      </div>
      {/* Teams row — w-7 h-7 logo placeholders to match real card */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-full bg-border-subtle shrink-0" />
          <span className="text-[13px] font-medium text-text-primary truncate">{team1}</span>
        </div>
        <div className="shrink-0 text-center min-w-[48px]">
          <span className="font-ibm-plex text-[14px] font-bold italic text-text-muted">VS</span>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-[13px] font-medium text-text-primary truncate text-right">{team2}</span>
          <div className="w-7 h-7 rounded-full bg-border-subtle shrink-0" />
        </div>
      </div>
      {/* Odds row */}
      <div className="mt-auto pt-2">
        <div className="flex gap-1">
          <div className="flex-1 h-[38px] rounded-lg bg-border-subtle" />
          <div className="flex-1 h-[38px] rounded-lg bg-border-subtle" />
          <div className="flex-1 h-[38px] rounded-lg bg-border-subtle" />
        </div>
      </div>
    </div>
  );
}
