"use client";

import { useSportsNavigation, useLive } from "@azuro-org/sdk";
import { memo, useCallback, useMemo, type ComponentType } from "react";

type SportIconMap = Record<string, ComponentType<{ className?: string }>>;

export function LiveSportsNav({
  sportIcons,
  activeSport,
  onSportClick,
}: {
  sportIcons: SportIconMap;
  activeSport: string | null;
  onSportClick: (slug: string | null) => void;
}) {
  const { isLive } = useLive();
  const { data: sports, isFetching } = useSportsNavigation({ isLive });

  if (isFetching) {
    return (
      <div className="px-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-10 rounded-lg animate-pulse mb-1"
            style={{ background: "var(--border-subtle)" }}
          />
        ))}
      </div>
    );
  }

  const sportsOnly = useMemo(
    () => sports?.filter((s) => s.sporthub?.slug === "sports") ?? [],
    [sports]
  );

  const totalGames = useMemo(
    () =>
      sportsOnly.reduce(
        (sum, s) =>
          sum + (isLive ? s.activeLiveGamesCount : s.activePrematchGamesCount),
        0
      ),
    [sportsOnly, isLive]
  );

  const handleAllClick = useCallback(() => onSportClick(null), [onSportClick]);

  return (
    <div>
      <SportNavItem
        name="All Events"
        count={totalGames}
        iconKey="top"
        active={activeSport === null}
        sportIcons={sportIcons}
        onClick={handleAllClick}
      />
      {sportsOnly.map((sport) => {
        const gameCount = isLive
          ? sport.activeLiveGamesCount
          : sport.activePrematchGamesCount;

        return (
          <SportNavItem
            key={sport.slug}
            name={sport.name}
            count={gameCount}
            iconKey={sport.slug}
            active={activeSport === sport.slug}
            sportIcons={sportIcons}
            onClick={() => onSportClick(sport.slug)}
          />
        );
      })}
    </div>
  );
}

const SportNavItem = memo(function SportNavItem({
  name,
  count,
  iconKey,
  active,
  sportIcons,
  onClick,
}: {
  name: string;
  count: number;
  iconKey: string;
  active?: boolean;
  sportIcons: SportIconMap;
  onClick: () => void;
}) {
  const Icon = sportIcons[iconKey] ?? sportIcons["top"];
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 h-10 rounded-lg transition-colors cursor-pointer mx-auto ${
        active ? "bg-bg-surface" : "hover:bg-bg-surface/50"
      }`}
      style={{ width: "calc(100% - 8px)", marginLeft: 4, marginRight: 4 }}
    >
      {Icon && (
        <Icon className={active ? "text-accent" : "text-text-secondary"} />
      )}
      <span
        className="text-[13px] font-medium flex-1 text-left text-text-primary"
      >
        {name}
      </span>
      <span
        className={`text-[11px] min-w-[28px] text-right tabular-nums ${
          active
            ? "text-accent bg-accent-muted px-1.5 py-0.5 rounded font-semibold"
            : "text-text-muted font-medium"
        }`}
      >
        {count}
      </span>
    </button>
  );
});
