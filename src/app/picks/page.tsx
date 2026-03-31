"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { PickCard } from "@/components/waliet/tipster/PickCard";
import { PickComposer } from "@/components/waliet/tipster/PickComposer";

type FeedTab = "all" | "following";

function FeaturedTipsters() {
  const [tipsters, setTipsters] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/tipsters?limit=5")
      .then((r) => r.ok ? r.json() : { tipsters: [] })
      .then((d) => setTipsters((d.tipsters ?? []).filter((t: any) => t.totalPicks > 0).slice(0, 4)))
      .catch(() => {});
  }, []);

  if (tipsters.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-semibold text-text-primary">Top Tipsters</span>
        <Link href="/tipsters" className="text-[11px] text-text-muted hover:text-text-secondary">See all</Link>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {tipsters.map((t: any) => (
          <Link
            key={t.id}
            href={`/tipster/${t.id}`}
            className="shrink-0 w-[140px] bg-bg-card rounded-xl border border-border-subtle p-3 hover:bg-bg-hover transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-bg-surface overflow-hidden shrink-0">
                {t.avatar ? (
                  <img src={t.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" style={{
                    background: `linear-gradient(135deg, hsl(${parseInt(t.walletAddress.slice(2, 6), 16) % 360}, 70%, 45%), hsl(${parseInt(t.walletAddress.slice(6, 10), 16) % 360}, 60%, 35%))`,
                  }} />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-medium text-text-primary truncate">{t.displayName ?? `${t.walletAddress.slice(0, 6)}...`}</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className={`font-bold ${t.winRate >= 60 ? "text-green-400" : t.winRate >= 50 ? "text-yellow-400" : "text-text-muted"}`}>{t.winRate}%</span>
              <span className="text-text-muted">{t.totalPicks} picks</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

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
    <div className="text-text-primary" style={{ letterSpacing: "-0.02em" }}>
      <div className="max-w-[600px] mx-auto p-4 lg:p-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[18px] font-semibold">Picks</h1>
          <Link href="/tipsters" className="text-[13px] text-accent font-medium hover:text-accent-hover">
            Browse Tipsters
          </Link>
        </div>
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

        {/* Featured tipsters */}
        <FeaturedTipsters />

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
