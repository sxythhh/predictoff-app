"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TipsterCard } from "@/components/waliet/tipster/TipsterCard";

export default function TipstersPage() {
  const [tipsters, setTipsters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tipsters?limit=50")
      .then((r) => r.json())
      .then((d) => setTipsters(d.tipsters ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="text-text-primary" style={{ letterSpacing: "-0.02em" }}>
      <div className="max-w-[700px] mx-auto p-4 lg:p-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[18px] font-semibold">Tipsters</h1>
          <div className="flex items-center gap-3">
            <Link href="/tipsters/leaderboard" className="text-[13px] text-text-muted font-medium hover:text-text-secondary">
              Leaderboard
            </Link>
            <Link href="/picks" className="text-[13px] text-accent font-medium hover:text-accent-hover">
              Picks Feed
            </Link>
          </div>
        </div>
        <div className="mb-4">
          <p className="text-[13px] text-text-muted">Follow top tipsters and get access to their premium picks</p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-xl bg-bg-card animate-pulse border border-border-subtle" />)}
          </div>
        ) : tipsters.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-text-secondary text-[15px] font-medium">No tipsters yet</p>
            <p className="text-text-muted text-[13px] mt-1">
              Be the first — <Link href="/tipster/setup" className="text-accent hover:underline">become a tipster</Link>
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tipsters.map((t) => (
              <TipsterCard key={t.id} tipster={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
