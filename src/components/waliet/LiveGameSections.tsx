"use client";

import { useMemo, useRef } from "react";
import { useSports, useLive } from "@azuro-org/sdk";
import { GameOrderBy, OrderDirection, GameState, type GameData } from "@azuro-org/toolkit";
import { LazyGameCard } from "./LazyGameCard";
import { useFavorites } from "./useFavorites";

const ACTIVE_STATES = new Set([GameState.Prematch, GameState.Live]);

function isGameActive(game: GameData): boolean {
  if (!ACTIVE_STATES.has(game.state as GameState)) return false;
  // For prematch games, also check that start time is in the future
  // (API sometimes returns past games that haven't been marked Finished yet)
  if (game.state === GameState.Prematch) {
    const startsAt = +game.startsAt * 1000;
    if (startsAt < Date.now()) return false;
  }
  return true;
}

export function LiveGameSections({ sportSlug, leagueSlug, showFavourites }: { sportSlug?: string | null; leagueSlug?: string | null; showFavourites?: boolean }) {
  const { isLive } = useLive();
  const { favorites } = useFavorites();
  const { data: sports, isFetching } = useSports(
    sportSlug
      ? {
          gameOrderBy: GameOrderBy.StartsAt,
          orderDir: OrderDirection.Asc,
          filter: { sportSlug, ...(leagueSlug ? { leagueSlug } : {}) },
          isLive,
          query: { refetchInterval: isLive ? (typeof window !== "undefined" && window.innerWidth < 768 ? 30_000 : 15_000) : 60_000 },
        }
      : {
          gameOrderBy: GameOrderBy.Turnover,
          filter: { maxGamesPerLeague: 5 },
          isLive,
          query: { refetchInterval: isLive ? (typeof window !== "undefined" && window.innerWidth < 768 ? 30_000 : 15_000) : 60_000 },
        }
  );

  // Keep a ref to the last successfully rendered content so we can show it
  // while new data is loading (avoids skeleton flash on live/prematch toggle)
  const prevContentRef = useRef<React.ReactNode>(null);

  const sportsContent = useMemo(() => {
    if (!sports?.length) return null;
    return sports.map((sport) => {
      const totalGames = sport.countries.reduce(
        (sum, c) => sum + c.leagues.reduce((s, l) => s + l.games.filter(
          (g: GameData) => isGameActive(g) && (!showFavourites || favorites.includes(g.gameId))
        ).length, 0),
        0
      );
      if (totalGames === 0) return null;

      return (
        <div key={sport.slug}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">
                {sportSlug ? sport.name : `Top ${sport.name}`}
              </h2>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {sport.countries.map((country) =>
              country.leagues.map((league) => {
                const activeGames = league.games.filter(
                  (g: GameData) => isGameActive(g) && (!showFavourites || favorites.includes(g.gameId))
                );
                if (!activeGames.length) return null;
                const leagueUrl = `/${sport.slug}/${country.slug}/${league.slug}`;
                return (
                  <div key={`${sport.slug}-${country.slug}-${league.slug}`}>
                    <div className="flex items-center gap-2 px-1 py-2">
                      <span className="text-sm font-medium text-text-secondary">
                        {country.name} &middot; {league.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 @[700px]/main:grid-cols-3 gap-2">
                      {activeGames.map((game: GameData) => (
                        <LazyGameCard
                          key={game.gameId}
                          game={game}
                          leagueUrl={leagueUrl}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      );
    });
  }, [sports, sportSlug, showFavourites, favorites]);

  // Cache the last good content
  if (sportsContent) {
    prevContentRef.current = sportsContent;
  }

  // Show skeletons only on first load (no previous content to display)
  if (isFetching && !prevContentRef.current) {
    return (
      <div className="flex flex-col gap-6 mt-6">
        <div>
          <div className="h-6 w-40 rounded-md bg-border-subtle mb-3 ml-1" />
          <div className="grid grid-cols-1 sm:grid-cols-2 @[700px]/main:grid-cols-3 gap-2">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="bg-bg-modal rounded-xl border border-border-subtle/50 p-3 game-card-shadow animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-16 h-4 rounded-md bg-border-subtle" />
                  <div className="w-6 h-6 rounded-md bg-border-subtle" />
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-7 h-7 rounded-full bg-border-subtle shrink-0" />
                    <div className="w-20 h-3 rounded-md bg-border-subtle" />
                  </div>
                  <div className="w-8 h-4 rounded-md bg-border-subtle shrink-0" />
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="w-20 h-3 rounded-md bg-border-subtle" />
                    <div className="w-7 h-7 rounded-full bg-border-subtle shrink-0" />
                  </div>
                </div>
                <div className="flex gap-1 mt-auto pt-2">
                  <div className="flex-1 h-[38px] rounded-lg bg-border-subtle" />
                  <div className="flex-1 h-[38px] rounded-lg bg-border-subtle" />
                  <div className="flex-1 h-[38px] rounded-lg bg-border-subtle" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isFetching && (!sports?.length || (showFavourites && sportsContent?.every((s) => s === null)))) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center mt-6">
        <p className="text-text-secondary text-sm font-medium">
          {showFavourites ? "No favourite events" : "No events available"}
        </p>
        <p className="text-text-muted text-xs mt-1">
          {showFavourites ? "Star some games to see them here" : "Check back later for upcoming matches"}
        </p>
      </div>
    );
  }

  // While fetching, show previous content with reduced opacity
  const content = sportsContent ?? prevContentRef.current;
  return (
    <div className={`flex flex-col gap-6 mt-6 transition-opacity duration-200 ${isFetching ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
      {content}
    </div>
  );
}
