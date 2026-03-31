"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useSports, useLive } from "@azuro-org/sdk";
import { GameOrderBy, OrderDirection } from "@azuro-org/toolkit";
import { CountryFlag } from "@/components/sidebar/app-sidebar";
import { TeamLogo } from "@/components/waliet/TeamLogo";
import { GameCard } from "@/components/waliet/GameCard";

type Tab = "games" | "standings" | "results";

export default function LeaguePage({ params }: { params: Promise<{ params: string[] }> }) {
  const segments = use(params).params;
  const [sportSlug, countrySlug, leagueSlug] = segments ?? [];

  const { isLive } = useLive();
  const [tab, setTab] = useState<Tab>("games");
  const [league, setLeague] = useState<any>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch active games from Azuro SDK
  const { data: sports } = useSports(sportSlug ? {
    gameOrderBy: GameOrderBy.StartsAt,
    orderDir: OrderDirection.Asc,
    filter: { sportSlug, leagueSlug },
    isLive,
    query: { refetchInterval: isLive ? 15_000 : 60_000 },
  } : undefined);

  const activeGames = sports?.flatMap((s) =>
    s.countries.flatMap((c) =>
      c.leagues.flatMap((l) => l.games)
    )
  ) ?? [];

  // Fetch standings or results from our API
  useEffect(() => {
    if (tab === "games" || !sportSlug) return;
    setLoading(true);
    fetch(`/api/leagues/${sportSlug}/${countrySlug}/${leagueSlug}?tab=${tab}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setLeague(data.league);
          if (tab === "standings") setStandings(data.standings ?? []);
          if (tab === "results") setResults(data.games ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, [tab, sportSlug, countrySlug, leagueSlug]);

  // Also fetch league info on mount
  useEffect(() => {
    if (!sportSlug) return;
    fetch(`/api/leagues/${sportSlug}/${countrySlug}/${leagueSlug}?tab=standings`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.league) setLeague(data.league); });
  }, [sportSlug, countrySlug, leagueSlug]);

  const leagueName = league?.name ?? leagueSlug;
  const countryName = league?.countryName ?? countrySlug;

  return (
    <div className="min-h-screen bg-bg-page text-text-primary" style={{ letterSpacing: "-0.02em" }}>
      <header className="h-14 flex items-center px-3 lg:px-6 border-b border-border-primary">
        <Link href="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span className="text-[14px] font-medium">Back</span>
        </Link>
      </header>

      <div className="max-w-[800px] mx-auto p-4 lg:p-6">
        {/* League header */}
        <div className="flex items-center gap-3 mb-6">
          <CountryFlag name={countryName} className="w-10 h-10 rounded-full" />
          <div>
            <h1 className="text-[22px] font-semibold">{leagueName}</h1>
            <span className="text-[13px] text-text-muted">{countryName} · {league?.sport?.name ?? sportSlug}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border-subtle mb-4">
          {(["games", "standings", "results"] as Tab[]).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`h-10 px-4 text-[13px] font-medium border-b-2 transition-colors capitalize ${
                tab === key ? "border-accent text-accent" : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              {key === "games" ? `Games (${activeGames.length})` : key}
            </button>
          ))}
        </div>

        {/* Games tab — live Azuro data */}
        {tab === "games" && (
          activeGames.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-[13px]">No active games in this league</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeGames.map((game) => (
                <GameCard key={game.gameId} game={game} leagueUrl={`/league/${sportSlug}/${countrySlug}/${leagueSlug}`} />
              ))}
            </div>
          )
        )}

        {/* Standings tab */}
        {tab === "standings" && (
          loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 rounded-lg bg-bg-surface animate-pulse" />)}
            </div>
          ) : standings.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-[13px]">
              Standings will be available once games have been resolved
            </div>
          ) : (
            <div className="bg-bg-card rounded-xl border border-border-subtle overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[32px_1fr_40px_40px_40px_40px_50px_80px] gap-1 px-3 py-2 text-[11px] text-text-muted font-medium border-b border-border-subtle">
                <span>#</span>
                <span>Team</span>
                <span className="text-center">P</span>
                <span className="text-center">W</span>
                <span className="text-center">D</span>
                <span className="text-center">L</span>
                <span className="text-center">Pts</span>
                <span className="text-center">Form</span>
              </div>
              {standings.map((row: any, i: number) => (
                <Link
                  key={row.team.id}
                  href={`/team/${row.team.slug}`}
                  className="grid grid-cols-[32px_1fr_40px_40px_40px_40px_50px_80px] gap-1 px-3 py-2.5 text-[13px] items-center hover:bg-bg-hover transition-colors"
                >
                  <span className={`font-semibold tabular-nums ${i < 4 ? "text-accent" : "text-text-muted"}`}>{i + 1}</span>
                  <span className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-bg-surface overflow-hidden shrink-0">
                      <TeamLogo src={row.team.image} name={row.team.name} className="w-5 h-5 object-cover" />
                    </div>
                    <span className="text-text-primary font-medium truncate">{row.team.name}</span>
                  </span>
                  <span className="text-center tabular-nums text-text-muted">{row.played}</span>
                  <span className="text-center tabular-nums text-text-secondary">{row.wins}</span>
                  <span className="text-center tabular-nums text-text-muted">{row.draws}</span>
                  <span className="text-center tabular-nums text-text-muted">{row.losses}</span>
                  <span className="text-center tabular-nums font-bold">{row.points}</span>
                  <span className="flex items-center justify-center gap-0.5">
                    {row.form.map((r: string, j: number) => (
                      <span key={j} className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                        r === "W" ? "bg-green-500" : r === "D" ? "bg-yellow-500" : "bg-red-500"
                      }`}>{r}</span>
                    ))}
                  </span>
                </Link>
              ))}
            </div>
          )
        )}

        {/* Results tab */}
        {tab === "results" && (
          loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-lg bg-bg-surface animate-pulse" />)}
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-[13px]">No results yet</div>
          ) : (
            <div className="flex flex-col gap-1">
              {results.map((g: any) => {
                const date = new Date(g.startsAt * 1000);
                const homeWon = g.winnerId === g.homeTeam.id;
                const awayWon = g.winnerId === g.awayTeam.id;
                const isDraw = g.winnerId === null;
                return (
                  <div key={g.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-hover transition-colors">
                    <span className="text-[11px] text-text-muted w-16 shrink-0">
                      {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className={`text-[13px] truncate ${homeWon ? "font-semibold text-text-primary" : "text-text-secondary"}`}>
                        {g.homeTeam.name}
                      </span>
                      <span className="text-[12px] text-text-muted shrink-0">
                        {g.homeScore != null ? `${g.homeScore} - ${g.awayScore}` : isDraw ? "Draw" : "vs"}
                      </span>
                      <span className={`text-[13px] truncate ${awayWon ? "font-semibold text-text-primary" : "text-text-secondary"}`}>
                        {g.awayTeam.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
