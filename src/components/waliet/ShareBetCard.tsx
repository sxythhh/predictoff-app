"use client";

import { useState, useRef, useCallback } from "react";
import type { Bet } from "@azuro-org/sdk";
import { useToast } from "./Toast";
import { useOddsFormat } from "./OddsFormatContext";

interface ShareBetCardProps {
  bet: Bet;
  tokenSymbol: string;
  onClose: () => void;
}

function BetCardPreview({ bet, tokenSymbol }: { bet: Bet; tokenSymbol: string }) {
  const { formatOdds } = useOddsFormat();
  const outcomes = bet.outcomes || [];
  const isCombo = outcomes.length > 1;
  const stake = Number(bet.amount);
  const statusText = bet.isWin ? "WON" : bet.isLose ? "LOST" : bet.isCashedOut ? "CASHED OUT" : "PENDING";
  const statusColor = bet.isWin ? "#22c55e" : bet.isLose ? "#ef4444" : bet.isCashedOut ? "#eab308" : "#a3a3a3";

  return (
    <div
      className="w-[340px] rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #111111 0%, #1a1a2e 50%, #111111 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="1" width="10" height="12" rx="2" stroke="#33c771" strokeWidth="1.2"/>
              <path d="M5 5H9M5 7H9M5 9H8" stroke="#33c771" strokeWidth="1" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-[14px] font-bold text-white tracking-tight">Waliet</span>
        </div>
        <div
          className="px-2 py-0.5 rounded text-[11px] font-bold"
          style={{ color: statusColor, backgroundColor: `${statusColor}15` }}
        >
          {statusText}
        </div>
      </div>

      {/* Type badge */}
      <div className="px-5 pb-3">
        <span className="text-[11px] text-white/40 uppercase tracking-wider font-medium">
          {isCombo ? `Combo · ${outcomes.length} Legs` : "Single Bet"}
        </span>
      </div>

      {/* Selections */}
      <div className="px-5 flex flex-col gap-2">
        {outcomes.map((outcome, i) => {
          const legWon = outcome.isWin === true;
          const legLost = outcome.isLose === true;
          return (
            <div
              key={i}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              {isCombo && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{
                    background: legWon ? "rgba(34,197,94,0.15)" : legLost ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.08)",
                    color: legWon ? "#22c55e" : legLost ? "#ef4444" : "#666",
                  }}
                >
                  {legWon ? "\u2713" : legLost ? "\u2717" : i + 1}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-white/40 truncate">
                  {outcome.game?.title ?? "Game"}
                </div>
                <div className="text-[12px] font-semibold text-white truncate">
                  {outcome.selectionName}
                </div>
              </div>
              <span className="text-[12px] font-bold text-[#33c771] tabular-nums shrink-0">
                {formatOdds(outcome.odds)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="mx-5 my-3 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

      {/* Stake + Payout */}
      <div className="px-5 pb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Stake</div>
          <div className="text-[14px] font-bold text-white tabular-nums">
            {stake.toFixed(2)} {tokenSymbol}
          </div>
        </div>
        {isCombo && (
          <div className="text-center">
            <div className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Total Odds</div>
            <div className="text-[14px] font-bold text-white tabular-nums">
              {formatOdds(bet.totalOdds)}
            </div>
          </div>
        )}
        <div className="text-right">
          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">
            {bet.isWin ? "Payout" : "Potential Win"}
          </div>
          <div className="text-[14px] font-bold text-[#33c771] tabular-nums">
            {(bet.isWin && bet.payout ? bet.payout : bet.possibleWin).toFixed(2)} {tokenSymbol}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-5 py-2.5 flex items-center justify-between"
        style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <span className="text-[10px] text-white/25">waliet.xyz</span>
        <span className="text-[10px] text-white/25">
          {new Date(bet.createdAt * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>
    </div>
  );
}

export function ShareBetCard({ bet, tokenSymbol, onClose }: ShareBetCardProps) {
  const { toast } = useToast();
  const { formatOdds } = useOddsFormat();
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  const shareAsText = useCallback(() => {
    const outcomes = bet.outcomes || [];
    const isCombo = outcomes.length > 1;
    const stake = Number(bet.amount);
    const status = bet.isWin ? "WON" : bet.isLose ? "LOST" : bet.isCashedOut ? "CASHED OUT" : "PENDING";

    let text = isCombo
      ? `My ${outcomes.length}-leg combo on Waliet ${status === "WON" ? "just hit!" : ""}\n\n`
      : `My bet on Waliet ${status === "WON" ? "just hit!" : ""}\n\n`;

    outcomes.forEach((o, i) => {
      text += isCombo ? `${i + 1}. ` : "";
      text += `${o.game?.title ?? "Game"} — ${o.selectionName} @ ${formatOdds(o.odds)}\n`;
    });

    text += `\nStake: ${stake.toFixed(2)} ${tokenSymbol}`;
    if (isCombo && bet.totalOdds) text += ` · Total Odds: ${formatOdds(bet.totalOdds)}`;
    const payout = bet.isWin && bet.payout ? bet.payout : bet.possibleWin;
    text += `\n${bet.isWin ? "Payout" : "Potential Win"}: ${payout.toFixed(2)} ${tokenSymbol}`;
    text += `\n\nBet on Waliet`;

    return text;
  }, [bet, tokenSymbol]);

  const handleCopy = useCallback(async () => {
    const text = shareAsText();
    try {
      await navigator.clipboard.writeText(text);
      toast("Bet card copied!", "success");
    } catch {
      toast("Failed to copy", "error");
    }
  }, [shareAsText, toast]);

  const handleShare = useCallback(async () => {
    const text = shareAsText();
    setSharing(true);

    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Waliet Bet",
          text,
        });
      } else {
        await navigator.clipboard.writeText(text);
        toast("Bet card copied!", "success");
      }
    } catch (err) {
      // User cancelled share
      if (err instanceof Error && err.name !== "AbortError") {
        toast("Share failed", "error");
      }
    } finally {
      setSharing(false);
    }
  }, [shareAsText, toast]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-4">
        {/* Card preview */}
        <div ref={cardRef}>
          <BetCardPreview bet={bet} tokenSymbol={tokenSymbol} />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="h-10 px-5 rounded-lg bg-white/10 text-white text-[13px] font-semibold hover:bg-white/15 transition-colors flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M10 4V3C10 2.44772 9.55228 2 9 2H3C2.44772 2 2 2.44772 2 3V9C2 9.55228 2.44772 10 3 10H4" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
            Copy Text
          </button>
          <button
            onClick={handleShare}
            disabled={sharing}
            className="h-10 px-5 rounded-lg bg-accent text-btn-primary-text text-[13px] font-semibold hover:bg-accent-hover transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="3" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="11" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="11" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M4.5 6.2L9.5 3.8M4.5 7.8L9.5 10.2" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
            Share
          </button>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-lg bg-white/10 text-white hover:bg-white/15 transition-colors flex items-center justify-center"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M4 4L10 10M10 4L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
