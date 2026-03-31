"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TournamentStatusBadge } from "@/components/waliet/tournaments/TournamentStatusBadge";

export default function MyTournamentsPage() {
  const [data, setData] = useState<{ created: any[]; joined: any[] }>({ created: [], joined: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"joined" | "created">("joined");

  useEffect(() => {
    fetch("/api/tournaments/my")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-bg-page text-text-primary" style={{ letterSpacing: "-0.02em" }}>
      <header className="h-14 flex items-center px-3 lg:px-6 border-b border-border-primary">
        <Link href="/tournaments" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span className="text-[14px] font-medium">Tournaments</span>
        </Link>
        <h1 className="text-[16px] font-semibold ml-4">My Tournaments</h1>
      </header>

      <div className="max-w-[800px] mx-auto p-4 lg:p-6">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 mb-4">
          {(["joined", "created"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`h-8 px-3.5 rounded-full text-[13px] font-medium capitalize transition-colors ${
                tab === t ? "bg-accent text-btn-primary-text" : "bg-bg-surface text-text-secondary hover:bg-bg-hover"
              }`}
            >
              {t} ({t === "joined" ? data.joined.length : data.created.length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => <div key={i} className="h-20 rounded-xl bg-bg-card animate-pulse border border-border-subtle" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {tab === "joined" && data.joined.length === 0 && (
              <div className="py-12 text-center text-text-muted text-[13px]">
                No tournaments joined yet. <Link href="/tournaments" className="text-accent hover:underline">Browse tournaments</Link>
              </div>
            )}
            {tab === "created" && data.created.length === 0 && (
              <div className="py-12 text-center text-text-muted text-[13px]">
                No tournaments created yet. <Link href="/tournaments/create" className="text-accent hover:underline">Create one</Link>
              </div>
            )}

            {tab === "joined" && data.joined.map((e: any) => (
              <Link key={e.entryId} href={`/tournaments/${e.tournament.id}`} className="bg-bg-card rounded-xl border border-border-subtle p-4 hover:bg-bg-hover transition-colors flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[14px] font-semibold truncate">{e.tournament.title}</span>
                    <TournamentStatusBadge status={e.tournament.status} />
                  </div>
                  <div className="text-[12px] text-text-muted">
                    {e.tournament.participantCount} players · {e.tournament.format}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className={`text-[14px] font-bold tabular-nums ${e.score > 0 ? "text-green-400" : e.score < 0 ? "text-red-400" : "text-text-primary"}`}>
                    {e.score > 0 ? "+" : ""}{e.score.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-text-muted">Rank #{e.rank ?? "—"}</div>
                </div>
              </Link>
            ))}

            {tab === "created" && data.created.map((t: any) => (
              <Link key={t.id} href={`/tournaments/${t.id}`} className="bg-bg-card rounded-xl border border-border-subtle p-4 hover:bg-bg-hover transition-colors flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[14px] font-semibold truncate">{t.title}</span>
                    <TournamentStatusBadge status={t.status} />
                  </div>
                  <div className="text-[12px] text-text-muted">
                    {t.participantCount} players · {t.format} · {t.entryType}
                  </div>
                </div>
                {t.prizePool > 0 && (
                  <div className="text-[14px] font-bold text-accent tabular-nums shrink-0 ml-3">
                    {t.prizePool.toFixed(2)}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
