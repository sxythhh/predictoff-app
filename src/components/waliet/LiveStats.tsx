"use client";
import { useState, useEffect, useRef } from "react";
import { useLiveStatistics } from "@azuro-org/sdk";
import { GameState, type GameData } from "@azuro-org/toolkit";

/** Extract score from any sport's scoreboard */
function extractScore(scoreBoard: any): { home: string; away: string } | null {
  if (!scoreBoard) return null;
  const h = scoreBoard?.goals?.h ?? scoreBoard?.total?.h ?? scoreBoard?.sets?.h;
  const g = scoreBoard?.goals?.g ?? scoreBoard?.total?.g ?? scoreBoard?.sets?.g;
  if (h == null && g == null) return null;
  return { home: String(h ?? 0), away: String(g ?? 0) };
}

/** Format clock seconds to mm:ss */
function formatClock(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

/** Extract sub-scores (quarters, sets, halves) */
function extractPeriods(scoreBoard: any, sportSlug: string): { home: string[]; away: string[] } | null {
  if (!scoreBoard) return null;

  // Basketball: q1-q4
  if (sportSlug === "basketball") {
    const periods: { home: string[]; away: string[] } = { home: [], away: [] };
    for (let i = 1; i <= 4; i++) {
      const qh = scoreBoard?.[`q${i}`]?.h;
      const qg = scoreBoard?.[`q${i}`]?.g;
      if (qh != null) {
        periods.home.push(String(qh));
        periods.away.push(String(qg ?? 0));
      }
    }
    return periods.home.length > 0 ? periods : null;
  }

  // Tennis / Volleyball: s1-s5
  if (sportSlug === "tennis" || sportSlug === "volleyball") {
    const periods: { home: string[]; away: string[] } = { home: [], away: [] };
    for (let i = 1; i <= 5; i++) {
      const sh = scoreBoard?.[`s${i}`]?.h;
      const sg = scoreBoard?.[`s${i}`]?.g;
      if (sh != null) {
        periods.home.push(String(sh));
        periods.away.push(String(sg ?? 0));
      }
    }
    return periods.home.length > 0 ? periods : null;
  }

  // Soccer: check for halftime (p1)
  if (sportSlug === "football") {
    const p1h = scoreBoard?.p1?.h;
    const p1g = scoreBoard?.p1?.g;
    if (p1h != null) {
      return {
        home: [String(p1h)],
        away: [String(p1g ?? 0)],
      };
    }
  }

  return null;
}

/** Get interesting stats from the stats object */
function extractStats(stats: any, sportSlug: string): { label: string; home: string; away: string }[] {
  if (!stats) return [];
  const result: { label: string; home: string; away: string }[] = [];

  if (sportSlug === "football") {
    if (stats.possession?.h != null) result.push({ label: "Possession", home: `${stats.possession.h}%`, away: `${stats.possession.g}%` });
    if (stats.shots?.h != null) result.push({ label: "Shots", home: String(stats.shots.h), away: String(stats.shots.g) });
    if (stats.shots_on_target?.h != null) result.push({ label: "On Target", home: String(stats.shots_on_target.h), away: String(stats.shots_on_target.g) });
    if (stats.corners?.h != null) result.push({ label: "Corners", home: String(stats.corners.h), away: String(stats.corners.g) });
    if (stats.dangerous_attacks?.h != null) result.push({ label: "Attacks", home: String(stats.dangerous_attacks.h), away: String(stats.dangerous_attacks.g) });
  } else if (sportSlug === "basketball") {
    if (stats.fouls?.h != null) result.push({ label: "Fouls", home: String(stats.fouls.h), away: String(stats.fouls.g) });
    if (stats.rebounds?.h != null) result.push({ label: "Rebounds", home: String(stats.rebounds.h), away: String(stats.rebounds.g) });
    if (stats.assists?.h != null) result.push({ label: "Assists", home: String(stats.assists.h), away: String(stats.assists.g) });
  } else if (sportSlug === "tennis") {
    if (stats.aces?.h != null) result.push({ label: "Aces", home: String(stats.aces.h), away: String(stats.aces.g) });
    if (stats.double_faults?.h != null) result.push({ label: "Dbl Faults", home: String(stats.double_faults.h), away: String(stats.double_faults.g) });
  }

  return result.slice(0, 3); // max 3 stat rows
}

export function useLiveScore(game: GameData, enabled = true) {
  const { data: stats, isAvailable } = useLiveStatistics({
    gameId: game.gameId,
    sportId: game.sport.sportId,
    gameState: GameState.Live,
    enabled,
  });

  const serverSeconds = stats?.clock?.clock_seconds ?? null;
  const [clockSeconds, setClockSeconds] = useState<number | null>(serverSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const serverSecondsRef = useRef(serverSeconds);

  // Sync local clock to server value whenever it changes — but don't restart the interval
  useEffect(() => {
    if (serverSeconds != null) {
      serverSecondsRef.current = serverSeconds;
      setClockSeconds(serverSeconds);
    }
  }, [serverSeconds]);

  // Single stable interval — only restarts when enabled changes
  useEffect(() => {
    if (serverSecondsRef.current == null || !enabled) return;

    intervalRef.current = setInterval(() => {
      setClockSeconds((prev) => (prev != null ? prev + 1 : prev));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled]);

  if (!enabled || !isAvailable || !stats?.scoreBoard) return null;

  const score = extractScore(stats.scoreBoard);
  const clockStr = clockSeconds != null ? formatClock(clockSeconds) : null;

  return { score, clock: clockStr, stats };
}

export function LiveStats({ game }: { game: GameData }) {
  const liveData = useLiveScore(game);
  if (!liveData?.stats) return null;

  const { stats } = liveData;
  const sportSlug = game.sport?.slug ?? "";
  const periods = extractPeriods(stats.scoreBoard, sportSlug);
  const statRows = extractStats(stats.stats, sportSlug);

  // No extra stats or periods to show — nothing to render here
  // (score is now shown inline in GameCard)
  if (!periods && statRows.length === 0) return null;

  return (
    <div className="mt-2 mb-1">
      {/* Period scores */}
      {periods && (
        <div className="flex items-center justify-center gap-3 mb-1.5">
          {periods.home.map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-[9px] text-text-muted mb-0.5">
                {sportSlug === "basketball" ? `Q${i + 1}` : sportSlug === "football" ? `H${i + 1}` : `S${i + 1}`}
              </span>
              <div className="flex gap-1.5 text-[11px] tabular-nums text-text-secondary font-medium">
                <span>{periods.home[i]}</span>
                <span className="text-text-muted">-</span>
                <span>{periods.away[i]}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stat bars */}
      {statRows.length > 0 && (
        <div className="flex flex-col gap-1 mt-1">
          {statRows.map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <span className="w-7 text-right text-[11px] tabular-nums font-medium text-text-secondary">{stat.home}</span>
              <div className="flex-1 flex items-center gap-1">
                <div className="flex-1 h-1 rounded-full bg-border-subtle overflow-hidden flex justify-end">
                  <div
                    className="h-full rounded-full bg-accent/60"
                    style={{ width: `${getBarWidth(stat.home, stat.away)}%` }}
                  />
                </div>
                <span className="text-[9px] text-text-muted w-12 text-center shrink-0">{stat.label}</span>
                <div className="flex-1 h-1 rounded-full bg-border-subtle overflow-hidden">
                  <div
                    className="h-full rounded-full bg-status-live/60"
                    style={{ width: `${getBarWidth(stat.away, stat.home)}%` }}
                  />
                </div>
              </div>
              <span className="w-7 text-left text-[11px] tabular-nums font-medium text-text-secondary">{stat.away}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getBarWidth(val: string, other: string): number {
  const a = parseFloat(val) || 0;
  const b = parseFloat(other) || 0;
  if (a + b === 0) return 50;
  return Math.round((a / (a + b)) * 100);
}
