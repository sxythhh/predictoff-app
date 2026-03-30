"use client";

import { useAccount } from "wagmi";
import { useBetsSummary } from "@azuro-org/sdk";
import { usePlayBets } from "./usePlayBalance";
import { usePlayMode } from "./PlayBetslip";

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-[15px] font-bold font-inter ${color ?? "text-text-primary"}`}>{value}</span>
      <span className="text-[11px] text-text-muted">{label}</span>
    </div>
  );
}

function RealBetSummary() {
  const { address } = useAccount();
  const { data } = useBetsSummary({
    account: address ?? "0x",
  });

  if (!address || !data) return null;

  const winRate = data.betsCount > 0
    ? Math.round((data.wonBetsCount / data.betsCount) * 100)
    : 0;
  const profit = Number(data.totalProfit ?? 0);
  const profitColor = profit > 0 ? "text-status-win" : profit < 0 ? "text-status-loss" : "text-text-primary";

  return (
    <div className="mx-3 mb-3 p-3 rounded-lg bg-bg-surface flex items-center justify-between">
      <StatBox label="Win Rate" value={`${winRate}%`} color={winRate >= 50 ? "text-status-win" : "text-text-primary"} />
      <div className="w-px h-8 bg-border-subtle" />
      <StatBox label="Total Bets" value={String(data.betsCount)} />
      <div className="w-px h-8 bg-border-subtle" />
      <StatBox label="Profit" value={`${profit >= 0 ? "+" : ""}${profit.toFixed(2)}`} color={profitColor} />
    </div>
  );
}

function PlayBetSummary() {
  const bets = usePlayBets();

  if (bets.length === 0) return null;

  const total = bets.length;
  const won = bets.filter((b) => b.status === "won").length;
  const lost = bets.filter((b) => b.status === "lost").length;
  const winRate = total > 0 ? Math.round((won / (won + lost || 1)) * 100) : 0;
  const profit = bets.reduce((sum, b) => {
    if (b.status === "won") return sum + b.possibleWin - b.amount;
    if (b.status === "lost") return sum - b.amount;
    return sum;
  }, 0);
  const profitColor = profit > 0 ? "text-status-win" : profit < 0 ? "text-status-loss" : "text-text-primary";

  return (
    <div className="mx-3 mb-3 p-3 rounded-lg bg-bg-surface flex items-center justify-between">
      <StatBox label="Win Rate" value={`${winRate}%`} color={winRate >= 50 ? "text-status-win" : "text-text-primary"} />
      <div className="w-px h-8 bg-border-subtle" />
      <StatBox label="Total Bets" value={String(total)} />
      <div className="w-px h-8 bg-border-subtle" />
      <StatBox label="Profit" value={`${profit >= 0 ? "+" : ""}${profit.toFixed(2)}`} color={profitColor} />
    </div>
  );
}

export function BetSummaryCard() {
  const { isPlayMode } = usePlayMode();
  return isPlayMode ? <PlayBetSummary /> : <RealBetSummary />;
}
