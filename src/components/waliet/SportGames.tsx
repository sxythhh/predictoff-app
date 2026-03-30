"use client";

import { useSports, useLive } from "@azuro-org/sdk";
import { GameOrderBy, OrderDirection } from "@azuro-org/toolkit";
import { GameCard } from "./GameCard";

export function SportGames({
  sportSlug,
  countrySlug,
  leagueSlug,
}: {
  sportSlug?: string;
  countrySlug?: string;
  leagueSlug?: string;
}) {
  const { isLive } = useLive();

  const { data: sports, isFetching } = useSports(
    sportSlug
      ? {
          gameOrderBy: GameOrderBy.StartsAt,
          orderDir: OrderDirection.Asc,
          filter: {
            sportSlug,
            countrySlug,
            leagueSlug,
          },
          isLive,
        }
      : {
          gameOrderBy: GameOrderBy.Turnover,
          filter: { maxGamesPerLeague: 5 },
          isLive,
        }
  );

  if (isFetching) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg overflow-hidden">
            <div
              className="h-10 animate-pulse"
              style={{ background: "var(--border-subtle)" }}
            />
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                className="h-20 animate-pulse mt-px"
                style={{ background: "var(--border-subtle)" }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (!sports?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-3xl mb-3">🏟️</div>
        <p className="text-text-secondary text-[14px] font-medium">
          No events available
        </p>
        <p className="text-text-muted text-[12px] mt-1">
          Check back later for upcoming matches
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {sports.map((sport) =>
        sport.countries.map((country) =>
          country.leagues.map((league) => {
            if (!league.games.length) return null;
            const leagueUrl = `/${sport.slug}/${country.slug}/${league.slug}`;
            return (
              <div
                key={`${sport.slug}-${country.slug}-${league.slug}`}
                className="rounded-lg overflow-hidden bg-bg-card"
              >
                {/* League header */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border-subtle">
                  <span className="text-[12px] font-medium text-text-secondary">
                    {country.name}
                  </span>
                  <span className="text-text-muted">·</span>
                  <span className="text-[12px] font-medium text-text-secondary">
                    {league.name}
                  </span>
                </div>

                {/* Games */}
                <div className="divide-y divide-border-subtle">
                  {league.games.map((game) => (
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
        )
      )}
    </div>
  );
}
