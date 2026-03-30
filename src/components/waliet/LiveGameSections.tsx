"use client";

import { useMemo } from "react";
import { useSports, useLive } from "@azuro-org/sdk";
import { GameOrderBy, OrderDirection, GameState, type GameData } from "@azuro-org/toolkit";
import { GameCard } from "./GameCard";

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

export function LiveGameSections({ sportSlug, leagueSlug }: { sportSlug?: string | null; leagueSlug?: string | null }) {
  const { isLive } = useLive();
  const { data: sports, isFetching } = useSports(
    sportSlug
      ? {
          gameOrderBy: GameOrderBy.StartsAt,
          orderDir: OrderDirection.Asc,
          filter: { sportSlug, ...(leagueSlug ? { leagueSlug } : {}) },
          isLive,
        }
      : {
          gameOrderBy: GameOrderBy.Turnover,
          filter: { maxGamesPerLeague: 5 },
          isLive,
        }
  );

  const sportsContent = useMemo(() => {
    if (!sports?.length) return null;
    return sports.map((sport) => {
      const totalGames = sport.countries.reduce(
        (sum, c) => sum + c.leagues.reduce((s, l) => s + l.games.length, 0),
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
                  (g: GameData) => isGameActive(g)
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {league.games
                        .filter((game: GameData) => ACTIVE_STATES.has(game.state as GameState))
                        .map((game: GameData) => (
                        <GameCard
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
  }, [sports, sportSlug]);

  if (isFetching) {
    return (
      <div className="flex flex-col gap-6 mt-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div
              className="h-8 w-48 rounded-lg animate-pulse mb-3"
              style={{ background: "var(--border-subtle)" }}
            />
            <div className="bg-bg-card rounded-lg overflow-hidden">
              {Array.from({ length: 3 }).map((_, j) => (
                <div
                  key={j}
                  className="h-20 animate-pulse border-t border-border-primary/60 first:border-t-0"
                  style={{ background: "var(--border-subtle)" }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!sports?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center mt-6">
        <p className="text-text-secondary text-sm font-medium">
          No events available
        </p>
        <p className="text-text-muted text-xs mt-1">
          Check back later for upcoming matches
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 mt-6">
      {sportsContent}
    </div>
  );
}
