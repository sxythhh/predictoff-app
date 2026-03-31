"use client";

import Link from "next/link";
import { useOddsFormat } from "../OddsFormatContext";

interface PickCardProps {
  pick: {
    id: string;
    gameTitle: string;
    sportSlug?: string | null;
    leagueName?: string | null;
    marketName: string;
    selectionName: string | null;
    odds: number | null;
    confidence?: string | null;
    analysis?: string | null;
    startsAt: number;
    visibility: string;
    isResolved: boolean;
    isCorrect?: boolean | null;
    createdAt: string;
    tipster: { id: string; displayName: string | null; avatar: string | null; walletAddress: string };
    hasAccess: boolean;
  };
  showTipster?: boolean;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function PickCard({ pick, showTipster = true }: PickCardProps) {
  const { formatOdds } = useOddsFormat();
  const isPremiumLocked = pick.visibility === "premium" && !pick.hasAccess;
  const now = Math.floor(Date.now() / 1000);
  const isUpcoming = now < pick.startsAt;

  return (
    <div className="bg-bg-card rounded-xl border border-border-subtle p-4">
      {/* Header: tipster + time */}
      {showTipster && (
        <div className="flex items-center justify-between mb-3">
          <Link href={`/tipster/${pick.tipster.id}`} className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-bg-surface overflow-hidden shrink-0">
              {pick.tipster.avatar ? (
                <img src={pick.tipster.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" style={{
                  background: `linear-gradient(135deg, hsl(${parseInt(pick.tipster.walletAddress.slice(2, 6), 16) % 360}, 70%, 45%), hsl(${parseInt(pick.tipster.walletAddress.slice(6, 10), 16) % 360}, 60%, 35%))`,
                }} />
              )}
            </div>
            <span className="text-[13px] font-medium text-text-primary truncate">
              {pick.tipster.displayName ?? `${pick.tipster.walletAddress.slice(0, 6)}...`}
            </span>
          </Link>
          <span className="text-[11px] text-text-muted shrink-0">{timeAgo(pick.createdAt)}</span>
        </div>
      )}

      {/* Game info */}
      <div className="text-[12px] text-text-muted mb-2">
        {pick.leagueName && <span>{pick.leagueName} · </span>}
        {pick.gameTitle}
      </div>

      {/* Pick content */}
      {isPremiumLocked ? (
        <div className="relative">
          <div className="blur-sm select-none">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[15px] font-semibold text-text-primary">Premium Pick</span>
              <span className="text-[14px] font-bold text-accent">?.??</span>
            </div>
            <p className="text-[13px] text-text-secondary">This analysis is only available to subscribers...</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-bg-card/60 rounded-lg">
            <Link
              href={`/tipster/${pick.tipster.id}`}
              className="h-9 px-4 rounded-lg bg-accent text-btn-primary-text text-[13px] font-semibold hover:bg-accent-hover transition-colors"
            >
              Subscribe to unlock
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-text-primary">{pick.selectionName}</span>
              {pick.confidence && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase ${
                  pick.confidence === "high" ? "bg-green-500/10 text-green-400" :
                  pick.confidence === "medium" ? "bg-yellow-500/10 text-yellow-400" :
                  "bg-red-500/10 text-red-400"
                }`}>
                  {pick.confidence}
                </span>
              )}
            </div>
            <span className="text-[14px] font-bold text-accent tabular-nums">{pick.odds ? formatOdds(pick.odds) : "—"}</span>
          </div>

          {pick.analysis && (
            <p className="text-[13px] text-text-secondary mb-2 leading-relaxed">{pick.analysis}</p>
          )}

          <div className="text-[12px] text-text-muted">{pick.marketName}</div>
        </>
      )}

      {/* Footer: status */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-subtle">
        <span className="text-[11px] text-text-muted">
          {isUpcoming
            ? `Starts ${new Date(pick.startsAt * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
            : pick.isResolved
              ? "Settled"
              : "In play"
          }
        </span>
        <div className="flex items-center gap-2">
          {pick.visibility === "premium" && pick.hasAccess && (
            <span className="text-[10px] font-semibold text-accent bg-accent-muted px-1.5 py-0.5 rounded">Premium</span>
          )}
          {pick.isResolved && (
            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
              pick.isCorrect ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"
            }`}>
              {pick.isCorrect ? "Hit" : "Miss"}
            </span>
          )}
          {!pick.isResolved && isUpcoming && (
            <span className="text-[11px] font-semibold text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded">Pending</span>
          )}
        </div>
      </div>
    </div>
  );
}
