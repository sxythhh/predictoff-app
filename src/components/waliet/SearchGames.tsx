"use client";
import { useState, useCallback, useRef } from "react";
import { useSearchGames } from "@azuro-org/sdk";
import { GameCard } from "./GameCard";

export function SearchGames() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  const handleChange = useCallback((value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(value), 300);
  }, []);

  const { data, isFetching } = useSearchGames({
    input: debouncedQuery,
    // only search when there are at least 2 chars
    query: { enabled: debouncedQuery.length >= 2 },
  });

  return (
    <div>
      {/* Search input */}
      <div className="px-4 pt-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" viewBox="0 0 16 16" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M7.15 0C3.2 0 0 3.2 0 7.15C0 11.09 3.2 14.29 7.15 14.29C8.85 14.29 10.42 13.7 11.64 12.7L14.73 15.78C15.02 16.07 15.49 16.07 15.78 15.78C16.07 15.49 16.07 15.02 15.78 14.73L12.7 11.64C13.7 10.42 14.29 8.85 14.29 7.15C14.29 3.2 11.09 0 7.15 0ZM1.49 7.15C1.49 4.02 4.02 1.49 7.15 1.49C10.27 1.49 12.8 4.02 12.8 7.15C12.8 10.27 10.27 12.8 7.15 12.8C4.02 12.8 1.49 10.27 1.49 7.15Z" fill="currentColor"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Search games..."
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-bg-input border border-border-input text-text-primary text-[14px] placeholder:text-text-muted outline-none focus:border-text-muted transition-colors"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setDebouncedQuery(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {debouncedQuery.length >= 2 && (
        <div className="mt-2">
          {isFetching ? (
            <div className="flex flex-col gap-2 p-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-20 rounded-lg animate-pulse" style={{background:"var(--border-subtle)"}} />
              ))}
            </div>
          ) : data?.games?.length ? (
            <div className="rounded-lg overflow-hidden mx-4 bg-bg-card divide-y divide-border-subtle">
              {data.games.map((game) => (
                <GameCard key={game.gameId} game={game} leagueUrl="" />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-muted text-[13px]">
              No games found for &ldquo;{debouncedQuery}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
