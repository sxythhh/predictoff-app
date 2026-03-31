"use client";

import { useState } from "react";
import Link from "next/link";
import { useBaseBetslip } from "@azuro-org/sdk";
import { useOddsFormat } from "../OddsFormatContext";
import { useToast } from "../Toast";
import { TeamLogo } from "../TeamLogo";
import { setBetslipMeta } from "../betslip-meta";

interface PickCardProps {
  pick: {
    id: string;
    gameId: string;
    gameTitle: string;
    sportSlug?: string | null;
    leagueName?: string | null;
    conditionId?: string;
    outcomeId?: string;
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
    tipster: { id: string; displayName: string | null; avatar: string | null; walletAddress: string; subscriptionPrice?: number | null };
    hasAccess: boolean;
    likeCount?: number;
    commentCount?: number;
    tailCount?: number;
  };
  showTipster?: boolean;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function PickCard({ pick, showTipster = true }: PickCardProps) {
  const { formatOdds } = useOddsFormat();
  const { toast } = useToast();
  const { addItem } = useBaseBetslip();
  const [subscribing, setSubscribing] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(pick.likeCount ?? 0);
  const [tailCount, setTailCount] = useState(pick.tailCount ?? 0);
  const [tailed, setTailed] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const isPremiumLocked = pick.visibility === "premium" && !pick.hasAccess;
  const now = Math.floor(Date.now() / 1000);
  const isUpcoming = now < pick.startsAt;
  const isLive = !isUpcoming && !pick.isResolved;

  // Parse team names from game title
  const teams = pick.gameTitle.split(" vs ");
  const team1 = teams[0]?.trim();
  const team2 = teams[1]?.trim();

  // Status styling
  const statusConfig = pick.isResolved
    ? pick.isCorrect
      ? { border: "border-l-green-500", label: "Hit", labelClass: "text-green-400 bg-green-500/10", icon: "✓" }
      : { border: "border-l-red-500", label: "Miss", labelClass: "text-red-400 bg-red-500/10", icon: "✗" }
    : isLive
      ? { border: "border-l-green-400", label: "Live", labelClass: "text-green-400 bg-green-500/10", icon: "" }
      : { border: "border-l-transparent", label: "Pending", labelClass: "text-yellow-400 bg-yellow-500/10", icon: "" };

  const handleLike = async () => {
    const res = await fetch(`/api/picks/${pick.id}/like`, { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setLiked(d.liked);
      setLikeCount(d.count);
    }
  };

  const handleTail = async () => {
    if (!pick.conditionId || !pick.outcomeId || !pick.selectionName) return;
    const res = await fetch(`/api/picks/${pick.id}/tail`, { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setTailed(true);
      setTailCount(d.count);
      // Add to betslip
      if (d.pick) {
        const item = { conditionId: d.pick.conditionId, outcomeId: d.pick.outcomeId, gameId: pick.gameId, isExpressForbidden: false };
        setBetslipMeta(d.pick.conditionId, d.pick.outcomeId, {
          gameTitle: d.pick.gameTitle, marketName: d.pick.marketName, selectionName: d.pick.selectionName,
        });
        addItem(item);
        toast("Added to betslip", "success");
      }
    }
  };

  return (
    <div className={`bg-bg-card rounded-xl border border-border-subtle border-l-4 ${statusConfig.border} overflow-hidden`}>
      {/* Tipster header */}
      {showTipster && (
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <Link href={`/tipster/${pick.tipster.id}`} className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-bg-surface overflow-hidden shrink-0">
              {pick.tipster.avatar ? (
                <img src={pick.tipster.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" style={{
                  background: `linear-gradient(135deg, hsl(${parseInt(pick.tipster.walletAddress.slice(2, 6), 16) % 360}, 70%, 45%), hsl(${parseInt(pick.tipster.walletAddress.slice(6, 10), 16) % 360}, 60%, 35%))`,
                }} />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[13px] font-semibold text-text-primary truncate block">
                {pick.tipster.displayName ?? `${pick.tipster.walletAddress.slice(0, 6)}...`}
              </span>
              <span className="text-[11px] text-text-muted">{timeAgo(pick.createdAt)}</span>
            </div>
          </Link>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${statusConfig.labelClass}`}>
            {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse mr-1" />}
            {statusConfig.label}
          </span>
        </div>
      )}

      {/* Match section with team logos */}
      <div className="px-4 py-3 bg-bg-surface/30">
        <div className="text-[11px] text-text-muted mb-2">
          {pick.sportSlug && <span className="capitalize">{pick.sportSlug} · </span>}
          {pick.leagueName}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-full bg-bg-surface overflow-hidden shrink-0">
              <TeamLogo src={null} name={team1 ?? "?"} className="w-7 h-7 object-cover" />
            </div>
            <span className="text-[13px] font-medium text-text-primary truncate">{team1 ?? "TBD"}</span>
          </div>
          <span className="text-[11px] text-text-muted font-medium shrink-0">vs</span>
          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <span className="text-[13px] font-medium text-text-primary truncate text-right">{team2 ?? "TBD"}</span>
            <div className="w-7 h-7 rounded-full bg-bg-surface overflow-hidden shrink-0">
              <TeamLogo src={null} name={team2 ?? "?"} className="w-7 h-7 object-cover" />
            </div>
          </div>
        </div>
        <div className="text-[11px] text-text-muted mt-2">
          {isUpcoming
            ? new Date(pick.startsAt * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
            : isLive ? "In progress" : "Settled"
          }
        </div>
      </div>

      {/* Pick content */}
      <div className="px-4 py-3">
        {isPremiumLocked ? (
          <div className="relative">
            <div className="blur-sm select-none">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[15px] font-semibold text-text-primary">Premium Pick</span>
                <span className="text-[14px] font-bold text-accent">?.??</span>
              </div>
              <p className="text-[12px] text-text-secondary">Analysis available to subscribers...</p>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <button
                disabled={subscribing}
                onClick={async () => {
                  setSubscribing(true);
                  const res = await fetch(`/api/tipster/${pick.tipster.id}/subscribe`, { method: "POST", headers: { "Content-Type": "application/json" } });
                  const data = await res.json();
                  if (data.checkoutUrl) { window.open(data.checkoutUrl, "_blank"); toast("Complete payment", "info"); }
                  else toast(data.error ?? "Unavailable", "error");
                  setSubscribing(false);
                }}
                className="h-8 px-4 rounded-lg bg-accent text-btn-primary-text text-[12px] font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {subscribing ? "..." : `Unlock · $${pick.tipster.subscriptionPrice ?? "?"}/mo`}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Pick + odds */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[14px] font-semibold text-text-primary truncate">{pick.selectionName}</span>
                {pick.confidence && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                    pick.confidence === "high" ? "bg-green-500/15 text-green-400" :
                    pick.confidence === "medium" ? "bg-yellow-500/15 text-yellow-400" :
                    "bg-red-500/15 text-red-400"
                  }`}>
                    {pick.confidence}
                  </span>
                )}
              </div>
              <span className="text-[15px] font-bold text-accent tabular-nums shrink-0 ml-2">{pick.odds ? formatOdds(pick.odds) : "—"}</span>
            </div>

            <div className="text-[11px] text-text-muted mb-2">{pick.marketName}</div>

            {/* Analysis */}
            {pick.analysis && (
              <p className="text-[12px] text-text-secondary leading-relaxed mb-2 line-clamp-3">{pick.analysis}</p>
            )}
          </>
        )}
      </div>

      {/* Engagement bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border-subtle">
        <div className="flex items-center gap-4">
          {/* Like */}
          <button onClick={handleLike} className={`flex items-center gap-1 text-[12px] transition-colors ${liked ? "text-red-400" : "text-text-muted hover:text-text-secondary"}`}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.3">
              <path d="M8 14S1 9.5 1 5.5C1 3.5 2.5 2 4.5 2C5.96 2 7.26 2.93 8 3.92C8.74 2.93 10.04 2 11.5 2C13.5 2 15 3.5 15 5.5C15 9.5 8 14 8 14Z"/>
            </svg>
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>

          {/* Comments */}
          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1 text-[12px] text-text-muted hover:text-text-secondary transition-colors">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M2 4C2 3.45 2.45 3 3 3H13C13.55 3 14 3.45 14 4V10C14 10.55 13.55 11 13 11H5L2 14V4Z"/>
            </svg>
            {(pick.commentCount ?? 0) > 0 && <span>{pick.commentCount}</span>}
          </button>

          {/* Tail count */}
          {tailCount > 0 && (
            <span className="text-[12px] text-text-muted flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d="M8 2C4.69 2 2 4.69 2 8s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm3 7H9v2H7V9H5V7h2V5h2v2h2v2z"/>
              </svg>
              {tailCount} tailed
            </span>
          )}
        </div>

        {/* Tail / Copy to betslip */}
        {!isPremiumLocked && pick.hasAccess && isUpcoming && !tailed && pick.conditionId && (
          <button
            onClick={handleTail}
            className="h-7 px-3 rounded-md bg-accent/10 text-accent text-[12px] font-semibold hover:bg-accent/20 transition-colors flex items-center gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 2V14M2 8H14" strokeLinecap="round"/>
            </svg>
            Tail
          </button>
        )}
        {tailed && (
          <span className="text-[12px] text-green-400 font-semibold flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 8L7 11L12 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Tailed
          </span>
        )}
      </div>

      {/* Comments section (expandable) */}
      {showComments && (
        <PickComments pickId={pick.id} />
      )}
    </div>
  );
}

function PickComments({ pickId }: { pickId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);

  useState(() => {
    fetch(`/api/picks/${pickId}/comments?limit=5`)
      .then((r) => r.ok ? r.json() : { comments: [] })
      .then((d) => setComments(d.comments ?? []))
      .finally(() => setLoading(false));
  });

  const postComment = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/picks/${pickId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment.trim() }),
    });
    if (res.ok) {
      const c = await res.json();
      setComments((prev) => [c, ...prev]);
      setNewComment("");
    }
    setPosting(false);
  };

  return (
    <div className="px-4 py-3 border-t border-border-subtle bg-bg-surface/20">
      {/* Comment input */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          maxLength={500}
          onKeyDown={(e) => e.key === "Enter" && postComment()}
          className="flex-1 h-8 px-3 rounded-lg bg-bg-input border border-border-input text-[12px] text-text-primary outline-none focus:border-accent transition-colors"
        />
        <button
          onClick={postComment}
          disabled={posting || !newComment.trim()}
          className="h-8 px-3 rounded-lg bg-accent text-btn-primary-text text-[12px] font-semibold disabled:opacity-50"
        >
          Post
        </button>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="text-[11px] text-text-muted">Loading...</div>
      ) : comments.length === 0 ? (
        <div className="text-[11px] text-text-muted">No comments yet</div>
      ) : (
        <div className="flex flex-col gap-2">
          {comments.map((c: any) => (
            <div key={c.id} className="flex gap-2">
              <div className="w-5 h-5 rounded-full bg-bg-surface overflow-hidden shrink-0 mt-0.5">
                {c.user.avatar ? (
                  <img src={c.user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" style={{
                    background: `linear-gradient(135deg, hsl(${parseInt(c.user.walletAddress.slice(2, 6), 16) % 360}, 70%, 45%), hsl(${parseInt(c.user.walletAddress.slice(6, 10), 16) % 360}, 60%, 35%))`,
                  }} />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-text-primary">{c.user.displayName ?? `${c.user.walletAddress.slice(0, 6)}...`}</span>
                <span className="text-[10px] text-text-muted ml-1.5">{timeAgo(c.createdAt)}</span>
                <p className="text-[12px] text-text-secondary mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
