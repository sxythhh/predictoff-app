"use client";

import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import {
  useGame,
  useActiveMarkets,
  useBaseBetslip,
  useSelectionOdds,
  useConditionState,
  useBetsSummaryBySelection,
  useResolvedMarkets,
} from "@azuro-org/sdk";
import { useAccount } from "wagmi";
import { GameState, type GameData, type MarketOutcome } from "@azuro-org/toolkit";
import { useWebHaptics } from "web-haptics/react";
import { setBetslipMeta, clearBetslipMeta } from "./betslip-meta";
import { TeamLogo } from "./TeamLogo";
import { SportFallbackIcon } from "./SportFallbackIcon";
import { GameComments } from "@/components/social/GameComments";
import { useOddsFormat } from "./OddsFormatContext";

function resolveSelectionName(raw: string, game: GameData): string {
  const home = game.participants?.[0]?.name;
  const away = game.participants?.[1]?.name;
  if (raw === "1" && home) return home;
  if (raw === "2" && away) return away;
  if (raw.toLowerCase() === "x") return "Draw";
  if (raw === "1X" && home) return `${home} or Draw`;
  if (raw === "X2" && away) return `Draw or ${away}`;
  if (raw === "12" && home && away) return `${home} or ${away}`;
  return raw;
}

/* ── Context: allows any component to open the game modal ── */
const GameModalContext = createContext<{ openGame: (id: string, siblingIds?: string[]) => void }>({
  openGame: () => {},
});

export function useOpenGame() {
  return useContext(GameModalContext).openGame;
}

export function GameModalProvider({
  children,
  openGame,
}: {
  children: React.ReactNode;
  openGame: (id: string, siblingIds?: string[]) => void;
}) {
  const haptic = useWebHaptics();
  const openGameWithHaptic = useCallback(
    (id: string, siblingIds?: string[]) => {
      haptic.trigger("medium");
      openGame(id, siblingIds);
    },
    [haptic, openGame]
  );

  return (
    <GameModalContext.Provider value={{ openGame: openGameWithHaptic }}>
      {children}
    </GameModalContext.Provider>
  );
}

/* ── Hook: interceptive game modal URL ── */

export function useGameModal() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [siblingIds, setSiblingIds] = useState<string[]>([]);
  const gameIdRef = useRef(gameId);
  const prevUrlRef = useRef<string | null>(null);
  gameIdRef.current = gameId;

  const open = useCallback((id: string, siblings?: string[]) => {
    if (gameIdRef.current) {
      window.history.replaceState({ gameModal: id }, "", `/game/${id}`);
    } else {
      prevUrlRef.current = window.location.pathname + window.location.search;
      window.history.pushState({ gameModal: id }, "", `/game/${id}`);
    }
    setGameId(id);
    setSiblingIds(siblings ?? []);
  }, []);

  const close = useCallback(() => {
    if (gameIdRef.current) {
      window.history.back();
    }
    setGameId(null);
    setSiblingIds([]);
  }, []);

  // Navigate to a sibling game within the carousel (replaceState, no back stack)
  const navigateToSibling = useCallback((id: string) => {
    window.history.replaceState({ gameModal: id }, "", `/game/${id}`);
    setGameId(id);
  }, []);

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (gameIdRef.current) {
        setGameId(null);
        setSiblingIds([]);
      }
      if (e.state?.gameModal) {
        setGameId(e.state.gameModal);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return { gameId, siblingIds, isOpen: gameId !== null, open, close, navigateToSibling };
}

/* ── Odds Button ── */

function ModalOddsButton({
  outcome,
  game,
  marketName,
  sentimentPct,
}: {
  outcome: MarketOutcome;
  game: GameData;
  marketName: string;
  sentimentPct?: number;
}) {
  const { formatOdds } = useOddsFormat();
  const { data: odds } = useSelectionOdds({
    selection: outcome,
    initialOdds: outcome.odds,
  });
  const { isLocked } = useConditionState({
    conditionId: outcome.conditionId,
  });
  const { items, addItem, removeItem } = useBaseBetslip();

  const isActive = items.some(
    (item) =>
      item.conditionId === outcome.conditionId &&
      item.outcomeId === outcome.outcomeId
  );

  const handleClick = () => {
    if (isLocked) return;
    const item = {
      conditionId: outcome.conditionId,
      outcomeId: outcome.outcomeId,
      gameId: game.gameId,
      isExpressForbidden: false,
    };
    if (isActive) {
      removeItem(item);
      clearBetslipMeta(outcome.conditionId, outcome.outcomeId);
    } else {
      setBetslipMeta(outcome.conditionId, outcome.outcomeId, {
        gameTitle: game.title,
        marketName,
        selectionName: resolveSelectionName(outcome.selectionName, game),
        sportName: game.sport?.name,
        leagueName: game.league?.name,
        startsAt: +game.startsAt,
        team1Name: game.participants?.[0]?.name,
        team2Name: game.participants?.[1]?.name,
        team1Image: game.participants?.[0]?.image ?? undefined,
        team2Image: game.participants?.[1]?.image ?? undefined,
      });
      addItem(item);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLocked}
      className={`odds-glass flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-semibold ${
        isLocked
          ? "opacity-40 cursor-not-allowed"
          : isActive
            ? "odds-glass-active cursor-pointer"
            : "cursor-pointer"
      }`}
    >
      {sentimentPct != null && sentimentPct > 0 && !isActive && (
        <div className="absolute inset-y-0 left-0 bg-accent/[0.06] pointer-events-none" style={{ width: `${sentimentPct}%` }} />
      )}
      <span className={`relative text-[12px] font-medium ${isActive ? "text-white/70" : "text-text-secondary"}`}>{outcome.selectionName}</span>
      <span className={`relative flex items-center gap-1.5 ${isActive ? "text-white" : ""}`}>
        {sentimentPct != null && sentimentPct > 0 && (
          <span className="text-[10px] text-text-muted font-normal">{sentimentPct}%</span>
        )}
        {formatOdds(odds)}
      </span>
    </button>
  );
}

/* ── All Markets Content ── */

function AllMarketsContent({ game }: { game: GameData }) {
  const { data: markets, isFetching } = useActiveMarkets({ gameId: game.gameId });
  const { address } = useAccount();
  const { data: sentiment } = useBetsSummaryBySelection({
    account: address ?? "0x" as `0x${string}`,
    gameId: game.gameId,
    gameState: game.state as any,
    query: { enabled: !!address },
  });

  if (isFetching) {
    return (
      <div className="flex flex-col gap-3 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-border-subtle rounded-lg p-4">
            <div className="h-5 w-32 rounded bg-border-subtle animate-pulse mb-3" />
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-10 rounded-lg bg-border-subtle animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!markets?.length) {
    const isFinished = game.state === GameState.Finished || game.state === GameState.Canceled;
    return (
      <div className="text-center py-12 px-4">
        <p className="text-text-muted text-sm">
          {isFinished
            ? "This game has ended — check resolved markets below"
            : "No markets available for this game yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-6 pt-0">
      {markets.map((market) => (
        <div key={market.name} className="bg-border-subtle rounded-lg overflow-hidden border border-border-subtle">
          <div className="px-4 py-3 border-b border-border-subtle">
            <span className="text-[13px] font-semibold text-text-primary">{market.name}</span>
          </div>
          <div className="p-3 flex flex-col gap-2">
            {market.conditions.map((condition, ci) => {
              const totals = condition.outcomes.map((o) => Number(sentiment?.[o.outcomeId] ?? 0));
              const totalSum = totals.reduce((a, b) => a + b, 0);
              return (
                <div
                  key={ci}
                  className={`grid gap-2 ${
                    condition.outcomes.length === 2 ? "grid-cols-2" :
                    condition.outcomes.length === 3 ? "grid-cols-3" :
                    "grid-cols-2 sm:grid-cols-3"
                  }`}
                >
                  {condition.outcomes.map((outcome, oi) => (
                    <ModalOddsButton
                      key={outcome.outcomeId}
                      outcome={outcome}
                      game={game}
                      marketName={market.name}
                      sentimentPct={totalSum > 0 ? Math.round((totals[oi] / totalSum) * 100) : undefined}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Resolved Markets ── */

function ResolvedMarketsContent({ game }: { game: GameData }) {
  const { formatOdds } = useOddsFormat();
  const { data: markets, isFetching } = useResolvedMarkets({ gameId: game.gameId });

  if (isFetching) {
    return (
      <div className="flex flex-col gap-3 p-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-border-subtle rounded-lg p-4">
            <div className="h-5 w-32 rounded bg-border-subtle animate-pulse mb-3" />
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((j) => <div key={j} className="h-10 rounded-lg bg-border-subtle animate-pulse" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!markets?.length) {
    return <div className="text-center py-12 text-text-muted text-sm">No resolved markets</div>;
  }

  return (
    <div className="flex flex-col gap-3 p-6 pt-0">
      {markets.map((market: any) => (
        <div key={market.name} className="bg-border-subtle rounded-lg overflow-hidden border border-border-subtle">
          <div className="px-4 py-3 border-b border-border-subtle">
            <span className="text-[13px] font-semibold text-text-primary">{market.name}</span>
            <span className="text-[11px] text-text-muted ml-2">Settled</span>
          </div>
          <div className="p-3 flex flex-col gap-2">
            {market.conditions?.map((condition: any, ci: number) => (
              <div
                key={ci}
                className={`grid gap-2 ${
                  condition.outcomes?.length === 2 ? "grid-cols-2" :
                  condition.outcomes?.length === 3 ? "grid-cols-3" :
                  "grid-cols-2 sm:grid-cols-3"
                }`}
              >
                {condition.outcomes?.map((outcome: any) => {
                  const isWon = outcome.isWon;
                  return (
                    <div
                      key={outcome.outcomeId}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-semibold ${
                        isWon
                          ? "bg-status-win/10 border border-status-win/20 text-status-win"
                          : "bg-bg-input text-text-muted opacity-60"
                      }`}
                    >
                      <span className="text-[12px] font-medium">{outcome.selectionName}</span>
                      <span className="flex items-center gap-1.5">
                        {formatOdds(outcome.odds)}
                        {isWon ? (
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M13.3 4.5L6.5 11.3L2.7 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Modal Component ── */

export function GameModal({
  gameId,
  onClose,
}: {
  gameId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { data: game, isLoading } = useGame({ gameId });
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimating(false));
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleExpand = () => {
    onClose();
    router.push(`/game/${gameId}`);
  };

  const isLive = game?.state === GameState.Live;
  const date = game ? new Date(+game.startsAt * 1000) : null;
  const time = date?.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  const dateStr = date?.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.85) 100%)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[720px] max-h-[85vh] mx-4 rounded-2xl overflow-hidden bg-bg-modal border border-border-subtle shadow-2xl"
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? "scale(0.95) translateY(10px)" : "none",
          transition: "transform 320ms cubic-bezier(0.16, 1, 0.3, 1), opacity 320ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Top bar with close + expand */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 bg-bg-modal/95 backdrop-blur-sm border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-input hover:bg-bg-active transition-colors text-text-primary"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            {game && (
              <span className="text-[12px] text-text-muted truncate">
                {game.sport?.name} › {game.league?.name}
              </span>
            )}
          </div>
          <button
            onClick={handleExpand}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-input hover:bg-bg-active transition-colors text-text-primary"
            title="Open full page"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M8.5 2H12V5.5M5.5 12H2V8.5M12 2L8 6M2 12L6 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[calc(85vh-60px)]">
          {isLoading ? (
            <div className="p-6 flex flex-col gap-4">
              <div className="h-8 w-64 rounded bg-border-subtle animate-pulse" />
              <div className="h-5 w-40 rounded bg-border-subtle animate-pulse" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-lg bg-border-subtle animate-pulse" />
              ))}
            </div>
          ) : !game ? (
            <div className="p-6 text-center text-text-muted">Game not found</div>
          ) : (
            <>
              {/* Game header */}
              <div className="px-6 pt-4 pb-5">
                <div className="flex items-center gap-6 mb-3">
                  {game.participants.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3">
                      <div className="w-10 h-10 shrink-0">
                        <TeamLogo src={p.image} name={p.name} className="w-10 h-10 object-contain" fallback={<SportFallbackIcon sportSlug={game.sport?.slug} className="w-8 h-8 text-text-muted" />} />
                      </div>
                      <span className="text-[16px] font-semibold">{p.name}</span>
                      {i === 0 && game.participants.length > 1 && (
                        <span className="text-text-muted text-[14px]">vs</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-[13px] text-text-secondary">
                  {isLive ? (
                    <span className="text-status-live font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-status-live animate-pulse" />
                      Live
                    </span>
                  ) : (
                    <>
                      <span>{dateStr}</span>
                      <span className="text-text-muted">·</span>
                      <span>{time}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Markets — active or resolved */}
              {game.state === GameState.Finished || game.state === GameState.Canceled ? (
                <ResolvedMarketsContent game={game} />
              ) : (
                <AllMarketsContent game={game} />
              )}

              {/* Comments */}
              <GameComments gameId={game.gameId} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
