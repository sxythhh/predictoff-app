"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { GameData } from "@azuro-org/toolkit";

/* ─── Types ─── */

interface ApiTeam {
  id: number;
  name: string;
  logo: string;
}

interface FixtureMapping {
  fixtureId: number;
  homeTeam: ApiTeam;
  awayTeam: ApiTeam;
  league: { id: number; name: string; season: number };
}

interface StandingsRow {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
  form: string | null;
}

interface LineupTeam {
  team: { name: string; logo: string };
  formation: string;
  startXI: Array<{ player: { id: number; name: string; number: number; pos: string } }>;
  substitutes: Array<{ player: { id: number; name: string; number: number; pos: string } }>;
}

interface H2HFixture {
  fixture: { id: number; date: string };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
}

/* ─── API helper ─── */

async function fetchSportsData<T>(params: Record<string, string>): Promise<T | null> {
  try {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`/api/sports-data?${qs}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

/* ─── Hook: resolve Azuro game → API-Sports IDs ─── */

function useFixtureMapping(game: GameData) {
  const [mapping, setMapping] = useState<FixtureMapping | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  const resolve = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const team1 = game.participants?.[0]?.name;
    const team2 = game.participants?.[1]?.name;
    if (!team1 || !team2) {
      setLoading(false);
      return;
    }

    const startsAt = Number(game.startsAt) * 1000;
    const d = new Date(startsAt);
    const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

    const data = await fetchSportsData<FixtureMapping>({
      type: "find-fixture",
      sport: "football",
      team1,
      team2,
      date: dateStr,
    });

    if (data) {
      setMapping(data);
    }
    setLoading(false);
  }, [game]);

  useEffect(() => {
    resolve();
  }, [resolve]);

  return { mapping, loading };
}

/* ─── Skeleton ─── */

function Skeleton({ className }: { className: string }) {
  return <div className={`bg-border-subtle animate-pulse rounded ${className}`} />;
}

function TabSkeleton() {
  return (
    <div className="space-y-3 py-2">
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((col) => (
          <div key={col} className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-16" />
            {Array.from({ length: 11 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Tab: Lineups ─── */

function LineupsTab({ mapping }: { mapping: FixtureMapping | null }) {
  const [lineups, setLineups] = useState<LineupTeam[] | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!mapping || fetchedRef.current) {
      setLoading(false);
      return;
    }
    fetchedRef.current = true;

    fetchSportsData<LineupTeam[]>({
      type: "lineups",
      sport: "football",
      fixtureId: String(mapping.fixtureId),
    }).then((data) => {
      setLineups(data);
      setLoading(false);
    });
  }, [mapping]);

  if (loading) return <TabSkeleton />;

  if (!lineups || lineups.length === 0) {
    return (
      <div className="py-10 text-center text-text-muted text-[13px]">
        —
      </div>
    );
  }

  const home = lineups[0];
  const away = lineups[1];

  return (
    <div className="grid grid-cols-2 gap-3">
      {[home, away].map((team, idx) => {
        if (!team) return null;
        return (
          <div key={idx}>
            <div className="mb-3 flex items-center gap-2">
              {team.team.logo && (
                <img
                  src={team.team.logo}
                  alt={team.team.name}
                  className="w-5 h-5 object-contain"
                />
              )}
              <div>
                <div className="text-[13px] font-semibold text-text-primary truncate">
                  {team.team.name}
                </div>
                {team.formation && (
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {team.formation}
                  </div>
                )}
              </div>
            </div>

            {/* Starting XI */}
            <div className="space-y-0.5">
              {team.startXI?.map((entry) => (
                <div
                  key={entry.player.id}
                  className="flex items-center gap-2 py-1 px-2 rounded text-[12px] hover:bg-bg-hover transition-colors"
                >
                  <span className="w-5 text-right text-text-muted font-mono text-[11px]">
                    {entry.player.number}
                  </span>
                  <span className="flex-1 text-text-primary truncate">
                    {entry.player.name}
                  </span>
                  <span className="text-text-muted text-[10px] uppercase">
                    {entry.player.pos}
                  </span>
                </div>
              ))}
            </div>

            {/* Substitutes */}
            {team.substitutes && team.substitutes.length > 0 && (
              <div className="mt-3">
                <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1 px-2">
                  Substitutes
                </div>
                <div className="space-y-0.5">
                  {team.substitutes.map((entry) => (
                    <div
                      key={entry.player.id}
                      className="flex items-center gap-2 py-1 px-2 rounded text-[12px] text-text-secondary hover:bg-bg-hover transition-colors"
                    >
                      <span className="w-5 text-right text-text-muted font-mono text-[11px]">
                        {entry.player.number}
                      </span>
                      <span className="flex-1 truncate">{entry.player.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Tab: Standings ─── */

function StandingsTab({ mapping }: { mapping: FixtureMapping | null }) {
  const [rows, setRows] = useState<StandingsRow[] | null>(null);
  const [seasonLabel, setSeasonLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!mapping || fetchedRef.current) {
      setLoading(false);
      return;
    }
    fetchedRef.current = true;

    fetch(`/api/sports-data?type=standings&sport=football&league=${mapping.league.id}&season=${mapping.league.season}`)
      .then((r) => r.json())
      .then((json) => {
        setRows(json.data ?? null);
        if (json.season) setSeasonLabel(json.season);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [mapping]);

  if (loading) {
    return (
      <div className="space-y-2 py-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-full" />
        ))}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="py-10 text-center text-text-muted text-[13px]">
        —
      </div>
    );
  }

  const homeId = mapping?.homeTeam.id;
  const awayId = mapping?.awayTeam.id;

  return (
    <div className="overflow-x-auto -mx-1">
      {seasonLabel && seasonLabel !== String(mapping?.league.season) && (
        <p className="text-[11px] text-text-muted mb-2 px-1">Showing {seasonLabel}/{Number(seasonLabel) + 1} season</p>
      )}
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-text-muted uppercase tracking-wider border-b border-border-subtle">
            <th className="text-left py-2 px-1 w-6">#</th>
            <th className="text-left py-2 px-1">Team</th>
            <th className="text-center py-2 px-1 w-7">P</th>
            <th className="text-center py-2 px-1 w-7">W</th>
            <th className="text-center py-2 px-1 w-7">D</th>
            <th className="text-center py-2 px-1 w-7">L</th>
            <th className="text-center py-2 px-1 w-10">GF</th>
            <th className="text-center py-2 px-1 w-10">GA</th>
            <th className="text-center py-2 px-1 w-8">GD</th>
            <th className="text-center py-2 px-1 w-8 font-semibold">Pts</th>
            <th className="text-center py-2 px-1 w-14">Form</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isHighlighted =
              row.team.id === homeId || row.team.id === awayId;
            const gd =
              row.all.goals.for - row.all.goals.against;

            return (
              <tr
                key={row.team.id}
                className={`border-b border-border-subtle/50 transition-colors ${
                  isHighlighted
                    ? "bg-accent-muted font-semibold"
                    : "hover:bg-bg-hover"
                }`}
              >
                <td className="py-1.5 px-1 text-text-muted">{row.rank}</td>
                <td className="py-1.5 px-1 text-text-primary">
                  <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                    {row.team.logo && (
                      <img
                        src={row.team.logo}
                        alt=""
                        className="w-4 h-4 object-contain shrink-0"
                      />
                    )}
                    <span className="truncate">{row.team.name}</span>
                  </div>
                </td>
                <td className="text-center py-1.5 px-1 text-text-secondary">
                  {row.all.played}
                </td>
                <td className="text-center py-1.5 px-1 text-text-secondary">
                  {row.all.win}
                </td>
                <td className="text-center py-1.5 px-1 text-text-secondary">
                  {row.all.draw}
                </td>
                <td className="text-center py-1.5 px-1 text-text-secondary">
                  {row.all.lose}
                </td>
                <td className="text-center py-1.5 px-1 text-text-secondary">
                  {row.all.goals.for}
                </td>
                <td className="text-center py-1.5 px-1 text-text-secondary">
                  {row.all.goals.against}
                </td>
                <td className="text-center py-1.5 px-1 text-text-secondary">
                  {gd > 0 ? `+${gd}` : gd}
                </td>
                <td className="text-center py-1.5 px-1 text-text-primary font-semibold">
                  {row.points}
                </td>
                <td className="text-center py-1.5 px-1">
                  <FormIndicator form={row.form} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FormIndicator({ form }: { form: string | null }) {
  if (!form) return <span className="text-text-muted">—</span>;

  return (
    <div className="flex items-center justify-center gap-0.5">
      {form.split("").map((ch, i) => {
        let color = "bg-text-muted";
        if (ch === "W") color = "bg-green-500";
        else if (ch === "L") color = "bg-red-500";
        else if (ch === "D") color = "bg-yellow-500";

        return (
          <div
            key={i}
            className={`w-[6px] h-[6px] rounded-full ${color}`}
            title={ch}
          />
        );
      })}
    </div>
  );
}

/* ─── Tab: H2H ─── */

function H2HTab({ mapping }: { mapping: FixtureMapping | null }) {
  const [fixtures, setFixtures] = useState<H2HFixture[] | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!mapping || fetchedRef.current) {
      setLoading(false);
      return;
    }
    fetchedRef.current = true;

    fetchSportsData<H2HFixture[]>({
      type: "h2h",
      sport: "football",
      team1Id: String(mapping.homeTeam.id),
      team2Id: String(mapping.awayTeam.id),
    }).then((data) => {
      setFixtures(data);
      setLoading(false);
    });
  }, [mapping]);

  if (loading) {
    return (
      <div className="space-y-2 py-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (!fixtures || fixtures.length === 0) {
    return (
      <div className="py-10 text-center text-text-muted text-[13px]">
        —
      </div>
    );
  }

  // Compute summary
  const homeId = mapping!.homeTeam.id;
  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;

  for (const fx of fixtures) {
    const homeGoals = fx.goals.home;
    const awayGoals = fx.goals.away;
    if (homeGoals == null || awayGoals == null) continue;

    // Determine which side "our" home team was on
    const isHomeTeamHome = fx.teams.home.id === homeId;
    if (homeGoals === awayGoals) {
      draws++;
    } else if (homeGoals > awayGoals) {
      if (isHomeTeamHome) homeWins++;
      else awayWins++;
    } else {
      if (isHomeTeamHome) awayWins++;
      else homeWins++;
    }
  }

  const total = homeWins + draws + awayWins;
  const homeName = mapping!.homeTeam.name;
  const awayName = mapping!.awayTeam.name;

  return (
    <div>
      {/* Summary bar */}
      {total > 0 && (
        <div className="mb-5">
          <div className="flex justify-between text-[12px] mb-2">
            <span className="text-text-primary font-semibold">
              {homeName} <span className="text-accent">{homeWins}</span>
            </span>
            <span className="text-text-muted">{draws} draws</span>
            <span className="text-text-primary font-semibold">
              <span className="text-accent">{awayWins}</span> {awayName}
            </span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-bg-surface">
            {homeWins > 0 && (
              <div
                className="bg-accent transition-all"
                style={{ width: `${(homeWins / total) * 100}%` }}
              />
            )}
            {draws > 0 && (
              <div
                className="bg-text-muted transition-all"
                style={{ width: `${(draws / total) * 100}%` }}
              />
            )}
            {awayWins > 0 && (
              <div
                className="bg-accent/50 transition-all"
                style={{ width: `${(awayWins / total) * 100}%` }}
              />
            )}
          </div>
        </div>
      )}

      {/* Recent matches */}
      <div className="space-y-1">
        <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
          Recent meetings
        </div>
        {fixtures.map((fx) => {
          const d = fx.fixture.date ? new Date(fx.fixture.date) : null;
          const dateStr = d
            ? d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "";
          const scoreStr =
            fx.goals.home != null && fx.goals.away != null
              ? `${fx.goals.home} - ${fx.goals.away}`
              : "- - -";

          return (
            <div
              key={fx.fixture.id}
              className="flex items-center justify-between py-2 px-2 rounded hover:bg-bg-hover transition-colors text-[12px]"
            >
              <span className="text-text-muted w-20 shrink-0">{dateStr}</span>
              <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
                <span className="text-text-primary truncate text-right flex-1">
                  {fx.teams.home.name}
                </span>
                <span className="text-text-primary font-semibold tabular-nums shrink-0 bg-bg-surface px-2 py-0.5 rounded text-[11px]">
                  {scoreStr}
                </span>
                <span className="text-text-primary truncate text-left flex-1">
                  {fx.teams.away.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */

type Tab = "lineups" | "standings" | "h2h";

export function MatchInfo({ game }: { game: GameData }) {
  const [activeTab, setActiveTab] = useState<Tab>("lineups");
  const { mapping, loading: mappingLoading } = useFixtureMapping(game);

  // Only show for football/soccer
  const sportSlug = game.sport?.slug;
  if (sportSlug && sportSlug !== "football" && sportSlug !== "soccer") {
    return null;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "lineups", label: "Lineups" },
    { key: "standings", label: "Standings" },
    { key: "h2h", label: "H2H" },
  ];

  return (
    <div className="bg-bg-card rounded-lg overflow-hidden mt-4">
      {/* Tab bar */}
      <div className="flex border-b border-border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 text-center py-2.5 text-[14px] font-semibold transition-colors relative ${
              activeTab === tab.key
                ? "text-accent"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4">
        {mappingLoading ? (
          <TabSkeleton />
        ) : !mapping ? (
          <div className="py-10 text-center text-text-muted text-[13px]">
            —
          </div>
        ) : (
          <>
            {activeTab === "lineups" && <LineupsTab mapping={mapping} />}
            {activeTab === "standings" && <StandingsTab mapping={mapping} />}
            {activeTab === "h2h" && <H2HTab mapping={mapping} />}
          </>
        )}
      </div>
    </div>
  );
}
