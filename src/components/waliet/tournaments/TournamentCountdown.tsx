"use client";

import { useState, useEffect } from "react";

export function TournamentCountdown({ endsAt, label }: { endsAt: number; label?: string }) {
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
    <span className="text-text-secondary tabular-nums">
      {label && <span className="text-text-muted">{label} </span>}
      {days > 0 && `${days}d `}{hours}h {minutes}m {seconds}s
    </span>
  );
}
