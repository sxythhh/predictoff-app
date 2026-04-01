"use client";

import { memo } from "react";
import { GameState, type GameData } from "@azuro-org/toolkit";
import { useLiveScore, extractPeriods, extractStats } from "../LiveStats";

function getBarWidth(val: string, other: string): number {
  const a = parseFloat(val) || 0;
  const b = parseFloat(other) || 0;
  if (a + b === 0) return 50;
  return Math.round((a / (a + b)) * 100);
}

export const ModalStats = memo(function ModalStats({ game }: { game: GameData }) {
  const liveData = useLiveScore(game, game.state === GameState.Live);

  if (!liveData?.stats) return null;

  const { stats } = liveData;
  const sportSlug = game.sport?.slug ?? "";
  const periods = extractPeriods(stats.scoreBoard, sportSlug);
  const statRows = extractStats(stats.stats, sportSlug);

  if (!periods && statRows.length === 0) return null;

  return (
    <div className="px-4 pb-2">
      <div className="stats-glass rounded-xl p-4">
        {/* Period scores */}
        {periods && (
          <div className="mb-3">
            <div className="grid gap-1" style={{ gridTemplateColumns: `1fr repeat(${periods.home.length}, 40px)` }}>
              {/* Header row */}
              <div className="text-[11px] text-text-muted font-medium" />
              {periods.home.map((_, i) => (
                <div key={i} className="text-[11px] text-text-muted font-medium text-center">
                  {sportSlug === "basketball" ? `Q${i + 1}` : sportSlug === "football" ? `H${i + 1}` : `S${i + 1}`}
                </div>
              ))}
              {/* Home row */}
              <div className="text-[12px] font-medium text-text-primary truncate">
                {game.participants?.[0]?.name}
              </div>
              {periods.home.map((val, i) => (
                <div key={i} className="text-[12px] font-semibold text-text-primary text-center tabular-nums font-inter">
                  {val}
                </div>
              ))}
              {/* Away row */}
              <div className="text-[12px] font-medium text-text-primary truncate">
                {game.participants?.[1]?.name}
              </div>
              {periods.away.map((val, i) => (
                <div key={i} className="text-[12px] font-semibold text-text-primary text-center tabular-nums font-inter">
                  {val}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stat comparison bars */}
        {statRows.length > 0 && (
          <div className={`flex flex-col gap-2.5 ${periods ? "pt-2 border-t border-border-subtle" : ""}`}>
            {statRows.map((stat) => {
              const homeW = getBarWidth(stat.home, stat.away);
              const awayW = getBarWidth(stat.away, stat.home);
              return (
                <div key={stat.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-semibold text-text-primary tabular-nums font-inter">{stat.home}</span>
                    <span className="text-[11px] text-text-muted font-medium">{stat.label}</span>
                    <span className="text-[12px] font-semibold text-text-primary tabular-nums font-inter">{stat.away}</span>
                  </div>
                  <div className="flex gap-1 h-1.5">
                    <div className="flex-1 rounded-full bg-border-subtle overflow-hidden flex justify-end">
                      <div
                        className="h-full rounded-full bg-accent/70 transition-all duration-500"
                        style={{ width: `${homeW}%` }}
                      />
                    </div>
                    <div className="flex-1 rounded-full bg-border-subtle overflow-hidden">
                      <div
                        className="h-full rounded-full bg-status-live/70 transition-all duration-500"
                        style={{ width: `${awayW}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
