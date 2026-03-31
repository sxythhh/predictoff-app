"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useAuth } from "@/hooks/useAuth";
import { TournamentStatusBadge } from "@/components/waliet/tournaments/TournamentStatusBadge";
import { TournamentCountdown } from "@/components/waliet/tournaments/TournamentCountdown";
import { useToast } from "@/components/waliet/Toast";
import { PickSheet } from "@/components/waliet/tournaments/PickSheet";
import type { TournamentGame, TournamentPick } from "@/types/tournament";
import { GamePicker } from "@/components/waliet/tournaments/GamePicker";

function formatAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

type Tab = "overview" | "leaderboard" | "picks" | "games" | "manage";

function LeaderboardTab({ tournamentId, myUserId }: { tournamentId: string; myUserId?: string }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchEntries = useCallback(async (cursor?: string) => {
    const params = new URLSearchParams({ limit: "50" });
    if (cursor) params.set("cursor", cursor);
    const res = await fetch(`/api/tournaments/${tournamentId}/leaderboard?${params}`);
    const d = await res.json();
    setEntries((prev) => cursor ? [...prev, ...(d.entries ?? [])] : d.entries ?? []);
    setNextCursor(d.nextCursor);
  }, [tournamentId]);

  useEffect(() => {
    setLoading(true);
    fetchEntries().finally(() => setLoading(false));
  }, [fetchEntries]);

  if (loading) return <div className="py-8 text-center text-text-muted text-sm">Loading...</div>;
  if (entries.length === 0) return <div className="py-8 text-center text-text-muted text-sm">No entries yet</div>;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="grid grid-cols-[40px_1fr_80px_80px] gap-2 px-3 py-2 text-[11px] text-text-muted font-medium border-b border-border-subtle">
        <span>#</span>
        <span>Player</span>
        <span className="text-right">Score</span>
        <span className="text-right">Prize</span>
      </div>
      {entries.map((e: any) => {
        const isMe = e.user.id === myUserId;
        return (
          <div
            key={e.id}
            className={`grid grid-cols-[40px_1fr_80px_80px] gap-2 px-3 py-2.5 text-[13px] items-center ${
              isMe ? "bg-accent-muted" : "hover:bg-bg-hover"
            } transition-colors`}
          >
            <span className={`font-semibold tabular-nums ${e.rank <= 3 ? "text-accent" : "text-text-muted"}`}>
              {e.rank}
            </span>
            <Link href={`/user/${e.user.walletAddress}`} className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-bg-surface shrink-0 overflow-hidden">
                {e.user.avatar ? (
                  <img src={e.user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" style={{
                    background: `linear-gradient(135deg, hsl(${parseInt(e.user.walletAddress.slice(2, 6), 16) % 360}, 70%, 45%), hsl(${parseInt(e.user.walletAddress.slice(6, 10), 16) % 360}, 60%, 35%))`,
                  }} />
                )}
              </div>
              <span className={`truncate ${isMe ? "text-accent font-semibold" : "text-text-primary"}`}>
                {e.user.displayName ?? formatAddress(e.user.walletAddress)}
              </span>
            </Link>
            <span className={`text-right font-semibold tabular-nums ${e.score > 0 ? "text-green-400" : e.score < 0 ? "text-red-400" : "text-text-primary"}`}>
              {e.score > 0 ? "+" : ""}{e.score.toFixed(2)}
            </span>
            <span className="text-right tabular-nums text-text-muted">
              {e.prizeAmount ? `${e.prizeAmount.toFixed(2)}` : "—"}
            </span>
          </div>
        );
      })}
      {nextCursor && (
        <button
          onClick={async () => {
            setLoadingMore(true);
            await fetchEntries(nextCursor);
            setLoadingMore(false);
          }}
          disabled={loadingMore}
          className="h-9 mt-2 rounded-lg bg-bg-surface text-[13px] font-medium text-text-secondary hover:bg-bg-hover transition-colors disabled:opacity-50"
        >
          {loadingMore ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}

function GamesTab({ tournamentId }: { tournamentId: string }) {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tournaments/${tournamentId}/games`)
      .then((r) => r.json())
      .then((d) => setGames(d.games ?? []))
      .finally(() => setLoading(false));
  }, [tournamentId]);

  if (loading) return <div className="py-8 text-center text-text-muted text-sm">Loading...</div>;
  if (games.length === 0) return <div className="py-8 text-center text-text-muted text-sm">No curated games</div>;

  return (
    <div className="flex flex-col gap-2 p-3">
      {games.map((g: any) => {
        const started = Math.floor(Date.now() / 1000) >= g.startsAt;
        return (
          <div key={g.id} className="bg-bg-input rounded-lg p-3 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-text-primary truncate">{g.gameTitle ?? g.gameId}</div>
              <div className="text-[11px] text-text-muted">
                {g.sportName && `${g.sportName} · `}
                {g.leagueName && `${g.leagueName} · `}
                {new Date(g.startsAt * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
              g.resolved ? "text-text-secondary bg-bg-surface" : started ? "text-green-400 bg-green-500/10" : "text-text-muted bg-bg-surface"
            }`}>
              {g.resolved ? "Resolved" : started ? "Live" : "Upcoming"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ManageGamesTab({ tournamentId }: { tournamentId: string }) {
  const [games, setGames] = useState<TournamentGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tournaments/${tournamentId}/games`)
      .then((r) => r.json())
      .then((d) => setGames(d.games ?? []))
      .finally(() => setLoading(false));
  }, [tournamentId]);

  if (loading) return <div className="py-8 text-center text-text-muted text-sm">Loading...</div>;

  return (
    <div>
      <h3 className="text-[14px] font-semibold text-text-primary mb-3">Manage Games</h3>
      <p className="text-[12px] text-text-muted mb-4">Add or remove games from this tournament. Changes can only be made before the tournament starts.</p>
      <GamePicker
        tournamentId={tournamentId}
        existingGames={games}
        onGamesChange={setGames}
      />
    </div>
  );
}

function PicksTab({ tournamentId, myEntry }: { tournamentId: string; myEntry: any }) {
  const [games, setGames] = useState<TournamentGame[]>([]);
  const [picks, setPicks] = useState<TournamentPick[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/tournaments/${tournamentId}/games`).then((r) => r.json()),
      fetch(`/api/tournaments/${tournamentId}/picks`).then((r) => r.json()),
    ]).then(([gData, pData]) => {
      setGames(gData.games ?? []);
      setPicks(pData.picks ?? []);
    }).finally(() => setLoading(false));
  }, [tournamentId]);

  if (loading) return <div className="py-8 text-center text-text-muted text-sm">Loading picks...</div>;
  if (games.length === 0) return <div className="py-8 text-center text-text-muted text-sm">No games in this tournament</div>;

  return <PickSheet tournamentId={tournamentId} games={games} existingPicks={picks} />;
}

export default function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { address } = useAccount();
  const { toast } = useToast();
  const [tournament, setTournament] = useState<any>(null);
  const [myEntry, setMyEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    Promise.all([
      fetch(`/api/tournaments/${id}`).then((r) => r.json()),
      user ? fetch(`/api/tournaments/${id}/entries/me`).then((r) => r.json()) : Promise.resolve({ entry: null }),
    ]).then(([t, e]) => {
      setTournament(t.error ? null : t);
      setMyEntry(e.entry);
    }).finally(() => setLoading(false));
  }, [id, user]);

  const handleJoin = async () => {
    setJoining(true);

    // Paid tournaments: create Whop checkout
    if (tournament?.entryType === "paid") {
      try {
        const res = await fetch("/api/whop/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tournamentId: id }),
        });
        const data = await res.json();
        if (res.ok && data.checkoutUrl) {
          // Redirect to Whop checkout — webhook will handle entry creation
          window.open(data.checkoutUrl, "_blank");
          toast("Complete payment in the new tab", "info");
          setJoining(false);
          return;
        }
        toast(data.error ?? "Failed to create checkout", "error");
        setJoining(false);
        return;
      } catch {
        toast("Payment error", "error");
        setJoining(false);
        return;
      }
    }

    // Free tournaments: join directly
    const res = await fetch(`/api/tournaments/${id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (res.ok) {
      toast("Joined tournament!", "success");
      setMyEntry({ id: data.entryId, score: 0, rank: null });
      setTournament((prev: any) => prev ? { ...prev, participantCount: prev.participantCount + 1 } : prev);
    } else {
      toast(data.error ?? "Failed to join", "error");
    }
    setJoining(false);
  };

  const handleLeave = async () => {
    const res = await fetch(`/api/tournaments/${id}/leave`, { method: "DELETE" });
    if (res.ok) {
      toast("Left tournament", "info");
      setMyEntry(null);
      setTournament((prev: any) => prev ? { ...prev, participantCount: Math.max(0, prev.participantCount - 1) } : prev);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-page">
        <header className="h-14 flex items-center px-3 lg:px-6 border-b border-border-primary">
          <Link href="/tournaments" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text-[14px] font-medium">Back</span>
          </Link>
        </header>
        <div className="max-w-[800px] mx-auto p-6">
          <div className="h-8 w-48 bg-bg-surface rounded animate-pulse mb-4" />
          <div className="h-24 bg-bg-card rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-bg-page">
        <header className="h-14 flex items-center px-3 lg:px-6 border-b border-border-primary">
          <Link href="/tournaments" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text-[14px] font-medium">Back</span>
          </Link>
        </header>
        <div className="max-w-[800px] mx-auto p-6 text-center py-16">
          <p className="text-text-secondary">Tournament not found</p>
        </div>
      </div>
    );
  }

  const t = tournament;
  const now = Math.floor(Date.now() / 1000);
  const canJoin = ["open", "active"].includes(t.status) && now >= t.registrationStart && now <= t.registrationEnd && !myEntry;
  const canLeave = t.status === "open" && myEntry;
  const isCreator = user?.id === t.creator?.id;

  return (
    <div className="min-h-screen bg-bg-page text-text-primary" style={{ letterSpacing: "-0.02em" }}>
      <header className="h-14 flex items-center justify-between px-3 lg:px-6 border-b border-border-primary">
        <Link href="/tournaments" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span className="text-[14px] font-medium">Tournaments</span>
        </Link>
        {isCreator && ["active", "scoring"].includes(t.status) && (
          <button
            onClick={async () => {
              const res = await fetch(`/api/tournaments/${id}/score`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ complete: false }),
              });
              if (res.ok) toast("Scoring triggered", "success");
            }}
            className="h-8 px-3 rounded-lg bg-yellow-500/15 text-yellow-400 text-[12px] font-semibold hover:bg-yellow-500/25 transition-colors"
          >
            Run Scoring
          </button>
        )}
      </header>

      <div className="max-w-[800px] mx-auto p-4 lg:p-6">
        {/* Title + status */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-[22px] font-semibold">{t.title}</h1>
            {t.description && <p className="text-[13px] text-text-muted mt-1">{t.description}</p>}
          </div>
          <TournamentStatusBadge status={t.status} />
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-bg-card rounded-xl border border-border-subtle p-3 text-center">
            <div className="text-[16px] font-bold">{t.participantCount}{t.maxParticipants ? `/${t.maxParticipants}` : ""}</div>
            <div className="text-[11px] text-text-muted">Players</div>
          </div>
          <div className="bg-bg-card rounded-xl border border-border-subtle p-3 text-center">
            <div className="text-[16px] font-bold text-accent">{t.prizePool > 0 ? t.prizePool.toFixed(2) : "—"}</div>
            <div className="text-[11px] text-text-muted">Prize Pool</div>
          </div>
          <div className="bg-bg-card rounded-xl border border-border-subtle p-3 text-center">
            <div className="text-[16px] font-bold capitalize">{t.format}</div>
            <div className="text-[11px] text-text-muted">Format</div>
          </div>
          <div className="bg-bg-card rounded-xl border border-border-subtle p-3 text-center">
            <div className="text-[14px] font-bold">
              {t.entryType === "free" ? "Free" : `${t.entryFee} ${t.currency ?? ""}`}
            </div>
            <div className="text-[11px] text-text-muted">Entry</div>
          </div>
        </div>

        {/* Share / Invite */}
        {isCreator && t.visibility === "private" && t.inviteCode && (
          <div className="bg-bg-card rounded-xl border border-border-subtle p-3 mb-4 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-[12px] text-text-muted mb-0.5">Invite Link</div>
              <div className="text-[13px] text-text-primary font-mono truncate">
                {typeof window !== "undefined" ? `${window.location.origin}/tournaments/invite/${t.inviteCode}` : ""}
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/tournaments/invite/${t.inviteCode}`);
                toast("Invite link copied!", "success");
              }}
              className="shrink-0 h-8 px-3 rounded-lg bg-accent-muted text-accent text-[12px] font-semibold hover:bg-accent/20 transition-colors ml-3"
            >
              Copy
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => {
              const url = `${window.location.origin}/tournaments/${id}`;
              const text = `Join "${t.title}" tournament on Waliet — ${t.format === "profit" ? "Profit" : "Pick'em"}, ${t.entryType === "free" ? "Free entry" : `${t.entryFee} ${t.currency} entry`}`;
              if (navigator.share) {
                navigator.share({ title: t.title, text, url }).catch(() => {});
              } else {
                navigator.clipboard.writeText(`${text}\n${url}`);
                toast("Link copied!", "success");
              }
            }}
            className="h-8 px-3 rounded-lg bg-bg-surface text-[12px] font-medium text-text-secondary hover:bg-bg-hover transition-colors flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <circle cx="3" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="11" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="11" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M4.5 6.2L9.5 3.8M4.5 7.8L9.5 10.2" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
            Share
          </button>
        </div>

        {/* Countdown */}
        {["open", "active"].includes(t.status) && (
          <div className="bg-bg-card rounded-xl border border-border-subtle p-3 mb-4 text-center text-[13px]">
            {now < t.startsAt ? (
              <TournamentCountdown endsAt={t.startsAt} label="Starts in" />
            ) : (
              <TournamentCountdown endsAt={t.endsAt} label="Ends in" />
            )}
          </div>
        )}

        {/* Join / Leave button */}
        <div className="flex items-center gap-3 mb-6">
          {canJoin && (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="h-10 px-6 rounded-lg bg-accent text-btn-primary-text text-[14px] font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {joining ? "Joining..." : t.entryType === "free" ? "Join Tournament" : `Join (${t.entryFee} ${t.currency ?? ""})`}
            </button>
          )}
          {canLeave && (
            <button
              onClick={handleLeave}
              className="h-10 px-6 rounded-lg bg-red-500/15 text-red-400 text-[14px] font-semibold hover:bg-red-500/25 transition-colors"
            >
              Leave
            </button>
          )}
          {myEntry && (
            <div className="text-[13px] text-text-muted">
              Rank: <span className="text-text-primary font-semibold">{myEntry.rank ?? "—"}</span>
              {" · "}
              Score: <span className={`font-semibold ${myEntry.score > 0 ? "text-green-400" : myEntry.score < 0 ? "text-red-400" : "text-text-primary"}`}>
                {myEntry.score > 0 ? "+" : ""}{myEntry.score.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border-subtle mb-4">
          {(["overview", "leaderboard", ...(t.scope === "curated" ? ["games"] : []), ...(myEntry && t.format === "pickem" ? ["picks"] : []), ...(isCreator && ["draft", "open"].includes(t.status) ? ["manage"] : [])] as Tab[]).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`h-10 px-4 text-[13px] font-medium border-b-2 transition-colors capitalize ${
                tab === key ? "border-accent text-accent" : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "overview" && (
          <div className="flex flex-col gap-4">
            <div className="bg-bg-card rounded-xl border border-border-subtle p-4">
              <h3 className="text-[14px] font-semibold mb-2">Rules</h3>
              <div className="text-[13px] text-text-secondary space-y-1">
                <p>Format: <span className="font-medium text-text-primary capitalize">{t.format}</span> — {t.format === "profit" ? "Ranked by profit from real bets" : "Predict outcomes of selected games"}</p>
                <p>Scoring: <span className="font-medium text-text-primary capitalize">{t.scoringMethod}</span></p>
                <p>Scope: <span className="font-medium text-text-primary">{t.scope === "curated" ? `${t.gameCount} selected games` : "Any Azuro market"}</span></p>
                <p>Registration: {new Date(t.registrationStart * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} — {new Date(t.registrationEnd * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                <p>Active: {new Date(t.startsAt * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} — {new Date(t.endsAt * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
            {t.prizeStructure && (
              <div className="bg-bg-card rounded-xl border border-border-subtle p-4">
                <h3 className="text-[14px] font-semibold mb-2">Prize Distribution</h3>
                <div className="flex flex-col gap-1">
                  {Object.entries(t.prizeStructure as Record<string, number>).map(([rank, pct]) => (
                    <div key={rank} className="flex items-center justify-between text-[13px]">
                      <span className="text-text-secondary">#{rank}</span>
                      <span className="font-semibold text-accent">{pct}% — {((t.prizePool * pct) / 100).toFixed(2)} {t.currency ?? ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-bg-card rounded-xl border border-border-subtle p-4">
              <h3 className="text-[14px] font-semibold mb-2">Created by</h3>
              <Link href={`/user/${t.creator.walletAddress}`} className="flex items-center gap-2 text-[13px] text-text-secondary hover:text-text-primary">
                {t.creator.avatar ? (
                  <img src={t.creator.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-bg-surface" />
                )}
                {t.creator.displayName ?? formatAddress(t.creator.walletAddress)}
              </Link>
            </div>
          </div>
        )}

        {tab === "leaderboard" && (
          <LeaderboardTab tournamentId={id} myUserId={user?.id} />
        )}

        {tab === "games" && (
          <GamesTab tournamentId={id} />
        )}

        {tab === "picks" && myEntry && (
          <PicksTab tournamentId={id} myEntry={myEntry} />
        )}

        {tab === "manage" && isCreator && (
          <ManageGamesTab tournamentId={id} />
        )}
      </div>
    </div>
  );
}
