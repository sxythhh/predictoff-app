"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/waliet/Toast";

function formatAddress(addr: string) { return `${addr.slice(0, 6)}...${addr.slice(-4)}`; }

export default function TipsterDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tipster/dashboard")
      .then((r) => r.ok ? r.json() : null)
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (!user?.isTipster) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-text-secondary text-[15px]">You need to be a tipster to view this page</p>
        <Link href="/tipster/setup" className="h-10 px-6 rounded-lg bg-accent text-btn-primary-text text-[14px] font-semibold hover:bg-accent-hover transition-colors flex items-center">
          Become a Tipster
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-[700px] mx-auto p-4 lg:p-6">
        <div className="h-8 w-48 bg-bg-surface rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-bg-card rounded-xl animate-pulse border border-border-subtle" />)}
        </div>
      </div>
    );
  }

  const s = data?.stats;

  return (
    <div className="text-text-primary" style={{ letterSpacing: "-0.02em" }}>
      <div className="max-w-[700px] mx-auto p-4 lg:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[20px] font-semibold">Tipster Dashboard</h1>
          <Link href="/picks" className="text-[13px] text-accent font-medium hover:text-accent-hover">
            View my picks
          </Link>
        </div>

        {/* Payment setup warning */}
        {!data?.whopConfigured && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-yellow-400 shrink-0 mt-0.5">
                <path d="M10 6V10M10 14H10.01M18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <div>
                <div className="text-[14px] font-semibold text-yellow-400 mb-1">Payment setup required</div>
                <p className="text-[13px] text-text-secondary">Complete your payment setup to start receiving subscription revenue. Your free picks are still visible to everyone.</p>
                <button
                  onClick={async () => {
                    const res = await fetch("/api/tipster/onboarding");
                    const d = await res.json();
                    if (d.url) window.open(d.url, "_blank");
                    else toast("Unable to start onboarding", "error");
                  }}
                  className="mt-3 h-9 px-4 rounded-lg bg-yellow-500/20 text-yellow-400 text-[13px] font-semibold hover:bg-yellow-500/30 transition-colors"
                >
                  Complete Payment Setup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Revenue stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-bg-card rounded-xl border border-border-subtle p-4">
            <div className="text-[22px] font-bold text-accent tabular-nums">${s?.netRevenue?.toFixed(2) ?? "0.00"}</div>
            <div className="text-[12px] text-text-muted mt-1">Monthly Revenue</div>
          </div>
          <div className="bg-bg-card rounded-xl border border-border-subtle p-4">
            <div className="text-[22px] font-bold tabular-nums">{s?.activeSubscribers ?? 0}</div>
            <div className="text-[12px] text-text-muted mt-1">Active Subscribers</div>
          </div>
          <div className="bg-bg-card rounded-xl border border-border-subtle p-4">
            <div className={`text-[22px] font-bold tabular-nums ${(s?.winRate ?? 0) >= 60 ? "text-green-400" : (s?.winRate ?? 0) >= 50 ? "text-yellow-400" : "text-text-primary"}`}>{s?.winRate ?? 0}%</div>
            <div className="text-[12px] text-text-muted mt-1">Win Rate</div>
          </div>
          <div className="bg-bg-card rounded-xl border border-border-subtle p-4">
            <div className="text-[22px] font-bold tabular-nums">{s?.totalPicks ?? 0}</div>
            <div className="text-[12px] text-text-muted mt-1">Total Picks</div>
          </div>
        </div>

        {/* Revenue breakdown */}
        <div className="bg-bg-card rounded-xl border border-border-subtle p-4 mb-6">
          <h3 className="text-[14px] font-semibold mb-3">Revenue Breakdown</h3>
          <div className="flex flex-col gap-2 text-[13px]">
            <div className="flex justify-between">
              <span className="text-text-muted">Subscription price</span>
              <span className="font-medium">${s?.subscriptionPrice?.toFixed(2) ?? "0.00"}/mo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Active subscribers</span>
              <span className="font-medium">{s?.activeSubscribers ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Gross revenue</span>
              <span className="font-medium">${s?.monthlyRevenue?.toFixed(2) ?? "0.00"}/mo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Platform fee (10%)</span>
              <span className="text-red-400">-${s?.platformFee?.toFixed(2) ?? "0.00"}</span>
            </div>
            <div className="h-px bg-border-subtle my-1" />
            <div className="flex justify-between">
              <span className="font-semibold text-text-primary">Net revenue</span>
              <span className="font-bold text-accent">${s?.netRevenue?.toFixed(2) ?? "0.00"}/mo</span>
            </div>
          </div>
        </div>

        {/* Pick stats */}
        <div className="bg-bg-card rounded-xl border border-border-subtle p-4 mb-6">
          <h3 className="text-[14px] font-semibold mb-3">Pick Performance</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-[18px] font-bold text-green-400">{s?.wins ?? 0}</div>
              <div className="text-[11px] text-text-muted">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-[18px] font-bold text-red-400">{s?.losses ?? 0}</div>
              <div className="text-[11px] text-text-muted">Losses</div>
            </div>
            <div className="text-center">
              <div className="text-[18px] font-bold text-text-muted">{(s?.totalPicks ?? 0) - (s?.resolvedPicks ?? 0)}</div>
              <div className="text-[11px] text-text-muted">Pending</div>
            </div>
          </div>
        </div>

        {/* Recent subscribers */}
        {data?.recentSubscribers?.length > 0 && (
          <div className="bg-bg-card rounded-xl border border-border-subtle p-4 mb-6">
            <h3 className="text-[14px] font-semibold mb-3">Recent Subscribers</h3>
            <div className="flex flex-col gap-2">
              {data.recentSubscribers.map((sub: any) => (
                <div key={sub.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-bg-surface overflow-hidden">
                      {sub.subscriber.avatar ? (
                        <img src={sub.subscriber.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" style={{
                          background: `linear-gradient(135deg, hsl(${parseInt(sub.subscriber.walletAddress.slice(2, 6), 16) % 360}, 70%, 45%), hsl(${parseInt(sub.subscriber.walletAddress.slice(6, 10), 16) % 360}, 60%, 35%))`,
                        }} />
                      )}
                    </div>
                    <span className="text-[13px] text-text-primary">
                      {sub.subscriber.displayName ?? formatAddress(sub.subscriber.walletAddress)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${sub.status === "active" ? "text-green-400 bg-green-500/10" : "text-text-muted bg-bg-surface"}`}>
                      {sub.status}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      {new Date(sub.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/picks" className="flex-1 h-10 rounded-lg bg-accent text-btn-primary-text text-[14px] font-semibold hover:bg-accent-hover transition-colors flex items-center justify-center">
            Share a Pick
          </Link>
          {data?.whopConfigured && (
            <button
              onClick={async () => {
                const res = await fetch("/api/tipster/onboarding?type=payouts");
                const d = await res.json();
                if (d.url) window.open(d.url, "_blank");
                else toast("Unable to open payouts portal", "error");
              }}
              className="flex-1 h-10 rounded-lg bg-bg-surface text-text-secondary text-[14px] font-medium hover:bg-bg-hover transition-colors flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 14V6M6 14V4M10 14V8M14 14V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Manage Payouts
            </button>
          )}
          <Link href={`/tipster/${user.id}`} className="flex-1 h-10 rounded-lg bg-bg-surface text-text-secondary text-[14px] font-medium hover:bg-bg-hover transition-colors flex items-center justify-center">
            View Public Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
