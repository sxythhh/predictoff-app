"use client";

import Link from "next/link";
import { TournamentStatusBadge } from "./TournamentStatusBadge";
import { TournamentCountdown } from "./TournamentCountdown";

interface TournamentCardProps {
  id: string;
  title: string;
  description?: string | null;
  format: string;
  entryType: string;
  entryFee?: number | null;
  currency?: string | null;
  prizePool: number;
  scoringMethod: string;
  status: string;
  startsAt: number;
  endsAt: number;
  participantCount: number;
  maxParticipants?: number | null;
  creator: { displayName: string | null; avatar: string | null };
}

export function TournamentCard({ tournament }: { tournament: TournamentCardProps }) {
  const t = tournament;
  const now = Math.floor(Date.now() / 1000);
  const isUpcoming = now < t.startsAt;
  const isLive = now >= t.startsAt && now < t.endsAt;

  return (
    <Link
      href={`/tournaments/${t.id}`}
      className="block bg-bg-card rounded-xl border border-border-subtle p-4 hover:bg-bg-hover transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-text-primary truncate">{t.title}</h3>
          {t.description && (
            <p className="text-[12px] text-text-muted mt-0.5 line-clamp-1">{t.description}</p>
          )}
        </div>
        <TournamentStatusBadge status={t.status} />
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
          t.format === "profit" ? "bg-accent-muted text-accent" : "bg-purple-500/10 text-purple-400"
        }`}>
          {t.format === "profit" ? "Profit" : "Pick'em"}
        </span>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
          t.entryType === "free" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
        }`}>
          {t.entryType === "free" ? "Free" : `${t.entryFee} ${t.currency ?? ""}`}
        </span>
        {t.scoringMethod !== "profit" && t.format === "profit" && (
          <span className="text-[11px] text-text-muted px-2 py-0.5 rounded bg-bg-surface">
            ROI
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-3">
          <span className="text-text-muted">
            <span className="text-text-secondary font-medium">{t.participantCount}</span>
            {t.maxParticipants ? `/${t.maxParticipants}` : ""} players
          </span>
          {t.prizePool > 0 && (
            <span className="text-text-muted">
              Prize: <span className="text-accent font-semibold">{t.prizePool.toFixed(2)} {t.currency ?? ""}</span>
            </span>
          )}
        </div>
        <div className="text-[11px]">
          {isUpcoming && <TournamentCountdown endsAt={t.startsAt} label="Starts in" />}
          {isLive && <TournamentCountdown endsAt={t.endsAt} label="Ends in" />}
          {t.status === "completed" && <span className="text-text-muted">Finished</span>}
        </div>
      </div>
    </Link>
  );
}
