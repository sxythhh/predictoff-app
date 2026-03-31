"use client";

import { useRef, useCallback, useState, useEffect, memo } from "react";
import {
  useSports,
  useLive,
  useActiveMarkets,
  useBaseBetslip,
  useSelectionOdds,
} from "@azuro-org/sdk";
import { GameOrderBy, GameState, type GameData, type MarketOutcome } from "@azuro-org/toolkit";
import { setBetslipMeta, clearBetslipMeta } from "./betslip-meta";
import { useOpenGame } from "./GameModal";
import { useImageColor, darkenColor, colorFromName, hslToRgb, lightenColor } from "./useImageColor";
import { useTheme } from "@/components/ui/theme";
import { useLiveScore } from "./LiveStats";
import { TeamLogo } from "./TeamLogo";
import { SportFallbackIcon } from "./SportFallbackIcon";
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

/* ── Odds Button ── */

function OddsBtn({
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

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
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
      className={`odds-glass flex-1 flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
        isActive ? "odds-glass-active" : ""
      }`}
    >
      <span className={`text-[11px] ${isActive ? "text-white/70" : "text-text-secondary"}`}>
        {outcome.selectionName}
      </span>
      <span className={`text-sm font-semibold ${isActive ? "text-white" : "text-text-primary"}`}>
        {formatOdds(odds)}
      </span>
    </button>
  );
}

/* ── Event Card Markets ── */

const EventCardMarkets = memo(function EventCardMarkets({ game }: { game: GameData }) {
  const { data: markets, isFetching } = useActiveMarkets({
    gameId: game.gameId,
  });

  if (isFetching || !markets?.length) {
    return (
      <div className="p-3 pt-2">
        <div className="text-[11px] text-text-secondary text-center mb-2">Loading...</div>
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-9 rounded-lg animate-pulse" style={{ background: "var(--border-subtle)" }} />
          ))}
        </div>
      </div>
    );
  }

  const firstMarket = markets[0];
  if (!firstMarket?.conditions?.[0]) return null;
  const condition = firstMarket.conditions[0];

  return (
    <div className="p-3 pt-2">
      <div className="text-[11px] text-text-secondary text-center mb-2">{firstMarket.name}</div>
      <div className="flex gap-1">
        {condition.outcomes.slice(0, 3).map((outcome) => (
          <OddsBtn key={outcome.outcomeId} outcome={outcome} game={game} marketName={firstMarket.name} />
        ))}
      </div>
    </div>
  );
});

/* ── Countdown Timer ── */

const CountdownTimer = memo(function CountdownTimer({ startsAt }: { startsAt: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const diff = startsAt * 1000 - now;
  if (diff <= 0) return null;

  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center justify-center w-[26px] h-[24px] rounded bg-bg-surface text-[13px] font-inter font-medium text-text-primary">
        {pad(hours)}
      </div>
      <span className="text-[13px] font-medium text-text-muted">:</span>
      <div className="flex items-center justify-center w-[26px] h-[24px] rounded bg-bg-surface text-[13px] font-inter font-medium text-text-primary">
        {pad(minutes)}
      </div>
      <span className="text-[13px] font-medium text-text-muted">:</span>
      <div className="flex items-center justify-center w-[26px] h-[24px] rounded bg-bg-surface text-[13px] font-inter font-medium text-text-primary">
        {pad(seconds)}
      </div>
    </div>
  );
});

/* ── Event Card with hover expand ── */

const LiveEventCard = memo(function LiveEventCard({ game }: { game: GameData }) {
  const { participants, startsAt } = game;
  const openGame = useOpenGame();
  const liveData = useLiveScore(game);
  const date = new Date(+startsAt * 1000);
  const timeStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const hourStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  const team1 = participants[0]?.name ?? "Team 1";
  const team2 = participants[1]?.name ?? "Team 2";
  const team1Img = participants[0]?.image;
  const team2Img = participants[1]?.image;
  const leagueInfo = game.league ? `${game.country?.name ?? ""} \u00b7 ${game.league.name}` : "";

  // Extract dominant colors from team logos, fallback to name-based color
  const imgColor1 = useImageColor(team1Img);
  const imgColor2 = useImageColor(team2Img);
  const nameColor1 = hslToRgb(colorFromName(team1));
  const nameColor2 = hslToRgb(colorFromName(team2));
  const c1 = imgColor1 ?? nameColor1;
  const c2 = imgColor2 ?? nameColor2;
  const d1 = darkenColor(c1, 0.5);
  const d2 = darkenColor(c2, 0.5);

  // Team colors in top corners — team1 top-left, team2 top-right
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const base = isDark ? "#111111" : "var(--bg-card)";
  const g1 = isDark ? d1 : lightenColor(c1, 0.55);
  const g2 = isDark ? d2 : lightenColor(c2, 0.55);
  // Team color gradients — smooth falloff, clear center
  const a1 = g1.replace('rgb(', 'rgba(').replace(')', ',');
  const a2 = g2.replace('rgb(', 'rgba(').replace(')', ',');
  const teamGradient = `radial-gradient(circle at 0% 0%, ${a1}0.85) 0%, ${a1}0.4) 20%, ${a1}0.1) 38%, transparent 55%), radial-gradient(circle at 100% 0%, ${a2}0.85) 0%, ${a2}0.4) 20%, ${a2}0.1) 38%, transparent 55%), ${base}`;

  return (
    <div className={`verified-card-hover rounded-xl bg-bg-card w-[280px] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:group-hover/card:z-30 transition-transform duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)] lg:group-hover/card:scale-[1.01] ${
      isDark ? "" : "ring-1 ring-black/[0.04]"
    }`}>
      {/* Team color gradient top — clickable, with border */}
      <div onClick={() => openGame(game.gameId)} className="cursor-pointer">
        <div className="event-card-border relative h-[140px] flex flex-col items-center justify-center px-3 rounded-t-xl overflow-hidden" style={{ background: teamGradient }}>
          {leagueInfo && (
            <div className="text-[11px] text-text-secondary mb-3 truncate max-w-full">{leagueInfo}</div>
          )}
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 px-3">
            {/* Team 1 — logo + name */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 shrink-0">
                <TeamLogo src={team1Img} name={team1} className="w-10 h-10 object-contain" fallback={<SportFallbackIcon sportSlug={game.sport?.slug} className="w-10 h-10 text-text-muted" />} />
              </div>
              <span className="text-[11px] text-text-primary text-center leading-tight line-clamp-2">{team1}</span>
            </div>

            {/* Center — score / countdown / time */}
            <div className="text-center flex flex-col items-center justify-center pt-2">
              {liveData?.score ? (
                <>
                  <div className="text-[20px] font-bold text-text-primary tabular-nums leading-tight">
                    {liveData.score.home}<span className="text-text-muted mx-0.5">-</span>{liveData.score.away}
                  </div>
                  {liveData.clock && (
                    <div className="text-[11px] font-semibold text-status-live tabular-nums">{liveData.clock}</div>
                  )}
                </>
              ) : (+startsAt * 1000 - Date.now() > 0 && +startsAt * 1000 - Date.now() < 6 * 3_600_000) ? (
                <CountdownTimer startsAt={+startsAt} />
              ) : (
                <>
                  <div className="text-[11px] text-text-secondary leading-tight">{timeStr}</div>
                  <div className="text-[11px] text-text-secondary">{hourStr}</div>
                </>
              )}
            </div>

            {/* Team 2 — logo + name */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 shrink-0">
                <TeamLogo src={team2Img} name={team2} className="w-10 h-10 object-contain" fallback={<SportFallbackIcon sportSlug={game.sport?.slug} className="w-10 h-10 text-text-muted" />} />
              </div>
              <span className="text-[11px] text-text-primary text-center leading-tight line-clamp-2">{team2}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Odds + expand area — bordered on sides and bottom */}
      <div className="border-x border-b border-border-subtle rounded-b-xl">
        <EventCardMarkets game={game} />

        {/* Hover expand: "View all markets" button */}
        <div className="grid grid-rows-[0fr] lg:group-hover/card:grid-rows-[1fr] lg:transition-[grid-template-rows] verified-expand">
          <div className="overflow-hidden opacity-0 lg:group-hover/card:opacity-100 lg:transition-opacity verified-expand-ease" style={{ "--expand-stagger": "20ms" } as React.CSSProperties}>
            <div className="px-3 pb-3">
              <button
                onClick={() => openGame(game.gameId)}
                className="w-full flex items-center justify-center h-8 rounded-lg bg-bg-active hover:bg-bg-input text-[12px] font-semibold text-text-primary transition-colors cursor-pointer"
              >
                View all markets
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

/* ── Scroll Nav Buttons ── */

function ScrollNavButtons({ scrollRef }: { scrollRef: React.RefObject<HTMLDivElement | null> }) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [scrollRef, updateScrollState]);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 292; // 280px card + 12px gap
    el.scrollBy({ left: direction === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
  }, [scrollRef]);

  return (
    <div className="flex items-center gap-1 pl-1">
      <button
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
        className={`w-[26px] h-[26px] rounded-lg border flex items-center justify-center transition-colors ${
          canScrollLeft
            ? "border-border-primary text-text-secondary hover:bg-bg-hover cursor-pointer"
            : "border-border-subtle text-text-muted/40 cursor-default"
        }`}
      >
        <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
          <path d="M5.75625 9.75559C6.08125 9.43059 6.08125 8.90559 5.75625 8.58059L2.52375 5.34684L5.75625 2.11309C5.8334 2.03594 5.8946 1.94435 5.93636 1.84354C5.97811 1.74274 5.9996 1.6347 5.9996 1.52559C5.9996 1.41648 5.97811 1.30844 5.93636 1.20764C5.8946 1.10684 5.8334 1.01524 5.75625 0.938094C5.6791 0.860942 5.58751 0.799743 5.4867 0.757989C5.3859 0.716235 5.27786 0.694744 5.16875 0.694744C5.05964 0.694744 4.9516 0.716235 4.8508 0.757989C4.74999 0.799743 4.6584 0.860942 4.58125 0.938094L0.75625 4.76309C0.43125 5.08809 0.43125 5.61309 0.75625 5.93809L4.58125 9.76309C4.7389 9.9163 4.95046 10.0014 5.17029 10C5.39011 9.99858 5.60057 9.9108 5.75625 9.75559Z" fill="currentColor"/>
        </svg>
      </button>
      <button
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
        className={`w-[26px] h-[26px] rounded-lg border flex items-center justify-center transition-colors ${
          canScrollRight
            ? "border-border-primary text-text-secondary hover:bg-bg-hover cursor-pointer"
            : "border-border-subtle text-text-muted/40 cursor-default"
        }`}
      >
        <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
          <path d="M0.24375 0.244407C-0.08125 0.569407 -0.08125 1.09441 0.24375 1.41941L3.47625 4.65316L0.24375 7.88691C0.166598 7.96406 0.105399 8.05565 0.0636444 8.15646C0.0218903 8.25726 0.000399724 8.3653 0.000399724 8.47441C0.000399723 8.58352 0.0218903 8.69156 0.0636444 8.79236C0.105399 8.89316 0.166598 8.98476 0.24375 9.06191C0.320902 9.13906 0.412494 9.20026 0.513298 9.24201C0.614101 9.28377 0.722142 9.30526 0.83125 9.30526C0.940359 9.30526 1.0484 9.28377 1.1492 9.24201C1.25001 9.20026 1.3416 9.13906 1.41875 9.06191L5.24375 5.23691C5.56875 4.91191 5.56875 4.38691 5.24375 4.06191L1.41875 0.236907C1.2611 0.083698 1.04954 -0.00138606 0.829714 1.7083e-05C0.609888 0.00142023 0.399427 0.0891981 0.24375 0.244407Z" fill="currentColor"/>
        </svg>
      </button>
    </div>
  );
}

/* ── Main Component ── */

export function LiveTopEvents() {
  const { isLive } = useLive();
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0, hasDragged: false, pointerId: -1 });
  const prevGamesRef = useRef<GameData[]>([]);

  // Only use pointer-drag on non-touch (desktop); let native touch scroll work on mobile
  const isTouch = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return; // let native scroll handle it
    const ds = dragState.current;
    ds.isDown = true;
    ds.startX = e.clientX;
    ds.scrollLeft = scrollRef.current?.scrollLeft ?? 0;
    ds.hasDragged = false;
    ds.pointerId = e.pointerId;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const ds = dragState.current;
    if (!ds.isDown) return;
    const dx = e.clientX - ds.startX;
    if (Math.abs(dx) > 5) {
      if (!ds.hasDragged) {
        ds.hasDragged = true;
        try { (e.currentTarget as HTMLElement).setPointerCapture(ds.pointerId); } catch {}
        (e.currentTarget as HTMLElement).style.cursor = "grabbing";
        (e.currentTarget as HTMLElement).classList.add("is-dragging");
      }
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = ds.scrollLeft - dx;
      }
    }
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const ds = dragState.current;
    if (ds.hasDragged) {
      try { (e.currentTarget as HTMLElement).releasePointerCapture(ds.pointerId); } catch {}
    }
    ds.isDown = false;
    (e.currentTarget as HTMLElement).classList.remove("is-dragging");
    (e.currentTarget as HTMLElement).style.cursor = "";
  }, []);

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (dragState.current.hasDragged) {
      e.stopPropagation();
      e.preventDefault();
      dragState.current.hasDragged = false;
    }
  }, []);

  const { data: sports, isFetching } = useSports({
    gameOrderBy: GameOrderBy.Turnover,
    filter: { maxGamesPerLeague: 3 },
    isLive,
    query: { refetchInterval: isLive ? 15_000 : 60_000 },
  });

  // Collect all games, attach league/country metadata, then pick the best 6
  const allGames: GameData[] = [];
  if (sports) {
    for (const sport of sports) {
      for (const country of sport.countries) {
        for (const league of country.leagues) {
          for (const game of league.games) {
            // Skip finished, canceled, or past prematch games
            if (game.state === GameState.Finished || game.state === GameState.Canceled) continue;
            if (game.state === GameState.Prematch && +game.startsAt * 1000 < Date.now()) continue;
            (game as any).league = league;
            (game as any).country = country;
            allGames.push(game);
          }
        }
      }
    }
  }

  // Sort by turnover (highest first), then pick top 6 with variety:
  // max 2 per sport, max 1 per league
  allGames.sort((a, b) => Number(b.turnover ?? 0) - Number(a.turnover ?? 0));
  const topGames: GameData[] = [];
  const seenLeagues = new Set<string>();
  const sportCount = new Map<string, number>();
  const MAX_PER_SPORT = 2;
  for (const game of allGames) {
    const leagueKey = (game as any).league?.slug ?? "";
    const sportKey = game.sport?.slug ?? "";
    if (seenLeagues.has(leagueKey)) continue;
    const sc = sportCount.get(sportKey) ?? 0;
    if (sc >= MAX_PER_SPORT) continue;
    seenLeagues.add(leagueKey);
    sportCount.set(sportKey, sc + 1);
    topGames.push(game);
    if (topGames.length >= 6) break;
  }
  // If we don't have 6 yet (strict limits), fill remaining from leftover sorted games
  if (topGames.length < 6) {
    const topIds = new Set(topGames.map((g) => g.gameId));
    for (const game of allGames) {
      if (topIds.has(game.gameId)) continue;
      const leagueKey = (game as any).league?.slug ?? "";
      if (seenLeagues.has(leagueKey)) continue;
      seenLeagues.add(leagueKey);
      topGames.push(game);
      if (topGames.length >= 6) break;
    }
  }

  // Cache previous games to show during fetch (avoids skeleton flash)
  if (topGames.length > 0) {
    prevGamesRef.current = topGames;
  }
  const displayGames = topGames.length > 0 ? topGames : prevGamesRef.current;

  // Only show skeletons on first load
  if (isFetching && displayGames.length === 0) {
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-3 px-2">
          <h2 className="text-lg font-semibold">Top Events</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pl-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-[280px] h-[260px] shrink-0 bg-bg-card rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!displayGames.length) return null;

  return (
    <div className={`mt-4 relative transition-opacity duration-200 ${isFetching ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
      <div className="flex items-center justify-between mb-3 px-2">
        <h2 className="text-lg font-semibold">Top Events</h2>
        <div className="hidden lg:block">
          <ScrollNavButtons scrollRef={scrollRef} />
        </div>
      </div>

      {/* Drag-to-scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto select-none pt-8 -mt-8 pb-28 -mb-28 pl-2 scrollbar-hide touch-auto lg:touch-pan-y scroll-pl-2 "
        style={{ overscrollBehaviorX: "contain" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
      >
        {displayGames.map((game) => (
          <div
            key={game.gameId}
            className="group/card card-wrapper relative w-[280px] h-[260px] shrink-0 text-left lg:hover:z-30 cursor-pointer top-events-card-perf"
          >
            <LiveEventCard game={game} />
          </div>
        ))}
      </div>
    </div>
  );
}
