"use client";

import { useState, createContext, useContext, useCallback } from "react";
import { useBaseBetslip, useDetailedBetslip, useChain } from "@azuro-org/sdk";
import { getBetslipMeta } from "./betslip-meta";
import { usePlayBalance, usePlacPlayBet, usePlayBets, PLAY_CURRENCY } from "./usePlayBalance";
import { BetConfirmModal, type BetConfirmData } from "./BetConfirmModal";
import { Betslip } from "./Betslip";
import { BetHistory } from "./BetHistory";
import { BetSummaryCard } from "./BetSummaryCard";

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

// Play mode context — allows toggling between play and real mode
const PlayModeContext = createContext<{
  isPlayMode: boolean;
  setPlayMode: (v: boolean) => void;
}>({ isPlayMode: true, setPlayMode: () => {} });

export function usePlayMode() {
  return useContext(PlayModeContext);
}

export function PlayModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isPlayMode, setPlayMode] = useState(true);
  return (
    <PlayModeContext.Provider value={{ isPlayMode, setPlayMode }}>
      {children}
    </PlayModeContext.Provider>
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
  const meta = getBetslipMeta(item.conditionId, item.outcomeId);

  return (
    <div className="odds-glass rounded-lg p-3 relative">
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 text-text-muted hover:text-status-loss transition-colors cursor-pointer"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path fillRule="evenodd" clipRule="evenodd" d="M7.83855 2.40883C8.14766 1.94517 8.66805 1.66667 9.2253 1.66667H10.7747C11.3319 1.66667 11.8523 1.94517 12.1614 2.40883L12.9167 3.54167H16.0417C16.3868 3.54167 16.6667 3.82149 16.6667 4.16667C16.6667 4.51185 16.3868 4.79167 16.0417 4.79167H3.95833C3.61315 4.79167 3.33333 4.51185 3.33333 4.16667C3.33333 3.82149 3.61315 3.54167 3.95833 3.54167H7.08333L7.83855 2.40883ZM12.5 18.3333H7.5C5.65905 18.3333 4.16666 16.841 4.16666 15V5.83333H15.8333V15C15.8333 16.841 14.3409 18.3333 12.5 18.3333ZM8.33333 8.54167C8.67851 8.54167 8.95833 8.82149 8.95833 9.16667V15C8.95833 15.3452 8.67851 15.625 8.33333 15.625C7.98815 15.625 7.70833 15.3452 7.70833 15L7.70833 9.16667C7.70833 8.82149 7.98815 8.54167 8.33333 8.54167ZM11.6667 8.54167C12.0118 8.54167 12.2917 8.82149 12.2917 9.16667V15C12.2917 15.3452 12.0118 15.625 11.6667 15.625C11.3215 15.625 11.0417 15.3452 11.0417 15V9.16667C11.0417 8.82149 11.3215 8.54167 11.6667 8.54167Z" fill="currentColor"/>
        </svg>
      </button>
      <div className="text-[11px] text-text-muted mb-1 truncate pr-6">
        {meta?.gameTitle ?? `Game ${item.gameId}`}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-text-primary truncate">
          {meta ? `${meta.marketName}: ${meta.selectionName}` : `#${item.outcomeId}`}
        </span>
        <span className="text-[13px] font-bold text-accent tabular-nums shrink-0">
          {odds?.toFixed(2) ?? "—"}
        </span>
      </div>
    </div>
  );
}

function PlayBetHistory() {
  const bets = usePlayBets();
  const { currency } = usePlayBalance();

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
                      {leg.odds.toFixed(2)}
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
                    {bet.odds.toFixed(2)}
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
  const { isPlayMode, setPlayMode } = usePlayMode();
  const [collapsed, setCollapsed] = useState(false);
  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  if (isMobileDrawer) {
    // Render without the sidebar wrapper for mobile drawer
    return (
      <BetslipCollapseContext.Provider value={{ collapsed: false, toggle: () => {} }}>
        {isPlayMode ? (
          <PlayBetslipInner isMobile />
        ) : (
          <RealBetslipSidebar onSwitchToPlay={() => setPlayMode(true)} isMobile />
        )}
      </BetslipCollapseContext.Provider>
    );
  }

  return (
    <BetslipCollapseContext.Provider value={{ collapsed, toggle }}>
      {collapsed ? (
        <CollapsedBetslip />
      ) : isPlayMode ? (
        <PlayBetslipInner />
      ) : (
        <RealBetslipSidebar onSwitchToPlay={() => setPlayMode(true)} />
      )}
    </BetslipCollapseContext.Provider>
  );
}

function RealBetslipSidebar({ onSwitchToPlay, isMobile }: { onSwitchToPlay: () => void; isMobile?: boolean }) {
  const [tab, setTab] = useState<"betslip" | "history">("betslip");

  return (
    <aside className={isMobile ? "flex flex-col" : "w-[320px] shrink-0 border-l border-border-primary flex flex-col"}>
      {/* Tabs — pill style */}
      <div className="flex gap-1 px-3 py-2 border-b border-border-primary">
        <button
          onClick={() => setTab("betslip")}
          className={`flex-1 h-8 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer ${
            tab === "betslip"
              ? "bg-bg-input text-text-primary"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          Betslip
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
        {tab === "betslip" ? <Betslip /> : <BetHistory />}
      </div>
    </aside>
  );
}

function PlayBetslipInner({ isMobile }: { isMobile?: boolean } = {}) {
  const { setPlayMode } = usePlayMode();
  const { items, removeItem, clear } = useBaseBetslip();
  const { odds, totalOdds, isOddsFetching } = useDetailedBetslip();
  const { balance, currency, reset } = usePlayBalance();
  const placeBet = usePlacPlayBet();
  const [amount, setAmount] = useState("10");
  const [tab, setTab] = useState<"betslip" | "history">("betslip");
  const [justBet, setJustBet] = useState(false);
  const [confirmData, setConfirmData] = useState<BetConfirmData | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [betMode, setBetMode] = useState<"combo" | "singles">("combo");

  const canCombo = items.length > 1 && !items.some((i) => i.isExpressForbidden);
  const isCombo = items.length > 1 && betMode === "combo" && canCombo;
  const possibleWin = totalOdds ? (totalOdds * +amount).toFixed(2) : "0.00";
  const isOverBalance = +amount > balance;

  const handlePlaceBet = () => {
    if (!items.length || !+amount || isOverBalance) return;

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
    setJustBet(true);
    setTimeout(() => setJustBet(false), 2000);
  };

  return (
    <aside className={isMobile ? "flex flex-col" : "w-[320px] shrink-0 border-l border-border-primary flex flex-col"}>
      {/* Tabs — pill style */}
      <div className="flex gap-1 px-3 py-2 border-b border-border-primary">
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
        {tab === "history" ? (
          <>
          <BetSummaryCard />
          <PlayBetHistory />
          </>
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
                <p className="text-[12px] text-text-muted mt-1">Click on odds to add to your betslip</p>
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
              <button onClick={clear} className="text-[11px] text-text-muted hover:text-status-loss transition-colors cursor-pointer">
                Clear all
              </button>
            </div>

            {/* Selection cards */}
            <div className="flex flex-col gap-2 px-3 max-h-[300px] overflow-y-auto">
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

            {/* Stake + place bet area */}
            <div className="px-3 pt-3 pb-4">
              {/* Amount input */}
              <div className="relative mb-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
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
                  <span className="text-text-muted">Stake</span>
                  <span className="text-text-secondary tabular-nums">{amount || "0"} {currency}</span>
                </div>
                {isCombo && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Total Odds</span>
                    <span className="font-semibold text-text-primary tabular-nums">
                      {totalOdds?.toFixed(2) ?? "—"}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Potential Win</span>
                  <span className="font-semibold text-accent tabular-nums">
                    {possibleWin} {currency}
                  </span>
                </div>
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
                disabled={!items.length || !+amount || isOverBalance || isOddsFetching}
                className="odds-glass odds-glass-active w-full h-11 rounded-lg font-semibold text-[14px] text-white cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.99]"
              >
                Place Bet
              </button>
            </div>
          </div>
        )}
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
