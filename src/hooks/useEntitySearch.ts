"use client";

import { useState, useEffect, useRef } from "react";

interface TeamResult {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  sportName: string;
  sportSlug: string;
  upcomingGamesCount: number;
}

interface LeagueResult {
  id: string;
  name: string;
  slug: string;
  countryName: string;
  countrySlug: string;
  sportName: string;
  sportSlug: string;
  activeGamesCount: number;
}

export function useEntitySearch(query: string) {
  const [teams, setTeams] = useState<TeamResult[]>([]);
  const [leagues, setLeagues] = useState<LeagueResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setTeams([]);
      setLeagues([]);
      setIsLoading(false);
      return;
    }

    // Debounce 200ms
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setTeams(data.teams ?? []);
        setLeagues(data.leagues ?? []);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setTeams([]);
          setLeagues([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  return { teams, leagues, isLoading };
}
