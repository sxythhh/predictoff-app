"use client";

import { memo } from "react";
import { GameState, type GameData } from "@azuro-org/toolkit";
import { TeamLogo } from "../TeamLogo";
import { SportFallbackIcon } from "../SportFallbackIcon";
import { useLiveScore } from "../LiveStats";
import { useTheme } from "@/components/ui/theme";

function CountdownInline({ startsAt }: { startsAt: number }) {
  const diff = startsAt * 1000 - Date.now();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");

  if (hours >= 24) {
    const d = new Date(startsAt * 1000);
    return (
      <span className="text-[13px] text-text-secondary">
        {d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
      </span>
    );
  }

  return (
    <span className="text-[15px] font-semibold text-text-primary font-inter tabular-nums">
      {pad(hours)}:{pad(minutes)}
    </span>
  );
}

export const ModalHeader = memo(function ModalHeader({
  game,
  onClose,
  onExpand,
  compact,
}: {
  game: GameData;
  onClose: () => void;
  onExpand: () => void;
  compact?: boolean;
}) {
  const liveData = useLiveScore(game);
  const isLive = game.state === GameState.Live;
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const team1 = game.participants?.[0];
  const team2 = game.participants?.[1];
  const leagueInfo = game.league?.name ?? game.sport?.name ?? "";
  const date = new Date(+game.startsAt * 1000);
  const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  const logoSize = compact ? "w-14 h-14" : "w-16 h-16";

  // Theme-aware text colors — dark mode uses white, light mode uses dark text
  const textPrimary = isDark ? "text-white" : "text-text-primary";
  const textSecondary = isDark ? "text-white/60" : "text-text-secondary";
  const textMuted = isDark ? "text-white/40" : "text-text-muted";
  const btnBg = isDark ? "bg-black/20 hover:bg-black/30 text-white/80" : "bg-white/40 hover:bg-white/50 text-text-primary";
  const fallbackColor = isDark ? "text-white/40" : "text-text-muted";

  return (
    <div className="relative overflow-hidden">

      {/* Top controls */}
      <div className="flex items-center justify-between px-4 pt-4 pb-0 relative z-10">
        <button
          onClick={onClose}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors backdrop-blur-sm ${btnBg}`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <span className={`text-[12px] font-medium ${textSecondary}`}>{leagueInfo}</span>
        <button
          onClick={onExpand}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors backdrop-blur-sm ${btnBg}`}
          title="Open full page"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M8.5 2H12V5.5M5.5 12H2V8.5M12 2L8 6M2 12L6 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Teams + Score */}
      <div className={`flex items-center justify-center gap-4 ${compact ? "px-4 pt-5 pb-7" : "px-6 pt-8 pb-10"}`}>
        {/* Team 1 */}
        <div className="flex-1 flex flex-col items-center gap-2.5">
          <div className={logoSize}>
            <TeamLogo
              src={team1?.image}
              name={team1?.name ?? ""}
              className={`${logoSize} object-contain`}
              fallback={<SportFallbackIcon sportSlug={game.sport?.slug} className={`${logoSize} ${fallbackColor}`} />}
            />
          </div>
          <div className="text-center">
            <div className={`text-[14px] font-semibold leading-tight ${textPrimary}`}>{team1?.name}</div>
          </div>
        </div>

        {/* Center: Score / Time */}
        <div className="flex flex-col items-center justify-center min-w-[70px]">
          {liveData?.score ? (
            <>
              <div className={`text-[32px] font-bold tabular-nums leading-none font-inter ${textPrimary}`}>
                {liveData.score.home}
                <span className={`mx-1.5 ${textMuted}`}>-</span>
                {liveData.score.away}
              </div>
              {liveData.clock && (
                <div className="text-[12px] font-semibold text-status-live tabular-nums mt-1.5">{liveData.clock}</div>
              )}
            </>
          ) : isLive ? (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-status-live animate-pulse" />
              <span className="text-[13px] font-semibold text-status-live">LIVE</span>
            </div>
          ) : (+game.startsAt * 1000 - Date.now() > 0 && +game.startsAt * 1000 - Date.now() < 24 * 3_600_000) ? (
            <CountdownInline startsAt={+game.startsAt} />
          ) : (
            <div className="flex flex-col items-center">
              <span className={`text-[13px] ${textSecondary}`}>
                {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              <span className={`text-[16px] font-semibold ${textPrimary}`}>{timeStr}</span>
            </div>
          )}
        </div>

        {/* Team 2 */}
        <div className="flex-1 flex flex-col items-center gap-2.5">
          <div className={logoSize}>
            <TeamLogo
              src={team2?.image}
              name={team2?.name ?? ""}
              className={`${logoSize} object-contain`}
              fallback={<SportFallbackIcon sportSlug={game.sport?.slug} className={`${logoSize} ${fallbackColor}`} />}
            />
          </div>
          <div className="text-center">
            <div className={`text-[14px] font-semibold leading-tight ${textPrimary}`}>{team2?.name}</div>
          </div>
        </div>
      </div>

      {/* Subtle bottom fade into content */}
      <div className={`absolute bottom-0 left-0 right-0 h-8 pointer-events-none ${isDark ? "bg-gradient-to-t from-black/10 to-transparent" : "bg-gradient-to-t from-white/10 to-transparent"}`} />
    </div>
  );
});
