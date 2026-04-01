"use client";

import { memo } from "react";
import {
  useActiveMarkets,
  useBaseBetslip,
  useSelectionOdds,
  useConditionState,
  useBetsSummaryBySelection,
  useResolvedMarkets,
} from "@azuro-org/sdk";
import { useAccount } from "wagmi";
import { GameState, type GameData, type MarketOutcome } from "@azuro-org/toolkit";
import { setBetslipMeta, clearBetslipMeta } from "../betslip-meta";
import { useOddsFormat } from "../OddsFormatContext";

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

/* ── Odds Button (glass-styled) ── */

function GlassOddsButton({
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
      <span className={`relative text-[12px] font-medium ${isActive ? "text-white/70" : "text-text-secondary"}`}>
        {outcome.selectionName}
      </span>
      <span className={`relative flex items-center gap-1.5 ${isActive ? "text-white" : ""}`}>
        {sentimentPct != null && sentimentPct > 0 && (
          <span className="text-[10px] text-text-muted font-normal">{sentimentPct}%</span>
        )}
        {formatOdds(odds)}
      </span>
    </button>
  );
}

/* ── Active Markets ── */

const ActiveMarketsContent = memo(function ActiveMarketsContent({ game }: { game: GameData }) {
  const { data: markets, isFetching } = useActiveMarkets({ gameId: game.gameId });
  const { address } = useAccount();
  const { data: sentiment } = useBetsSummaryBySelection({
    account: address ?? ("0x" as `0x${string}`),
    gameId: game.gameId,
    gameState: game.state as any,
    query: { enabled: !!address },
  });

  if (isFetching) {
    return (
      <div className="flex flex-col gap-3 px-4 pb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="stats-glass rounded-xl p-4">
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
      <div className="text-center py-10 px-4">
        <p className="text-text-muted text-sm">
          {isFinished
            ? "This game has ended — check resolved markets below"
            : "No markets available yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      {markets.map((market) => (
        <div key={market.name} className="stats-glass rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle/50">
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
                    condition.outcomes.length === 2
                      ? "grid-cols-2"
                      : condition.outcomes.length === 3
                        ? "grid-cols-3"
                        : "grid-cols-2 sm:grid-cols-3"
                  }`}
                >
                  {condition.outcomes.map((outcome, oi) => (
                    <GlassOddsButton
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
});

/* ── Resolved Markets ── */

const ResolvedMarketsContent = memo(function ResolvedMarketsContent({ game }: { game: GameData }) {
  const { formatOdds } = useOddsFormat();
  const { data: markets, isFetching } = useResolvedMarkets({ gameId: game.gameId });

  if (isFetching) {
    return (
      <div className="flex flex-col gap-3 px-4 pb-4">
        {[1, 2].map((i) => (
          <div key={i} className="stats-glass rounded-xl p-4">
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
    return <div className="text-center py-10 text-text-muted text-sm">No resolved markets</div>;
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      {markets.map((market: any) => (
        <div key={market.name} className="stats-glass rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle/50">
            <span className="text-[13px] font-semibold text-text-primary">{market.name}</span>
            <span className="text-[11px] text-text-muted ml-2">Settled</span>
          </div>
          <div className="p-3 flex flex-col gap-2">
            {market.conditions?.map((condition: any, ci: number) => (
              <div
                key={ci}
                className={`grid gap-2 ${
                  condition.outcomes?.length === 2
                    ? "grid-cols-2"
                    : condition.outcomes?.length === 3
                      ? "grid-cols-3"
                      : "grid-cols-2 sm:grid-cols-3"
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
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                            <path d="M13.3 4.5L6.5 11.3L2.7 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
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
});

/* ── Exports ── */

export const ModalMarkets = memo(function ModalMarkets({ game }: { game: GameData }) {
  const isFinished = game.state === GameState.Finished || game.state === GameState.Canceled;

  return (
    <div className="pt-2">
      {isFinished ? (
        <ResolvedMarketsContent game={game} />
      ) : (
        <ActiveMarketsContent game={game} />
      )}
    </div>
  );
});
