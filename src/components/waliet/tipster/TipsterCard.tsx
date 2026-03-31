"use client";

import Link from "next/link";

interface TipsterCardProps {
  tipster: {
    id: string;
    walletAddress: string;
    displayName: string | null;
    avatar: string | null;
    tipsterBio: string | null;
    subscriptionPrice: number | null;
    totalPicks: number;
    subscriberCount: number;
    winRate: number;
    wins: number;
    resolvedPicks: number;
  };
}

export function TipsterCard({ tipster }: TipsterCardProps) {
  const t = tipster;
  return (
    <Link
      href={`/tipster/${t.id}`}
      className="bg-bg-card rounded-xl border border-border-subtle p-4 hover:bg-bg-hover transition-colors block"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-bg-surface overflow-hidden shrink-0">
          {t.avatar ? (
            <img src={t.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{
              background: `linear-gradient(135deg, hsl(${parseInt(t.walletAddress.slice(2, 6), 16) % 360}, 70%, 45%), hsl(${parseInt(t.walletAddress.slice(6, 10), 16) % 360}, 60%, 35%))`,
            }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[15px] font-semibold text-text-primary truncate">
              {t.displayName ?? `${t.walletAddress.slice(0, 6)}...${t.walletAddress.slice(-4)}`}
            </span>
            {t.winRate > 0 && (
              <span className={`text-[12px] font-bold tabular-nums ${t.winRate >= 60 ? "text-green-400" : t.winRate >= 50 ? "text-yellow-400" : "text-text-muted"}`}>
                {t.winRate}%
              </span>
            )}
          </div>
          {t.tipsterBio && (
            <p className="text-[12px] text-text-muted mt-0.5 line-clamp-2">{t.tipsterBio}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-[11px] text-text-muted">
            <span>{t.totalPicks} picks</span>
            <span>{t.subscriberCount} subs</span>
            {t.resolvedPicks > 0 && <span>{t.wins}W / {t.resolvedPicks - t.wins}L</span>}
            {t.subscriptionPrice && (
              <span className="text-accent font-semibold">${t.subscriptionPrice}/mo</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
