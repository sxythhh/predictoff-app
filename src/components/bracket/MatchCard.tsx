"use client";

import type { BracketMatch } from "@/types/bracket";

export const MATCH_CARD_W = 260;
export const MATCH_CARD_H = 90;
const ARROW = 18;

function TeamRow({
  name,
  score,
  isWinner,
  teamId,
  onHover,
  position,
  status,
}: {
  name: string;
  score: number | null;
  isWinner: boolean;
  teamId: string | undefined;
  onHover: (id: string | null) => void;
  position: "top" | "bottom";
  status: "upcoming" | "live" | "completed";
}) {
  const clip = position === "top"
    ? `polygon(0 0, calc(100% - ${ARROW}px) 0%, 100% 100%, 0 100%)`
    : `polygon(0 0, 100% 0%, calc(100% - ${ARROW}px) 100%, 0 100%)`;

  const isLive = status === "live";
  const bg = isLive
    ? "linear-gradient(100deg, rgba(34,197,94,0.40) 0%, rgba(16,185,129,0.25) 50%, rgba(34,197,94,0.06) 100%)"
    : isWinner
      ? "linear-gradient(100deg, rgba(34,197,94,0.32) 0%, rgba(16,185,129,0.20) 50%, rgba(34,197,94,0.05) 100%)"
      : "linear-gradient(100deg, rgba(34,197,94,0.22) 0%, rgba(16,185,129,0.12) 50%, rgba(34,197,94,0.03) 100%)";

  return (
    <div
      className="bracket-team-row relative flex items-center gap-2.5 pl-3 pr-7 h-[34px] cursor-pointer"
      data-team-id={teamId}
      onMouseEnter={() => teamId && onHover(teamId)}
      onMouseLeave={() => onHover(null)}
      style={{ clipPath: clip, background: bg }}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${isWinner ? "bg-accent" : "bg-accent/30"}`} />

      {/* Logo placeholder */}
      <div className={`w-[22px] h-[22px] rounded-full shrink-0 flex items-center justify-center ${
        isWinner ? "bg-accent/20 ring-1 ring-accent/30" : "bg-white/5 ring-1 ring-white/8"
      }`}>
        <span className={`text-[8px] font-bold ${isWinner ? "text-accent" : "text-white/30"}`}>
          {name.slice(0, 2).toUpperCase()}
        </span>
      </div>

      {/* Team name */}
      <span className={`flex-1 text-[13px] font-semibold truncate ${
        isWinner ? "text-white" : "text-white/55"
      }`}>
        {name}
      </span>

      {/* Score */}
      <span className={`text-[15px] font-bold tabular-nums min-w-[16px] text-right ${
        isWinner ? "text-white" : "text-white/25"
      }`}>
        {score ?? 0}
      </span>

      {/* Inner edge line (subtle border effect inside the clip) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderLeft: `1px solid rgba(34,197,94,${isWinner ? "0.25" : "0.10"})`,
          borderTop: position === "top" ? "1px solid rgba(34,197,94,0.08)" : "none",
          borderBottom: position === "bottom" ? "1px solid rgba(34,197,94,0.08)" : "none",
        }}
      />
    </div>
  );
}

export function MatchCard({
  match,
  onTeamHover,
}: {
  match: BracketMatch;
  onTeamHover: (id: string | null) => void;
}) {
  const teamIds = [match.team1?.id, match.team2?.id].filter(Boolean).join(",");
  const date = new Date(match.scheduledAt);
  const dateStr = date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  const isEmpty = !match.team1 && !match.team2;

  return (
    <div
      className="bracket-element"
      data-team-ids={teamIds}
      style={{ width: MATCH_CARD_W }}
    >
      {/* Date header */}
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-[10px] text-white/25 italic">{dateStr}</span>
        <span className="text-[10px] text-white/25">{timeStr}</span>
      </div>

      {/* Card body — overall arrow shape */}
      <div
        className="group/match relative"
        style={{
          clipPath: `polygon(0 0, calc(100% - ${ARROW}px) 0, 100% 50%, calc(100% - ${ARROW}px) 100%, 0 100%)`,
        }}
      >
        {match.team1 ? (
          <TeamRow
            name={match.team1.name}
            score={match.score1}
            isWinner={match.winnerId === match.team1.id}
            teamId={match.team1.id}
            onHover={onTeamHover}
            position="top"
            status={match.status}
          />
        ) : (
          <div className="h-[34px] flex items-center pl-3 text-[12px] text-white/12 italic"
            style={{ background: "rgba(34,197,94,0.03)" }}>TBD</div>
        )}

        {/* Center divider — subtle glow line */}
        <div className="h-[1px]" style={{
          background: "linear-gradient(90deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.06) 70%, transparent 100%)"
        }} />

        {match.team2 ? (
          <TeamRow
            name={match.team2.name}
            score={match.score2}
            isWinner={match.winnerId === match.team2.id}
            teamId={match.team2.id}
            onHover={onTeamHover}
            position="bottom"
            status={match.status}
          />
        ) : (
          <div className="h-[34px] flex items-center pl-3 text-[12px] text-white/12 italic"
            style={{ background: "rgba(34,197,94,0.03)" }}>TBD</div>
        )}
      </div>
    </div>
  );
}
