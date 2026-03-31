"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { TournamentStatusBadge } from "@/components/waliet/tournaments/TournamentStatusBadge";
import { useToast } from "@/components/waliet/Toast";

export default function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { user, signIn } = useAuth();
  const { toast } = useToast();
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    // Find tournament by invite code
    fetch(`/api/tournaments?inviteCode=${code}`)
      .then(async (r) => {
        // The list endpoint doesn't support inviteCode filter yet,
        // so we need a direct lookup
        const res = await fetch(`/api/tournaments`);
        return res.json();
      })
      .catch(() => null)
      .finally(() => setLoading(false));

    // Direct lookup by invite code
    fetch(`/api/tournaments/invite/${code}`)
      .then((r) => r.ok ? r.json() : null)
      .then(setTournament)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [code]);

  const handleJoin = async () => {
    if (!user) {
      signIn();
      return;
    }
    if (!tournament) return;
    setJoining(true);
    const res = await fetch(`/api/tournaments/${tournament.id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: code }),
    });
    const data = await res.json();
    if (res.ok) {
      toast("Joined tournament!", "success");
      router.push(`/tournaments/${tournament.id}`);
    } else {
      toast(data.error ?? "Failed to join", "error");
    }
    setJoining(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center">
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-bg-page flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-[18px] font-semibold text-text-primary">Invalid invite link</div>
        <p className="text-text-muted text-[14px]">This tournament invite code is not valid or has expired.</p>
        <Link href="/tournaments" className="text-accent hover:underline text-[14px]">Browse tournaments</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page flex flex-col items-center justify-center p-4">
      <div className="max-w-[400px] w-full bg-bg-card rounded-2xl border border-border-subtle p-6 flex flex-col gap-4">
        <div className="text-center">
          <div className="text-[11px] text-text-muted mb-2">You're invited to</div>
          <h1 className="text-[20px] font-semibold text-text-primary">{tournament.title}</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <TournamentStatusBadge status={tournament.status} />
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
              tournament.format === "profit" ? "bg-accent-muted text-accent" : "bg-purple-500/10 text-purple-400"
            }`}>
              {tournament.format === "profit" ? "Profit" : "Pick'em"}
            </span>
          </div>
        </div>

        {tournament.description && (
          <p className="text-[13px] text-text-secondary text-center">{tournament.description}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-surface rounded-lg p-3 text-center">
            <div className="text-[14px] font-bold">{tournament.participantCount}</div>
            <div className="text-[11px] text-text-muted">Players</div>
          </div>
          <div className="bg-bg-surface rounded-lg p-3 text-center">
            <div className="text-[14px] font-bold text-accent">{tournament.prizePool > 0 ? tournament.prizePool.toFixed(2) : "Free"}</div>
            <div className="text-[11px] text-text-muted">Prize Pool</div>
          </div>
        </div>

        <button
          onClick={handleJoin}
          disabled={joining}
          className="h-11 rounded-xl bg-accent text-btn-primary-text text-[14px] font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {!user ? "Sign in to Join" : joining ? "Joining..." : "Join Tournament"}
        </button>

        <Link href="/tournaments" className="text-center text-[13px] text-text-muted hover:text-text-secondary">
          Browse all tournaments
        </Link>
      </div>
    </div>
  );
}
