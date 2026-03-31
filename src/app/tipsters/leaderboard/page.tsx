"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

type SortBy = "winRate" | "picks" | "subscribers";

function formatAddress(addr: string) { return `${addr.slice(0, 6)}...${addr.slice(-4)}`; }

export default function TipsterLeaderboardPage() {
  const { user } = useAuth();
  const [tipsters, setTipsters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("winRate");

  useEffect(() => {
    fetch("/api/tipsters?limit=50")
      .then((r) => r.json())
      .then((d) => setTipsters(d.tipsters ?? []))
      .finally(() => setLoading(false));
  }, []);

  // Sort client-side
  const sorted = [...tipsters].sort((a, b) => {
    if (sortBy === "winRate") return b.winRate - a.winRate || b.totalPicks - a.totalPicks;
    if (sortBy === "picks") return b.totalPicks - a.totalPicks;
    if (sortBy === "subscribers") return b.subscriberCount - a.subscriberCount;
    return 0;
  }).filter((t) => t.resolvedPicks >= 3); // Min 3 resolved picks to qualify

  const myRank = user ? sorted.findIndex((t) => t.id === user.id) + 1 : 0;

  return (
    <div className="text-text-primary" style={{ letterSpacing: "-0.02em" }}>
      <div className="max-w-[700px] mx-auto p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[18px] font-semibold">Tipster Leaderboard</h1>
          <Link href="/tipsters" className="text-[13px] text-text-muted hover:text-text-secondary">
            Browse all
          </Link>
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-1.5 mb-4">
          {([
            { key: "winRate" as const, label: "Win Rate" },
            { key: "picks" as const, label: "Most Picks" },
            { key: "subscribers" as const, label: "Most Subscribers" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`h-7 px-3 rounded-full text-[12px] font-medium transition-colors ${
                sortBy === key ? "bg-accent/15 text-accent" : "text-text-muted hover:text-text-secondary hover:bg-bg-hover"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-1">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 bg-bg-surface rounded-lg animate-pulse" />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-16 text-center text-text-muted text-[13px]">
            No qualifying tipsters yet (min 3 resolved picks)
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="bg-bg-card rounded-xl border border-border-subtle overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[40px_1fr_60px_60px_60px_60px] gap-2 px-4 py-2.5 text-[11px] text-text-muted font-medium border-b border-border-subtle">
                <span>#</span>
                <span>Tipster</span>
                <span className="text-right">W-L</span>
                <span className="text-right">Win%</span>
                <span className="text-right">Picks</span>
                <span className="text-right">Subs</span>
              </div>

              {/* Rows */}
              {sorted.map((t, i) => {
                const rank = i + 1;
                const isMe = user?.id === t.id;
                return (
                  <Link
                    key={t.id}
                    href={`/tipster/${t.id}`}
                    className={`grid grid-cols-[40px_1fr_60px_60px_60px_60px] gap-2 px-4 py-3 text-[13px] items-center transition-colors ${
                      isMe ? "bg-accent-muted" : "hover:bg-bg-hover"
                    }`}
                  >
                    {/* Rank */}
                    <span className={`font-bold tabular-nums ${rank <= 3 ? "text-accent" : "text-text-muted"}`}>
                      {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                    </span>

                    {/* Tipster */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-bg-surface overflow-hidden shrink-0">
                        {t.avatar ? (
                          <img src={t.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full" style={{
                            background: `linear-gradient(135deg, hsl(${parseInt(t.walletAddress.slice(2, 6), 16) % 360}, 70%, 45%), hsl(${parseInt(t.walletAddress.slice(6, 10), 16) % 360}, 60%, 35%))`,
                          }} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className={`text-[13px] font-medium truncate block ${isMe ? "text-accent" : "text-text-primary"}`}>
                          {t.displayName ?? formatAddress(t.walletAddress)}
                        </span>
                        {/* Form dots */}
                        {t.resolvedPicks > 0 && (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {/* We don't have form data in list API, show win rate bar instead */}
                            <div className="w-16 h-1.5 rounded-full bg-bg-surface overflow-hidden">
                              <div className="h-full rounded-full bg-green-500" style={{ width: `${t.winRate}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* W-L */}
                    <span className="text-right tabular-nums text-text-secondary">{t.wins}-{t.resolvedPicks - t.wins}</span>

                    {/* Win% */}
                    <span className={`text-right tabular-nums font-semibold ${t.winRate >= 60 ? "text-green-400" : t.winRate >= 50 ? "text-yellow-400" : "text-text-muted"}`}>
                      {t.winRate}%
                    </span>

                    {/* Picks */}
                    <span className="text-right tabular-nums text-text-muted">{t.totalPicks}</span>

                    {/* Subs */}
                    <span className="text-right tabular-nums text-text-muted">{t.subscriberCount}</span>
                  </Link>
                );
              })}
            </div>

            {/* Your rank footer */}
            {myRank > 0 && (
              <div className="mt-3 px-4 py-3 bg-accent-muted rounded-xl text-[13px]">
                <span className="text-text-muted">Your rank: </span>
                <span className="font-bold text-accent">#{myRank}</span>
                <span className="text-text-muted"> of {sorted.length} tipsters</span>
              </div>
            )}
            {user?.isTipster && myRank === 0 && (
              <div className="mt-3 px-4 py-3 bg-bg-surface rounded-xl text-[13px] text-text-muted">
                Post at least 3 picks to appear on the leaderboard
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
