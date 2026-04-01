"use client";

import { memo, useRef, useState, useEffect } from "react";
import { useActiveMarkets, useGameState, useBaseBetslip, useSelectionOdds } from "@azuro-org/sdk";
import { type GameData, GameState, type MarketOutcome } from "@azuro-org/toolkit";
import { LiveStats, useLiveScore } from "./LiveStats";
import { setBetslipMeta, clearBetslipMeta } from "./betslip-meta";
import { useFavorites } from "./useFavorites";
import { useOpenGame } from "./GameModal";
import { TeamLogo } from "./TeamLogo";
import { SportFallbackIcon } from "./SportFallbackIcon";
import { useOddsFormat } from "./OddsFormatContext";
import { useTick } from "@/hooks/useTick";

/** Resolve "1"→home team, "2"→away team, "X"→"Draw", otherwise keep original */
function resolveSelectionName(raw: string, game: GameData): string {
  const home = game.participants?.[0]?.name;
  const away = game.participants?.[1]?.name;
  if (raw === "1" && home) return home;
  if (raw === "2" && away) return away;
  if (raw.toLowerCase() === "x") return "Draw";
  // For "1X", "X2", "12" etc.
  if (raw === "1X" && home) return `${home} or Draw`;
  if (raw === "X2" && away) return `Draw or ${away}`;
  if (raw === "12" && home && away) return `${home} or ${away}`;
  return raw;
}

const OddsButton = memo(function OddsButton({
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

  const prevOdds = useRef(odds);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (prevOdds.current !== undefined && odds !== undefined && odds !== prevOdds.current) {
      setFlash(odds > prevOdds.current ? "up" : "down");
      const timer = setTimeout(() => setFlash(null), 600);
      prevOdds.current = odds;
      return () => clearTimeout(timer);
    }
    prevOdds.current = odds;
  }, [odds]);

  const { items, addItem, removeItem } = useBaseBetslip();

  const isActive = items.some(
    (item) =>
      item.conditionId === outcome.conditionId &&
      item.outcomeId === outcome.outcomeId
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      className={`odds-glass flex-1 flex items-center justify-center gap-2 h-[44px] lg:h-[38px] px-2 rounded-lg cursor-pointer ${
        isActive ? "odds-glass-active" : ""
      } ${flash === "up" ? "odds-increased" : flash === "down" ? "odds-decreased" : ""}`}
    >
      <span className={`text-[13px] font-normal tracking-tight ${isActive ? "text-white/70" : "text-text-secondary"}`}>
        {outcome.selectionName}
      </span>
      <span className={`text-[13px] font-bold tracking-tight ${isActive ? "text-white" : "text-text-primary"}`}>
        {formatOdds(odds)}
      </span>
    </button>
  );
});

const GameMarkets = memo(function GameMarkets({ game }: { game: GameData }) {
  const { data: markets, isFetching } = useActiveMarkets({
    gameId: game.gameId,
  });

  if (isFetching || !markets?.length) {
    return (
      <div className="flex gap-2 mt-1">
        <div className="flex-1">
          <div className="h-3 w-10 rounded bg-border-subtle mb-1.5" />
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 h-[38px] rounded bg-border-subtle animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show only the first market (1X2 / Match Winner)
  const market = markets[0];
  const condition = market?.conditions?.[0];
  if (!condition) return null;

  return (
    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
      <div className="text-[11px] text-text-muted mb-1.5 text-center">{market.name}</div>
      <div className="flex gap-1">
        {condition.outcomes.slice(0, 3).map((outcome) => (
          <OddsButton
            key={outcome.outcomeId}
            outcome={outcome}
            game={game}
            marketName={market.name}
          />
        ))}
      </div>
    </div>
  );
});

function useCountdown(startsAt: number) {
  const now = useTick();
  const startMs = startsAt * 1000;
  const diffMs = startMs - now;

  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffSeconds = Math.floor((diffMs % 60_000) / 1000);

  if (diffMs <= 0) return null; // already started
  if (diffMinutes < 1) return { label: `Starts in ${diffSeconds}s`, urgent: true };
  if (diffMinutes < 60) return { label: `Starts in ${diffMinutes}m ${diffSeconds}s`, urgent: true };
  if (diffHours < 24) return { label: `Starts in ${diffHours}h ${diffMinutes % 60}m`, urgent: false };
  return null; // more than 24h away
}

function GameTime({ startsAt, isLive }: { startsAt: string; isLive: boolean }) {
  const countdown = useCountdown(+startsAt);
  const date = new Date(+startsAt * 1000);
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  if (isLive) {
    return null;
  }

  if (countdown) {
    return (
      <span className={`text-[12px] font-semibold ${countdown.urgent ? "text-orange-400" : "text-yellow-400/80"}`}>
        {countdown.label}
      </span>
    );
  }

  // Check if today
  const today = new Date();
  const isToday = date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isToday) {
    return (
      <span className="text-[13px] font-semibold text-text-secondary">
        Today &middot; {time}
      </span>
    );
  }

  return (
    <>
      <span className="text-[13px] font-semibold text-text-secondary">{time}</span>
      <span className="text-[12px] text-text-muted">{dateStr}</span>
    </>
  );
}

export const GameCard = memo(function GameCard({ game, leagueUrl }: { game: GameData; leagueUrl: string }) {
  const { gameId, participants, startsAt } = game;
  const openGame = useOpenGame();

  const { data: state } = useGameState({
    gameId,
    initialState: game.state,
  });

  const isLive = state === GameState.Live;
  const liveData = useLiveScore(game, isLive);
  const { toggle, isFavorite } = useFavorites();
  const fav = isFavorite(gameId);

  const team1 = participants[0];
  const team2 = participants[1];

  return (
    <div
      className="bg-bg-modal rounded-xl border border-border-subtle/50 p-3 cursor-pointer flex flex-col game-card-shadow"
      onClick={() => openGame(gameId)}
    >
      {/* Top: time + live badge + favorite */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          {isLive && (
            <svg width="28" height="14" viewBox="0 0 32 32" fill="none" className="shrink-0">
              <path fillRule="evenodd" clipRule="evenodd" d="M5.15533 8.20547C2.94619 8.20547 1.15533 9.99633 1.15533 12.2055V20.2055C1.15533 22.4146 2.94619 24.2055 5.15533 24.2055H27.1553C29.3644 24.2055 31.1553 22.4146 31.1553 20.2055V12.2055C31.1553 9.99633 29.3644 8.20547 27.1553 8.20547H5.15533ZM3.15533 12.2055C3.15533 11.1009 4.05076 10.2055 5.15533 10.2055H27.1553C28.2599 10.2055 29.1553 11.1009 29.1553 12.2055V20.2055C29.1553 21.3101 28.2599 22.2055 27.1553 22.2055H5.15533C4.05076 22.2055 3.15533 21.3101 3.15533 20.2055V12.2055ZM8.04333 13.6055H6.15533V19.2055H10.5713V17.7415H8.04333V13.6055ZM13.6208 13.6055H11.7328V19.2055H13.6208V13.6055ZM21.1537 13.6055L18.7857 19.2055H16.9297L14.5617 13.6055H16.5937L17.9297 16.8775L19.2977 13.6055H21.1537ZM26.6376 19.2055V17.7815H23.8375V17.0455H26.2055V15.6855H23.8375V15.0295H26.5336V13.6055H21.9816V19.2055H26.6376Z" fill="#FE7C8C"/>
            </svg>
          )}
          <GameTime startsAt={startsAt} isLive={isLive} />
          {isLive && liveData?.clock && (
            <span className="text-[10px] font-bold text-status-live tabular-nums">{liveData.clock}</span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toggle(gameId); }}
          className={`w-6 h-6 flex items-center justify-center rounded-md cursor-pointer transition-colors ${fav ? "bg-yellow-400/15" : "hover:bg-bg-hover"}`}
          title={fav ? "Remove from favorites" : "Add to favorites"}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M5.62295 0.889986C6.18623 -0.29666 7.81373 -0.296663 8.377 0.889983L9.3505 2.94082C9.57417 3.41203 10.0065 3.73864 10.5067 3.81421L12.6835 4.14307C13.943 4.33336 14.446 5.94266 13.5345 6.86634L11.9594 8.46269C11.5975 8.82948 11.4323 9.35795 11.5178 9.87587L11.8896 12.1299C12.1048 13.4342 10.7881 14.4288 9.66154 13.813L7.71456 12.7488C7.2672 12.5043 6.73276 12.5043 6.2854 12.7488L4.33842 13.813C3.21186 14.4288 1.89519 13.4342 2.11034 12.1299L2.48218 9.87587C2.56762 9.35795 2.40247 8.82948 2.04055 8.46269L0.465411 6.86634C-0.445992 5.94266 0.0569295 4.33336 1.31646 4.14307L3.49325 3.81421C3.99341 3.73864 4.42578 3.41203 4.64946 2.94082L5.62295 0.889986Z" fill="currentColor" className={fav ? "text-yellow-400" : "text-text-muted"}/>
          </svg>
        </button>
      </div>

      {/* Teams + VS/Score */}
      <div className="flex items-center gap-3 mb-2">
        {/* Team 1 */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 shrink-0">
            <TeamLogo src={team1?.image} name={team1?.name ?? "?"} className="w-7 h-7 object-contain" fallback={<SportFallbackIcon sportSlug={game.sport?.slug} className="w-5 h-5 text-text-muted" />} />
          </div>
          <span className="text-[13px] font-medium text-text-primary truncate">{team1?.name ?? "TBD"}</span>
        </div>

        {/* VS or Score */}
        <div className="shrink-0 text-center min-w-[48px]">
          {isLive && liveData?.score ? (
            <span className="text-[16px] font-bold text-text-primary tabular-nums whitespace-nowrap">
              {liveData.score.home}<span className="text-text-muted mx-0.5">-</span>{liveData.score.away}
            </span>
          ) : isLive ? (
            <span className="text-[11px] font-semibold text-status-live uppercase">Live</span>
          ) : (
            <span className="font-ibm-plex text-[14px] font-bold italic text-text-muted">VS</span>
          )}
        </div>

        {/* Team 2 */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-[13px] font-medium text-text-primary truncate text-right">{team2?.name ?? "TBD"}</span>
          <div className="w-7 h-7 shrink-0">
            <TeamLogo src={team2?.image} name={team2?.name ?? "?"} className="w-7 h-7 object-contain" fallback={<SportFallbackIcon sportSlug={game.sport?.slug} className="w-5 h-5 text-text-muted" />} />
          </div>
        </div>
      </div>

      {/* Odds (single market) */}
      <div className="mt-auto">
        <GameMarkets game={game} />
      </div>
    </div>
  );
});
