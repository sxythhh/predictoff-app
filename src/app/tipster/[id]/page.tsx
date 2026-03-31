"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { PickCard } from "@/components/waliet/tipster/PickCard";
import { useToast } from "@/components/waliet/Toast";

type PicksTab = "all" | "free" | "premium" | "won" | "lost";

function FormDot({ result }: { result: string }) {
  return (
    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
      result === "W" ? "bg-green-500" : "bg-red-500"
    }`}>{result}</span>
  );
}

function StatCard({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div className="bg-bg-card rounded-xl border border-border-subtle p-3 text-center">
      <div className={`text-[18px] font-bold tabular-nums ${color ?? "text-text-primary"}`}>{value}</div>
      <div className="text-[11px] text-text-muted">{label}</div>
    </div>
  );
}

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
  const [picksTab, setPicksTab] = useState<PicksTab>("all");

  const isOwn = user?.id === id;

  useEffect(() => {
    Promise.all([
      fetch(`/api/tipsters/${id}/stats`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/picks?tipsterId=${id}&limit=30`).then((r) => r.ok ? r.json() : { picks: [] }),
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
    const res = await fetch(`/api/tipster/${id}/subscribe`, { method: "POST", headers: { "Content-Type": "application/json" } });
    const data = await res.json();
    if (data.checkoutUrl) { window.open(data.checkoutUrl, "_blank"); toast("Complete payment in the new tab", "info"); }
    else toast(data.error ?? "Subscription unavailable", "error");
    setSubscribing(false);
  };

  const handleFollow = async () => {
    if (!user) { window.location.href = "/"; return; }
    const res = await fetch("/api/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetId: id }) });
    const d = await res.json();
    setIsFollowing(d.following);
  };

  // Filter picks by tab
  const filteredPicks = picks.filter((p) => {
    if (picksTab === "free") return p.visibility === "free";
    if (picksTab === "premium") return p.visibility === "premium";
    if (picksTab === "won") return p.isResolved && p.isCorrect;
    if (picksTab === "lost") return p.isResolved && !p.isCorrect;
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-[600px] mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-bg-surface animate-pulse" />
          <div className="flex-1">
            <div className="h-6 w-40 bg-bg-surface rounded animate-pulse mb-2" />
            <div className="h-4 w-24 bg-bg-surface rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-bg-card rounded-xl animate-pulse border border-border-subtle" />)}
        </div>
      </div>
    );
  }

  if (!tipster) {
    return (
      <div className="max-w-[600px] mx-auto p-6 text-center py-16">
        <p className="text-text-secondary">Tipster not found</p>
      </div>
    );
  }

  const s = stats;
  const winRateColor = (s?.winRate ?? 0) >= 60 ? "text-green-400" : (s?.winRate ?? 0) >= 50 ? "text-yellow-400" : "text-text-primary";
  const profitUnits = s ? (s.wins * 1 - s.losses * 1) : 0; // simplified unit calc
  const roi = s?.resolvedPicks > 0 ? Math.round(((s.wins - s.losses) / s.resolvedPicks) * 100) : 0;

  return (
    <div className="text-text-primary" style={{ letterSpacing: "-0.02em" }}>
      <div className="max-w-[600px] mx-auto p-4 lg:p-6">
        <Link href="/tipsters" className="flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-primary transition-colors mb-4">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back to Tipsters
        </Link>

        {/* Profile header */}
        <div className="bg-bg-card rounded-2xl border border-border-subtle p-5 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl bg-bg-surface overflow-hidden shrink-0">
              {tipster.avatar ? (
                <img src={tipster.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" style={{
                  background: `linear-gradient(135deg, hsl(${parseInt((tipster.walletAddress ?? "0x0000").slice(2, 6), 16) % 360}, 70%, 45%), hsl(${parseInt((tipster.walletAddress ?? "0x0000").slice(6, 10), 16) % 360}, 60%, 35%))`,
                }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-bold truncate">{tipster.displayName ?? "Tipster"}</h1>
                {(s?.winRate ?? 0) >= 60 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 uppercase tracking-wider">Pro</span>
                )}
              </div>
              {tipster.tipsterBio && <p className="text-[13px] text-text-secondary mt-1 line-clamp-2">{tipster.tipsterBio}</p>}

              {/* Follower + subscriber counts */}
              <div className="flex items-center gap-3 mt-2 text-[12px] text-text-muted">
                <span><span className="text-text-primary font-semibold">{s?.subscriberCount ?? 0}</span> subscribers</span>
                {s?.totalPicks > 0 && <span><span className="text-text-primary font-semibold">{s.totalPicks}</span> picks</span>}
              </div>

              {/* Action buttons */}
              {!isOwn && (
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleFollow}
                    className={`h-9 px-4 rounded-lg text-[13px] font-semibold transition-colors ${
                      isFollowing ? "bg-bg-surface text-text-secondary hover:bg-bg-hover" : "bg-bg-surface text-text-primary hover:bg-bg-hover"
                    }`}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                  {!hasAccess && tipster.subscriptionPrice ? (
                    <button onClick={handleSubscribe} disabled={subscribing}
                      className="h-9 px-4 rounded-lg bg-accent text-btn-primary-text text-[13px] font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50">
                      {subscribing ? "..." : `Subscribe $${tipster.subscriptionPrice}/mo`}
                    </button>
                  ) : hasAccess && !isOwn ? (
                    <span className="text-[11px] text-green-400 bg-green-500/10 px-2 py-1 rounded font-semibold">Subscribed</span>
                  ) : null}
                </div>
              )}
              {isOwn && (
                <Link href="/tipster/dashboard" className="inline-flex items-center gap-1.5 mt-3 text-[13px] text-accent font-medium hover:text-accent-hover">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 14V6M6 14V4M10 14V8M14 14V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        {s && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <StatCard value={`${s.winRate}%`} label="Win Rate" color={winRateColor} />
            <StatCard value={`${s.wins}-${s.losses}`} label="Record" />
            <StatCard value={`${roi >= 0 ? "+" : ""}${roi}%`} label="ROI" color={roi > 0 ? "text-green-400" : roi < 0 ? "text-red-400" : undefined} />
            <StatCard value={`${profitUnits >= 0 ? "+" : ""}${profitUnits}`} label="Units" color={profitUnits > 0 ? "text-green-400" : profitUnits < 0 ? "text-red-400" : undefined} />
          </div>
        )}

        {/* Form + streak */}
        {s?.form?.length > 0 && (
          <div className="bg-bg-card rounded-xl border border-border-subtle p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold text-text-primary">Recent Form</span>
              {s.streak && (
                <span className={`text-[12px] font-bold flex items-center gap-1 ${s.streak.type === "W" ? "text-green-400" : "text-red-400"}`}>
                  {s.streak.type === "W" ? "🔥" : ""} {s.streak.count}{s.streak.type} streak
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {s.form.map((r: string, i: number) => <FormDot key={i} result={r} />)}
              {s.form.length < 10 && Array.from({ length: 10 - s.form.length }).map((_, i) => (
                <span key={`empty-${i}`} className="w-5 h-5 rounded-full bg-bg-surface" />
              ))}
            </div>
          </div>
        )}

        {/* Picks tabs */}
        <div className="flex items-center gap-1 border-b border-border-subtle mb-4">
          {([
            { key: "all" as const, label: "All" },
            { key: "free" as const, label: "Free" },
            { key: "premium" as const, label: "Premium" },
            { key: "won" as const, label: "Hits" },
            { key: "lost" as const, label: "Misses" },
          ]).map(({ key, label }) => {
            const count = key === "all" ? picks.length
              : key === "free" ? picks.filter((p) => p.visibility === "free").length
              : key === "premium" ? picks.filter((p) => p.visibility === "premium").length
              : key === "won" ? picks.filter((p) => p.isResolved && p.isCorrect).length
              : picks.filter((p) => p.isResolved && !p.isCorrect).length;
            return (
              <button
                key={key}
                onClick={() => setPicksTab(key)}
                className={`h-9 px-3 text-[12px] font-medium border-b-2 transition-colors ${
                  picksTab === key ? "border-accent text-accent" : "border-transparent text-text-muted hover:text-text-secondary"
                }`}
              >
                {label}
                {count > 0 && <span className="ml-1 text-[10px] opacity-60">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Picks list */}
        {filteredPicks.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-[13px]">
            {picksTab === "all" ? "No picks yet" : `No ${picksTab} picks`}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredPicks.map((pick) => (
              <PickCard key={pick.id} pick={{ ...pick, hasAccess }} showTipster={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
