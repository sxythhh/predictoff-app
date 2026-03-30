"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  useWaveLevels,
  useWaveStats,
  useWaveLeaderBoard,
  useWaveActivation,
  useWavePeriods,
} from "@azuro-org/sdk";

/* ── Countdown ── */

function WaveCountdown({ endsAt }: { endsAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const diff = endsAt * 1000 - now;
  if (diff <= 0) return <span className="text-text-muted">Ended</span>;

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  return (
    <div className="flex items-center gap-1.5 font-inter">
      {days > 0 && <TimeBlock value={days} label="d" />}
      <TimeBlock value={hours} label="h" />
      <TimeBlock value={minutes} label="m" />
      <TimeBlock value={seconds} label="s" />
    </div>
  );
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-0.5">
      <span className="text-[18px] font-bold text-text-primary tabular-nums">{String(value).padStart(2, "0")}</span>
      <span className="text-[11px] font-medium text-text-muted">{label}</span>
    </div>
  );
}

/* ── User Stats ── */

function UserStats() {
  const { address } = useAccount();
  const { data: stats } = useWaveStats({ account: address ?? "0x" as `0x${string}` });
  const { data: levels } = useWaveLevels({});
  const { activate, isPending } = useWaveActivation({ account: address ?? "0x" as `0x${string}` });

  if (!address) {
    return (
      <div className="bg-bg-card rounded-xl border border-border-subtle p-6 text-center">
        <p className="text-text-muted text-sm">Connect your wallet to view your wave stats</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-bg-card rounded-xl border border-border-subtle p-6">
        <div className="h-16 animate-pulse bg-border-subtle rounded-lg" />
      </div>
    );
  }

  if (!stats.isActivated) {
    return (
      <div className="bg-bg-card rounded-xl border border-border-subtle p-6 text-center">
        <p className="text-text-primary text-sm font-medium mb-3">Join the wave to earn points and climb the leaderboard</p>
        <button
          onClick={() => activate()}
          disabled={isPending}
          className="h-10 px-6 rounded-lg bg-accent text-btn-primary-text font-semibold text-[14px] hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {isPending ? "Activating..." : "Activate Wave"}
        </button>
      </div>
    );
  }

  // Find current level info
  const currentLevel = levels?.find((l: any) => l.level === (stats as any).level);
  const nextLevel = levels?.find((l: any) => l.level === ((stats as any).level ?? 0) + 1);
  const totalPoints = Number((stats as any).totalPoints ?? (stats as any).points ?? 0);
  const nextThreshold = nextLevel ? Number((nextLevel as any).pointsNeeded ?? (nextLevel as any).points ?? 100) : totalPoints;
  const progress = nextThreshold > 0 ? Math.min((totalPoints / nextThreshold) * 100, 100) : 100;

  return (
    <div className="bg-bg-card rounded-xl border border-border-subtle p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[12px] text-text-muted mb-1">Your Level</div>
          <div className="text-[18px] font-bold text-text-primary">
            {(currentLevel as any)?.name ?? `Level ${(stats as any).level ?? 1}`}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[12px] text-text-muted mb-1">Total Points</div>
          <div className="text-[18px] font-bold text-accent font-inter">{totalPoints.toLocaleString()}</div>
        </div>
      </div>

      {/* Progress bar */}
      {nextLevel && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-text-muted">Progress to next level</span>
            <span className="text-[11px] text-text-muted font-inter">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-bg-surface overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Level Tiers ── */

function LevelTiers() {
  const { data: levels } = useWaveLevels({});
  if (!levels?.length) return null;

  return (
    <div>
      <h3 className="text-[14px] font-semibold text-text-primary mb-3">Level Tiers</h3>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {levels.map((level: any, i: number) => (
          <div
            key={i}
            className="shrink-0 w-[120px] bg-bg-card rounded-lg border border-border-subtle p-3 text-center"
          >
            <div className="text-[13px] font-semibold text-text-primary mb-1">{level.name ?? `Level ${level.level}`}</div>
            {level.boost && (
              <div className="text-[11px] text-accent font-medium">{level.boost}x boost</div>
            )}
            {(level.pointsNeeded ?? level.points) && (
              <div className="text-[11px] text-text-muted mt-1 font-inter">{Number(level.pointsNeeded ?? level.points).toLocaleString()} pts</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Leaderboard Table ── */

function LeaderboardTable() {
  const { address } = useAccount();
  const { data: entries, isFetching } = useWaveLeaderBoard({});

  if (isFetching) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg animate-pulse bg-border-subtle" />
        ))}
      </div>
    );
  }

  if (!entries?.length) {
    return (
      <div className="text-center py-12 text-text-muted text-sm">
        No leaderboard data available yet
      </div>
    );
  }

  return (
    <div className="bg-bg-card rounded-xl border border-border-subtle overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[48px_1fr_100px_100px] px-4 py-2.5 border-b border-border-subtle text-[11px] text-text-muted font-medium">
        <span>Rank</span>
        <span>Address</span>
        <span className="text-right">Level</span>
        <span className="text-right">Points</span>
      </div>
      {/* Rows */}
      <div className="divide-y divide-border-subtle">
        {entries.map((entry: any, i: number) => {
          const isUser = address && entry.address?.toLowerCase() === address.toLowerCase();
          return (
            <div
              key={entry.address ?? i}
              className={`grid grid-cols-[48px_1fr_100px_100px] px-4 py-3 text-[13px] ${
                isUser ? "bg-accent-muted" : "hover:bg-bg-hover"
              } transition-colors`}
            >
              <span className={`font-bold font-inter ${i < 3 ? "text-accent" : "text-text-secondary"}`}>
                {entry.position ?? i + 1}
              </span>
              <span className={`font-mono truncate ${isUser ? "text-accent font-semibold" : "text-text-primary"}`}>
                {isUser ? "You" : `${(entry.address ?? "").slice(0, 6)}...${(entry.address ?? "").slice(-4)}`}
              </span>
              <span className="text-right text-text-secondary">
                {entry.levelName ?? entry.level ?? "-"}
              </span>
              <span className="text-right font-semibold font-inter text-text-primary">
                {Number(entry.points ?? 0).toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Component ── */

export function WaveLeaderboard() {
  const { data: periods } = useWavePeriods({});

  // Find current active period
  const now = Date.now() / 1000;
  const currentPeriod = periods?.find((p: any) => p.startsAt <= now && p.endsAt >= now);

  return (
    <main className="flex-1 min-w-0 overflow-y-auto">
      <div className="max-w-[800px] mx-auto p-4 lg:p-6 flex flex-col gap-5">
        {/* Wave Period Banner */}
        <div className="bg-bg-card rounded-xl border border-border-subtle p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] text-text-muted mb-1">Current Wave</div>
              <h2 className="text-[20px] font-bold text-text-primary">
                {currentPeriod ? `Wave ${currentPeriod.id}` : "Wave Season"}
              </h2>
            </div>
            {currentPeriod && (
              <div className="text-right">
                <div className="text-[12px] text-text-muted mb-1">Ends in</div>
                <WaveCountdown endsAt={currentPeriod.endsAt} />
              </div>
            )}
          </div>
        </div>

        {/* User Stats */}
        <UserStats />

        {/* Level Tiers */}
        <LevelTiers />

        {/* Leaderboard */}
        <div>
          <h3 className="text-[14px] font-semibold text-text-primary mb-3">Leaderboard</h3>
          <LeaderboardTable />
        </div>
      </div>
    </main>
  );
}
