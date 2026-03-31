"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { PickCard } from "@/components/waliet/tipster/PickCard";
import { PickComposer } from "@/components/waliet/tipster/PickComposer";

type FeedTab = "all" | "following";

export default function PicksFeedPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<FeedTab>("all");
  const [picks, setPicks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchPicks = useCallback(async (cursor?: string) => {
    const params = new URLSearchParams({ limit: "20" });
    if (tab === "following") params.set("following", "true");
    if (cursor) params.set("cursor", cursor);

    const res = await fetch(`/api/picks/feed?${params}`);
    if (!res.ok) return;
    const data = await res.json();
    setPicks((prev) => cursor ? [...prev, ...data.picks] : data.picks);
    setNextCursor(data.nextCursor);
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    setPicks([]);
    fetchPicks().finally(() => setLoading(false));
  }, [fetchPicks]);

  return (
    <div className="min-h-screen bg-bg-page text-text-primary" style={{ letterSpacing: "-0.02em" }}>
      <header className="h-14 flex items-center justify-between px-3 lg:px-6 border-b border-border-primary">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <h1 className="text-[18px] font-semibold">Picks</h1>
        </div>
        <Link href="/tipsters" className="text-[13px] text-accent font-medium hover:text-accent-hover">
          Browse Tipsters
        </Link>
      </header>

      <div className="max-w-[600px] mx-auto p-4 lg:p-6">
        {/* Composer for tipsters */}
        {user?.isTipster && (
          <div className="mb-4">
            <PickComposer onPickCreated={() => fetchPicks()} />
          </div>
        )}

        {/* Not a tipster? CTA */}
        {user && !user.isTipster && (
          <div className="bg-bg-card rounded-xl border border-border-subtle p-4 mb-4 text-center">
            <p className="text-[13px] text-text-secondary mb-2">Share your expertise and earn</p>
            <Link
              href="/tipster/setup"
              className="inline-flex h-9 px-4 rounded-lg bg-accent text-btn-primary-text text-[13px] font-semibold hover:bg-accent-hover transition-colors items-center"
            >
              Become a Tipster
            </Link>
          </div>
        )}

        {/* Feed tabs */}
        <div className="flex items-center gap-1.5 mb-4">
          <button
            onClick={() => setTab("all")}
            className={`h-8 px-3.5 rounded-full text-[13px] font-medium transition-colors ${
              tab === "all" ? "bg-accent text-btn-primary-text" : "bg-bg-surface text-text-secondary hover:bg-bg-hover"
            }`}
          >
            All Picks
          </button>
          {user && (
            <button
              onClick={() => setTab("following")}
              className={`h-8 px-3.5 rounded-full text-[13px] font-medium transition-colors ${
                tab === "following" ? "bg-accent text-btn-primary-text" : "bg-bg-surface text-text-secondary hover:bg-bg-hover"
              }`}
            >
              Following
            </button>
          )}
        </div>

        {/* Picks list */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-xl bg-bg-card animate-pulse border border-border-subtle" />)}
          </div>
        ) : picks.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-text-secondary text-[15px] font-medium">No picks yet</p>
            <p className="text-text-muted text-[13px] mt-1">
              {tab === "following" ? "Follow tipsters to see their picks here" : "Be the first to share a pick"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {picks.map((pick) => (
              <PickCard key={pick.id} pick={pick} />
            ))}
            {nextCursor && (
              <button
                onClick={() => fetchPicks(nextCursor)}
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
