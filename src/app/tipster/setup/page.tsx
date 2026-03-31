"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/waliet/Toast";

export default function TipsterSetupPage() {
  const router = useRouter();
  const { user, signIn } = useAuth();
  const { toast } = useToast();
  const [tipsterBio, setTipsterBio] = useState("");
  const [price, setPrice] = useState("20");
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-bg-page flex flex-col items-center justify-center p-4">
        <p className="text-text-secondary mb-4">Sign in to become a tipster</p>
        <button onClick={signIn} className="h-10 px-6 rounded-lg bg-accent text-btn-primary-text font-semibold hover:bg-accent-hover">
          Sign In
        </button>
      </div>
    );
  }

  if (user.isTipster) {
    return (
      <div className="min-h-screen bg-bg-page flex flex-col items-center justify-center p-4 gap-4">
        <div className="text-[18px] font-semibold text-text-primary">You're already a tipster!</div>
        <Link href="/picks" className="text-accent hover:underline">Go to picks feed</Link>
      </div>
    );
  }

  const handleSetup = async () => {
    setSubmitting(true);
    const res = await fetch("/api/tipster/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipsterBio: tipsterBio.trim(), subscriptionPrice: parseFloat(price) }),
    });
    const data = await res.json();
    if (data.success) {
      toast("You're now a tipster!", "success");
      router.push("/picks");
    } else {
      toast(data.error ?? "Setup failed", "error");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-bg-page text-text-primary" style={{ letterSpacing: "-0.02em" }}>
      <header className="h-14 flex items-center px-3 lg:px-6 border-b border-border-primary">
        <Link href="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span className="text-[14px] font-medium">Back</span>
        </Link>
      </header>

      <div className="max-w-[500px] mx-auto p-4 lg:p-8">
        <h1 className="text-[24px] font-bold mb-2">Become a Tipster</h1>
        <p className="text-[14px] text-text-secondary mb-8">Share your betting expertise and earn from your picks. Your subscribers pay a monthly fee to access your premium analysis.</p>

        <div className="flex flex-col gap-5">
          {/* Bio */}
          <div>
            <label className="text-[12px] text-text-muted mb-1.5 block">Your pitch</label>
            <textarea
              value={tipsterBio}
              onChange={(e) => setTipsterBio(e.target.value)}
              placeholder="What makes your picks valuable? e.g., 'Football specialist with 65% win rate, focused on Premier League and Champions League'"
              maxLength={300}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border-input text-[13px] text-text-primary outline-none focus:border-accent transition-colors resize-none"
            />
            <div className="text-[10px] text-text-muted text-right">{tipsterBio.length}/300</div>
          </div>

          {/* Price */}
          <div>
            <label className="text-[12px] text-text-muted mb-1.5 block">Monthly subscription price (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[14px]">$</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="1"
                max="1000"
                className="w-full h-10 pl-7 pr-3 rounded-lg bg-bg-input border border-border-input text-[14px] text-text-primary outline-none focus:border-accent transition-colors"
              />
            </div>
            <p className="text-[11px] text-text-muted mt-1">You keep 90% of each subscription. Free picks are always available to everyone.</p>
          </div>

          {/* How it works */}
          <div className="bg-bg-surface rounded-xl p-4">
            <h3 className="text-[13px] font-semibold text-text-primary mb-2">How it works</h3>
            <div className="flex flex-col gap-2 text-[12px] text-text-secondary">
              <div className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-accent-muted flex items-center justify-center text-[10px] font-bold text-accent shrink-0">1</span>
                <span>Share free picks to build your audience</span>
              </div>
              <div className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-accent-muted flex items-center justify-center text-[10px] font-bold text-accent shrink-0">2</span>
                <span>Gate your best analysis behind a premium subscription</span>
              </div>
              <div className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-accent-muted flex items-center justify-center text-[10px] font-bold text-accent shrink-0">3</span>
                <span>Earn 90% of every subscription — paid out via Whop</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSetup}
            disabled={submitting}
            className="h-11 rounded-xl bg-accent text-btn-primary-text text-[14px] font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {submitting ? "Setting up..." : "Start Sharing Picks"}
          </button>
        </div>
      </div>
    </div>
  );
}
