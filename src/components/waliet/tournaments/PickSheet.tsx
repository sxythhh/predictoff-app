"use client";

import { useState, useEffect, useCallback } from "react";
import { useGame, useActiveMarkets } from "@azuro-org/sdk";
import type { TournamentGame, TournamentPick } from "@/types/tournament";
import { useToast } from "@/components/waliet/Toast";

function GamePickRow({
  tournamentGame,
  existingPick,
  onPick,
}: {
  tournamentGame: TournamentGame;
  existingPick?: { conditionId: string; outcomeId: string; selectionName: string | null };
  onPick: (pick: { tournamentGameId: string; conditionId: string; outcomeId: string; marketName: string; selectionName: string }) => void;
}) {
  const { data: game } = useGame({ gameId: tournamentGame.gameId });
  const { data: markets, isFetching } = useActiveMarkets({ gameId: tournamentGame.gameId });
  const now = Math.floor(Date.now() / 1000);
  const isLocked = now >= tournamentGame.startsAt || tournamentGame.resolved;

  // Use first market (usually Match Winner / 1X2)
  const market = markets?.[0];
  const condition = market?.conditions?.[0];

  return (
    <div className="bg-bg-card rounded-xl border border-border-subtle overflow-hidden">
      {/* Game header */}
      <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-text-primary truncate">
            {tournamentGame.gameTitle ?? game?.title ?? tournamentGame.gameId}
          </div>
          <div className="text-[11px] text-text-muted">
            {tournamentGame.sportName && `${tournamentGame.sportName} · `}
            {tournamentGame.leagueName && `${tournamentGame.leagueName} · `}
            {new Date(tournamentGame.startsAt * 1000).toLocaleDateString("en-US", {
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </div>
        </div>
        {isLocked && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
            tournamentGame.resolved
              ? "text-text-secondary bg-bg-surface"
              : "text-yellow-400 bg-yellow-500/10"
          }`}>
            {tournamentGame.resolved ? "Resolved" : "Locked"}
          </span>
        )}
      </div>

      {/* Outcomes */}
      <div className="p-3">
        {isFetching || !condition ? (
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 h-10 rounded-lg bg-bg-surface animate-pulse" />
            ))}
          </div>
        ) : (
          <div className={`grid gap-2 ${
            condition.outcomes.length === 2 ? "grid-cols-2" :
            condition.outcomes.length === 3 ? "grid-cols-3" : "grid-cols-2"
          }`}>
            {condition.outcomes.map((outcome) => {
              const isSelected = existingPick?.conditionId === condition.conditionId && existingPick?.outcomeId === outcome.outcomeId;
              return (
                <button
                  key={outcome.outcomeId}
                  disabled={isLocked}
                  onClick={() => onPick({
                    tournamentGameId: tournamentGame.id,
                    conditionId: condition.conditionId,
                    outcomeId: outcome.outcomeId,
                    marketName: market.name,
                    selectionName: outcome.selectionName,
                  })}
                  className={`h-10 rounded-lg text-[13px] font-medium transition-colors ${
                    isLocked
                      ? isSelected
                        ? "bg-accent/10 text-accent border border-accent/20 cursor-not-allowed"
                        : "bg-bg-surface text-text-muted cursor-not-allowed opacity-50"
                      : isSelected
                        ? "bg-accent text-btn-primary-text ring-2 ring-accent/30"
                        : "bg-bg-surface text-text-secondary hover:bg-bg-hover cursor-pointer"
                  }`}
                >
                  {outcome.selectionName}
                </button>
              );
            })}
          </div>
        )}

        {/* Show existing pick when locked */}
        {isLocked && existingPick && (
          <div className="mt-2 text-[11px] text-text-muted">
            Your pick: <span className="text-accent font-medium">{existingPick.selectionName}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function PickSheet({
  tournamentId,
  games,
  existingPicks,
}: {
  tournamentId: string;
  games: TournamentGame[];
  existingPicks: TournamentPick[];
}) {
  const { toast } = useToast();
  const [picks, setPicks] = useState<Map<string, { tournamentGameId: string; conditionId: string; outcomeId: string; marketName: string; selectionName: string }>>(new Map());
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Initialize from existing picks
  useEffect(() => {
    const map = new Map<string, any>();
    for (const p of existingPicks) {
      map.set(p.tournamentGameId, {
        tournamentGameId: p.tournamentGameId,
        conditionId: p.conditionId,
        outcomeId: p.outcomeId,
        marketName: p.marketName ?? "",
        selectionName: p.selectionName ?? "",
      });
    }
    setPicks(map);
  }, [existingPicks]);

  const handlePick = useCallback((pick: { tournamentGameId: string; conditionId: string; outcomeId: string; marketName: string; selectionName: string }) => {
    setPicks((prev) => {
      const next = new Map(prev);
      next.set(pick.tournamentGameId, pick);
      return next;
    });
    setDirty(true);
  }, []);

  const savePicks = async () => {
    setSaving(true);
    const picksArray = Array.from(picks.values());
    const res = await fetch(`/api/tournaments/${tournamentId}/picks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ picks: picksArray }),
    });
    const data = await res.json();
    if (res.ok) {
      toast(`${data.saved} picks saved`, "success");
      setDirty(false);
    } else {
      toast(data.error ?? "Failed to save picks", "error");
    }
    setSaving(false);
  };

  const totalGames = games.length;
  const pickedCount = picks.size;
  const now = Math.floor(Date.now() / 1000);
  const lockedCount = games.filter((g) => now >= g.startsAt).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Stats bar */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[13px] text-text-muted">
          <span className="text-text-primary font-semibold">{pickedCount}</span>/{totalGames} picks made
          {lockedCount > 0 && <span className="ml-2 text-yellow-400/70">({lockedCount} locked)</span>}
        </span>
        {dirty && (
          <button
            onClick={savePicks}
            disabled={saving}
            className="h-8 px-4 rounded-lg bg-accent text-btn-primary-text text-[13px] font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Picks"}
          </button>
        )}
      </div>

      {/* Game list */}
      {games.map((game) => {
        const existingPick = picks.get(game.id);
        return (
          <GamePickRow
            key={game.id}
            tournamentGame={game}
            existingPick={existingPick}
            onPick={handlePick}
          />
        );
      })}

      {/* Save button at bottom */}
      {dirty && (
        <button
          onClick={savePicks}
          disabled={saving}
          className="h-11 rounded-xl bg-accent text-btn-primary-text text-[14px] font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : `Save ${pickedCount} Picks`}
        </button>
      )}
    </div>
  );
}
