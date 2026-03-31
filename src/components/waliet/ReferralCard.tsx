"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "./Toast";

interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  referrals: {
    id: string;
    displayName: string | null;
    walletAddress: string;
    joinedAt: string;
  }[];
}

export function ReferralCard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchReferral = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await fetch("/api/referral");
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchReferral();
  }, [fetchReferral]);

  const copyLink = useCallback(() => {
    if (!data?.referralCode) return;
    const link = `${window.location.origin}?ref=${data.referralCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast("Referral link copied!", "success");
      setTimeout(() => setCopied(false), 2000);
    });
  }, [data?.referralCode, toast]);

  const copyCode = useCallback(() => {
    if (!data?.referralCode) return;
    navigator.clipboard.writeText(data.referralCode).then(() => {
      setCopied(true);
      toast("Code copied!", "success");
      setTimeout(() => setCopied(false), 2000);
    });
  }, [data?.referralCode, toast]);

  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <p className="text-[13px] text-text-muted">Sign in to get your referral link</p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="p-4">
        <div className="h-32 rounded-xl animate-pulse bg-bg-surface" />
      </div>
    );
  }

  if (!data) return null;

  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}?ref=${data.referralCode}`;

  return (
    <div className="flex flex-col gap-3">
      {/* Main referral card */}
      <div className="rounded-xl bg-bg-surface p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1V8M8 8L11 5M8 8L5 5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 8 8)"/>
              <path d="M2 11V12C2 13.1 2.9 14 4 14H12C13.1 14 14 13.1 14 12V11" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-text-primary">Invite Friends</h3>
            <p className="text-[11px] text-text-muted">Earn rewards for every friend who joins</p>
          </div>
        </div>

        {/* Referral link */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-9 px-3 rounded-lg bg-bg-input border border-border-input flex items-center">
            <span className="text-[12px] text-text-secondary truncate font-mono">
              {referralLink}
            </span>
          </div>
          <button
            onClick={copyLink}
            className="h-9 px-3 rounded-lg bg-accent text-btn-primary-text text-[12px] font-semibold hover:bg-accent-hover transition-colors shrink-0"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Referral code */}
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-input border border-border-subtle">
          <div>
            <span className="text-[11px] text-text-muted">Your code: </span>
            <span className="text-[13px] font-bold text-text-primary font-mono tracking-wider">
              {data.referralCode}
            </span>
          </div>
          <button
            onClick={copyCode}
            className="text-[11px] text-accent font-semibold hover:text-accent-hover transition-colors"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-2">
        <div className="flex-1 rounded-xl bg-bg-surface p-3 text-center">
          <div className="text-[20px] font-bold text-text-primary font-inter">{data.totalReferrals}</div>
          <div className="text-[11px] text-text-muted">Friends Invited</div>
        </div>
        <div className="flex-1 rounded-xl bg-bg-surface p-3 text-center">
          <div className="text-[20px] font-bold text-accent font-inter">
            {data.totalReferrals > 0 ? "Active" : "—"}
          </div>
          <div className="text-[11px] text-text-muted">Status</div>
        </div>
      </div>

      {/* Referral list */}
      {data.referrals.length > 0 && (
        <div className="rounded-xl bg-bg-surface">
          <div className="px-4 py-2.5 border-b border-border-subtle">
            <span className="text-[12px] font-semibold text-text-secondary">Recent Referrals</span>
          </div>
          <div className="divide-y divide-border-subtle">
            {data.referrals.slice(0, 10).map((ref) => (
              <div key={ref.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <span className="text-[13px] font-medium text-text-primary">
                    {ref.displayName || ref.walletAddress}
                  </span>
                </div>
                <span className="text-[11px] text-text-muted">
                  {new Date(ref.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
