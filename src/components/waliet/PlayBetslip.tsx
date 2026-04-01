"use client";

import { useState, createContext, useContext, useCallback, useRef, useEffect } from "react";
import { useBaseBetslip, useDetailedBetslip, useChain, useGame } from "@azuro-org/sdk";
import { useAccount } from "wagmi";
import { getBetslipMeta, setBetslipMeta } from "./betslip-meta";
import { usePlayBalance, usePlacPlayBet, usePlayBets, PLAY_CURRENCY } from "./usePlayBalance";
import { BetConfirmModal, type BetConfirmData } from "./BetConfirmModal";
import { Betslip } from "./Betslip";
import { BetHistory } from "./BetHistory";
import { BetSummaryCard } from "./BetSummaryCard";
import { TeamLogo } from "./TeamLogo";
import { useToast } from "./Toast";
import { useOpenGame } from "./GameModal";
import { BettingErrorBoundary } from "./ErrorBoundary";
import { useOddsFormat } from "./OddsFormatContext";

// ── Betslip collapse context ──────────────────────────────────
const BetslipCollapseContext = createContext<{
  collapsed: boolean;
  toggle: () => void;
}>({ collapsed: false, toggle: () => {} });

function useBetslipCollapse() {
  return useContext(BetslipCollapseContext);
}

function CollapseToggle() {
  const { collapsed, toggle } = useBetslipCollapse();
  return (
    <button
      onClick={toggle}
      className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-bg-hover transition-colors text-text-muted hover:text-text-secondary"
      title={collapsed ? "Expand betslip" : "Collapse betslip"}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        {collapsed ? (
          <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        ) : (
          <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        )}
      </svg>
    </button>
  );
}

function CollapsedBetslip() {
  const { toggle } = useBetslipCollapse();
  const { items } = useBaseBetslip();
  const count = items.length;

  return (
    <aside className="w-[48px] shrink-0 border-l border-border-primary flex flex-col items-center py-3 gap-3 bg-bg-modal">
      <button
        onClick={toggle}
        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-bg-hover transition-colors text-text-muted hover:text-text-secondary"
        title="Expand betslip"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {/* Betslip icon with count badge */}
      <div className="relative">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-text-muted">
          <rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 7H12M8 10H12M8 13H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-accent text-[9px] font-bold text-btn-primary-text px-1">
            {count}
          </span>
        )}
      </div>
    </aside>
  );
}


function PlayScrollMask({ children }: { children: React.ReactNode }) {
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

function PlayBetslipCard({
  item,
  odds,
  onRemove,
}: {
  item: AzuroSDK.BetslipItem;
  odds: number | undefined;
  onRemove: () => void;
}) {
  const cachedMeta = getBetslipMeta(item.conditionId, item.outcomeId);
  const openGame = useOpenGame();
  const { formatOdds } = useOddsFormat();

  // Fetch game data from SDK when metadata is missing (e.g., after page refresh)
  const { data: gameData } = useGame({ gameId: item.gameId, query: { enabled: !cachedMeta } });
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
          </span>
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
          {odds && (
            <span className="text-[10px] text-text-muted tabular-nums">
              {((1 / odds) * 100).toFixed(0)}% chance
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function PlayBetHistory() {
  const bets = usePlayBets();
  const { currency } = usePlayBalance();
  const { formatOdds } = useOddsFormat();

  if (bets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-10 h-10 rounded-full bg-bg-input flex items-center justify-center mb-3">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-text-muted">
            <path d="M4 4H16M4 8H16M4 12H12M4 16H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-[13px] font-semibold text-text-secondary">No bets yet</p>
        <p className="text-[12px] text-text-muted mt-1">Place a bet to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {bets.map((bet) => {
        const isCombo = bet.legs && bet.legs.length > 1;
        const statusColor = bet.status === "won" ? "text-status-win" : bet.status === "lost" ? "text-status-loss" : "text-status-pending";
        const statusBg = bet.status === "won" ? "bg-green-500/10" : bet.status === "lost" ? "bg-red-500/10" : "bg-yellow-500/10";

        return (
          <div key={bet.id} className="bg-border-subtle rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-border-subtle">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-text-muted font-medium">
                  {new Date(bet.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
                {isCombo && (
                  <span className="text-[10px] font-bold text-accent bg-accent-muted px-1.5 py-0.5 rounded uppercase">
                    Combo
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${statusColor} ${statusBg}`}>
                {bet.status === "won" ? "Won" : bet.status === "lost" ? "Lost" : "Pending"}
              </span>
            </div>

            {/* Content — different layout for single vs combo */}
            {isCombo && bet.legs ? (
              /* Combo: show each leg */
              <div className="divide-y divide-border-subtle">
                {bet.legs.map((leg, i) => (
                  <div key={i} className="px-3 py-2 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-bg-input flex items-center justify-center text-[10px] font-bold text-text-muted shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-text-muted truncate">{leg.gameTitle}</div>
                      <div className="text-[12px] font-semibold text-text-primary truncate">
                        {leg.selectionName}
                      </div>
                    </div>
                    <span className="text-[12px] font-semibold text-accent tabular-nums shrink-0">
                      {formatOdds(leg.odds)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              /* Single bet */
              <div className="px-3 py-2.5">
                <div className="text-[12px] text-text-muted mb-0.5 truncate">{bet.gameTitle}</div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-text-primary truncate">
                    {bet.selectionName}
                  </span>
                  <span className="text-[13px] font-bold text-accent tabular-nums shrink-0 ml-2">
                    {formatOdds(bet.odds)}
                  </span>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-border-subtle bg-border-subtle">
              <span className="text-[12px] text-text-muted">
                {bet.amount} {currency}
                {isCombo && <span className="text-text-muted"> · {bet.legs!.length} legs</span>}
              </span>
              {bet.status === "won" && (
                <span className="text-[12px] font-semibold text-status-win">
                  +{bet.possibleWin} {currency}
                </span>
              )}
              {bet.status === "lost" && (
                <span className="text-[12px] text-status-loss/60">
                  -{bet.amount} {currency}
                </span>
              )}
              {bet.status === "pending" && (() => {
                const now = Date.now() / 1000;
                const started = bet.gameStartsAt && now > bet.gameStartsAt;
                return (
                  <span className={`text-[11px] flex items-center gap-1 ${started ? "text-status-pending/60" : "text-text-muted"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${started ? "bg-yellow-400 animate-pulse" : "bg-text-muted"}`} />
                    {started ? "In play..." : bet.gameStartsAt
                      ? new Date(bet.gameStartsAt * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "Pending"}
                  </span>
                );
              })()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PlayBetslip({ isMobileDrawer }: { isMobileDrawer?: boolean } = {}) {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  if (isMobileDrawer) {
    return (
      <BetslipCollapseContext.Provider value={{ collapsed: false, toggle: () => {} }}>
        <PlayBetslipInner isMobile />
      </BetslipCollapseContext.Provider>
    );
  }

  return (
    <BetslipCollapseContext.Provider value={{ collapsed, toggle }}>
      {collapsed ? <CollapsedBetslip /> : <PlayBetslipInner />}
    </BetslipCollapseContext.Provider>
  );
}

function PlayBetslipInner({ isMobile }: { isMobile?: boolean } = {}) {
  const { address } = useAccount();
  const isWalletConnected = !!address;
  const { items, removeItem, clear } = useBaseBetslip();
  const { odds, totalOdds, isOddsFetching } = useDetailedBetslip();
  const { balance, currency, reset } = usePlayBalance();
  const placeBet = usePlacPlayBet();
  const { toast } = useToast();
  const { formatOdds } = useOddsFormat();
  const [amount, setAmount] = useState("10");
  const [tab, setTab] = useState<"betslip" | "history">("betslip");
  const [justBet, setJustBet] = useState(false);
  const [confirmData, setConfirmData] = useState<BetConfirmData | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [betMode, setBetMode] = useState<"combo" | "singles">("combo");
  const [isPlacing, setIsPlacing] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

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
  const possibleWin = totalOdds ? (totalOdds * +amount).toFixed(2) : "0.00";
  const isOverBalance = +amount > balance;

  const handlePlaceBet = () => {
    if (!items.length || !+amount || isOverBalance || isPlacing) return;

    const selections = items.map((item) => {
      const meta = getBetslipMeta(item.conditionId, item.outcomeId);
      const itemOdds = odds?.[`${item.conditionId}-${item.outcomeId}`] ?? 1;
      return {
        gameTitle: meta?.gameTitle ?? `Game ${item.gameId}`,
        marketName: meta?.marketName ?? "Market",
        selectionName: meta?.selectionName ?? "Selection",
        odds: itemOdds,
      };
    });

    setConfirmData({
      selections,
      amount,
      possibleWin,
      currency,
      isCombo,
    });
    setShowConfirm(true);
  };

  const executePlace = () => {
    if (isPlacing) return;
    setIsPlacing(true);
    setShowConfirm(false);
    setConfirmData(null);

    for (const item of items) {
      const meta = getBetslipMeta(item.conditionId, item.outcomeId);
      const itemOdds = odds?.[`${item.conditionId}-${item.outcomeId}`] ?? 1;

      if (isCombo) continue;

      placeBet({
        gameTitle: meta?.gameTitle ?? "Unknown game",
        marketName: meta?.marketName ?? "Market",
        selectionName: meta?.selectionName ?? "Selection",
        odds: itemOdds,
        amount: +amount,
        gameStartsAt: meta?.startsAt,
      });
    }

    if (isCombo && totalOdds) {
      const latestStart = Math.max(
        ...items.map((i) => getBetslipMeta(i.conditionId, i.outcomeId)?.startsAt ?? 0)
      );
      const legs = items.map((item) => {
        const meta = getBetslipMeta(item.conditionId, item.outcomeId);
        return {
          gameTitle: meta?.gameTitle ?? "Unknown",
          marketName: meta?.marketName ?? "Market",
          selectionName: meta?.selectionName ?? "Selection",
          odds: odds?.[`${item.conditionId}-${item.outcomeId}`] ?? 1,
        };
      });
      placeBet({
        gameTitle: `Combo (${items.length} legs)`,
        marketName: "Combo",
        selectionName: `${items.length} selections`,
        odds: totalOdds,
        amount: +amount,
        gameStartsAt: latestStart || undefined,
        legs,
      });
    }

    clear();
    setIsPlacing(false);
    setJustBet(true);
    setTimeout(() => setJustBet(false), 2000);
    toast(
      isCombo ? `Combo bet placed!` : "Bet placed!",
      "bet-placed",
      `Stake: ${amount} ${currency} · Potential win: ${possibleWin} ${currency}`
    );
  };

  return (
    <aside className={isMobile ? "flex flex-col" : "w-[320px] shrink-0 border-l border-border-primary flex flex-col"}>
      {/* Tabs — pill style */}
      <div className="flex items-center gap-1 px-3 py-2">
        {!isMobile && <CollapseToggle />}
        <button
          onClick={() => setTab("betslip")}
          className={`flex-1 h-8 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer ${
            tab === "betslip"
              ? "bg-bg-input text-text-primary"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          Betslip{items.length > 0 ? ` (${items.length})` : ""}
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 h-8 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer ${
            tab === "history"
              ? "bg-bg-input text-text-primary"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          My Bets
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <BettingErrorBoundary>
        {tab === "history" ? (
          <>
          <BetSummaryCard />
          {isWalletConnected ? <BetHistory /> : <PlayBetHistory />}
          </>
        ) : isWalletConnected ? (
          /* Real blockchain betslip when wallet connected */
          <Betslip />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            {justBet ? (
              <>
                <div className="w-10 h-10 rounded-full bg-status-win/10 flex items-center justify-center mb-3">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5 10L8.5 13.5L15 7" stroke="var(--status-win)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-[13px] font-semibold text-status-win">Bet placed!</p>
                <p className="text-[12px] text-text-muted mt-1">Check My Bets to see results</p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-bg-input flex items-center justify-center mb-3">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-text-muted">
                    <rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 7H12M8 10H12M8 13H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-[13px] font-semibold text-text-secondary">No selections yet</p>
                <p className="text-[12px] text-text-muted mt-1 mb-4">Tap any odds button to get started</p>

                {/* Quick guide */}
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
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Header — combo/singles toggle */}
            <div className="flex items-center justify-between px-3 py-3">
              {items.length > 1 ? (
                <div className="flex items-center gap-1 bg-bg-surface rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setBetMode("combo")}
                    className={`odds-glass h-7 px-3 rounded-md text-[12px] font-semibold cursor-pointer ${
                      betMode === "combo" && canCombo
                        ? "odds-glass-active text-white"
                        : ""
                    } ${!canCombo ? "opacity-40 cursor-not-allowed" : ""}`}
                    disabled={!canCombo}
                  >
                    Combo ({items.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBetMode("singles")}
                    className={`odds-glass h-7 px-3 rounded-md text-[12px] font-semibold cursor-pointer ${
                      betMode === "singles" || !canCombo
                        ? "odds-glass-active text-white"
                        : ""
                    }`}
                  >
                    Singles
                  </button>
                </div>
              ) : (
                <span className="text-[13px] font-semibold text-text-primary">Single Bet</span>
              )}
              <button
                onClick={handleClear}
                className={`text-[11px] transition-colors cursor-pointer ${
                  clearConfirm
                    ? "text-red-400 hover:text-red-300 font-semibold"
                    : "text-text-muted hover:text-status-loss"
                }`}
              >
                {clearConfirm ? "Confirm clear?" : "Clear all"}
              </button>
            </div>

            {/* Selection cards */}
            <PlayScrollMask>
              <div className="flex flex-col gap-2 px-3 max-h-[300px] overflow-y-auto" data-scroll-inner>
                {items.map((item) => {
                  const oddsKey = `${item.conditionId}-${item.outcomeId}`;
                  return (
                    <PlayBetslipCard
                      key={oddsKey}
                      item={item}
                      odds={odds?.[oddsKey]}
                      onRemove={() => removeItem(item)}
                    />
                  );
                })}
              </div>
            </PlayScrollMask>

            {/* Combo summary bar */}
            {isCombo && totalOdds && (
              <div className="mx-3 mt-2 p-2.5 rounded-lg bg-accent-muted border border-accent/10">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-text-secondary font-medium">
                    {items.length} legs combined
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted tabular-nums">
                      {((1 / totalOdds) * 100).toFixed(1)}% prob
                    </span>
                    <span className="font-bold text-accent tabular-nums">
                      {formatOdds(totalOdds)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Stake + place bet area */}
            <div className="px-3 pt-3 pb-4">
              {/* Amount input */}
              <div className="relative mb-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  placeholder="0.00"
                  min="0"
                  className={`w-full h-10 px-3 pr-16 rounded-lg bg-bg-input text-text-primary text-[14px] font-semibold outline-none transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                    isOverBalance
                      ? "border border-red-500/40 focus:border-red-500/60"
                      : "border border-border-input focus:border-accent/50"
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-text-muted">
                  {currency}
                </span>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-1.5 mb-3">
                {["10", "25", "50", "100", "250"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(v)}
                    disabled={+v > balance}
                    className={`flex-1 h-10 lg:h-7 rounded-md text-[12px] font-semibold transition-colors ${
                      amount === v
                        ? "bg-accent-muted text-accent"
                        : +v > balance
                          ? "bg-border-subtle text-text-muted cursor-not-allowed"
                          : "bg-bg-input text-text-secondary hover:bg-bg-active"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Bet summary breakdown */}
              <div className="flex flex-col gap-1 mb-3 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">
                    {!isCombo && items.length > 1 ? "Stake per bet" : "Stake"}
                  </span>
                  <span className="text-text-secondary tabular-nums">{amount || "0"} {currency}</span>
                </div>
                {!isCombo && items.length > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Total Stake</span>
                    <span className="text-text-secondary tabular-nums">
                      {(+amount * items.length).toFixed(2)} {currency}
                    </span>
                  </div>
                )}
                {isCombo && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Total Odds</span>
                    <span className="font-semibold text-text-primary tabular-nums">
                      {formatOdds(totalOdds)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">
                    {!isCombo && items.length > 1 ? "Max Potential Win" : "Potential Win"}
                  </span>
                  <span className="font-semibold text-accent tabular-nums">
                    {!isCombo && items.length > 1
                      ? items.reduce((sum, item) => {
                          const key = `${item.conditionId}-${item.outcomeId}`;
                          return sum + (odds?.[key] ?? 1) * +amount;
                        }, 0).toFixed(2)
                      : possibleWin
                    } {currency}
                  </span>
                </div>
                {isCombo && totalOdds && +amount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Profit</span>
                    <span className="font-semibold text-accent tabular-nums">
                      +{(totalOdds * +amount - +amount).toFixed(2)} {currency}
                    </span>
                  </div>
                )}
              </div>

              {/* Balance warning */}
              {isOverBalance && (
                <div className="flex items-center gap-1.5 text-[11px] text-status-loss/80 mb-2 px-2 py-1.5 rounded-lg bg-red-500/[0.06] border border-red-500/10">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="shrink-0">
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 5V9M8 11V11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span>Insufficient balance ({balance.toFixed(2)} {currency})</span>
                </div>
              )}

              {/* Place bet button */}
              <button
                onClick={handlePlaceBet}
                disabled={!items.length || !+amount || isOverBalance || isOddsFetching || isPlacing}
                className="odds-glass odds-glass-active w-full h-11 rounded-lg font-semibold text-[14px] text-white cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.99]"
              >
                {isCombo
                  ? `Place Combo (${items.length})`
                  : items.length > 1
                    ? `Place ${items.length} Singles`
                    : "Place Bet"
                }
              </button>
            </div>
          </div>
        )}
        </BettingErrorBoundary>
      </div>
      <BetConfirmModal
        open={showConfirm}
        data={confirmData}
        onConfirm={executePlace}
        onCancel={() => { setShowConfirm(false); setConfirmData(null); }}
      />
    </aside>
  );
}
