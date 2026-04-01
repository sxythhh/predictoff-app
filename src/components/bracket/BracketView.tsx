"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { BracketData, BracketMatch } from "@/types/bracket";
import { MatchCard, MATCH_CARD_W, MATCH_CARD_H } from "./MatchCard";

const COL_GAP = 100;
const ROW_GAP = 28;
const DATE_HEADER = 20;
const BODY_H = 69; // two 34px rows + 1px separator
const ARROW_TIP_OFFSET_Y = DATE_HEADER + BODY_H / 2 - MATCH_CARD_H / 2;

interface CardPos {
  match: BracketMatch;
  x: number;
  cy: number;
}

function computePositions(data: BracketData): CardPos[] {
  const positions: CardPos[] = [];
  const firstRoundCount = data.rounds[0].matches.length;
  const totalHeight = firstRoundCount * MATCH_CARD_H + (firstRoundCount - 1) * ROW_GAP;

  for (let r = 0; r < data.rounds.length; r++) {
    const round = data.rounds[r];
    const matchCount = round.matches.length;
    const x = r * (MATCH_CARD_W + COL_GAP);

    for (let m = 0; m < matchCount; m++) {
      const slotH = totalHeight / matchCount;
      const cy = slotH * m + slotH / 2;
      positions.push({ match: round.matches[m], x, cy });
    }
  }
  return positions;
}

function ConnectorLines({ data, positions }: { data: BracketData; positions: CardPos[] }) {
  const lines: React.ReactNode[] = [];

  for (let r = 0; r < data.rounds.length - 1; r++) {
    const round = data.rounds[r];
    for (let m = 0; m < round.matches.length; m += 2) {
      const topMatch = round.matches[m];
      const botMatch = round.matches[m + 1];
      if (!botMatch) continue;

      const top = positions.find((p) => p.match.id === topMatch.id);
      const bot = positions.find((p) => p.match.id === botMatch.id);
      const dest = positions.find(
        (p) => p.match.roundIndex === r + 1 && p.match.matchIndex === Math.floor(m / 2)
      );
      if (!top || !bot || !dest) continue;

      const x1 = top.x + MATCH_CARD_W;
      const midX = top.x + MATCH_CARD_W + COL_GAP / 2;
      const x2 = dest.x;
      const y1 = top.cy + ARROW_TIP_OFFSET_Y;
      const y2 = bot.cy + ARROW_TIP_OFFSET_Y;
      const yMid = dest.cy + ARROW_TIP_OFFSET_Y;
      const rad = 10;

      const topTeamIds = [topMatch.team1?.id, topMatch.team2?.id].filter(Boolean).join(",");
      const botTeamIds = [botMatch.team1?.id, botMatch.team2?.id].filter(Boolean).join(",");
      const allTeamIds = [...new Set([
        topMatch.team1?.id, topMatch.team2?.id,
        botMatch.team1?.id, botMatch.team2?.id
      ].filter(Boolean))].join(",");

      const topPath = `M ${x1} ${y1} H ${midX - rad} Q ${midX} ${y1} ${midX} ${y1 + rad} V ${yMid - rad} Q ${midX} ${yMid} ${midX + rad} ${yMid} H ${x2}`;
      const botPath = `M ${x1} ${y2} H ${midX - rad} Q ${midX} ${y2} ${midX} ${y2 - rad} V ${yMid + rad} Q ${midX} ${yMid} ${midX + rad} ${yMid} H ${x2}`;

      // Glow layer (wider, lower opacity)
      lines.push(
        <path key={`glow-top-${r}-${m}`} d={topPath} fill="none" stroke="var(--accent)" strokeWidth={4} strokeOpacity={0.08} className="bracket-element" data-team-ids={topTeamIds} />,
        <path key={`glow-bot-${r}-${m}`} d={botPath} fill="none" stroke="var(--accent)" strokeWidth={4} strokeOpacity={0.08} className="bracket-element" data-team-ids={botTeamIds} />,
      );

      // Main lines
      lines.push(
        <path key={`top-${r}-${m}`} d={topPath} fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeOpacity={0.6} className="bracket-element" data-team-ids={topTeamIds} />,
        <path key={`bot-${r}-${m}`} d={botPath} fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeOpacity={0.6} className="bracket-element" data-team-ids={botTeamIds} />,
      );

      // Diamond connector at junction
      lines.push(
        <g key={`diamond-${r}-${m}`} className="bracket-element" data-team-ids={allTeamIds}>
          {/* Glow */}
          <rect x={midX - 8} y={yMid - 8} width={16} height={16} rx={2}
            transform={`rotate(45 ${midX} ${yMid})`}
            fill="var(--accent)" fillOpacity={0.06} stroke="none" />
          {/* Diamond */}
          <rect x={midX - 5} y={yMid - 5} width={10} height={10} rx={1.5}
            transform={`rotate(45 ${midX} ${yMid})`}
            fill="var(--bg-page)" stroke="var(--accent)" strokeWidth={1.5} strokeOpacity={0.5} />
          {/* Inner dot */}
          <circle cx={midX} cy={yMid} r={2} fill="var(--accent)" fillOpacity={0.4} />
        </g>
      );
    }
  }

  return <>{lines}</>;
}

export function BracketView({ data }: { data: BracketData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTeam, setActiveTeam] = useState<string | null>(null);

  const positions = useMemo(() => computePositions(data), [data]);

  const totalRounds = data.rounds.length;
  const firstRoundCount = data.rounds[0].matches.length;
  const totalWidth = totalRounds * MATCH_CARD_W + (totalRounds - 1) * COL_GAP + 120;
  const totalHeight = firstRoundCount * MATCH_CARD_H + (firstRoundCount - 1) * ROW_GAP + 60;

  // CSS-driven highlighting via DOM attributes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const elements = container.querySelectorAll<HTMLElement>(".bracket-element");
    elements.forEach((el) => {
      const teamIds = el.getAttribute("data-team-ids")?.split(",") ?? [];
      if (activeTeam) {
        el.setAttribute("data-highlighted", teamIds.includes(activeTeam) ? "true" : "false");
      } else {
        el.removeAttribute("data-highlighted");
      }
    });
  }, [activeTeam]);

  const onTeamHover = useCallback((id: string | null) => setActiveTeam(id), []);

  // Winner
  const finalMatch = data.rounds[data.rounds.length - 1]?.matches[0];
  const winner = finalMatch?.winnerId
    ? (finalMatch.team1?.id === finalMatch.winnerId ? finalMatch.team1 : finalMatch.team2)
    : null;
  const lastPos = positions[positions.length - 1];

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto"
      data-active-team={activeTeam || undefined}
      onMouseLeave={() => setActiveTeam(null)}
    >
      <div className="relative pt-8" style={{ minWidth: totalWidth, height: totalHeight }}>
        {/* SVG connectors */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={totalWidth}
          height={totalHeight}
          style={{ overflow: "visible" }}
        >
          {/* Subtle vertical grid lines per round */}
          {data.rounds.map((_, r) => {
            const x = r * (MATCH_CARD_W + COL_GAP) + MATCH_CARD_W / 2;
            return (
              <line key={`grid-${r}`} x1={x} y1={0} x2={x} y2={totalHeight}
                stroke="var(--accent)" strokeWidth={1} strokeOpacity={0.03} strokeDasharray="4 8" />
            );
          })}
          <ConnectorLines data={data} positions={positions} />
        </svg>

        {/* Round headers */}
        {data.rounds.map((round, r) => (
          <div
            key={round.name + r}
            className="absolute flex items-center justify-center"
            style={{ left: r * (MATCH_CARD_W + COL_GAP), top: 0, width: MATCH_CARD_W }}
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent/30 bg-bg-page px-3">
              {round.name}
            </span>
          </div>
        ))}

        {/* Match cards */}
        {positions.map(({ match, x, cy }) => (
          <div
            key={match.id}
            className="absolute"
            style={{ left: x, top: cy - MATCH_CARD_H / 2 }}
          >
            <MatchCard match={match} onTeamHover={onTeamHover} />
          </div>
        ))}

        {/* Winner display */}
        {winner && lastPos && (
          <div
            className="bracket-element absolute flex flex-col items-center gap-3"
            data-team-ids={winner.id}
            style={{ left: lastPos.x + MATCH_CARD_W + 40, top: lastPos.cy - 40 }}
          >
            {/* Winner hexagon-ish shape */}
            <div className="relative">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(16,185,129,0.08) 100%)",
                  border: "1.5px solid rgba(34,197,94,0.35)",
                  boxShadow: "0 0 20px rgba(34,197,94,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <span className="text-2xl font-bold text-accent/80">{winner.name.charAt(0)}</span>
              </div>
              {/* Crown / winner indicator */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                  <path d="M1 10L3 3L8 6L13 3L15 10H1Z" fill="var(--accent)" fillOpacity="0.3" stroke="var(--accent)" strokeWidth="1" strokeOpacity="0.5"/>
                </svg>
              </div>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[12px] font-bold text-white/70">{winner.name}</span>
              <span className="text-[10px] font-medium text-accent/50 uppercase tracking-wider">Champion</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
