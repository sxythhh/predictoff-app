"use client";

import { useAccount } from "wagmi";
import { useBetsSummary, useChain } from "@azuro-org/sdk";
import { usePlayBets } from "./usePlayBalance";

function StatBox({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-[15px] font-bold font-inter ${color ?? "text-text-primary"}`}>{value}</span>
      <span className="text-[11px] text-text-muted">{label}</span>
      {sub && <span className="text-[10px] text-text-muted">{sub}</span>}
    </div>
  );
}

function RealBetSummary() {
  const { address } = useAccount();
  const { betToken } = useChain();
  const { data } = useBetsSummary({
    account: address ?? "0x",
  });

  if (!address || !data) return null;

  const winRate = data.betsCount > 0
    ? Math.round((data.wonBetsCount / data.betsCount) * 100)
    : 0;
  const profit = Number(data.totalProfit ?? 0);
  const profitColor = profit > 0 ? "text-status-win" : profit < 0 ? "text-status-loss" : "text-text-primary";
  const inBets = Number(data.inBets ?? 0);
  const toPayout = Number(data.toPayout ?? 0);

  return (
    <div className="mx-3 mb-3 flex flex-col gap-2">
      {/* Main stats row */}
      <div className="p-3 rounded-lg bg-bg-surface flex items-center justify-between">
        <StatBox
          label="Win Rate"
          value={`${winRate}%`}
          color={winRate >= 50 ? "text-status-win" : "text-text-primary"}
          sub={`${data.wonBetsCount}W / ${data.lostBetsCount}L`}
        />
        <div className="w-px h-10 bg-border-subtle" />
        <StatBox label="Total Bets" value={String(data.betsCount)} />
        <div className="w-px h-10 bg-border-subtle" />
        <StatBox
          label="Profit"
          value={`${profit >= 0 ? "+" : ""}${profit.toFixed(2)}`}
          color={profitColor}
          sub={betToken?.symbol}
        />
      </div>

      {/* Secondary stats */}
      {(inBets > 0 || toPayout > 0) && (
        <div className="flex gap-2">
          {inBets > 0 && (
            <div className="flex-1 px-3 py-2 rounded-lg bg-yellow-500/[0.06] border border-yellow-500/10">
              <div className="text-[10px] text-text-muted mb-0.5">In Active Bets</div>
              <div className="text-[13px] font-bold text-yellow-400 tabular-nums">
                {inBets.toFixed(2)} {betToken?.symbol}
              </div>
            </div>
          )}
          {toPayout > 0 && (
            <div className="flex-1 px-3 py-2 rounded-lg bg-green-500/[0.06] border border-green-500/10">
              <div className="text-[10px] text-text-muted mb-0.5">Claimable</div>
              <div className="text-[13px] font-bold text-green-400 tabular-nums">
                {toPayout.toFixed(2)} {betToken?.symbol}
              </div>
            </div>
          )}
        </div>
      )}
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
      <StatBox
        label="Win Rate"
        value={`${winRate}%`}
        color={winRate >= 50 ? "text-status-win" : "text-text-primary"}
        sub={`${won}W / ${lost}L`}
      />
      <div className="w-px h-10 bg-border-subtle" />
      <StatBox label="Total Bets" value={String(total)} />
      <div className="w-px h-10 bg-border-subtle" />
      <StatBox
        label="Profit"
        value={`${profit >= 0 ? "+" : ""}${profit.toFixed(2)}`}
        color={profitColor}
      />
    </div>
  );
}

export function BetSummaryCard() {
  const { address } = useAccount();

  // Show real stats when wallet connected, play stats otherwise
  if (address) return <RealBetSummary />;
  return <PlayBetSummary />;
}
