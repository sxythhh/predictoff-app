"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { TournamentCard } from "@/components/waliet/tournaments/TournamentCard";
import type { TournamentListItem } from "@/types/tournament";

type FilterTab = "all" | "profit" | "pickem";

export default function TournamentsPage() {
  const [tab, setTab] = useState<FilterTab>("all");
  const [tournaments, setTournaments] = useState<TournamentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchTournaments = useCallback(async (cursor?: string) => {
    const params = new URLSearchParams({ limit: "20" });
    if (tab !== "all") params.set("format", tab);
    if (cursor) params.set("cursor", cursor);

    const res = await fetch(`/api/tournaments?${params}`);
    if (!res.ok) return;
    const data = await res.json();

    setTournaments((prev) => cursor ? [...prev, ...data.tournaments] : data.tournaments);
    setNextCursor(data.nextCursor);
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    setTournaments([]);
    fetchTournaments().finally(() => setLoading(false));
  }, [fetchTournaments]);

  return (
    <div className="text-text-primary" style={{ letterSpacing: "-0.02em" }}>
      <div className="max-w-[800px] mx-auto p-4 lg:p-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[18px] font-semibold">Tournaments</h1>
          <Link
            href="/tournaments/create"
            className="h-9 px-4 rounded-lg bg-accent text-btn-primary-text text-[13px] font-semibold hover:bg-accent-hover transition-colors flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Create
          </Link>
        </div>
        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 mb-4">
          {([
            { key: "all" as const, label: "All" },
            { key: "profit" as const, label: "Profit" },
            { key: "pickem" as const, label: "Pick'em" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`h-8 px-3.5 rounded-full text-[13px] font-medium transition-colors ${
                tab === key
                  ? "bg-accent text-btn-primary-text"
                  : "bg-bg-surface text-text-secondary hover:bg-bg-hover"
              }`}
            >
              {label}
            </button>
          ))}
          <Link
            href="/tournaments/my"
            className="h-8 px-3.5 rounded-full text-[13px] font-medium bg-bg-surface text-text-secondary hover:bg-bg-hover transition-colors ml-auto"
          >
            My Tournaments
          </Link>
        </div>

        {/* Tournament list */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-bg-card animate-pulse border border-border-subtle" />
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-bg-surface flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-muted">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-text-secondary text-[15px] font-medium">No tournaments yet</p>
            <p className="text-text-muted text-[13px] mt-1">Be the first to create one</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
            {nextCursor && (
              <button
                onClick={() => fetchTournaments(nextCursor)}
                className="h-9 rounded-lg bg-bg-surface text-[13px] font-medium text-text-secondary hover:bg-bg-hover transition-colors"
              >
                Load more
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
