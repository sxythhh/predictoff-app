"use client";

import { use } from "react";
import Link from "next/link";
import {
  useGame,
  useActiveMarkets,
  useGameState,
  useBaseBetslip,
  useSelectionOdds,
} from "@azuro-org/sdk";
import { GameState, type GameData, type MarketOutcome } from "@azuro-org/toolkit";
import { PlayBetslip } from "@/components/waliet/PlayBetslip";
import { setBetslipMeta, clearBetslipMeta } from "@/components/waliet/betslip-meta";
import { useLiveScore, LiveStats } from "@/components/waliet/LiveStats";
import { MatchTracker } from "@/components/waliet/MatchTracker";
import { MatchInfo } from "@/components/waliet/MatchInfo";
import { useOddsFormat } from "@/components/waliet/OddsFormatContext";

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

function OddsButton({
  outcome,
  game,
  marketName,
}: {
  outcome: MarketOutcome;
  game: GameData;
  marketName: string;
}) {
  const { formatOdds } = useOddsFormat();
  const { data: odds } = useSelectionOdds({
    selection: outcome,
    initialOdds: outcome.odds,
  });
  const { items, addItem, removeItem } = useBaseBetslip();

  const isActive = items.some(
    (item) =>
      item.conditionId === outcome.conditionId &&
      item.outcomeId === outcome.outcomeId
  );

  const handleClick = () => {
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
      className={`odds-glass flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer ${
        isActive ? "odds-glass-active" : ""
      }`}
    >
      <span className={`text-[12px] font-medium ${isActive ? "text-white/70" : "text-text-secondary"}`}>
        {outcome.selectionName}
      </span>
      <span className={isActive ? "text-white" : ""}>{formatOdds(odds)}</span>
    </button>
  );
}

function AllMarkets({ game }: { game: GameData }) {
  const { data: markets, isFetching } = useActiveMarkets({
    gameId: game.gameId,
  });

  if (isFetching) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-bg-card rounded-lg p-4">
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
    return (
      <div className="text-center py-12 text-text-muted text-sm">
        No markets available for this game
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {markets.map((market) => (
        <div key={market.name} className="bg-bg-card rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle">
            <span className="text-[13px] font-semibold text-text-primary">
              {market.name}
            </span>
          </div>
          <div className="p-3 flex flex-col gap-2">
            {market.conditions.map((condition, ci) => (
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
                {condition.outcomes.map((outcome) => (
                  <OddsButton
                    key={outcome.outcomeId}
                    outcome={outcome}
                    game={game}
                    marketName={market.name}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  const { data: game, isLoading } = useGame({ gameId });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-page text-text-primary flex flex-col">
        <div className="h-14 flex items-center px-6 border-b border-border-primary">
          <div className="h-4 w-16 rounded bg-border-subtle animate-pulse" />
        </div>
        <div className="flex flex-1">
          <div className="flex-1 p-6">
            <div className="h-8 w-64 rounded bg-border-subtle animate-pulse mb-6" />
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-lg bg-border-subtle animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-bg-page text-text-primary flex flex-col items-center justify-center">
        <p className="text-xl font-semibold mb-2">Game not found</p>
        <Link href="/" className="text-accent text-sm hover:underline">
          ← Back to home
        </Link>
      </div>
    );
  }

  const date = new Date(+game.startsAt * 1000);
  const time = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  const dateStr = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const isLive = game.state === GameState.Live;

  return (
    <GamePageContent game={game} isLive={isLive} time={time} dateStr={dateStr} />
  );
}

function GamePageContent({ game, isLive, time, dateStr }: { game: GameData; isLive: boolean; time: string; dateStr: string }) {
  const liveData = useLiveScore(game, isLive);

  return (
    <div className="min-h-screen bg-bg-page text-text-primary flex flex-col" style={{ letterSpacing: "-0.02em" }}>
      {/* Header */}
      <header className="h-14 flex items-center px-3 lg:px-6 border-b border-border-primary shrink-0 gap-4">
        <Link href="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[14px] font-medium">Back</span>
        </Link>
        <div className="h-4 w-px bg-bg-active" />
        <span className="text-[13px] text-text-secondary truncate">
          {game.sport?.name} › {game.country?.name} › {game.league?.name}
        </span>
      </header>

      {/* Content with sidebars */}
      <div className="flex flex-1 justify-center overflow-hidden">
        <div className="w-full max-w-[1440px] flex h-[calc(100vh-56px)]">
          {/* Main content */}
          <main className="flex-1 min-w-0 overflow-y-auto p-3 lg:p-6">
          {/* Game header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[12px] text-text-muted">
                {game.country?.name} · {game.league?.name}
              </span>
              {isLive && (
                <span className="text-[11px] font-bold text-status-live bg-status-live/10 px-2 py-0.5 rounded uppercase">
                  Live
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 lg:gap-4 mb-3">
              {/* Team 1 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-bg-active flex items-center justify-center border border-border-primary text-sm font-bold text-text-secondary overflow-hidden">
                  {game.participants[0]?.image ? (
                    <img src={game.participants[0].image} alt={game.participants[0].name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (game.participants[0]?.name ?? "?").slice(0, 2).toUpperCase()
                  )}
                </div>
                <span className="text-[16px] font-semibold">{game.participants[0]?.name ?? "TBD"}</span>
              </div>

              {/* Score or vs */}
              {isLive && liveData?.score ? (
                <div className="flex flex-col items-center mx-2">
                  <span className="text-[24px] font-bold tabular-nums">
                    {liveData.score.home}<span className="text-text-muted mx-1">-</span>{liveData.score.away}
                  </span>
                  {liveData.clock && (
                    <span className="text-[12px] font-semibold text-status-live tabular-nums">{liveData.clock}</span>
                  )}
                </div>
              ) : (
                <span className="text-text-muted text-[14px] mx-2">vs</span>
              )}

              {/* Team 2 */}
              {game.participants[1] && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-bg-active flex items-center justify-center border border-border-primary text-sm font-bold text-text-secondary overflow-hidden">
                    {game.participants[1].image ? (
                      <img src={game.participants[1].image} alt={game.participants[1].name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      game.participants[1].name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <span className="text-[16px] font-semibold">{game.participants[1].name}</span>
                </div>
              )}
            </div>

            {/* Live stats (periods, possession, etc.) */}
            {isLive && <LiveStats game={game} />}

            <div className="flex items-center gap-2 text-[13px] text-text-secondary">
              {isLive ? (
                <span className="text-status-live font-semibold">Live{liveData?.clock ? ` · ${liveData.clock}` : ""}</span>
              ) : (
                <>
                  <span>{dateStr}</span>
                  <span className="text-text-muted">·</span>
                  <span>{time}</span>
                </>
              )}
            </div>
          </div>

          {/* Live Match Tracker */}
          {isLive && <MatchTracker game={game} />}

          {/* Match Info (Lineups, Standings, H2H) — API-Sports */}
          <MatchInfo game={game} />

          {/* All markets */}
          <AllMarkets game={game} />
        </main>

        {/* Betslip sidebar — hidden on mobile */}
        <div className="hidden lg:contents">
          <PlayBetslip />
        </div>
        </div>
      </div>
    </div>
  );
}
