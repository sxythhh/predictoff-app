"use client";
import { memo, useMemo } from "react";
import { useLiveStatistics } from "@azuro-org/sdk";
import { GameState, type GameData } from "@azuro-org/toolkit";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TimelineEvent {
  type: string;
  minute?: number;
  participant?: "home" | "away" | string;
  description?: string;
}

interface HomeGuest {
  h: number;
  g: number;
}

interface StatDef {
  key: string;
  label: string;
  suffix?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FOOTBALL_STATS: StatDef[] = [
  { key: "possession", label: "Possession", suffix: "%" },
  { key: "shots", label: "Shots" },
  { key: "shots_on_target", label: "Shots on Target" },
  { key: "corners", label: "Corners" },
  { key: "fouls", label: "Fouls" },
  { key: "yellow_cards", label: "Yellow Cards" },
  { key: "red_cards", label: "Red Cards" },
  { key: "offsides", label: "Offsides" },
  { key: "dangerous_attacks", label: "Dangerous Attacks" },
  { key: "attacks", label: "Attacks" },
  { key: "passes", label: "Passes" },
  { key: "free_kicks", label: "Free Kicks" },
];

const GENERIC_STATS: StatDef[] = [
  { key: "possession", label: "Possession", suffix: "%" },
  { key: "shots", label: "Shots" },
  { key: "shots_on_target", label: "Shots on Target" },
  { key: "corners", label: "Corners" },
  { key: "fouls", label: "Fouls" },
  { key: "yellow_cards", label: "Yellow Cards" },
  { key: "red_cards", label: "Red Cards" },
  { key: "offsides", label: "Offsides" },
  { key: "dangerous_attacks", label: "Dangerous Attacks" },
  { key: "attacks", label: "Attacks" },
  { key: "rebounds", label: "Rebounds" },
  { key: "assists", label: "Assists" },
  { key: "aces", label: "Aces" },
  { key: "double_faults", label: "Double Faults" },
  { key: "passes", label: "Passes" },
  { key: "free_kicks", label: "Free Kicks" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function barWidth(a: number, b: number): number {
  if (a + b === 0) return 50;
  return Math.round((a / (a + b)) * 100);
}

function eventIcon(type: string): string {
  switch (type) {
    case "goal":
      return "\u26BD";
    case "yellow_card":
      return "\uD83D\uDFE8";
    case "red_card":
      return "\uD83D\uDFE5";
    case "corner":
      return "\u26F3";
    case "substitution":
      return "\uD83D\uDD04";
    default:
      return "\u25CF";
  }
}

function eventLabel(type: string): string {
  switch (type) {
    case "goal":
      return "Goal";
    case "yellow_card":
      return "Yellow Card";
    case "red_card":
      return "Red Card";
    case "corner":
      return "Corner";
    case "substitution":
      return "Substitution";
    default:
      return type?.replace(/_/g, " ") ?? "Event";
  }
}

// Deterministic-ish position for incident markers on the pitch SVG
function incidentPosition(
  event: TimelineEvent,
  index: number,
  total: number
): { x: number; y: number } {
  const isHome = event.participant === "home";
  // Spread vertically based on index
  const yBase = 30 + ((index % 6) * 140) / 6;
  const yJitter = ((index * 37) % 30) - 15;
  const y = Math.max(15, Math.min(185, yBase + yJitter));

  // Home on left half, away on right half
  if (event.type === "goal") {
    // Goals near the goal area
    const x = isHome ? 60 + (index % 3) * 15 : 340 - (index % 3) * 15;
    return { x, y };
  }
  if (event.type === "corner") {
    const x = isHome ? 20 : 380;
    const cy = index % 2 === 0 ? 15 : 185;
    return { x, y: cy };
  }
  // Default: spread across the half
  const xBase = isHome ? 50 + ((index * 43) % 130) : 220 + ((index * 43) % 130);
  return { x: xBase, y };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const FootballPitch = memo(function FootballPitch({
  events,
}: {
  events: TimelineEvent[];
}) {
  return (
    <div className="w-full rounded-lg overflow-hidden bg-[#2d8a4e] dark:bg-[#1a5e32]">
      <svg
        viewBox="0 0 400 200"
        className="w-full h-auto"
        style={{ maxHeight: 200 }}
        aria-label="Football pitch with match incidents"
      >
        {/* Field background */}
        <rect width="400" height="200" fill="currentColor" className="text-[#2d8a4e] dark:text-[#1a5e32]" />

        {/* Field lines */}
        <g stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none">
          {/* Outline */}
          <rect x="10" y="10" width="380" height="180" rx="2" />
          {/* Center line */}
          <line x1="200" y1="10" x2="200" y2="190" />
          {/* Center circle */}
          <circle cx="200" cy="100" r="30" />
          {/* Center dot */}
          <circle cx="200" cy="100" r="2" fill="rgba(255,255,255,0.5)" />

          {/* Left penalty area */}
          <rect x="10" y="45" width="55" height="110" />
          {/* Left goal area */}
          <rect x="10" y="70" width="22" height="60" />
          {/* Left penalty arc */}
          <path d="M 65 75 A 25 25 0 0 1 65 125" />
          {/* Left penalty dot */}
          <circle cx="48" cy="100" r="2" fill="rgba(255,255,255,0.5)" />

          {/* Right penalty area */}
          <rect x="335" y="45" width="55" height="110" />
          {/* Right goal area */}
          <rect x="368" y="70" width="22" height="60" />
          {/* Right penalty arc */}
          <path d="M 335 75 A 25 25 0 0 0 335 125" />
          {/* Right penalty dot */}
          <circle cx="352" cy="100" r="2" fill="rgba(255,255,255,0.5)" />

          {/* Corner arcs */}
          <path d="M 10 16 A 6 6 0 0 0 16 10" />
          <path d="M 384 10 A 6 6 0 0 0 390 16" />
          <path d="M 16 190 A 6 6 0 0 0 10 184" />
          <path d="M 390 184 A 6 6 0 0 0 384 190" />
        </g>

        {/* Incident markers */}
        {events.map((event, i) => {
          const pos = incidentPosition(event, i, events.length);
          const isGoal = event.type === "goal";
          const isCard =
            event.type === "yellow_card" || event.type === "red_card";

          return (
            <g key={`${event.type}-${event.minute}-${i}`}>
              {isGoal && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="10"
                  fill="rgba(255,255,255,0.2)"
                />
              )}
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={isGoal ? 14 : isCard ? 11 : 9}
                className="select-none"
              >
                {eventIcon(event.type)}
              </text>
              {event.minute != null && (
                <text
                  x={pos.x}
                  y={pos.y + (isGoal ? 16 : 13)}
                  textAnchor="middle"
                  fontSize="8"
                  fill="rgba(255,255,255,0.7)"
                  fontWeight="600"
                >
                  {event.minute}&apos;
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
});

const IncidentTimeline = memo(function IncidentTimeline({
  events,
}: {
  events: TimelineEvent[];
}) {
  if (events.length === 0) return null;

  // Sort by minute
  const sorted = [...events].sort(
    (a, b) => (a.minute ?? 0) - (b.minute ?? 0)
  );

  return (
    <div className="relative px-2 py-3">
      {/* Center vertical line */}
      <div className="absolute left-1/2 top-3 bottom-3 w-px bg-border-subtle -translate-x-px" />

      <div className="flex flex-col gap-2">
        {sorted.map((event, i) => {
          const isHome = event.participant === "home";
          const isGoal = event.type === "goal";

          return (
            <div
              key={`${event.type}-${event.minute}-${i}`}
              className={`flex items-center gap-2 ${
                isHome ? "flex-row" : "flex-row-reverse"
              }`}
            >
              {/* Event content */}
              <div
                className={`flex-1 flex items-center gap-1.5 ${
                  isHome ? "justify-end text-right" : "justify-start text-left"
                }`}
              >
                <div className="flex flex-col">
                  <span
                    className={`text-xs ${
                      isGoal
                        ? "font-bold text-text-primary"
                        : "font-medium text-text-secondary"
                    }`}
                  >
                    {event.description || eventLabel(event.type)}
                  </span>
                </div>
              </div>

              {/* Center icon + minute */}
              <div className="relative z-10 flex flex-col items-center shrink-0 w-14">
                <span
                  className={`flex items-center justify-center rounded-full ${
                    isGoal
                      ? "w-8 h-8 bg-accent-muted text-base"
                      : "w-6 h-6 bg-bg-card text-sm"
                  } border border-border-subtle`}
                >
                  {eventIcon(event.type)}
                </span>
                <span className="text-[10px] tabular-nums text-text-muted mt-0.5 font-semibold">
                  {event.minute != null ? `${event.minute}'` : ""}
                </span>
              </div>

              {/* Spacer for the other side */}
              <div className="flex-1" />
            </div>
          );
        })}
      </div>
    </div>
  );
});

const StatBar = memo(function StatBar({
  label,
  home,
  away,
  suffix,
}: {
  label: string;
  home: number;
  away: number;
  suffix?: string;
}) {
  const homeWidth = barWidth(home, away);
  const awayWidth = barWidth(away, home);
  const sfx = suffix ?? "";

  return (
    <div className="flex items-center gap-2">
      <span className="w-10 text-right text-xs tabular-nums font-semibold text-text-secondary">
        {home}
        {sfx}
      </span>
      <div className="flex-1 flex items-center gap-1">
        <div className="flex-1 h-1.5 rounded-full bg-border-subtle overflow-hidden flex justify-end">
          <div
            className="h-full rounded-full bg-accent/70"
            style={{ width: `${homeWidth}%` }}
          />
        </div>
        <span className="text-[10px] text-text-muted w-24 text-center shrink-0 leading-tight">
          {label}
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-border-subtle overflow-hidden">
          <div
            className="h-full rounded-full bg-status-live/70"
            style={{ width: `${awayWidth}%` }}
          />
        </div>
      </div>
      <span className="w-10 text-left text-xs tabular-nums font-semibold text-text-secondary">
        {away}
        {sfx}
      </span>
    </div>
  );
});

const MomentumBar = memo(function MomentumBar({
  stats,
}: {
  stats: Record<string, any>;
}) {
  const homeAttacks =
    (stats?.attacks?.h ?? 0) + (stats?.dangerous_attacks?.h ?? 0);
  const awayAttacks =
    (stats?.attacks?.g ?? 0) + (stats?.dangerous_attacks?.g ?? 0);

  if (homeAttacks + awayAttacks === 0) return null;

  const homePct = barWidth(homeAttacks, awayAttacks);

  return (
    <div className="px-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
          Momentum
        </span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-border-subtle">
        <div
          className="h-full bg-accent/80 transition-all duration-500"
          style={{ width: `${homePct}%` }}
        />
        <div
          className="h-full bg-status-live/80 transition-all duration-500"
          style={{ width: `${100 - homePct}%` }}
        />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[10px] tabular-nums text-text-muted">
          {homePct}%
        </span>
        <span className="text-[10px] tabular-nums text-text-muted">
          {100 - homePct}%
        </span>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Stats extraction (all available stats, not limited)
// ---------------------------------------------------------------------------

function extractAllStats(
  rawStats: any,
  sportSlug: string
): { label: string; home: number; away: number; suffix?: string }[] {
  if (!rawStats) return [];

  const defs = sportSlug === "football" ? FOOTBALL_STATS : GENERIC_STATS;
  const result: { label: string; home: number; away: number; suffix?: string }[] = [];

  for (const def of defs) {
    const val = rawStats[def.key] as HomeGuest | undefined;
    if (val && val.h != null) {
      result.push({
        label: def.label,
        home: Number(val.h),
        away: Number(val.g ?? 0),
        suffix: def.suffix,
      });
    }
  }

  // Also check for any other keys we might have missed
  if (rawStats) {
    const knownKeys = new Set(GENERIC_STATS.map((d) => d.key));
    for (const key of Object.keys(rawStats)) {
      if (knownKeys.has(key)) continue;
      const val = rawStats[key];
      if (val && typeof val === "object" && val.h != null && typeof val.h === "number") {
        result.push({
          label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          home: Number(val.h),
          away: Number(val.g ?? 0),
        });
      }
    }
  }

  return result;
}

function extractTimeline(stats: any): TimelineEvent[] {
  // Try multiple paths where timeline data might live
  const timeline =
    stats?.timeline ??
    (stats as any)?.timeline ??
    stats?.stats?.timeline ??
    null;

  if (!Array.isArray(timeline)) return [];

  return timeline
    .filter((e: any) => e && e.type)
    .map((e: any) => ({
      type: String(e.type),
      minute: e.minute != null ? Number(e.minute) : undefined,
      participant: e.participant ?? e.team ?? undefined,
      description: e.description ?? undefined,
    }));
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const MatchTracker = memo(function MatchTracker({
  game,
}: {
  game: GameData;
}) {
  const { data: liveStats, isAvailable } = useLiveStatistics({
    gameId: game.gameId,
    sportId: game.sport.sportId,
    gameState: GameState.Live,
    enabled: true,
  });

  const sportSlug = game.sport?.slug ?? "";
  const isFootball = sportSlug === "football";

  const timeline = useMemo(
    () => extractTimeline(liveStats),
    [liveStats]
  );

  const statRows = useMemo(
    () => extractAllStats(liveStats?.stats, sportSlug),
    [liveStats?.stats, sportSlug]
  );

  // No data available — don't render anything
  if (!isAvailable || !liveStats) return null;

  const rawStats = liveStats.stats as Record<string, any> | null;
  const hasPitchEvents = isFootball && timeline.length > 0;
  const hasTimeline = timeline.length > 0;
  const hasStats = statRows.length > 0;
  const hasMomentum =
    rawStats &&
    ((rawStats.attacks?.h ?? 0) + (rawStats.dangerous_attacks?.h ?? 0) +
      (rawStats.attacks?.g ?? 0) + (rawStats.dangerous_attacks?.g ?? 0)) > 0;

  if (!hasPitchEvents && !hasTimeline && !hasStats && !hasMomentum) {
    return (
      <div className="flex items-center justify-center py-8 text-text-muted text-sm">
        No match statistics available yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Football Pitch SVG */}
      {hasPitchEvents && (
        <section>
          <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            Pitch Overview
          </h3>
          <FootballPitch events={timeline} />
        </section>
      )}

      {/* 2. Incident Timeline */}
      {hasTimeline && (
        <section className="bg-bg-card rounded-lg border border-border-subtle overflow-hidden">
          <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-3 pt-2.5 pb-1">
            Match Events
          </h3>
          <IncidentTimeline events={timeline} />
        </section>
      )}

      {/* 3. Enhanced Stats Grid */}
      {hasStats && (
        <section className="bg-bg-card rounded-lg border border-border-subtle p-3">
          <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
            Statistics
          </h3>
          <div className="flex flex-col gap-2">
            {statRows.map((stat) => (
              <StatBar
                key={stat.label}
                label={stat.label}
                home={stat.home}
                away={stat.away}
                suffix={stat.suffix}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. Momentum Indicator */}
      {hasMomentum && rawStats && (
        <section className="bg-bg-card rounded-lg border border-border-subtle p-3">
          <MomentumBar stats={rawStats} />
        </section>
      )}
    </div>
  );
});
