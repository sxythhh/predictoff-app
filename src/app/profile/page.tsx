"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAccount } from "wagmi";
import Link from "next/link";
import { ReferralCard } from "@/components/waliet/ReferralCard";

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
  const [error, setError] = useState<string | null>(null);

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

      {/* Avatar preview */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-[14px] overflow-hidden bg-bg-surface shrink-0">
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
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-[12px] text-text-muted mb-1 block">Avatar URL</label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.png"
            className="w-full h-9 px-3 rounded-lg bg-bg-input border border-border-subtle text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors"
          />
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

/* ── Profile Card (1:1 from Figma) ── */
function ProfileCard() {
  const { user, isAuthenticated, signIn } = useAuth();
  const { address } = useAccount();
  const [editing, setEditing] = useState(false);

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

  const displayName = user.displayName ?? formatAddress(user.walletAddress);
  const joinDate = new Date().toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" });

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
          <span className="text-[12px] text-[#686868]">Joined Waliet on {joinDate}</span>
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
          <ActionButton>
            Settings
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

/* ── Stats Row ── */
function StatsRow() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Total Bets", value: "0" },
        { label: "Win Rate", value: "0%" },
        { label: "Profit/Loss", value: "$0.00" },
        { label: "Favorites", value: "0" },
      ].map((stat) => (
        <div key={stat.label} className="bg-bg-card rounded-xl border border-border-subtle p-4 text-center">
          <div className="text-[18px] font-bold text-text-primary font-inter">{stat.value}</div>
          <div className="text-[12px] text-text-muted mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Recent Activity ── */
function RecentActivity() {
  return (
    <div>
      <h3 className="text-[14px] font-semibold text-text-primary mb-3">Recent Activity</h3>
      <div className="bg-bg-card rounded-xl border border-border-subtle p-8 text-center">
        <p className="text-text-muted text-[13px]">No recent activity</p>
        <p className="text-text-muted text-[11px] mt-1">Your bets and comments will appear here</p>
      </div>
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
        <ReferralCard />
        <RecentActivity />
      </div>
    </div>
  );
}
