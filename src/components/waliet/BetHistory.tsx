"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { BetType, useBets, useRedeemBet, useChain, usePrecalculatedCashouts, useCashout } from "@azuro-org/sdk";
import type { Bet } from "@azuro-org/sdk";
import { useAccount } from "wagmi";
import type { Address } from "viem";
import { useToast } from "./Toast";
import { ShareBetCard } from "./ShareBetCard";
import { useOddsFormat } from "./OddsFormatContext";

/** Determine the resolution status for a pending bet */
function getPendingStatus(bet: Bet): { label: string; color: string; bg: string } {
  const now = Date.now();
  // Use the latest game start time across all outcomes (for combos)
  const latestStartsAt = Math.max(
    ...bet.outcomes.map((o) => Number(o.game?.startsAt ?? 0))
  ) * 1000;

  if (latestStartsAt <= 0) {
    return { label: "Pending", color: "text-yellow-400", bg: "bg-yellow-500/10" };
  }

  const msAfterStart = now - latestStartsAt;
  const hoursAfterStart = msAfterStart / (1000 * 60 * 60);

  if (latestStartsAt > now) {
    // Game hasn't started yet
    return { label: "Awaiting kickoff", color: "text-yellow-400", bg: "bg-yellow-500/10" };
  }

  if (hoursAfterStart < 3) {
    // Game likely in progress or just ended — normal settlement window
    return { label: "Settling", color: "text-yellow-400", bg: "bg-yellow-500/10" };
  }

  if (hoursAfterStart < 24) {
    // Past normal settlement — may be under dispute review
    return { label: "Under review", color: "text-orange-400", bg: "bg-orange-500/10" };
  }

  // 24h+ — extended review / possible dispute
  return { label: "Disputed", color: "text-orange-400", bg: "bg-orange-500/10" };
}

/** Get a human-readable settlement estimate for a pending bet */
function getSettlementHint(bet: Bet): string | null {
  const now = Date.now();
  const latestStartsAt = Math.max(
    ...bet.outcomes.map((o) => Number(o.game?.startsAt ?? 0))
  ) * 1000;

  if (latestStartsAt <= 0) return null;

  const msAfterStart = now - latestStartsAt;
  const hoursAfterStart = msAfterStart / (1000 * 60 * 60);

  if (latestStartsAt > now) {
    const hoursUntil = (latestStartsAt - now) / (1000 * 60 * 60);
    if (hoursUntil < 1) return `Game starts in ${Math.ceil(hoursUntil * 60)}min`;
    if (hoursUntil < 24) return `Game starts in ${Math.round(hoursUntil)}hr`;
    return `Game starts ${new Date(latestStartsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }

  if (hoursAfterStart < 3) {
    return "Typically settles within ~1hr of game ending";
  }

  if (hoursAfterStart < 24) {
    return "Taking longer than usual — result may be under review";
  }

  return "Result under extended review — disputes can take up to 3 days";
}

/** Explanation for why a bet was canceled */
function getCancelReason(bet: Bet): string {
  const hasCanceledOutcome = bet.outcomes.some((o) => o.isCanceled);
  if (hasCanceledOutcome) return "One or more markets were voided";
  return "Event was not completed or market was voided";
}

const AFFILIATE = (process.env.NEXT_PUBLIC_AFFILIATE_ADDRESS as Address) ?? "0x0000000000000000000000000000000000000000";

type FilterTab = "all" | "pending" | "won" | "lost" | "cashed";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
  { key: "cashed", label: "Cashed Out" },
];

function filterBets(bets: Bet[], filter: FilterTab): Bet[] {
  switch (filter) {
    case "pending":
      return bets.filter((b) => !b.isWin && !b.isLose && !b.isCanceled && !b.isCashedOut);
    case "won":
      return bets.filter((b) => b.isWin);
    case "lost":
      return bets.filter((b) => b.isLose);
    case "cashed":
      return bets.filter((b) => b.isCashedOut);
    default:
      return bets;
  }
}

function CashoutButton({ bet }: { bet: Bet }) {
  const { toast } = useToast();
  const { betToken } = useChain();
  const { data: cashoutData } = usePrecalculatedCashouts({
    bet: {
      tokenId: bet.tokenId,
      amount: bet.amount,
      outcomes: bet.outcomes,
      status: bet.status,
      totalOdds: bet.possibleWin / +bet.amount,
      freebetId: bet.freebetId,
    },
    query: { enabled: !bet.isWin && !bet.isLose && !bet.isCanceled && !bet.isCashedOut },
  });

  const { submit, cashoutTx } = useCashout({
    bet: { tokenId: bet.tokenId, outcomes: bet.outcomes },
    onSuccess: () => {
      toast("Bet cashed out!", "success", `Received ${Number(cashoutData?.cashoutAmount ?? 0).toFixed(2)}`);
    },
    onError: (err) => {
      toast("Cashout failed", "error", err instanceof Error ? err.message : undefined);
    },
  });

  if (!cashoutData?.isAvailable) return null;

  const isBusy = cashoutTx.isPending || cashoutTx.isProcessing;
  const cashoutAmount = Number(cashoutData.cashoutAmount);
  const stake = Number(bet.amount);
  const profitPct = stake > 0 ? ((cashoutAmount - stake) / stake * 100).toFixed(0) : "0";
  const isProfit = cashoutAmount > stake;

  return (
    <button
      onClick={() => submit()}
      disabled={isBusy}
      className="h-7 px-3 rounded-md bg-yellow-500/15 text-yellow-400 text-[12px] font-semibold hover:bg-yellow-500/25 active:scale-[0.97] transition-all disabled:opacity-50"
    >
      {isBusy ? "..." : (
        <span className="flex items-center gap-1">
          Cashout {cashoutAmount.toFixed(2)} {betToken?.symbol}
          {isProfit && <span className="text-[10px] text-green-400">+{profitPct}%</span>}
        </span>
      )}
    </button>
  );
}

function BetHistoryCard({ bet }: { bet: Bet }) {
  const { betToken } = useChain();
  const { toast } = useToast();
  const { formatOdds } = useOddsFormat();
  const { submit, isPending: isRedeeming, isProcessing } = useRedeemBet();
  const [showShare, setShowShare] = useState(false);

  const outcomes = bet.outcomes || [];
  const isCombo = outcomes.length > 1;
  const gameTitle = outcomes[0]?.game?.title ?? "Unknown game";
  const date = new Date(bet.createdAt * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const sport = outcomes[0]?.game?.sport?.name;

  const isBetPending = !bet.isWin && !bet.isLose && !bet.isCanceled && !bet.isCashedOut;
  const pendingStatus = isBetPending ? getPendingStatus(bet) : null;
  const settlementHint = isBetPending ? getSettlementHint(bet) : null;
  const cancelReason = bet.isCanceled ? getCancelReason(bet) : null;

  const statusColor = bet.isWin ? "text-green-400" : bet.isLose ? "text-red-400" : bet.isCanceled ? "text-text-muted" : bet.isCashedOut ? "text-yellow-400" : pendingStatus!.color;
  const statusBg = bet.isWin ? "bg-green-500/10" : bet.isLose ? "bg-red-500/10" : bet.isCashedOut ? "bg-yellow-500/10" : bet.isCanceled ? "bg-bg-surface" : pendingStatus!.bg;
  const statusText = bet.isWin ? "Won" : bet.isLose ? "Lost" : bet.isCanceled ? "Canceled" : bet.isCashedOut ? "Cashed Out" : pendingStatus!.label;

  const stake = Number(bet.amount);
  const pnl = bet.isWin
    ? (bet.payout ?? bet.possibleWin) - stake
    : bet.isLose
      ? -stake
      : bet.isCashedOut && bet.cashout
        ? Number(bet.cashout) - stake
        : 0;

  return (
    <div className="bg-bg-input rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-text-muted font-medium">#{bet.tokenId} · {date}</span>
          {isCombo && (
            <span className="text-[10px] font-bold text-accent bg-accent-muted px-1.5 py-0.5 rounded uppercase">
              Combo · {outcomes.length} legs
            </span>
          )}
          {sport && !isCombo && (
            <span className="text-[10px] text-text-muted bg-bg-surface px-1.5 py-0.5 rounded">
              {sport}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowShare(true)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-colors"
            title="Share bet"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <circle cx="3" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="11" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="11" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M4.5 6.2L9.5 3.8M4.5 7.8L9.5 10.2" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </button>
          <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${statusColor} ${statusBg}`}>
            {statusText}
          </span>
        </div>
      </div>

      {/* Settlement / cancel hint */}
      {(settlementHint || cancelReason) && (
        <div className="px-3 pb-1 -mt-0.5">
          <span className={`text-[11px] ${cancelReason ? "text-text-muted" : pendingStatus?.label === "Under review" || pendingStatus?.label === "Disputed" ? "text-orange-400/70" : "text-text-muted"}`}>
            {cancelReason ?? settlementHint}
          </span>
        </div>
      )}

      {/* Share modal */}
      {showShare && (
        <ShareBetCard
          bet={bet}
          tokenSymbol={betToken?.symbol ?? "USDT"}
          onClose={() => setShowShare(false)}
        />
      )}

      {/* Content */}
      {isCombo ? (
        <div className="divide-y divide-border-subtle">
          {outcomes.map((outcome, i) => {
            const legWon = outcome.isWin === true;
            const legLost = outcome.isLose === true;
            return (
              <div key={i} className="px-3 py-2 flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  legWon ? "bg-green-500/15 text-green-400" : legLost ? "bg-red-500/15 text-red-400" : "bg-bg-surface text-text-muted"
                }`}>
                  {legWon ? "\u2713" : legLost ? "\u2717" : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-text-muted truncate">{outcome.game?.title ?? "Unknown"}</div>
                  <div className="text-[12px] font-semibold text-text-primary truncate">
                    {outcome.marketName}: {outcome.selectionName}
                  </div>
                </div>
                <span className="text-[12px] font-semibold text-accent-text tabular-nums shrink-0">
                  {formatOdds(outcome.odds)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-3 py-2.5">
          <div className="text-[12px] text-text-muted mb-0.5 truncate">{gameTitle}</div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-text-primary truncate">
              {outcomes[0]?.marketName}: {outcomes[0]?.selectionName}
            </span>
            <span className="text-[13px] font-bold text-accent-text tabular-nums shrink-0 ml-2">
              {formatOdds(outcomes[0]?.odds)}
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border-subtle">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-text-primary tabular-nums">
            {stake.toFixed(2)} {betToken?.symbol}
          </span>
          {isCombo && (
            <span className="text-[11px] text-text-muted tabular-nums">
              @ {formatOdds(bet.totalOdds)}
            </span>
          )}
          {/* P&L indicator */}
          {(bet.isWin || bet.isLose || bet.isCashedOut) && (
            <span className={`text-[11px] font-semibold tabular-nums ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
              {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!bet.isWin && !bet.isLose && !bet.isCanceled && !bet.isCashedOut && (
            <CashoutButton bet={bet} />
          )}
          {bet.isRedeemable && !bet.isRedeemed && (
            <button
              onClick={() => {
                submit({ bets: [bet] });
                toast("Claiming winnings...", "info", `${bet.possibleWin?.toFixed(2)} ${betToken?.symbol}`);
              }}
              disabled={isRedeeming || isProcessing}
              className="h-7 px-3 rounded-md bg-green-500/20 text-green-400 text-[12px] font-semibold hover:bg-green-500/30 active:scale-[0.97] transition-all disabled:opacity-50"
            >
              {isRedeeming || isProcessing ? "Claiming..." : `Claim ${bet.possibleWin?.toFixed(2)} ${betToken?.symbol}`}
            </button>
          )}
          {bet.isWin && bet.isRedeemed && (
            <span className="text-[12px] text-green-400/60 font-medium tabular-nums">
              +{bet.payout?.toFixed(2)} {betToken?.symbol}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function BetHistory() {
  const { address } = useAccount();

  if (!address) {
    return (
      <div className="p-4 text-center">
        <p className="text-[13px] text-text-muted">Connect wallet to see bet history</p>
      </div>
    );
  }

  return <BetHistoryInner address={address} />;
}

function BetHistoryInner({ address }: { address: Address }) {
  const [filter, setFilter] = useState<FilterTab>("all");
  const { toast } = useToast();

  const listRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage, refetch, isFetching } = useBets({
    filter: { bettor: address, affiliate: AFFILIATE },
    itemsPerPage: 50,
    query: {
      refetchInterval: 30_000, // Poll every 30s to catch resolutions
      // Preserve scroll position across background refetches
      placeholderData: (prev: any) => prev,
    },
  });

  // Save/restore scroll position on data changes from background refetch
  useEffect(() => {
    const el = listRef.current?.closest("[data-bet-scroll]") as HTMLElement | null;
    if (el) scrollRef.current = el.scrollTop;
  });
  useEffect(() => {
    const el = listRef.current?.closest("[data-bet-scroll]") as HTMLElement | null;
    if (el && scrollRef.current > 0) el.scrollTop = scrollRef.current;
  }, [data]);

  const handleRefresh = useCallback(() => {
    refetch();
    toast("Refreshing bets...", "info");
  }, [refetch, toast]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-24 rounded-lg animate-pulse" style={{background:"var(--border-subtle)"}} />
        ))}
      </div>
    );
  }

  const allBets = data?.pages?.flatMap((page) => page.bets) ?? [];
  const filteredBets = filterBets(allBets, filter);

  // Quick stats from current data
  const pendingCount = allBets.filter((b) => !b.isWin && !b.isLose && !b.isCanceled && !b.isCashedOut).length;
  const wonCount = allBets.filter((b) => b.isWin).length;
  const lostCount = allBets.filter((b) => b.isLose).length;
  const cashedCount = allBets.filter((b) => b.isCashedOut).length;

  const counts: Record<FilterTab, number> = {
    all: allBets.length,
    pending: pendingCount,
    won: wonCount,
    lost: lostCount,
    cashed: cashedCount,
  };

  if (allBets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-10 h-10 rounded-full bg-bg-input flex items-center justify-center mb-3">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-text-muted">
            <path d="M4 4H16M4 8H16M4 12H12M4 16H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-[13px] font-semibold text-text-secondary">No bets yet</p>
        <p className="text-[12px] text-text-muted mt-1">Place a bet to see your history here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Filter tabs + refresh */}
      <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto">
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-colors disabled:opacity-50"
          title="Refresh bets"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={isFetching ? "animate-spin" : ""}>
            <path d="M13.5 2.5V6H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2.5 13.5V10H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3.5 5.5A5 5 0 0112.3 4L13.5 6M2.5 10L3.7 12A5 5 0 0012.5 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {FILTER_TABS.map(({ key, label }) => {
          const count = counts[key];
          const isActive = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`shrink-0 h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors ${
                isActive
                  ? "bg-accent-muted text-accent"
                  : "text-text-muted hover:text-text-secondary hover:bg-bg-hover"
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`ml-1 text-[10px] ${isActive ? "text-accent/70" : "text-text-muted"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bet list */}
      <div ref={listRef} className="flex flex-col gap-2 p-3" data-bet-scroll>
        {filteredBets.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[13px] text-text-muted">
              No {filter === "all" ? "" : filter} bets
            </p>
          </div>
        ) : (
          filteredBets.map((bet) => (
            <BetHistoryCard key={bet.tokenId} bet={bet} />
          ))
        )}
      </div>

      {/* Load more */}
      {hasNextPage && (
        <div className="px-3 pb-3">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full h-8 rounded-lg bg-bg-surface text-[12px] font-medium text-text-secondary hover:bg-bg-hover transition-colors disabled:opacity-50"
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
