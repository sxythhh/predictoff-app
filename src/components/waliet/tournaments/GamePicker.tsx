"use client";

import { useState, useCallback } from "react";
import { useSearchGames } from "@azuro-org/sdk";
import type { GameData } from "@azuro-org/toolkit";
import { useToast } from "@/components/waliet/Toast";
import type { TournamentGame } from "@/types/tournament";

export function GamePicker({
  tournamentId,
  existingGames,
  onGamesChange,
}: {
  tournamentId?: string;
  existingGames: TournamentGame[];
  onGamesChange?: (games: TournamentGame[]) => void;
}) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const { data: searchResults, isFetching } = useSearchGames({ input: query.length >= 2 ? query : "", perPage: 20 });
  const [addedIds, setAddedIds] = useState<Set<string>>(() => new Set(existingGames.map((g) => g.gameId)));

  const addGame = useCallback(async (game: GameData) => {
    if (addedIds.has(game.gameId)) return;

    const gameData = {
      gameId: game.gameId,
      gameTitle: game.title,
      sportName: game.sport?.name ?? null,
      leagueName: game.league?.name ?? null,
      startsAt: parseInt(game.startsAt),
    };

    // If we have a tournamentId, persist to API
    if (tournamentId) {
      const res = await fetch(`/api/tournaments/${tournamentId}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ games: [gameData] }),
      });
      if (!res.ok) {
        toast("Failed to add game", "error");
        return;
      }
    }

    setAddedIds((prev) => new Set(prev).add(game.gameId));
    const newGame: TournamentGame = {
      id: `temp-${game.gameId}`,
      ...gameData,
      resolved: false,
      totalPicks: 0,
      metadata: null,
    };
    onGamesChange?.([...existingGames, newGame]);
    toast(`Added: ${game.title}`, "success");
  }, [tournamentId, addedIds, existingGames, onGamesChange, toast]);

  const removeGame = useCallback(async (gameId: string) => {
    if (tournamentId) {
      await fetch(`/api/tournaments/${tournamentId}/games`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });
    }

    setAddedIds((prev) => {
      const next = new Set(prev);
      next.delete(gameId);
      return next;
    });
    onGamesChange?.(existingGames.filter((g) => g.gameId !== gameId));
  }, [tournamentId, existingGames, onGamesChange]);

  const games = searchResults?.games ?? [];

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search games (e.g. 'Arsenal', 'Lakers')..."
          className="w-full h-10 px-3 pl-9 rounded-lg bg-bg-input border border-border-input text-[13px] text-text-primary outline-none focus:border-accent transition-colors"
        />
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Search results */}
      {query.length >= 2 && (
        <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
          {isFetching ? (
            <div className="py-4 text-center text-text-muted text-[12px]">Searching...</div>
          ) : games.length === 0 ? (
            <div className="py-4 text-center text-text-muted text-[12px]">No games found</div>
          ) : (
            games.map((game: GameData) => {
              const isAdded = addedIds.has(game.gameId);
              return (
                <div
                  key={game.gameId}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-surface hover:bg-bg-hover transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-text-primary truncate">{game.title}</div>
                    <div className="text-[11px] text-text-muted">
                      {game.sport?.name} · {game.league?.name} · {new Date(parseInt(game.startsAt) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <button
                    onClick={() => isAdded ? removeGame(game.gameId) : addGame(game)}
                    className={`shrink-0 h-7 px-3 rounded-md text-[12px] font-semibold transition-colors ml-2 ${
                      isAdded
                        ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        : "bg-accent-muted text-accent hover:bg-accent/20"
                    }`}
                  >
                    {isAdded ? "Remove" : "Add"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Added games */}
      {existingGames.length > 0 && (
        <div className="mt-2">
          <div className="text-[12px] text-text-muted mb-2">
            {existingGames.length} game{existingGames.length !== 1 ? "s" : ""} selected
          </div>
          <div className="flex flex-col gap-1">
            {existingGames.map((g) => (
              <div key={g.gameId} className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-card border border-border-subtle">
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-text-primary truncate">{g.gameTitle ?? g.gameId}</div>
                  <div className="text-[10px] text-text-muted">
                    {g.sportName && `${g.sportName} · `}
                    {g.leagueName}
                  </div>
                </div>
                <button
                  onClick={() => removeGame(g.gameId)}
                  className="text-text-muted hover:text-red-400 transition-colors ml-2"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
