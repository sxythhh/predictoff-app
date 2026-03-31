"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchGames } from "@azuro-org/sdk";
import Link from "next/link";
import { useEntitySearch } from "@/hooks/useEntitySearch";
import { CountryFlag } from "@/components/sidebar/app-sidebar";
import { TeamLogo } from "@/components/waliet/TeamLogo";

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M11 1L1 11M1 1L11 11" stroke="#8A8A98" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
      <circle cx="8.5" cy="8.5" r="8" stroke="#54545C" strokeWidth="1"/>
      <path d="M6 6L11 11M11 6L6 11" stroke="#54545C" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-2 px-2 py-2 mx-2 rounded-lg bg-bg-modal mb-1 animate-pulse">
      <div className="flex items-center w-[68px] justify-end">
        <div className="w-10 h-10 rounded-full bg-bg-hover" />
        <div className="w-10 h-10 rounded-full bg-bg-hover -ml-3" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="h-3 w-24 rounded bg-bg-hover" />
        <div className="h-3 w-48 rounded bg-bg-hover" />
      </div>
      <div className="h-7 w-24 rounded-full bg-bg-hover" />
    </div>
  );
}

export default function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isFetching } = useSearchGames({
    input: query,
    debounceMs: 300,
    perPage: 20,
  });

  const games = data?.games ?? [];
  const { teams: entityTeams, leagues: entityLeagues } = useEntitySearch(query);
  const hasEntities = entityTeams.length > 0 || entityLeagues.length > 0;

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [open, onClose]);

  if (!open) return null;

  // Group games by league
  const grouped = new Map<string, typeof games>();
  for (const game of games) {
    const leagueKey = `${game.country?.name ?? ""} · ${game.league?.name ?? ""}`;
    if (!grouped.has(leagueKey)) grouped.set(leagueKey, []);
    grouped.get(leagueKey)!.push(game);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-0 lg:pt-[10vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 hidden lg:block" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full h-full lg:w-[956px] lg:max-w-[95vw] lg:max-h-[676px] lg:h-auto flex flex-col bg-bg-modal lg:rounded-xl rounded-none p-4 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-text-primary">Search</span>
            <button onClick={onClose} className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-bg-hover transition-colors">
              <CloseIcon />
            </button>
          </div>

          {/* Search input */}
          <label className="flex items-center gap-3 bg-bg-card rounded-lg px-4 h-11">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
              <path fillRule="evenodd" clipRule="evenodd" d="M7.14667 0C3.19967 0 0 3.19967 0 7.14667C0 11.0937 3.19967 14.2933 7.14667 14.2933C8.851 14.2933 10.4165 13.6964 11.6447 12.7006L14.7254 15.7813C15.017 16.0729 15.4897 16.0729 15.7813 15.7813C16.0729 15.4897 16.0729 15.017 15.7813 14.7254L12.7006 11.6447C13.6964 10.4165 14.2933 8.851 14.2933 7.14667C14.2933 3.19967 11.0937 0 7.14667 0ZM1.49333 7.14667C1.49333 4.02442 4.02442 1.49333 7.14667 1.49333C10.2689 1.49333 12.8 4.02442 12.8 7.14667C12.8 10.2689 10.2689 12.8 7.14667 12.8C4.02442 12.8 1.49333 10.2689 1.49333 7.14667Z" fill="#54545C"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sport, league, event or team"
              className="flex-1 bg-transparent text-[15px] font-medium text-text-primary placeholder:text-text-muted outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="shrink-0">
                <ClearIcon />
              </button>
            )}
          </label>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto pt-4">
          {!query.trim() ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
              <svg width="24" height="24" viewBox="0 0 16 16" fill="none" className="mb-3 opacity-40">
                <path fillRule="evenodd" clipRule="evenodd" d="M7.14667 0C3.19967 0 0 3.19967 0 7.14667C0 11.0937 3.19967 14.2933 7.14667 14.2933C8.851 14.2933 10.4165 13.6964 11.6447 12.7006L14.7254 15.7813C15.017 16.0729 15.4897 16.0729 15.7813 15.7813C16.0729 15.4897 16.0729 15.017 15.7813 14.7254L12.7006 11.6447C13.6964 10.4165 14.2933 8.851 14.2933 7.14667C14.2933 3.19967 11.0937 0 7.14667 0ZM1.49333 7.14667C1.49333 4.02442 4.02442 1.49333 7.14667 1.49333C10.2689 1.49333 12.8 4.02442 12.8 7.14667C12.8 10.2689 10.2689 12.8 7.14667 12.8C4.02442 12.8 1.49333 10.2689 1.49333 7.14667Z" fill="currentColor"/>
              </svg>
              <span className="text-[13px]">Type to search for games, teams, or leagues</span>
            </div>
          ) : isFetching ? (
            <div className="bg-bg-card rounded-lg overflow-hidden">
              {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : games.length === 0 && !hasEntities ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
              <span className="text-2xl mb-2">🔍</span>
              <span className="text-[13px]">No results found for &ldquo;{query}&rdquo;</span>
            </div>
          ) : (
            <>
              {/* Teams */}
              {entityTeams.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Teams</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {entityTeams.map((team) => (
                      <Link
                        key={team.id}
                        href={`/team/${team.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-hover transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-bg-surface overflow-hidden flex items-center justify-center shrink-0">
                          <TeamLogo src={team.image} name={team.name} className="w-8 h-8 object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-medium text-text-primary truncate">{team.name}</div>
                          <div className="text-[11px] text-text-muted">{team.sportName} · {team.upcomingGamesCount} upcoming</div>
                        </div>
                        <svg width="5" height="9" viewBox="0 0 5 9" fill="none" className="text-text-muted shrink-0">
                          <path d="M0.5 1L4 4.5L0.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Leagues */}
              {entityLeagues.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Leagues</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {entityLeagues.map((league) => (
                      <Link
                        key={league.id}
                        href={`/league/${league.sportSlug}/${league.countrySlug}/${league.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-hover transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-bg-surface overflow-hidden flex items-center justify-center shrink-0">
                          <CountryFlag name={league.countryName} className="w-6 h-6 rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-medium text-text-primary truncate">{league.name}</div>
                          <div className="text-[11px] text-text-muted">{league.countryName} · {league.sportName} · {league.activeGamesCount} games</div>
                        </div>
                        <svg width="5" height="9" viewBox="0 0 5 9" fill="none" className="text-text-muted shrink-0">
                          <path d="M0.5 1L4 4.5L0.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Games header */}
              {games.length > 0 && (
                <div className="flex items-center gap-2 px-2 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Games</span>
                  <span className="text-[11px] text-text-muted">{data?.total ?? games.length}</span>
                </div>
              )}

              {/* Results list */}
              {games.length > 0 && <div className="bg-bg-card rounded-lg overflow-hidden">
                {[...grouped.entries()].map(([leagueKey, leagueGames]) => (
                  <div key={leagueKey}>
                    {/* League header */}
                    <div className="flex items-center gap-2 px-4 h-10">
                      <div className="w-5 h-5 rounded-sm bg-bg-subtle" />
                      <span className="text-[13px] font-medium text-text-primary">{leagueKey}</span>
                    </div>

                    {/* Events */}
                    {leagueGames.map((game) => {
                      const date = new Date(+game.startsAt * 1000);
                      const time = date.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      });
                      const dateStr = date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });

                      return (
                        <Link
                          key={game.gameId}
                          href={`/game/${game.gameId}`}
                          onClick={onClose}
                          className="flex items-center gap-2 px-2 py-2 mx-2 rounded-lg bg-bg-modal mb-1 hover:bg-bg-hover transition-colors cursor-pointer"
                        >
                          {/* Team logos */}
                          <div className="flex items-center w-[68px] justify-end">
                            {game.participants.slice(0, 2).map((p, i) => (
                              <div
                                key={p.name}
                                className={`w-10 h-10 rounded-full bg-bg-hover flex items-center justify-center ${i > 0 ? "-ml-3" : ""}`}
                              >
                                {p.image ? (
                                  <img src={p.image} alt={p.name} className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                  <span className="text-[11px] font-bold text-text-secondary">{p.name.charAt(0)}</span>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Event info */}
                          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 text-[13px] font-medium text-text-secondary">
                              <span>{dateStr}</span>
                              <span>&middot;</span>
                              <span>{time}</span>
                            </div>
                            <span className="text-[13px] font-medium text-text-primary truncate">{game.title}</span>
                          </div>

                          {/* See markets button */}
                          <span className="flex items-center gap-1 px-4 py-1.5 rounded-full border border-border-primary shrink-0">
                            <span className="text-[13px] font-medium text-text-secondary">See markets</span>
                            <svg width="5" height="9" viewBox="0 0 5 9" fill="none">
                              <path d="M0.5 1L4 4.5L0.5 8" stroke="#8A8A98" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
