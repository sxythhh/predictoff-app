"use client";

import { useState, useRef, useEffect, useCallback, type MouseEvent } from "react";
import {
  useBaseBetslip,
  useDetailedBetslip,
  useChain,
  useBetTokenBalance,
  useBet,
  useBetFee,
  useGame,
} from "@azuro-org/sdk";
import { type Address } from "viem";
import { useAccount } from "wagmi";
import { getBetslipMeta, setBetslipMeta } from "./betslip-meta";
import { WrapTokenModal } from "./WrapTokenModal";
import { useToast } from "./Toast";
import { TeamLogo } from "./TeamLogo";
import { useOpenGame } from "./GameModal";
import { useOddsFormat } from "./OddsFormatContext";

const AFFILIATE =
  (process.env.NEXT_PUBLIC_AFFILIATE_ADDRESS as Address) ??
  "0x0000000000000000000000000000000000000000";

function ScrollMask({ children }: { children: React.ReactNode }) {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const update = useCallback(() => {
    const el = containerRef.current?.querySelector("[data-scroll-inner]") as HTMLElement | null;
    if (!el) return;
    setShowTop(el.scrollTop > 4);
    setShowBottom(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
  }, []);

  useEffect(() => {
    const el = containerRef.current?.querySelector("[data-scroll-inner]") as HTMLElement | null;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", update); ro.disconnect(); };
  }, [update]);

  return (
    <div ref={containerRef} className="relative">
      {showTop && (
        <div className="absolute top-0 left-0 right-0 h-8 z-10 pointer-events-none" style={{ background: "linear-gradient(to bottom, var(--bg-page), transparent)" }} />
      )}
      {children}
      {showBottom && (
        <div className="absolute bottom-0 left-0 right-0 h-8 z-10 pointer-events-none" style={{ background: "linear-gradient(to top, var(--bg-page), transparent)" }} />
      )}
    </div>
  );
}

function BetslipCard({
  item,
  odds,
  onRemove,
  legIndex,
  isCombo,
}: {
  item: AzuroSDK.BetslipItem;
  odds: number | undefined;
  onRemove: () => void;
  legIndex?: number;
  isCombo: boolean;
}) {
  const cachedMeta = getBetslipMeta(item.conditionId, item.outcomeId);
  const isForbidden = item.isExpressForbidden;
  const impliedProb = odds ? ((1 / odds) * 100).toFixed(0) : null;
  const openGame = useOpenGame();
  const { formatOdds } = useOddsFormat();

  // Fetch game data from SDK when metadata is missing (e.g., after page refresh)
  const { data: gameData } = useGame({ gameId: item.gameId, query: { enabled: !cachedMeta } });

  // Backfill cache from SDK data
  const meta = cachedMeta ?? (gameData ? (() => {
    const backfilled = {
      gameTitle: gameData.title,
      marketName: "Market",
      selectionName: `#${item.outcomeId}`,
      sportName: gameData.sport?.name,
      leagueName: gameData.league?.name,
      startsAt: +gameData.startsAt,
      team1Name: gameData.participants?.[0]?.name,
      team2Name: gameData.participants?.[1]?.name,
      team1Image: gameData.participants?.[0]?.image ?? undefined,
      team2Image: gameData.participants?.[1]?.image ?? undefined,
    };
    setBetslipMeta(item.conditionId, item.outcomeId, backfilled);
    return backfilled;
  })() : undefined);

  return (
    <div
      className="rounded-xl p-3 relative cursor-pointer"
      onClick={() => openGame(item.gameId)}
      style={{
        background: "var(--bg-card)",
        boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.06), inset 0 -1px 0 0 rgba(0,0,0,0.15), inset 0 0 12px 0 rgba(255,255,255,0.02)",
      }}
    >
      {/* Remove button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-2.5 right-2.5 text-text-muted hover:text-status-loss transition-colors cursor-pointer"
      >
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
          <path fillRule="evenodd" clipRule="evenodd" d="M7.83855 2.40883C8.14766 1.94517 8.66805 1.66667 9.2253 1.66667H10.7747C11.3319 1.66667 11.8523 1.94517 12.1614 2.40883L12.9167 3.54167H16.0417C16.3868 3.54167 16.6667 3.82149 16.6667 4.16667C16.6667 4.51185 16.3868 4.79167 16.0417 4.79167H3.95833C3.61315 4.79167 3.33333 4.51185 3.33333 4.16667C3.33333 3.82149 3.61315 3.54167 3.95833 3.54167H7.08333L7.83855 2.40883ZM12.5 18.3333H7.5C5.65905 18.3333 4.16666 16.841 4.16666 15V5.83333H15.8333V15C15.8333 16.841 14.3409 18.3333 12.5 18.3333ZM8.33333 8.54167C8.67851 8.54167 8.95833 8.82149 8.95833 9.16667V15C8.95833 15.3452 8.67851 15.625 8.33333 15.625C7.98815 15.625 7.70833 15.3452 7.70833 15L7.70833 9.16667C7.70833 8.82149 7.98815 8.54167 8.33333 8.54167ZM11.6667 8.54167C12.0118 8.54167 12.2917 8.82149 12.2917 9.16667V15C12.2917 15.3452 12.0118 15.625 11.6667 15.625C11.3215 15.625 11.0417 15.3452 11.0417 15V9.16667C11.0417 8.82149 11.3215 8.54167 11.6667 8.54167Z" fill="currentColor"/>
        </svg>
      </button>

      {/* Teams row */}
      {meta?.team1Name && (
        <div className="flex items-center gap-2 mb-2 pr-6">
          {(meta.team1Image || meta.team2Image) && (
            <div className="flex items-center -space-x-1.5">
              {meta.team1Image && (
                <div className="w-5 h-5 rounded-full overflow-hidden bg-bg-surface ring-1 ring-border-subtle">
                  <TeamLogo src={meta.team1Image} name={meta.team1Name} className="w-5 h-5 object-contain" />
                </div>
              )}
              {meta.team2Image && (
                <div className="w-5 h-5 rounded-full overflow-hidden bg-bg-surface ring-1 ring-border-subtle">
                  <TeamLogo src={meta.team2Image} name={meta.team2Name ?? ""} className="w-5 h-5 object-contain" />
                </div>
              )}
            </div>
          )}
          <span className="text-[11px] text-text-muted truncate">
            {meta.team1Name} vs {meta.team2Name}
            {isForbidden && (
              <span className="ml-1" title="Cannot be used in combo bets">
                {"\u26A0\uFE0F"}
              </span>
            )}
          </span>
        </div>
      )}

      {/* Fallback title when no team names */}
      {!meta?.team1Name && (
        <div className="text-[11px] text-text-muted mb-2 truncate pr-6">
          {meta?.gameTitle ?? `Game ${item.gameId}`}
          {isForbidden && (
            <span className="ml-1" title="Cannot be used in combo bets">
              {"\u26A0\uFE0F"}
            </span>
          )}
        </div>
      )}

      {/* Selection + odds */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <span className="text-[13px] font-semibold text-text-primary truncate">
            {meta?.selectionName ?? `#${item.outcomeId}`}
          </span>
          <span className="text-[11px] text-text-muted truncate">
            {meta?.marketName ?? "Market"}
          </span>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-[14px] font-bold text-accent tabular-nums">
            {formatOdds(odds)}
          </span>
          {impliedProb && (
            <span className="text-[10px] text-text-muted tabular-nums">
              {impliedProb}% chance
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function Betslip() {
  const { address } = useAccount();
  const { betToken } = useChain();
  const { items, removeItem, clear } = useBaseBetslip();
  const {
    odds,
    totalOdds,
    minBet,
    maxBet,
    betAmount,
    changeBetAmount,
    disableReason,
    isBetAllowed,
    isOddsFetching,
    isStatesFetching,
    isBetCalculationFetching,
    freebets,
    selectedFreebet,
    selectFreebet,
    isFreebetsFetching,
    states,
  } = useDetailedBetslip();
  const { data: balanceData } = useBetTokenBalance();
  const { data: feeData } = useBetFee();

  const [wrapOpen, setWrapOpen] = useState(false);
  const [betMode, setBetMode] = useState<"combo" | "singles">("combo");
  const [clearConfirm, setClearConfirm] = useState(false);
  const { toast } = useToast();
  const { formatOdds } = useOddsFormat();

  // Reset confirm state when items change
  useEffect(() => { setClearConfirm(false); }, [items.length]);

  const handleClear = () => {
    if (items.length <= 1 || clearConfirm) {
      clear();
      setClearConfirm(false);
    } else {
      setClearConfirm(true);
      setTimeout(() => setClearConfirm(false), 3000);
    }
  };

  const canCombo = items.length > 1 && !items.some((i) => i.isExpressForbidden);
  const isCombo = items.length > 1 && betMode === "combo" && canCombo;

  const {
    submit,
    approveTx,
    betTx,
    isApproveRequired,
    isAllowanceLoading,
    isRelayerFeeLoading,
  } = useBet({
    betAmount,
    slippage: 10,
    affiliate: AFFILIATE,
    selections: isCombo
      ? items.map((item) => ({
          conditionId: item.conditionId,
          outcomeId: item.outcomeId,
        }))
      : items.slice(0, 1).map((item) => ({
          conditionId: item.conditionId,
          outcomeId: item.outcomeId,
        })),
    odds: odds ?? {},
    totalOdds: isCombo ? totalOdds : totalOdds,
    freebet: selectedFreebet,
    onSuccess: () => {
      const win = isCombo && totalOdds
        ? (totalOdds * +betAmount).toFixed(2)
        : (+betAmount * (Object.values(odds ?? {})[0] ?? 1)).toFixed(2);
      toast(
        isCombo ? `Combo bet placed!` : "Bet placed!",
        "bet-placed",
        `Stake: ${betAmount} ${betToken?.symbol ?? ""} · Potential win: ${win} ${betToken?.symbol ?? ""}`
      );
      // Record activity
      const meta = items[0] ? getBetslipMeta(items[0].conditionId, items[0].outcomeId) : null;
      fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "bet_placed",
          metadata: {
            gameTitle: isCombo ? `Combo (${items.length} legs)` : (meta?.gameTitle ?? "Unknown game"),
            odds: isCombo ? totalOdds : (Object.values(odds ?? {})[0] ?? null),
            amount: betAmount,
            selections: items.length,
          },
        }),
      }).catch(() => {});
      clear();
    },
    onError: (err) => {
      console.error("Bet error:", err);
      const msg = err instanceof Error ? err.message : "Something went wrong";
      const lower = msg.toLowerCase();
      if (lower.includes("user rejected") || lower.includes("user denied")) {
        toast("Transaction cancelled", "info", "You rejected the transaction in your wallet");
      } else if (lower.includes("freebet") || lower.includes("bonus") || lower.includes("expired")) {
        toast("Free bet unavailable", "error", "This free bet may have expired or doesn't apply to this selection. Try removing it.");
        selectFreebet(undefined);
      } else {
        toast("Bet failed", "error", msg.length > 80 ? msg.slice(0, 80) + "..." : msg);
      }
    },
  });

  const isPending = approveTx.isPending || betTx.isPending;
  const isProcessing = approveTx.isProcessing || betTx.isProcessing;
  // Background data fetching — button disabled but no spinner
  const isDataLoading =
    isOddsFetching ||
    isStatesFetching ||
    isAllowanceLoading ||
    isRelayerFeeLoading;
  // User-initiated tx — button shows spinner
  const isTxActive = isPending || isProcessing;
  const isLoading = isDataLoading || isTxActive;

  const possibleWin = isCombo && totalOdds
    ? (totalOdds * +betAmount).toFixed(2)
    : !isCombo && odds
      ? items.reduce((sum, item) => {
          const key = `${item.conditionId}-${item.outcomeId}`;
          return sum + (odds[key] ?? 1) * +betAmount;
        }, 0).toFixed(2)
      : "0.00";
  const isOverMax = maxBet !== undefined && +betAmount > maxBet;
  const isUnderMin = minBet !== undefined && +betAmount > 0 && +betAmount < minBet;
  const balance = balanceData?.balance ? Number(balanceData.balance) : undefined;
  const isOverBalance = balance !== undefined && +betAmount > balance;

  const impliedComboProb = isCombo && totalOdds ? ((1 / totalOdds) * 100) : null;

  // Build a specific message for unavailable markets
  const unavailableNames = (() => {
    if (!states) return [];
    return items
      .filter((item) => states[item.conditionId] && states[item.conditionId] !== "Active")
      .map((item) => {
        const meta = getBetslipMeta(item.conditionId, item.outcomeId);
        const state = states[item.conditionId];
        const name = meta?.selectionName ?? meta?.marketName ?? "Selection";
        const reason = state === "Stopped" ? "suspended" : state === "Canceled" ? "cancelled" : state === "Resolved" ? "already settled" : "unavailable";
        return `${name} is ${reason}`;
      });
  })();

  const DISABLE_MESSAGES: Record<string, string> = {
    ConditionState: unavailableNames.length ? unavailableNames.join(". ") : "One or more markets are unavailable",
    BetAmountGreaterThanMaxBet: `Max bet is ${maxBet?.toFixed(2)} ${betToken?.symbol ?? ""}`,
    BetAmountLowerThanMinBet: `Min bet is ${minBet?.toFixed(2)} ${betToken?.symbol ?? ""}`,
    ComboWithForbiddenItem: "One selection can\u2019t be combined in a combo",
    ComboWithSameGame: "Can\u2019t combine selections from the same game",
    SelectedOutcomesTemporarySuspended: "Selections temporarily suspended",
    TotalOddsTooLow: "Total odds too low for combo bet",
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4">
        <div className="w-10 h-10 rounded-full bg-bg-input flex items-center justify-center mb-3">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-text-muted">
            <rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 7H12M8 10H12M8 13H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-[13px] font-semibold text-text-secondary">
          Betslip is empty
        </p>
        <p className="text-[12px] text-text-muted mt-1 mb-4">
          Tap any odds button to get started
        </p>
        <div className="w-full flex flex-col gap-2 text-[11px]">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-bg-surface">
            <span className="w-5 h-5 rounded-full bg-accent-muted flex items-center justify-center text-[10px] font-bold text-accent shrink-0">1</span>
            <span className="text-text-secondary">Browse events and tap odds to select</span>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-bg-surface">
            <span className="w-5 h-5 rounded-full bg-accent-muted flex items-center justify-center text-[10px] font-bold text-accent shrink-0">2</span>
            <span className="text-text-secondary">Add multiple picks for a combo bet</span>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-bg-surface">
            <span className="w-5 h-5 rounded-full bg-accent-muted flex items-center justify-center text-[10px] font-bold text-accent shrink-0">3</span>
            <span className="text-text-secondary">Set your stake and place your bet</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header with combo/singles toggle */}
      <div className="flex items-center justify-between px-3 py-3">
        {items.length > 1 ? (
          <div className="flex items-center gap-1 bg-bg-surface rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setBetMode("combo")}
              className={`h-7 px-3 rounded-md text-[12px] font-semibold cursor-pointer transition-colors ${
                betMode === "combo" && canCombo
                  ? "bg-accent text-btn-primary-text"
                  : "text-text-muted hover:text-text-secondary"
              } ${!canCombo ? "opacity-40 cursor-not-allowed" : ""}`}
              disabled={!canCombo}
            >
              Combo ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setBetMode("singles")}
              className={`h-7 px-3 rounded-md text-[12px] font-semibold cursor-pointer transition-colors ${
                betMode === "singles" || !canCombo
                  ? "bg-accent text-btn-primary-text"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              Singles
            </button>
          </div>
        ) : (
          <span className="text-[14px] font-semibold text-text-primary">Single Bet</span>
        )}
        <button
          onClick={handleClear}
          className={`text-[12px] transition-colors ${
            clearConfirm
              ? "text-red-400 hover:text-red-300 font-semibold"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          {clearConfirm ? "Confirm clear?" : "Clear all"}
        </button>
      </div>

      {/* Combo warnings */}
      {items.length > 1 && betMode === "combo" && (disableReason === "ComboWithSameGame" || disableReason === "ComboWithForbiddenItem") && (
        <div className="mx-3 mb-2 flex items-center gap-1.5 text-[11px] text-amber-400/80 px-2 py-2 rounded-lg bg-amber-500/[0.08] border border-amber-500/[0.12]">
          <span>{"\u26A0\uFE0F"}</span>
          <span>{DISABLE_MESSAGES[disableReason]}</span>
        </div>
      )}

      {/* Cards with gradient mask */}
      <ScrollMask>
        <div className="flex flex-col gap-2 px-3 max-h-[300px] overflow-y-auto" data-scroll-inner>
          {items.map((item, index) => {
            const oddsKey = `${item.conditionId}-${item.outcomeId}`;
            return (
              <BetslipCard
                key={oddsKey}
                item={item}
                odds={odds?.[oddsKey]}
                onRemove={() => removeItem(item)}
                legIndex={index}
                isCombo={isCombo}
              />
            );
          })}
        </div>
      </ScrollMask>

      {/* Combo summary bar */}
      {isCombo && totalOdds && (
        <div className="mx-3 mt-2 p-2.5 rounded-lg bg-accent-muted border border-accent/10">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-text-secondary font-medium">
              {items.length} legs combined
            </span>
            <div className="flex items-center gap-3">
              <span className="text-text-muted tabular-nums">
                {impliedComboProb?.toFixed(1)}% prob
              </span>
              <span className="font-bold text-accent tabular-nums">
                {formatOdds(totalOdds)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Amount + Place Bet */}
      <div className="px-3 pt-3 pb-4">
        {/* Amount input — hidden when freebet selected */}
        {!selectedFreebet && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 relative">
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => changeBetAmount(e.target.value)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  placeholder="0.00"
                  min="0"
                  className={`w-full h-10 px-3 pr-16 rounded-lg bg-bg-input text-text-primary text-[14px] font-semibold outline-none transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                    isOverMax || isOverBalance
                      ? "border border-red-500/40 focus:border-red-500/60"
                      : "border border-border-input focus:border-accent/50"
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-text-muted">
                  {betToken?.symbol ?? "USDT"}
                </span>
              </div>
            </div>

            {/* Min/Max bet limits */}
            <div className="flex items-center justify-between mb-2 px-0.5">
              <div className="text-[11px] text-text-muted tabular-nums">
                {isBetCalculationFetching ? (
                  <span className="inline-block w-16 h-3 rounded bg-bg-input animate-pulse" />
                ) : minBet !== undefined ? (
                  <span>
                    Min:{" "}
                    <button
                      onClick={() => changeBetAmount(String(minBet))}
                      className="text-text-muted hover:text-text-secondary transition-colors"
                    >
                      {minBet.toFixed(2)}
                    </button>
                  </span>
                ) : null}
              </div>
              <div className="text-[11px] text-text-muted tabular-nums">
                {isBetCalculationFetching ? (
                  <span className="inline-block w-20 h-3 rounded bg-bg-input animate-pulse" />
                ) : maxBet !== undefined ? (
                  <span className="relative group/tip cursor-help border-b border-dotted border-text-muted/50">
                    Max:{" "}
                    <button
                      onClick={() => changeBetAmount(String(maxBet))}
                      className="text-text-muted hover:text-text-secondary transition-colors font-semibold"
                    >
                      {maxBet.toFixed(2)}
                    </button>{" "}
                    <span className="text-text-muted">{betToken?.symbol}</span>
                    <span className="absolute bottom-full right-0 mb-1.5 w-[200px] p-2.5 rounded-lg bg-bg-card text-[11px] text-text-secondary leading-snug shadow-lg opacity-0 pointer-events-none group-hover/tip:opacity-100 group-hover/tip:pointer-events-auto transition-opacity z-50 text-center">
                      The maximum amount you can bet on this selection, set by the liquidity pool based on current market conditions.
                    </span>
                  </span>
                ) : null}
              </div>
            </div>

            {/* Quick amounts */}
            <div className="flex gap-1.5 mb-3">
              {["5", "10", "25", "50", "100"].map((v) => {
                const exceedsMax = maxBet !== undefined && +v > maxBet;
                return (
                  <button
                    key={v}
                    onClick={() => changeBetAmount(v)}
                    disabled={exceedsMax}
                    className={`flex-1 h-7 rounded-md text-[12px] font-semibold transition-colors ${
                      betAmount === v
                        ? "bg-accent-muted text-accent-text"
                        : exceedsMax
                          ? "bg-border-subtle text-text-muted cursor-not-allowed"
                          : "bg-bg-input text-text-secondary hover:bg-white/[0.10]"
                    }`}
                  >
                    {v}
                  </button>
                );
              })}
              {/* MAX button */}
              {maxBet !== undefined && (
                <button
                  onClick={() =>
                    changeBetAmount(
                      String(Math.min(maxBet, balance ?? maxBet))
                    )
                  }
                  className="flex-1 h-7 rounded-md text-[12px] font-semibold bg-accent-muted text-accent-text/70 hover:bg-accent-muted hover:text-accent-text transition-colors"
                >
                  MAX
                </button>
              )}
            </div>
          </>
        )}

        {/* Bet breakdown */}
        <div className="flex flex-col gap-1 mb-2 text-[12px]">
          {isCombo && (
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Total Odds</span>
              <span className="font-semibold text-text-primary tabular-nums">
                {formatOdds(totalOdds)}
              </span>
            </div>
          )}
          {!isCombo && items.length > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Mode</span>
              <span className="text-text-secondary">
                {items.length} singles &middot; {betAmount || "0"} {betToken?.symbol} each
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-text-muted">
              {!isCombo && items.length > 1 ? "Total Stake" : "Potential Win"}
            </span>
            <span className="font-semibold text-accent tabular-nums">
              {!isCombo && items.length > 1
                ? `${(+betAmount * items.length).toFixed(2)} ${betToken?.symbol ?? ""}`
                : `${possibleWin} ${betToken?.symbol ?? ""}`
              }
            </span>
          </div>
          {!isCombo && items.length > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Max Potential Win</span>
              <span className="font-semibold text-accent tabular-nums">
                {possibleWin} {betToken?.symbol ?? ""}
              </span>
            </div>
          )}
          {isCombo && totalOdds && +betAmount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Potential Profit</span>
              <span className="font-semibold text-accent tabular-nums">
                +{(totalOdds * +betAmount - +betAmount).toFixed(2)} {betToken?.symbol ?? ""}
              </span>
            </div>
          )}
        </div>

        {/* Max payout info — show when bet exceeds or approaches max */}
        {maxBet !== undefined && +betAmount > maxBet * 0.7 && (
          <div className="flex items-center justify-between mb-1 text-[11px]">
            <span className="text-text-muted">Max payout at limit</span>
            <span className="text-text-muted tabular-nums">
              {isCombo && totalOdds
                ? (maxBet * totalOdds).toFixed(2)
                : odds
                  ? (maxBet * (Object.values(odds)[0] ?? 1)).toFixed(2)
                  : "—"
              } {betToken?.symbol ?? ""}
            </span>
          </div>
        )}

        {/* Balance + Wrap button */}
        {balanceData?.balance && (
          <div className="flex items-center justify-between mb-3 text-[12px]">
            <span className="text-text-muted">Balance</span>
            <span className="flex items-center gap-2">
              <span className="font-medium text-text-secondary tabular-nums">
                {Number(balanceData.balance).toFixed(2)} {betToken?.symbol}
              </span>
              <button
                onClick={() => setWrapOpen(true)}
                className="text-[11px] font-semibold text-accent-text/70 hover:text-accent-text bg-accent-muted px-2 py-0.5 rounded transition-colors"
              >
                Wrap
              </button>
            </span>
          </div>
        )}

        {/* Freebet selector */}
        {freebets && freebets.length > 0 && (
          <div className="mb-3">
            <div className="text-[11px] text-text-muted mb-1.5">
              Free Bets Available
            </div>
            <div className="flex flex-col gap-1.5">
              {/* No freebet option */}
              <button
                onClick={() => selectFreebet(undefined)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[12px] font-medium transition-colors ${
                  !selectedFreebet
                    ? "bg-accent-muted text-accent-text ring-1 ring-accent/30"
                    : "bg-border-subtle text-text-secondary hover:bg-bg-input"
                }`}
              >
                <span>Use real balance</span>
              </button>
              {freebets.map((fb: any) => {
                const isExpired = fb.expiresAt && fb.expiresAt <= Date.now();
                const expiresIn = fb.expiresAt ? fb.expiresAt - Date.now() : null;
                const expiresHrs = expiresIn ? Math.floor(expiresIn / (1000 * 60 * 60)) : null;
                const expiresSoon = expiresHrs !== null && expiresHrs < 24;
                const minOdds = fb.settings?.betRestriction?.minOdds;
                return (
                  <button
                    key={fb.id}
                    onClick={() => !isExpired && selectFreebet(fb)}
                    disabled={isExpired}
                    className={`w-full flex flex-col px-3 py-2 rounded-lg text-[12px] font-medium transition-colors ${
                      isExpired
                        ? "bg-border-subtle text-text-muted opacity-50 cursor-not-allowed"
                        : selectedFreebet?.id === fb.id
                          ? "bg-green-500/15 text-green-400 ring-1 ring-green-500/30"
                          : "bg-border-subtle text-text-secondary hover:bg-bg-input"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="flex items-center gap-1.5">
                        <span>{"\uD83C\uDF81"}</span>
                        <span>{isExpired ? "Expired" : "Free Bet"}</span>
                      </span>
                      <span className="font-semibold">
                        {fb.amount} {betToken?.symbol}
                      </span>
                    </div>
                    {(expiresSoon || minOdds) && !isExpired && (
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-text-muted w-full">
                        {expiresSoon && (
                          <span className="text-yellow-400/70">
                            Expires in {expiresHrs}h
                          </span>
                        )}
                        {minOdds && +minOdds > 1 && (
                          <span>Min odds: {(+minOdds).toFixed(2)}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Relayer fee */}
        {feeData?.formattedRelayerFeeAmount && (
          <div className="flex items-center justify-between mb-2 text-[11px]">
            <span className="text-text-muted">Relayer fee</span>
            <span className="text-text-muted tabular-nums">
              {feeData.formattedRelayerFeeAmount} {betToken?.symbol}
            </span>
          </div>
        )}

        {/* Over max bet — actionable panel */}
        {isOverMax && maxBet !== undefined && (
          <div className="mb-2 rounded-lg bg-amber-500/[0.06] border border-amber-500/10 p-2.5">
            <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 mb-2">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                <path d="M6 1L11 10H1L6 1Z" stroke="currentColor" strokeWidth="1" fill="none"/>
                <path d="M6 5V7M6 8.5V8.51" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              </svg>
              <span>Bet exceeds pool limit for this market</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => changeBetAmount(String(Math.min(maxBet, balance ?? maxBet)))}
                className="flex-1 h-7 rounded-md bg-amber-500/15 text-amber-400 text-[11px] font-semibold hover:bg-amber-500/25 transition-colors"
              >
                Reduce to max ({maxBet.toFixed(2)} {betToken?.symbol})
              </button>
            </div>
            <p className="text-[10px] text-text-muted mt-1.5 leading-snug">
              Max bet is set by the liquidity pool. Try a different market for higher limits, or split across multiple bets.
            </p>
          </div>
        )}

        {/* Disable reason (non-max-bet reasons) */}
        {disableReason &&
          disableReason !== "ComboWithSameGame" &&
          disableReason !== "ComboWithForbiddenItem" &&
          disableReason !== "BetAmountGreaterThanMaxBet" && (
            <div className="flex items-center gap-1.5 text-[11px] text-red-400/80 mb-2 px-1 py-1.5 rounded-md bg-red-500/[0.06]">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className="shrink-0"
              >
                <circle
                  cx="6"
                  cy="6"
                  r="5.5"
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <path
                  d="M6 3.5V6.5M6 8V8.01"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
              <span>{DISABLE_MESSAGES[disableReason] ?? disableReason}</span>
            </div>
          )}

        {/* Over balance warning */}
        {isOverBalance && !disableReason && (
          <div className="flex items-center gap-1.5 text-[11px] text-yellow-400/80 mb-2 px-1 py-1.5 rounded-md bg-yellow-500/[0.06]">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="shrink-0"
            >
              <path
                d="M6 1L11 10H1L6 1Z"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M6 5V7M6 8.5V8.51"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </svg>
            <span>
              Insufficient balance ({balance?.toFixed(2)} {betToken?.symbol})
            </span>
          </div>
        )}

        {/* Place Bet button */}
        {!address ? (
          <div className="text-center text-[13px] text-text-muted py-3">
            {items.length > 0 ? "Connect wallet to place bets" : "Connect wallet to get started"}
          </div>
        ) : (
          <button
            onClick={submit}
            disabled={isLoading || !isBetAllowed || (!selectedFreebet && !+betAmount)}
            className="w-full h-11 rounded-lg font-semibold text-[14px] transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-btn-primary-bg text-btn-primary-text hover:bg-accent-hover active:scale-[0.98]"
          >
            {isTxActive ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {isPending ? "Confirm in wallet..." : "Processing..."}
              </span>
            ) : isApproveRequired ? (
              "Approve"
            ) : (
              <span className="flex items-center justify-between px-4">
                <span>
                  {selectedFreebet
                    ? "Place Free Bet"
                    : !isCombo && items.length > 1
                      ? `Place ${items.length} Singles`
                      : isCombo
                        ? `Place Combo (${items.length})`
                        : "Place Bet"
                  }
                </span>
                <span className="bg-black/20 px-2.5 py-1 rounded text-[12px]">
                  Win {selectedFreebet ? (totalOdds ? (totalOdds * +selectedFreebet.amount).toFixed(2) : "0.00") : possibleWin}{" "}
                  {betToken?.symbol}
                </span>
              </span>
            )}
          </button>
        )}
      </div>

      {/* Wrap Token Modal */}
      <WrapTokenModal open={wrapOpen} onClose={() => setWrapOpen(false)} />
    </div>
  );
}
