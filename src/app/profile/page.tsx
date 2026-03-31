"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAccount } from "wagmi";
import { useBetsSummary, useChain } from "@azuro-org/sdk";
import Link from "next/link";
import { ReferralCard } from "@/components/waliet/ReferralCard";
import { ActivityFeed } from "@/components/social/ActivityFeed";

function formatAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/* ── Level Tag (red badge from Figma) ── */
function LevelTag({ level }: { level: number }) {
  return (
    <div className="relative flex items-center h-[22px]">
      {/* Outer frame */}
      <div
        className="flex items-center justify-center h-[22px] px-2.5 rounded-[4px] overflow-hidden"
        style={{
          background: "rgba(237, 52, 64, 0.15)",
          border: "0.3px solid rgba(249, 73, 84, 0.42)",
          backdropFilter: "blur(4px)",
        }}
      >
        <span className="font-inter text-[10px] text-white">{level}</span>
      </div>
      {/* Inner label */}
      <div
        className="flex items-center justify-center h-[15px] px-1.5 rounded-[2px] overflow-hidden ml-[-4px] z-10"
        style={{
          boxShadow: "inset 0px 8px 14px 0px rgba(253, 80, 91, 0.40), 0px 1px 0px 0px #cb0c17",
        }}
      >
        <span className="text-[10px] font-medium text-white" style={{ fontFamily: "var(--font-sans)" }}>Bettor</span>
      </div>
      {/* Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[49px] h-[1px] blur-[7px]" style={{ background: "#f84551" }} />
    </div>
  );
}

/* ── Points Badge (silver from Figma) ── */
function PointsBadge({ points }: { points: number }) {
  return (
    <div
      className="flex items-center justify-center h-[15px] px-1.5 rounded-[2px] overflow-hidden"
      style={{
        boxShadow: "inset 0px 3px 8px 0px #e4e4e4, 0px 1px 0px 0px #575757",
      }}
    >
      <span className="font-inter text-[10px] font-normal" style={{ color: "#21201f" }}>{points}</span>
    </div>
  );
}

/* ── Action Button (dark, from Figma) ── */
function ActionButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex items-center justify-center gap-2 h-[32px] px-3 rounded-[8px] overflow-hidden text-[14px] text-[#eeeeee] transition-colors"
      style={{
        background: "#1a1a19",
        border: "1px solid #272625",
      }}
    >
      {children}
    </button>
  );
}

/* ── Edit Profile Form ── */
function EditProfileForm({ user, onClose }: { user: { displayName: string | null; avatar: string | null; bio: string | null; walletAddress: string }; onClose: () => void }) {
  const { refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatar ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setError("File too large. Max 4MB.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setAvatarUrl(data.url);
    } catch (e: any) {
      setError(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          bio: bio.trim() || null,
          avatar: avatarUrl.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }
      await refreshUser();
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-bg-card rounded-xl border border-border-subtle p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-text-primary">Edit Profile</h3>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors cursor-pointer">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      </div>

      {/* Avatar upload */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="relative w-16 h-16 rounded-[14px] overflow-hidden bg-bg-surface shrink-0 group cursor-pointer"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar preview" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(135deg, hsl(${parseInt(user.walletAddress.slice(2, 6), 16) % 360}, 70%, 45%), hsl(${parseInt(user.walletAddress.slice(6, 10), 16) % 360}, 60%, 35%))`,
              }}
            />
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? (
              <svg className="w-5 h-5 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileUpload}
            className="hidden"
          />
        </button>
        <div className="flex-1 min-w-0">
          <label className="text-[12px] text-text-muted mb-1 block">Profile Picture</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-9 px-3 rounded-lg bg-bg-input border border-border-subtle text-[13px] text-text-secondary hover:bg-bg-hover transition-colors disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Image"}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl("")}
                className="h-9 px-3 rounded-lg bg-bg-input border border-border-subtle text-[13px] text-text-muted hover:text-status-loss transition-colors"
              >
                Remove
              </button>
            )}
          </div>
          <p className="text-[10px] text-text-muted mt-1">JPG, PNG, WebP, or GIF. Max 4MB.</p>
        </div>
      </div>

      {/* Display name */}
      <div>
        <label className="text-[12px] text-text-muted mb-1 block">Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={formatAddress(user.walletAddress)}
          maxLength={50}
          className="w-full h-9 px-3 rounded-lg bg-bg-input border border-border-subtle text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="text-[12px] text-text-muted mb-1 block">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself..."
          maxLength={300}
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border-subtle text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors resize-none"
        />
        <div className="text-[11px] text-text-muted text-right mt-0.5">{bio.length}/300</div>
      </div>

      {error && <p className="text-[12px] text-red-400">{error}</p>}

      {/* Actions */}
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={onClose}
          className="h-9 px-4 rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="odds-glass odds-glass-active h-9 px-5 rounded-lg text-[13px] font-semibold text-white cursor-pointer disabled:opacity-50 active:scale-[0.99]"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

/* ── Privacy Settings ── */
function PrivacySettings({ onClose }: { onClose: () => void }) {
  const { refreshUser } = useAuth();
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [showStats, setShowStats] = useState(true);
  const [showBets, setShowBets] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((data) => {
      setVisibility(data.profileVisibility ?? "public");
      setShowStats(data.showStats ?? true);
      setShowBets(data.showBetHistory ?? true);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileVisibility: visibility, showStats, showBetHistory: showBets }),
    });
    await refreshUser();
    setSaving(false);
    onClose();
  };

  if (!loaded) return <div className="p-5 text-center text-text-muted text-sm">Loading...</div>;

  return (
    <div className="bg-bg-card rounded-xl border border-border-subtle p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-text-primary">Privacy Settings</h3>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors cursor-pointer">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {/* Profile visibility */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-medium text-text-primary">Public Profile</div>
            <div className="text-[11px] text-text-muted">Others can view your profile</div>
          </div>
          <button
            onClick={() => setVisibility(visibility === "public" ? "private" : "public")}
            className={`w-10 h-6 rounded-full transition-colors ${visibility === "public" ? "bg-accent" : "bg-border-subtle"}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-1 ${visibility === "public" ? "translate-x-4" : ""}`} />
          </button>
        </div>

        {/* Show stats */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-medium text-text-primary">Show Betting Stats</div>
            <div className="text-[11px] text-text-muted">Win rate, profit, total bets</div>
          </div>
          <button
            onClick={() => setShowStats(!showStats)}
            className={`w-10 h-6 rounded-full transition-colors ${showStats ? "bg-accent" : "bg-border-subtle"}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-1 ${showStats ? "translate-x-4" : ""}`} />
          </button>
        </div>

        {/* Show bet history */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-medium text-text-primary">Show Bet History</div>
            <div className="text-[11px] text-text-muted">Recent bets visible on profile</div>
          </div>
          <button
            onClick={() => setShowBets(!showBets)}
            className={`w-10 h-6 rounded-full transition-colors ${showBets ? "bg-accent" : "bg-border-subtle"}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-1 ${showBets ? "translate-x-4" : ""}`} />
          </button>
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="odds-glass odds-glass-active h-9 rounded-lg text-[13px] font-semibold text-white cursor-pointer disabled:opacity-50 active:scale-[0.99]"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

/* ── Profile Card (1:1 from Figma) ── */
function ProfileCard() {
  const { user, isAuthenticated, signIn } = useAuth();
  const { address } = useAccount();
  const [editing, setEditing] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="relative w-[99px] h-[99px]">
          <div className="w-[99px] h-[99px] rounded-[22px] bg-bg-surface flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 20 20" fill="none" className="text-text-muted">
              <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M3 17.5C3 14.5 6 12.5 10 12.5C14 12.5 17 14.5 17 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="absolute top-0 right-0 w-[1px] h-[99px] rounded-[22px] pointer-events-none" style={{ background: "#ED3440", filter: "blur(8.85px)", transform: "scaleX(-1)" }} />
        </div>
        <p className="text-text-muted text-sm">Connect wallet to view profile</p>
        <button
          onClick={signIn}
          className="h-10 px-6 rounded-lg bg-accent text-btn-primary-text text-[14px] font-semibold hover:bg-accent-hover transition-colors cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (editing) {
    return <EditProfileForm user={user} onClose={() => setEditing(false)} />;
  }

  if (showPrivacy) {
    return <PrivacySettings onClose={() => setShowPrivacy(false)} />;
  }

  const displayName = user.displayName ?? formatAddress(user.walletAddress);
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" }) : null;

  return (
    <div className="flex items-start gap-5">
      {/* Avatar with glow */}
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
        {/* Red glow on right edge — Figma: 1px wide, blur 8.85px, #ED3440, flipped */}
        <div
          className="absolute top-0 right-0 w-[1px] h-[99px] rounded-[22px] pointer-events-none"
          style={{
            background: "#ED3440",
            filter: "blur(8.85px)",
            transform: "scaleX(-1)",
          }}
        />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-5 min-w-0">
        {/* Name + badges + bio */}
        <div className="flex flex-col gap-[5px]">
          <div className="flex items-center gap-3.5">
            <span className="text-[22px] font-medium text-white truncate">{displayName}</span>
            <div className="flex items-center gap-[7px] shrink-0">
              <LevelTag level={1} />
              <PointsBadge points={0} />
            </div>
          </div>
          {joinDate && <span className="text-[12px] text-[#686868]">Joined Waliet on {joinDate}</span>}
          {user.bio && <p className="text-[13px] text-text-secondary mt-1">{user.bio}</p>}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3.5">
          <ActionButton>
            <svg width="14" height="13" viewBox="0 0 14 13" fill="none">
              <path d="M3.45 8.35L6.91 11.81M6.91 11.81L10.37 8.35M6.91 11.81V4.58M13.23 4.92V4.09C13.23 2.93 13.23 2.35 13.01 1.9C12.81 1.51 12.49 1.19 12.1.99C11.65.77 11.07.77 9.91.77H4.09C2.93.77 2.35.77 1.9.99C1.51 1.19 1.19 1.51.99 1.9C.77 2.35.77 2.93.77 4.09V4.92" stroke="#EEEEEE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Deposit
          </ActionButton>
          <ActionButton onClick={() => setEditing(true)}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M11.5 1.5L14.5 4.5M1 15L1.5 11.5L12 1L15 4L4.5 14.5L1 15Z" stroke="#EEEEEE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Edit Profile
          </ActionButton>
          <ActionButton onClick={() => setShowPrivacy(true)}>
            Settings
          </ActionButton>
        </div>

        {/* Tipster CTA */}
        {user.isTipster ? (
          <Link href="/picks" className="flex items-center gap-2 mt-3 text-[13px] text-accent font-medium hover:text-accent-hover">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
            Manage my picks
          </Link>
        ) : (
          <Link href="/tipster/setup" className="flex items-center gap-2 mt-3 text-[13px] text-accent font-medium hover:text-accent-hover">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
            Become a Tipster — earn from your picks
          </Link>
        )}
      </div>
    </div>
  );
}

/* ── Stats Row ── */
function StatsRow() {
  const { user } = useAuth();
  const { address } = useAccount();
  const { betToken } = useChain();
  const { data: betStats } = useBetsSummary({ account: address ?? "0x" });
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    fetch("/api/favorites").then((r) => r.ok ? r.json() : []).then((data) => {
      setFavCount(Array.isArray(data) ? data.length : 0);
    }).catch(() => {});
  }, []);

  if (!user) return null;

  const betsCount = betStats?.betsCount ?? 0;
  const winRate = betsCount > 0 ? Math.round(((betStats?.wonBetsCount ?? 0) / betsCount) * 100) : 0;
  const profit = Number(betStats?.totalProfit ?? 0);
  const profitColor = profit > 0 ? "text-green-400" : profit < 0 ? "text-red-400" : "text-text-primary";

  const stats = [
    { label: "Total Bets", value: String(betsCount) },
    { label: "Win Rate", value: `${winRate}%` },
    { label: "Profit/Loss", value: `${profit >= 0 ? "+" : ""}${profit.toFixed(2)} ${betToken?.symbol ?? ""}`, color: profitColor },
    { label: "Favorites", value: String(favCount) },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-bg-card rounded-xl border border-border-subtle p-4 text-center">
          <div className={`text-[18px] font-bold font-inter ${"color" in stat ? stat.color : "text-text-primary"}`}>{stat.value}</div>
          <div className="text-[12px] text-text-muted mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Tournament Stats ── */
function TournamentStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ joined: 0, won: 0, prizeTotal: 0 });

  useEffect(() => {
    if (!user) return;
    fetch("/api/tournaments/my")
      .then((r) => r.ok ? r.json() : { created: [], joined: [] })
      .then((data) => {
        const joined = data.joined?.length ?? 0;
        const won = data.joined?.filter((e: any) => e.rank === 1).length ?? 0;
        const prizeTotal = data.joined?.reduce((sum: number, e: any) => sum + (e.prizeAmount ?? 0), 0) ?? 0;
        setStats({ joined, won, prizeTotal });
      })
      .catch(() => {});
  }, [user]);

  if (!user || stats.joined === 0) return null;

  return (
    <div>
      <h3 className="text-[14px] font-semibold text-text-primary mb-3">Tournaments</h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bg-card rounded-xl border border-border-subtle p-4 text-center">
          <div className="text-[18px] font-bold text-text-primary font-inter">{stats.joined}</div>
          <div className="text-[12px] text-text-muted mt-1">Joined</div>
        </div>
        <div className="bg-bg-card rounded-xl border border-border-subtle p-4 text-center">
          <div className="text-[18px] font-bold text-yellow-400 font-inter">{stats.won}</div>
          <div className="text-[12px] text-text-muted mt-1">Won</div>
        </div>
        <div className="bg-bg-card rounded-xl border border-border-subtle p-4 text-center">
          <div className="text-[18px] font-bold text-accent font-inter">{stats.prizeTotal > 0 ? stats.prizeTotal.toFixed(2) : "—"}</div>
          <div className="text-[12px] text-text-muted mt-1">Prize Earnings</div>
        </div>
      </div>
    </div>
  );
}

/* ── Recent Activity ── */
function RecentActivity() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div>
      <h3 className="text-[14px] font-semibold text-text-primary mb-3">Recent Activity</h3>
      <ActivityFeed userId={user.id} />
    </div>
  );
}

/* ── Profile Page ── */
export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-bg-page text-text-primary" style={{ letterSpacing: "-0.02em" }}>
      {/* Header */}
      <header className="h-14 flex items-center px-3 lg:px-6 border-b border-border-primary shrink-0">
        <Link href="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[14px] font-medium">Back</span>
        </Link>
      </header>

      {/* Content */}
      <div className="max-w-[700px] mx-auto p-4 lg:p-8 flex flex-col gap-8">
        <ProfileCard />
        <StatsRow />
        <TournamentStats />
        <ReferralCard />
        <RecentActivity />
      </div>
    </div>
  );
}
