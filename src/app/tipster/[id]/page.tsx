"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { PickCard } from "@/components/waliet/tipster/PickCard";
import { useToast } from "@/components/waliet/Toast";

export default function TipsterProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { toast } = useToast();
  const [tipster, setTipster] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [picks, setPicks] = useState<any[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwn = user?.id === id;

  useEffect(() => {
    Promise.all([
      fetch(`/api/tipsters/${id}/stats`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/picks?tipsterId=${id}&limit=20`).then((r) => r.ok ? r.json() : { picks: [] }),
      user ? fetch(`/api/tipster/${id}/access`).then((r) => r.ok ? r.json() : { hasAccess: false }) : Promise.resolve({ hasAccess: false }),
      user ? fetch(`/api/follow?targetId=${id}`).then((r) => r.ok ? r.json() : { following: false }) : Promise.resolve({ following: false }),
    ]).then(([statsData, picksData, accessData, followData]) => {
      if (statsData) { setTipster(statsData.tipster); setStats(statsData.stats); }
      setPicks(picksData.picks ?? []);
      setHasAccess(accessData.hasAccess || isOwn);
      setIsFollowing(followData.following);
    }).finally(() => setLoading(false));
  }, [id, user, isOwn]);

  const handleSubscribe = async () => {
    if (!user) { window.location.href = "/"; return; }
    setSubscribing(true);
    const res = await fetch(`/api/tipster/${id}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (data.checkoutUrl) {
      window.open(data.checkoutUrl, "_blank");
      toast("Complete payment in the new tab", "info");
    } else {
      toast(data.error ?? "Subscription unavailable", "error");
    }
    setSubscribing(false);
  };

  if (loading) {
    return (
      <div>
        <div className="max-w-[600px] mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-bg-surface animate-pulse" />
            <div className="h-6 w-40 bg-bg-surface rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!tipster) {
    return (
      <div>
        <div className="max-w-[600px] mx-auto p-6 text-center py-16">
          <p className="text-text-secondary">Tipster not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-text-primary" style={{ letterSpacing: "-0.02em" }}>
      <div className="max-w-[600px] mx-auto p-4 lg:p-6">
        <Link href="/tipsters" className="flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-primary transition-colors mb-4">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back to Tipsters
        </Link>
        {/* Profile header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-bg-surface overflow-hidden shrink-0">
            {tipster.avatar ? (
              <img src={tipster.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" style={{
                background: `linear-gradient(135deg, hsl(${parseInt((tipster.walletAddress ?? "0x0000").slice(2, 6), 16) % 360}, 70%, 45%), hsl(${parseInt((tipster.walletAddress ?? "0x0000").slice(6, 10), 16) % 360}, 60%, 35%))`,
              }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[20px] font-semibold truncate">{tipster.displayName ?? "Tipster"}</h1>
            {tipster.tipsterBio && <p className="text-[13px] text-text-secondary mt-1">{tipster.tipsterBio}</p>}
            {!isOwn && (
              <div className="flex items-center gap-2 mt-3">
                {/* Follow button (free) */}
                <button
                  onClick={async () => {
                    if (!user) { window.location.href = "/"; return; }
                    const res = await fetch("/api/follow", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ targetId: id }),
                    });
                    const d = await res.json();
                    setIsFollowing(d.following);
                  }}
                  className={`h-10 px-4 rounded-lg text-[14px] font-semibold transition-colors ${
                    isFollowing
                      ? "bg-bg-surface text-text-secondary hover:bg-bg-hover"
                      : "bg-bg-surface text-text-primary hover:bg-bg-hover"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>

                {/* Subscribe button (paid) */}
                {!hasAccess && tipster.subscriptionPrice ? (
                  <button
                    onClick={handleSubscribe}
                    disabled={subscribing}
                    className="h-10 px-5 rounded-lg bg-accent text-btn-primary-text text-[14px] font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
                  >
                    {subscribing ? "..." : `Subscribe $${tipster.subscriptionPrice}/mo`}
                  </button>
                ) : hasAccess ? (
                  <span className="text-[12px] text-green-400 bg-green-500/10 px-2.5 py-1 rounded font-semibold">Subscribed</span>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-bg-card rounded-xl border border-border-subtle p-3 text-center">
              <div className={`text-[18px] font-bold ${stats.winRate >= 60 ? "text-green-400" : stats.winRate >= 50 ? "text-yellow-400" : "text-text-primary"}`}>{stats.winRate}%</div>
              <div className="text-[11px] text-text-muted">Win Rate</div>
            </div>
            <div className="bg-bg-card rounded-xl border border-border-subtle p-3 text-center">
              <div className="text-[18px] font-bold">{stats.totalPicks}</div>
              <div className="text-[11px] text-text-muted">Picks</div>
            </div>
            <div className="bg-bg-card rounded-xl border border-border-subtle p-3 text-center">
              <div className="text-[18px] font-bold text-green-400">{stats.wins}</div>
              <div className="text-[11px] text-text-muted">Wins</div>
            </div>
            <div className="bg-bg-card rounded-xl border border-border-subtle p-3 text-center">
              <div className="text-[18px] font-bold">{stats.subscriberCount}</div>
              <div className="text-[11px] text-text-muted">Subscribers</div>
            </div>
          </div>
        )}

        {/* Form */}
        {stats?.form?.length > 0 && (
          <div className="flex items-center gap-1.5 mb-6">
            <span className="text-[12px] text-text-muted mr-2">Form:</span>
            {stats.form.map((r: string, i: number) => (
              <span key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${
                r === "W" ? "bg-green-500" : "bg-red-500"
              }`}>{r}</span>
            ))}
            {stats.streak && (
              <span className={`ml-2 text-[12px] font-semibold ${stats.streak.type === "W" ? "text-green-400" : "text-red-400"}`}>
                {stats.streak.count} streak
              </span>
            )}
          </div>
        )}

        {/* Picks */}
        <h2 className="text-[14px] font-semibold mb-3">Recent Picks</h2>
        {picks.length === 0 ? (
          <div className="py-8 text-center text-text-muted text-[13px]">No picks yet</div>
        ) : (
          <div className="flex flex-col gap-3">
            {picks.map((pick) => (
              <PickCard key={pick.id} pick={{ ...pick, hasAccess }} showTipster={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
