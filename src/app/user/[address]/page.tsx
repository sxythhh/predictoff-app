"use client";

import { useState, useEffect, use } from "react";
import { useBetsSummary, useChain } from "@azuro-org/sdk";
import { useAccount } from "wagmi";
import Link from "next/link";
import { ActivityFeed } from "@/components/social/ActivityFeed";

function formatAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

interface PublicUser {
  id: string;
  walletAddress: string;
  displayName: string | null;
  avatar: string | null;
  bio?: string | null;
  showBetHistory?: boolean;
  showStats?: boolean;
  favoritesCount?: number;
  createdAt?: string;
  isPrivate: boolean;
}

function PublicStatsRow({ address, showStats, favoritesCount }: { address: string; showStats: boolean; favoritesCount: number }) {
  const { betToken } = useChain();
  const { data: betStats } = useBetsSummary({ account: address as `0x${string}` });

  if (!showStats) return null;

  const betsCount = betStats?.betsCount ?? 0;
  const winRate = betsCount > 0 ? Math.round(((betStats?.wonBetsCount ?? 0) / betsCount) * 100) : 0;
  const profit = Number(betStats?.totalProfit ?? 0);
  const profitColor = profit > 0 ? "text-green-400" : profit < 0 ? "text-red-400" : "text-text-primary";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Total Bets", value: String(betsCount) },
        { label: "Win Rate", value: `${winRate}%` },
        { label: "Profit/Loss", value: `${profit >= 0 ? "+" : ""}${profit.toFixed(2)} ${betToken?.symbol ?? ""}`, color: profitColor },
        { label: "Favorites", value: String(favoritesCount) },
      ].map((stat) => (
        <div key={stat.label} className="bg-bg-card rounded-xl border border-border-subtle p-4 text-center">
          <div className={`text-[18px] font-bold font-inter ${"color" in stat ? stat.color : "text-text-primary"}`}>{stat.value}</div>
          <div className="text-[12px] text-text-muted mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function PublicProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const { address: paramAddress } = use(params);
  const { address: myAddress } = useAccount();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isOwnProfile = myAddress?.toLowerCase() === paramAddress?.toLowerCase();

  useEffect(() => {
    fetch(`/api/users/${paramAddress}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setUser)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [paramAddress]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-page">
        <header className="h-14 flex items-center px-3 lg:px-6 border-b border-border-primary">
          <Link href="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text-[14px] font-medium">Back</span>
          </Link>
        </header>
        <div className="max-w-[700px] mx-auto p-8">
          <div className="flex items-start gap-5">
            <div className="w-[99px] h-[99px] rounded-[22px] bg-bg-surface animate-pulse" />
            <div className="flex-1 flex flex-col gap-3">
              <div className="h-6 w-40 bg-bg-surface rounded animate-pulse" />
              <div className="h-4 w-24 bg-bg-surface rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-bg-page">
        <header className="h-14 flex items-center px-3 lg:px-6 border-b border-border-primary">
          <Link href="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text-[14px] font-medium">Back</span>
          </Link>
        </header>
        <div className="max-w-[700px] mx-auto p-8 text-center">
          <p className="text-text-secondary text-[15px] font-medium mt-12">User not found</p>
          <p className="text-text-muted text-[13px] mt-2">This address hasn't signed up on Waliet yet</p>
        </div>
      </div>
    );
  }

  const displayName = user.displayName ?? formatAddress(user.walletAddress);
  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" })
    : null;

  return (
    <div className="min-h-screen bg-bg-page text-text-primary" style={{ letterSpacing: "-0.02em" }}>
      <header className="h-14 flex items-center px-3 lg:px-6 border-b border-border-primary">
        <Link href="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span className="text-[14px] font-medium">Back</span>
        </Link>
        {isOwnProfile && (
          <Link href="/profile" className="ml-auto text-[13px] text-accent hover:text-accent-hover font-medium">
            Edit Profile
          </Link>
        )}
      </header>

      <div className="max-w-[700px] mx-auto p-4 lg:p-8 flex flex-col gap-8">
        {/* Profile card */}
        <div className="flex items-start gap-5">
          <div className="relative shrink-0 w-[99px] h-[99px]">
            <div className="w-[99px] h-[99px] rounded-[22px] overflow-hidden bg-bg-surface">
              {user.avatar ? (
                <img src={user.avatar} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full rounded-[22px]"
                  style={{
                    background: `linear-gradient(135deg, hsl(${parseInt(user.walletAddress.slice(2, 6), 16) % 360}, 70%, 45%), hsl(${parseInt(user.walletAddress.slice(6, 10), 16) % 360}, 60%, 35%))`,
                  }}
                />
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-[22px] font-medium text-text-primary truncate">{displayName}</span>
            <span className="text-[12px] text-text-muted">{formatAddress(user.walletAddress)}</span>
            {joinDate && <span className="text-[12px] text-text-muted">Joined {joinDate}</span>}
            {!user.isPrivate && user.bio && (
              <p className="text-[13px] text-text-secondary mt-1">{user.bio}</p>
            )}
          </div>
        </div>

        {user.isPrivate ? (
          <div className="bg-bg-card rounded-xl border border-border-subtle p-8 text-center">
            <p className="text-text-muted text-[13px]">This profile is private</p>
          </div>
        ) : (
          <>
            <PublicStatsRow
              address={user.walletAddress}
              showStats={user.showStats ?? true}
              favoritesCount={user.favoritesCount ?? 0}
            />
            <div>
              <h3 className="text-[14px] font-semibold text-text-primary mb-3">Recent Activity</h3>
              <ActivityFeed userId={user.id} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
