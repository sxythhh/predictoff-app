"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { TeamLogo } from "@/components/waliet/TeamLogo";
import { useOpenGame } from "@/components/waliet/GameModal";

type Tab = "upcoming" | "results" | "stats";

function formatAddress(addr: string) { return `${addr.slice(0, 6)}...${addr.slice(-4)}`; }

function FormBadge({ result }: { result: string }) {
  const config = result === "W" ? "bg-green-500 text-white" : result === "D" ? "bg-yellow-500 text-white" : "bg-red-500 text-white";
  return <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${config}`}>{result}</span>;
}

function GameRow({ game, teamId, onClick }: { game: any; teamId: string; onClick: () => void }) {
  const isHome = game.homeTeam.id === teamId;
  const opponent = isHome ? game.awayTeam : game.homeTeam;
  const date = new Date(game.startsAt * 1000);
  const isResult = !!game.winnerId || game.winnerId === null;

  let resultText = "";
  let resultColor = "text-text-muted";
  if (isResult) {
    if (game.winnerId === teamId) { resultText = "W"; resultColor = "text-green-400"; }
    else if (game.winnerId === null) { resultText = "D"; resultColor = "text-yellow-400"; }
    else { resultText = "L"; resultColor = "text-red-400"; }
  }

  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-bg-hover transition-colors text-left">
      <div className="w-8 h-8 rounded-full bg-bg-surface overflow-hidden flex items-center justify-center shrink-0">
        <TeamLogo src={opponent.image} name={opponent.name} className="w-8 h-8 object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-text-primary truncate">
          {isHome ? "vs" : "@"} {opponent.name}
        </div>
        <div className="text-[11px] text-text-muted">
          {game.league?.countryName && `${game.league.countryName} · `}
          {game.league?.name} · {date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
      {isResult ? (
        <span className={`text-[14px] font-bold ${resultColor}`}>{resultText}</span>
      ) : (
        <span className="text-[11px] text-text-muted">
          {game.state === "live" ? <span className="text-green-400">Live</span> : date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
        </span>
      )}
    </button>
  );
}

export default function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const openGame = useOpenGame();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [team, setTeam] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/teams/${slug}?tab=${tab}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setTeam(data.team);
          setGames(data.games ?? []);
          setStats(data.stats ?? null);
        }
      })
      .finally(() => setLoading(false));
  }, [slug, tab]);

  if (loading && !team) {
    return (
      <div className="min-h-screen bg-bg-page">
        <header className="h-14 flex items-center px-3 lg:px-6 border-b border-border-primary">
          <Link href="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text-[14px] font-medium">Back</span>
          </Link>
        </header>
        <div className="max-w-[700px] mx-auto p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-bg-surface animate-pulse" />
            <div className="h-6 w-40 bg-bg-surface rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-bg-page">
        <header className="h-14 flex items-center px-3 lg:px-6 border-b border-border-primary">
          <Link href="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text-[14px] font-medium">Back</span>
          </Link>
        </header>
        <div className="max-w-[700px] mx-auto p-6 text-center py-16">
          <p className="text-text-secondary">Team not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page text-text-primary" style={{ letterSpacing: "-0.02em" }}>
      <header className="h-14 flex items-center px-3 lg:px-6 border-b border-border-primary">
        <Link href="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span className="text-[14px] font-medium">Back</span>
        </Link>
      </header>

      <div className="max-w-[700px] mx-auto p-4 lg:p-6">
        {/* Team header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-bg-surface overflow-hidden flex items-center justify-center shrink-0">
            <TeamLogo src={team.image} name={team.name} className="w-16 h-16 object-cover" />
          </div>
          <div>
            <h1 className="text-[22px] font-semibold">{team.name}</h1>
            <span className="text-[13px] text-text-muted">{team.sport?.name}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border-subtle mb-4">
          {(["upcoming", "results", "stats"] as Tab[]).map((key) => (
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

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-bg-surface animate-pulse" />)}
          </div>
        ) : tab === "stats" && stats ? (
          <div className="flex flex-col gap-4">
            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-bg-card rounded-xl border border-border-subtle p-4 text-center">
                <div className="text-[18px] font-bold">{stats.played}</div>
                <div className="text-[12px] text-text-muted">Played</div>
              </div>
              <div className="bg-bg-card rounded-xl border border-border-subtle p-4 text-center">
                <div className="text-[18px] font-bold text-green-400">{stats.wins}</div>
                <div className="text-[12px] text-text-muted">Wins</div>
              </div>
              <div className="bg-bg-card rounded-xl border border-border-subtle p-4 text-center">
                <div className="text-[18px] font-bold text-yellow-400">{stats.draws}</div>
                <div className="text-[12px] text-text-muted">Draws</div>
              </div>
              <div className="bg-bg-card rounded-xl border border-border-subtle p-4 text-center">
                <div className="text-[18px] font-bold text-red-400">{stats.losses}</div>
                <div className="text-[12px] text-text-muted">Losses</div>
              </div>
            </div>

            {/* Form */}
            {stats.form.length > 0 && (
              <div className="bg-bg-card rounded-xl border border-border-subtle p-4">
                <div className="text-[13px] font-semibold text-text-primary mb-3">Recent Form</div>
                <div className="flex items-center gap-2">
                  {stats.form.map((r: string, i: number) => <FormBadge key={i} result={r} />)}
                </div>
              </div>
            )}

            {/* Home/Away split */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg-card rounded-xl border border-border-subtle p-4">
                <div className="text-[12px] text-text-muted mb-1">Home</div>
                <div className="text-[15px] font-semibold">{stats.homeRecord.wins}W / {stats.homeRecord.played}P</div>
              </div>
              <div className="bg-bg-card rounded-xl border border-border-subtle p-4">
                <div className="text-[12px] text-text-muted mb-1">Away</div>
                <div className="text-[15px] font-semibold">{stats.awayRecord.wins}W / {stats.awayRecord.played}P</div>
              </div>
            </div>
          </div>
        ) : games.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-[13px]">
            {tab === "upcoming" ? "No upcoming games" : "No results yet"}
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {games.map((game: any) => (
              <GameRow
                key={game.id}
                game={game}
                teamId={team.id}
                onClick={() => openGame(game.azuroGameId, games.map((g: any) => g.azuroGameId).filter(Boolean))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
