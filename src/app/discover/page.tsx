"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { campaigns, type Campaign } from "./campaigns";

const allCategories = Array.from(new Set(campaigns.map((c) => c.category)));
const allPlatforms = ["youtube", "tiktok", "instagram", "x"];

/* ============================================================
   HELPERS
   ============================================================ */

function parseBudgetTotal(budget: string): number {
  const match = budget.match(/\$(\d+(?:\.\d+)?)K?\/\$(\d+(?:\.\d+)?)K?/);
  if (!match) return 0;
  const total = parseFloat(match[2]);
  return budget.includes("K") ? total * 1000 : total;
}

function parseCpm(cpm: string): number {
  const match = cpm.match(/\$([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

function platformLabel(platform: string) {
  switch (platform) {
    case "youtube":
      return "Y";
    case "tiktok":
      return "T";
    case "instagram":
      return "I";
    case "x":
      return "X";
    default:
      return "?";
  }
}

/* ============================================================
   SMALL COMPONENTS
   ============================================================ */

function VerifiedBadge() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="inline-block ml-1 shrink-0"
    >
      <circle cx="7" cy="7" r="7" fill="#3b82f6" />
      <path
        d="M4.5 7.2L6.2 8.8L9.5 5.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlatformPill({
  platform,
  index,
}: {
  platform: string;
  index: number;
}) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-[10px] font-bold text-text-primary"
      style={{
        width: 24,
        height: 24,
        outline: "2px solid var(--bg-page)",
        background: "var(--bg-subtle)",
        marginLeft: index > 0 ? -4 : 0,
      }}
    >
      {platformLabel(platform)}
    </span>
  );
}

function PlatformFilterButton({
  platform,
  active,
  onClick,
}: {
  platform: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`size-[36px] rounded-full flex items-center justify-center cursor-pointer transition-colors border ${
        active
          ? "bg-bg-active border-border-input shadow-sm"
          : "bg-transparent border-border-input"
      }`}
    >
      <span
        className={`text-[11px] font-bold ${active ? "text-text-primary" : "text-text-muted"}`}
      >
        {platformLabel(platform)}
      </span>
    </button>
  );
}

/* ============================================================
   CAMPAIGN CARD
   ============================================================ */

function CampaignCard({
  campaign,
  onClick,
  isGrid,
}: {
  campaign: Campaign;
  onClick: () => void;
  isGrid?: boolean;
}) {
  const budgetParts = campaign.budget.split("/");
  const STAGGER_80 = { "--expand-stagger": "20ms" } as React.CSSProperties;
  const STAGGER_100 = { "--expand-stagger": "40ms" } as React.CSSProperties;

  return (
    <div
      className={`discover-card-border verified-card-hover rounded-2xl overflow-hidden bg-bg-page flex flex-col cursor-pointer ${isGrid ? "relative w-full" : "w-[320px] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"} lg:group-hover/card:z-30`}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative">
        <div
          className={`aspect-[16/9] w-full bg-gradient-to-br ${campaign.gradient}`}
        />
      </div>

      {/* Body */}
      <div className="relative px-4 pt-3 pb-4 bg-bg-page flex flex-col gap-2 w-full">
        {/* Brand row */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              className="w-5 h-5 rounded-full shrink-0"
              style={{
                background: "linear-gradient(135deg, #888, #aaa)",
                boxShadow: "0 0 0 1px var(--border-subtle)",
              }}
            />
            <span className="text-[12px] font-medium text-text-primary truncate">
              {campaign.brand}
            </span>
            <VerifiedBadge />
            <span className="text-[12px] text-text-muted">
              &middot; {campaign.time}
            </span>
          </div>
          <div className="flex items-center pl-2 shrink-0">
            {campaign.platforms.map((p, i) => (
              <PlatformPill key={p} platform={p} index={i} />
            ))}
            {/* Category pill — hidden, expands on hover */}
            <div
              className="overflow-hidden max-w-0 opacity-0 lg:group-hover/card:max-w-[160px] lg:group-hover/card:opacity-100 lg:transition-[max-width,opacity] verified-expand-ease"
              style={STAGGER_80}
            >
              <div className="pl-1">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-text-primary whitespace-nowrap"
                  style={{
                    outline: "2px solid var(--bg-page)",
                    background: "var(--bg-subtle)",
                  }}
                >
                  {campaign.category}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex flex-col">
            <p className="text-[14px] font-semibold leading-[20px] tracking-[-0.18px] text-text-primary line-clamp-1">
              {campaign.title}
            </p>
            {/* Description — expand on hover */}
            <div className="grid grid-rows-[0fr] lg:group-hover/card:grid-rows-[1fr] lg:transition-[grid-template-rows] verified-expand">
              <div
                className="overflow-hidden opacity-0 lg:group-hover/card:opacity-100 lg:transition-opacity verified-expand-ease"
                style={STAGGER_80}
              >
                <div className="h-10 pt-1">
                  <p className="line-clamp-2 text-[14px] font-normal leading-[140%] tracking-[-0.18px] text-text-secondary">
                    {campaign.description || `Join ${campaign.brand}'s campaign and earn by creating engaging content for their audience.`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Join button — expand on hover */}
          <div className="grid grid-rows-[0fr] lg:group-hover/card:grid-rows-[1fr] lg:transition-[grid-template-rows] verified-expand">
            <div
              className="overflow-hidden opacity-0 lg:group-hover/card:opacity-100 lg:transition-opacity verified-expand-ease"
              style={STAGGER_100}
            >
              <div className="flex items-center gap-2 pb-1">
                <div
                  className="flex items-center justify-center h-9 w-[128px] rounded-full flex-none cursor-pointer transition-[transform,filter] duration-150 hover:brightness-110 active:scale-[0.96] bg-accent"
                  onClick={(e) => { e.stopPropagation(); onClick(); }}
                >
                  <span className="text-[14px] font-semibold leading-[21px] text-btn-primary-text whitespace-nowrap">
                    Join Campaign
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between w-full">
            <span className="text-[12px] font-semibold text-text-primary">
              {budgetParts[0]}
              <span className="text-text-muted">/{budgetParts[1]}</span>
            </span>
            <div className="flex items-center -space-x-1">
              <span
                className="relative z-[1] inline-flex items-center gap-[2px] rounded-full px-2 py-[3px] h-6 text-[12px] font-semibold text-text-primary"
                style={{
                  outline: "2px solid var(--bg-page)",
                  background: "var(--bg-subtle)",
                }}
              >
                <svg width="10" height="10" viewBox="0 0 11 12" fill="none" className="shrink-0">
                  <path d="M5.0153 0C3.56555 0 2.3903 1.17525 2.3903 2.625C2.3903 4.07475 3.56555 5.25 5.0153 5.25C6.46505 5.25 7.6403 4.07475 7.6403 2.625C7.6403 1.17525 6.46505 0 5.0153 0Z" fill="currentColor"/>
                  <path d="M5.01574 5.83333C2.24037 5.83333 0.300456 7.8873 0.0599713 10.4454L0 11.0833H10.0315L9.97152 10.4454C9.73103 7.8873 7.79112 5.83333 5.01574 5.83333Z" fill="currentColor"/>
                </svg>
                {campaign.creators}
              </span>
              <span
                className="relative inline-flex items-center justify-center rounded-full px-2 py-[3px] h-6 text-[12px] font-semibold text-accent"
                style={{
                  outline: "2px solid var(--bg-page)",
                  background: "var(--accent-muted)",
                }}
              >
                <span>{campaign.cpm}</span>
                <span className="opacity-70">/1K</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full relative">
        <div className="absolute inset-0 bg-border-subtle" />
        <div
          className="absolute inset-y-0 left-0 bg-accent"
          style={{ width: `${campaign.progress}%` }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   CAMPAIGN MODAL
   ============================================================ */

function CampaignModal({
  campaign,
  onClose,
}: {
  campaign: Campaign;
  onClose: () => void;
}) {
  const router = useRouter();
  const [animating, setAnimating] = useState(true);
  const [expanding, setExpanding] = useState(false);

  const handleExpand = useCallback(() => {
    setExpanding(true);
    setTimeout(() => {
      router.push(`/discover/${campaign.id}`);
    }, 200);
  }, [router, campaign.id]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimating(false));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [handleEsc]);

  const budgetParts = campaign.budget.split("/");
  const approvalRate = 92;

  const surfaceStyle: React.CSSProperties = {
    background: "var(--bg-subtle)",
    border: "1px solid var(--border-subtle)",
  };

  const glassPill = (children: React.ReactNode, extraClass = "") => (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-text-secondary ${extraClass}`}
      style={{
        outline: "2px solid var(--bg-card)",
        background: "var(--bg-subtle)",
      }}
    >
      {children}
    </span>
  );

  const blueGlassPill = (children: React.ReactNode) => (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-accent"
      style={{
        outline: "2px solid var(--bg-card)",
        background: "var(--accent-muted)",
      }}
    >
      {children}
    </span>
  );

  const trophyColors = [
    "linear-gradient(135deg, #FFD700, #FFA500)",
    "linear-gradient(135deg, #C0C0C0, #A0A0A0)",
    "linear-gradient(135deg, #CD7F32, #A0522D)",
  ];

  const topEarners = [
    { name: "Creator1", views: 45000 },
    { name: "Creator2", views: 32000 },
    { name: "Creator3", views: 28000 },
  ];

  const resources = [
    { label: "YouTube", description: "Example clips", icon: "play" },
    { label: "Google Drive", description: "Brand assets", icon: "folder" },
  ];

  const requirements = [
    "Include product in first 30 seconds",
    "Show unboxing experience",
    "Mention discount code",
    "Tag brand account",
    "Use campaign hashtag",
  ];

  const chartPoints = [
    [0, 60],
    [40, 45],
    [80, 55],
    [120, 30],
    [160, 40],
    [200, 20],
    [240, 25],
    [280, 10],
    [320, 15],
    [360, 5],
  ];
  const chartPath = chartPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`)
    .join(" ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(ellipse at center, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.85) 100%)",
      }}
      onClick={onClose}
    >
      <div
        className="relative max-w-[800px] w-full max-h-[85vh] rounded-3xl overflow-hidden"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-primary)",
          transform: animating ? "scale(0.92) translateY(14px)" : expanding ? "scale(1.03)" : "none",
          opacity: animating || expanding ? 0 : 1,
          transition:
            "transform 320ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[85vh]">
          {/* Expand + Close buttons - sticky */}
          <div className="sticky top-0 z-10 flex justify-end gap-2 p-4 pointer-events-none">
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center pointer-events-auto cursor-pointer"
              style={{
                background:
                  "linear-gradient(0deg, rgba(0,0,0,0.2), rgba(0,0,0,0.2)), radial-gradient(86.44% 42.53% at 50.57% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%)",
                boxShadow:
                  "inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 0 rgba(255,255,255,0.3)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
              onClick={handleExpand}
              aria-label="Expand to full page"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M9.5 2.5H13.5V6.5M6.5 13.5H2.5V9.5M13.5 2.5L9 7M2.5 13.5L7 9"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center pointer-events-auto cursor-pointer"
              style={{
                background:
                  "linear-gradient(0deg, rgba(0,0,0,0.2), rgba(0,0,0,0.2)), radial-gradient(86.44% 42.53% at 50.57% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%)",
                boxShadow:
                  "inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 0 rgba(255,255,255,0.3)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
              onClick={onClose}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 4L12 12M12 4L4 12"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Banner thumbnail */}
          <div
            className={`aspect-video w-full bg-gradient-to-br ${campaign.gradient} -mt-[72px]`}
          />

          {/* Banner info */}
          <div className="px-8 pt-5 pb-2">
            {/* Brand row */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-6 h-6 rounded-full shrink-0"
                style={{
                  background: "linear-gradient(135deg, #888, #aaa)",
                  boxShadow: "0 0 0 1px var(--border-subtle)",
                }}
              />
              <span className="text-sm font-medium text-text-primary">
                {campaign.brand}
              </span>
              <VerifiedBadge />
              <span className="text-sm text-text-muted">
                &middot; {approvalRate}% approval rate
              </span>
            </div>

            {/* Title */}
            <h2
              className="font-semibold text-text-primary mb-4"
              style={{ fontSize: 32, letterSpacing: "-0.6px" }}
            >
              {campaign.title}
            </h2>

            {/* Stats row */}
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-text-primary">
                  {budgetParts[0]}
                  <span className="text-text-muted">/{budgetParts[1]}</span>
                </span>
                <div
                  className="rounded-full overflow-hidden bg-border-subtle"
                  style={{ width: 80, height: 4 }}
                >
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${campaign.progress}%` }}
                  />
                </div>
              </div>

              <span className="text-text-muted">|</span>

              <div className="flex items-center gap-2 flex-wrap">
                {glassPill(
                  <>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M6 6C7.1 6 8 5.1 8 4C8 2.9 7.1 2 6 2C4.9 2 4 2.9 4 4C4 5.1 4.9 6 6 6ZM6 7C4.67 7 2 7.67 2 9V10H10V9C10 7.67 7.33 7 6 7Z"
                        fill="currentColor"
                        opacity="0.7"
                      />
                    </svg>
                    {campaign.creators} creators
                  </>
                )}
                {glassPill(
                  <>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <rect
                        x="1"
                        y="1"
                        width="10"
                        height="10"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        fill="none"
                      />
                      <path
                        d="M1 4H11"
                        stroke="currentColor"
                        strokeWidth="1.2"
                      />
                    </svg>
                    {campaign.category}
                  </>
                )}
                {glassPill(
                  <>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M3 6.5L5 8.5L9 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {approvalRate}%
                  </>
                )}
                {blueGlassPill(<>{campaign.cpm}/1K</>)}
              </div>
            </div>

            {/* Description */}
            <p
              className="text-base leading-relaxed line-clamp-4 mb-5 text-text-secondary"
            >
              {campaign.description}
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-3 mb-6">
              <button
                className="rounded-[40px] px-8 text-base font-semibold cursor-pointer bg-accent text-btn-primary-text"
                style={{ height: 48 }}
              >
                Join Campaign
              </button>
              <button
                className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
                style={{
                  background:
                    "linear-gradient(0deg, rgba(0,0,0,0.2), rgba(0,0,0,0.2)), radial-gradient(86.44% 42.53% at 50.57% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%)",
                  boxShadow:
                    "inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 0 rgba(255,255,255,0.3)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M6 3L10 3C11.1046 3 12 3.89543 12 5V5C12 6.10457 11.1046 7 10 7L8 7M8 7L10 5M8 7L10 9"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4 9V13H13"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* ===== Content Sections ===== */}
          <div className="px-8 flex flex-col gap-8 pb-8">
            {/* Requirements */}
            <div>
              <h3 className="text-base font-medium text-text-primary mb-3">
                Requirements
              </h3>
              <p className="text-xs font-medium mb-3 text-text-muted">
                Content Requirements
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                {requirements.map((req) => (
                  <div key={req} className="flex items-start gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="shrink-0 mt-0.5 text-text-muted"
                    >
                      <circle
                        cx="8"
                        cy="8"
                        r="6"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        fill="none"
                        opacity="0.5"
                      />
                      <path
                        d="M5.5 8L7.2 9.7L10.5 6.3"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.7"
                      />
                    </svg>
                    <span className="text-sm text-text-secondary">
                      {req}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Earnings + Analytics row */}
            <div className="flex gap-2 flex-col sm:flex-row">
              {/* Earnings */}
              <div className="flex-1">
                <h3 className="text-base font-medium text-text-primary mb-3">
                  Earnings
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <div className="rounded-2xl p-4" style={surfaceStyle}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-text-primary">
                        YouTube
                      </span>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{
                          background: "rgba(255,0,0,0.2)",
                          border: "1px solid rgba(255,0,0,0.3)",
                        }}
                      >
                        Y
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary mb-2">
                      $8.50 / 1K views
                    </p>
                    <div className="flex items-center gap-2">
                      {glassPill("Min $2")}
                      {glassPill("Max $50")}
                    </div>
                  </div>

                  <div className="rounded-2xl p-4" style={surfaceStyle}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-text-primary">
                        TikTok
                      </span>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{
                          background: "rgba(0,255,255,0.15)",
                          border: "1px solid rgba(0,255,255,0.25)",
                        }}
                      >
                        T
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary mb-2">
                      $5.20 / 1K views
                    </p>
                    <div className="flex items-center gap-2">
                      {glassPill("Min $1")}
                      {glassPill("Max $30")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics */}
              <div className="flex-1">
                <h3 className="text-base font-medium text-text-primary mb-3">
                  Analytics
                </h3>
                <div
                  className="rounded-2xl p-4 flex flex-col"
                  style={{ ...surfaceStyle, height: 252 }}
                >
                  <div className="flex items-center gap-1 mb-4">
                    <button className="rounded-full px-3 py-1 text-xs font-medium text-text-primary bg-bg-active">
                      Views
                    </button>
                    <button className="rounded-full px-3 py-1 text-xs font-medium text-text-muted">
                      Submissions
                    </button>
                  </div>

                  <p className="text-2xl font-semibold text-text-primary">
                    1,234,567
                  </p>
                  <p className="text-sm mb-4 text-text-muted">
                    Total views
                  </p>

                  <div className="flex-1 min-h-0">
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 360 70"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient
                          id="chartStroke"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="0"
                        >
                          <stop
                            offset="0%"
                            stopColor="white"
                            stopOpacity="0.25"
                          />
                          <stop
                            offset="100%"
                            stopColor="white"
                            stopOpacity="1"
                          />
                        </linearGradient>
                      </defs>
                      <path
                        d={chartPath}
                        fill="none"
                        stroke="url(#chartStroke)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Earners */}
            <div>
              <h3 className="text-base font-medium text-text-primary mb-3">
                Top Earners
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {topEarners.map((earner, i) => (
                  <div
                    key={earner.name}
                    className="rounded-2xl p-4"
                    style={surfaceStyle}
                  >
                    <div className="flex items-center gap-1.5 mb-3">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M7 2.5C3.5 2.5 1 7 1 7C1 7 3.5 11.5 7 11.5C10.5 11.5 13 7 13 7C13 7 10.5 2.5 7 2.5Z"
                          stroke="rgba(255,255,255,0.5)"
                          strokeWidth="1.2"
                          fill="none"
                        />
                        <circle
                          cx="7"
                          cy="7"
                          r="2"
                          stroke="rgba(255,255,255,0.5)"
                          strokeWidth="1.2"
                          fill="none"
                        />
                      </svg>
                      <span className="text-lg font-semibold text-text-primary">
                        {(earner.views / 1000).toFixed(0)}K
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full shrink-0"
                          style={{
                            background: "linear-gradient(135deg, #555, #777)",
                          }}
                        />
                        <span className="text-xs font-medium text-text-secondary">
                          {earner.name}
                        </span>
                      </div>
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: trophyColors[i] }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M3 2H9V5C9 6.657 7.657 8 6 8C4.343 8 3 6.657 3 5V2Z"
                            fill="rgba(0,0,0,0.3)"
                            stroke="rgba(0,0,0,0.2)"
                            strokeWidth="0.5"
                          />
                          <path d="M5 8V10H7V8" fill="rgba(0,0,0,0.2)" />
                          <path
                            d="M4 10H8"
                            stroke="rgba(0,0,0,0.3)"
                            strokeWidth="0.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-base font-medium text-text-primary mb-3">
                Resources
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {resources.map((res) => (
                  <div
                    key={res.label}
                    className="rounded-2xl px-4 flex items-center gap-3"
                    style={{ ...surfaceStyle, height: 80 }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted"
                      style={{
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {res.icon === "play" ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M5 3L12 8L5 13V3Z"
                            fill="currentColor"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M2 4C2 3.44772 2.44772 3 3 3H6L8 5H13C13.5523 5 14 5.44772 14 6V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V4Z"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            fill="none"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {res.label}
                      </p>
                      <p className="text-xs text-text-muted">
                        {res.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DROPDOWN COMPONENT
   ============================================================ */

function Dropdown({
  label,
  options,
  value,
  onChange,
  onClose,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (v: string | null) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-2 z-50 min-w-[180px] p-1.5"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-primary)",
        borderRadius: 16,
        transform: entered ? "none" : "translateY(-4px) scale(0.97)",
        opacity: entered ? 1 : 0,
        transition:
          "transform 150ms cubic-bezier(0.165,0.84,0.44,1), opacity 150ms cubic-bezier(0.165,0.84,0.44,1)",
      }}
    >
      {options.map((opt) => {
        const isSelected = value === opt;
        return (
          <button
            key={opt}
            className={`w-full flex items-center gap-2 h-[36px] px-3 rounded-xl text-[14px] font-medium text-text-primary cursor-pointer transition-colors ${
              isSelected ? "bg-bg-active" : "hover:bg-bg-hover"
            }`}
            onClick={() => {
              onChange(isSelected ? null : opt);
              onClose();
            }}
          >
            {/* Checkbox circle */}
            <span
              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                isSelected ? "border-text-secondary bg-bg-active" : "border-border-input"
              }`}
            >
              {isSelected && (
                <span className="w-2 h-2 rounded-full bg-text-primary" />
              )}
            </span>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   SORT DROPDOWN
   ============================================================ */

function SortDropdown({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  const options = [
    "Newest",
    "Highest CPM",
    "Lowest CPM",
    "Highest Budget",
    "Most Creators",
  ];

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 mt-2 z-50 min-w-[180px] p-1.5"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-primary)",
        borderRadius: 16,
        transform: entered ? "none" : "translateY(-4px) scale(0.97)",
        opacity: entered ? 1 : 0,
        transition:
          "transform 150ms cubic-bezier(0.165,0.84,0.44,1), opacity 150ms cubic-bezier(0.165,0.84,0.44,1)",
      }}
    >
      {options.map((opt) => {
        const isSelected = value === opt;
        return (
          <button
            key={opt}
            className={`w-full flex items-center gap-2 h-[36px] px-3 rounded-xl text-[14px] font-medium text-text-primary cursor-pointer transition-colors ${
              isSelected ? "bg-bg-active" : "hover:bg-bg-hover"
            }`}
            onClick={() => {
              onChange(opt);
              onClose();
            }}
          >
            <span
              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                isSelected ? "border-text-secondary bg-bg-active" : "border-border-input"
              }`}
            >
              {isSelected && (
                <span className="w-2 h-2 rounded-full bg-text-primary" />
              )}
            </span>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   CAMPAIGN MODAL HOOK
   ============================================================ */

function useCampaignModal() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const campaignRef = useRef(campaign);
  campaignRef.current = campaign;

  const open = useCallback((c: Campaign) => {
    setCampaign(c);
    window.history.pushState({ campaignModal: c.id }, "", `/discover/${c.id}`);
  }, []);

  const close = useCallback(() => {
    setCampaign(null);
    window.history.replaceState(null, "", "/discover");
  }, []);

  useEffect(() => {
    const onPopState = () => {
      if (campaignRef.current) setCampaign(null);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return { isOpen: campaign !== null, campaign, open, close };
}

/* ============================================================
   MAIN PAGE
   ============================================================ */

export default function DiscoverPage() {
  // --- State ---
  const [search, setSearch] = useState("");
  const [activePlatforms, setActivePlatforms] = useState<Set<string>>(
    new Set(allPlatforms)
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("Newest");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const modal = useCampaignModal();

  // Hero banner state
  const [heroSlide, setHeroSlide] = useState(0);
  const heroCount = 3;

  // --- Drag scroll refs ---
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    hasDragged: false,
    pointerId: -1,
  });

  // --- Filters ---
  const hasFilters =
    search !== "" ||
    activePlatforms.size !== allPlatforms.length ||
    selectedCategory !== null ||
    sortBy !== "Newest";

  const clearFilters = () => {
    setSearch("");
    setActivePlatforms(new Set(allPlatforms));
    setSelectedCategory(null);
    setSortBy("Newest");
  };

  const togglePlatform = (p: string) => {
    setActivePlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) {
        // Don't allow deselecting all
        if (next.size > 1) next.delete(p);
      } else {
        next.add(p);
      }
      return next;
    });
  };

  // --- Filtered + sorted campaigns ---
  const filtered = useMemo(() => {
    let result = [...campaigns];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.brand.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q)
      );
    }

    // Platform filter
    result = result.filter((c) =>
      c.platforms.some((p) => activePlatforms.has(p))
    );

    // Category
    if (selectedCategory) {
      result = result.filter((c) => c.category === selectedCategory);
    }

    // Sort
    switch (sortBy) {
      case "Highest CPM":
        result.sort((a, b) => parseCpm(b.cpm) - parseCpm(a.cpm));
        break;
      case "Lowest CPM":
        result.sort((a, b) => parseCpm(a.cpm) - parseCpm(b.cpm));
        break;
      case "Highest Budget":
        result.sort(
          (a, b) => parseBudgetTotal(b.budget) - parseBudgetTotal(a.budget)
        );
        break;
      case "Most Creators":
        result.sort((a, b) => b.creators - a.creators);
        break;
      default:
        break;
    }

    return result;
  }, [search, activePlatforms, selectedCategory, sortBy]);

  const featuredCampaigns = campaigns.slice(0, 4);

  // --- Drag-to-scroll handlers ---
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const ds = dragState.current;
      ds.isDown = true;
      ds.startX = e.clientX;
      ds.scrollLeft = scrollRef.current?.scrollLeft ?? 0;
      ds.hasDragged = false;
      ds.pointerId = e.pointerId;
    },
    []
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const ds = dragState.current;
      if (!ds.isDown) return;
      const dx = e.clientX - ds.startX;
      if (Math.abs(dx) > 5) {
        if (!ds.hasDragged) {
          ds.hasDragged = true;
          try {
            (e.currentTarget as HTMLElement).setPointerCapture(ds.pointerId);
          } catch {
            /* ignore */
          }
          (e.currentTarget as HTMLElement).style.cursor = "grabbing";
        }
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = ds.scrollLeft - dx;
        }
      }
    },
    []
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const ds = dragState.current;
      if (ds.hasDragged) {
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(ds.pointerId);
        } catch {
          /* ignore */
        }
      }
      (e.currentTarget as HTMLElement).style.cursor = "grab";
      ds.isDown = false;
    },
    []
  );

  const onClickCapture = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState.current.hasDragged) {
      e.stopPropagation();
      e.preventDefault();
      dragState.current.hasDragged = false;
    }
  }, []);

  // --- Hero auto-advance ---
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % heroCount);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const heroCampaign = campaigns[heroSlide];

  return (
    <>
      <div className="min-h-screen bg-bg-card">
        {/* ===== HERO BANNER ===== */}
        <div
          className="relative w-full overflow-hidden"
          style={{ height: "clamp(28vh, 42vw, 70vh)" }}
        >
          {/* Background image / gradient */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${heroCampaign.gradient} transition-opacity duration-700`}
          />
          {/* Bottom fade */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, transparent 40%, var(--bg-card) 100%)",
            }}
          />

          {/* Content */}
          <div className="absolute bottom-[72px] left-0 px-3 sm:px-12 max-w-[770px]">
            {/* Brand */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="sm:size-6 size-5 rounded-full shrink-0"
                style={{
                  background: "linear-gradient(135deg, #444, #666)",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.4)",
                }}
              />
              <span className="text-[14px] font-medium text-white tracking-[-0.09px]">
                {heroCampaign.brand}
              </span>
            </div>

            {/* Title */}
            <h1
              className="font-semibold text-white mb-3"
              style={{
                fontSize: "clamp(18px, 3.125vw, 32px)",
                letterSpacing: "clamp(-0.69px, -0.06vw, -0.26px)",
              }}
            >
              {heroCampaign.title}
            </h1>

            {/* Meta */}
            <p className="text-[14px] leading-[20px] tracking-[0.01em] text-[rgba(255,255,255,0.72)] mb-5">
              {heroCampaign.creators} creators joined &middot;{" "}
              <span className="font-semibold text-white">
                {heroCampaign.cpm}
              </span>
              <span className="text-text-muted">/1K views</span> &middot;{" "}
              {heroCampaign.category}
            </p>

            {/* Join button */}
            <button
              className="h-12 px-8 rounded-[40px] text-[16px] font-semibold cursor-pointer"
              style={{
                background:
                  "radial-gradient(31.76% 50.52% at 64.86% 100.52%, rgba(255,63,213,0.35) 0%, rgba(255,63,213,0) 100%), radial-gradient(60.93% 50% at 51.43% 0%, rgba(255,255,255,0.265) 0%, rgba(255,255,255,0.005) 100%), linear-gradient(0deg, #1c1917, #1c1917)",
                boxShadow: "inset 0px 1px 0px rgba(255,255,255,0.08)",
                color: "#fff",
              }}
            >
              Join Campaign
            </button>
          </div>

          {/* Slide dots */}
          <div className="absolute bottom-[72px] left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {Array.from({ length: heroCount }).map((_, i) => (
              <button
                key={i}
                className="size-1.5 rounded-full cursor-pointer"
                style={{
                  background:
                    i === heroSlide ? "#fff" : "rgba(255,255,255,0.4)",
                }}
                onClick={() => setHeroSlide(i)}
              />
            ))}
          </div>

          {/* Nav arrows */}
          <div className="absolute bottom-[72px] right-3 sm:right-12 flex items-center gap-2">
            <button
              className="size-8 rounded-full flex items-center justify-center cursor-pointer"
              style={{ border: "1px solid rgba(255,255,255,0.3)" }}
              onClick={() =>
                setHeroSlide((prev) =>
                  prev === 0 ? heroCount - 1 : prev - 1
                )
              }
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  d="M8.5 3.5L5 7L8.5 10.5"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              className="size-8 rounded-full flex items-center justify-center cursor-pointer"
              style={{ border: "1px solid rgba(255,255,255,0.3)" }}
              onClick={() =>
                setHeroSlide((prev) => (prev + 1) % heroCount)
              }
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  d="M5.5 3.5L9 7L5.5 10.5"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* ===== FILTER BAR (sticky) ===== */}
        <div className="sticky top-0 z-40 bg-bg-card px-3 sm:px-12 py-4">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search input */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <circle
                  cx="6"
                  cy="6"
                  r="4.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <path
                  d="M9.5 9.5L12.5 12.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search campaigns..."
                className="h-9 rounded-full pl-9 pr-4 text-[14px] text-text-primary placeholder:text-text-muted outline-none bg-bg-input border border-border-input"
                style={{ minWidth: 200 }}
              />
            </div>

            {/* Sort button */}
            <div className="relative">
              <button
                className="size-[36px] rounded-full flex items-center justify-center cursor-pointer border border-border-input"
                onClick={() =>
                  setOpenDropdown(openDropdown === "sort" ? null : "sort")
                }
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M3 4H13M3 8H10M3 12H7"
                    stroke="currentColor"
                    className="text-text-secondary"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              {openDropdown === "sort" && (
                <SortDropdown
                  value={sortBy}
                  onChange={setSortBy}
                  onClose={() => setOpenDropdown(null)}
                />
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-border-input mx-1" />

            {/* Platform filter buttons */}
            {allPlatforms.map((p) => (
              <PlatformFilterButton
                key={p}
                platform={p}
                active={activePlatforms.has(p)}
                onClick={() => togglePlatform(p)}
              />
            ))}

            {/* Divider */}
            <div className="w-px h-5 bg-border-input mx-1" />

            {/* Category dropdown */}
            <div className="relative">
              <button
                className="h-[36px] rounded-full px-4 text-[13px] font-medium text-text-primary/80 flex items-center gap-1.5 cursor-pointer border border-border-input"
                onClick={() =>
                  setOpenDropdown(
                    openDropdown === "category" ? null : "category"
                  )
                }
              >
                {selectedCategory ?? "Category"}
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                >
                  <path
                    d="M2.5 3.75L5 6.25L7.5 3.75"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {openDropdown === "category" && (
                <Dropdown
                  label="Category"
                  options={allCategories}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  onClose={() => setOpenDropdown(null)}
                />
              )}
            </div>

            {/* Clear button */}
            {hasFilters && (
              <button
                className="text-[13px] font-medium text-text-secondary flex items-center gap-1 cursor-pointer ml-2"
                onClick={clearFilters}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M3 3L9 9M9 3L3 9"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ===== FEATURED ROW ===== */}
        <div className="mt-6">
          <h2 className="text-lg md:text-xl font-semibold text-text-primary tracking-tight px-3 sm:px-12 mb-4">
            Featured Campaigns
          </h2>
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto px-3 sm:px-12 py-12 -my-12 cursor-grab select-none scrollbar-hide"
            style={{
              overscrollBehaviorX: "contain",
              touchAction: "auto",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClickCapture={onClickCapture}
          >
            {featuredCampaigns.map((campaign) => (
              <button
                key={campaign.brand + "-featured"}
                type="button"
                className="group/card relative w-[320px] h-[310px] shrink-0 cursor-pointer text-left focus-visible:outline-none lg:hover:z-30"
                aria-label={`View ${campaign.title}`}
              >
                <CampaignCard
                  campaign={campaign}
                  onClick={() => {
                    if (!dragState.current.hasDragged) {
                      modal.open(campaign);
                    }
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* ===== ALL CAMPAIGNS GRID ===== */}
        <div className="mt-10 pb-16">
          <h2 className="text-lg md:text-xl font-semibold text-text-primary tracking-tight px-3 sm:px-12 mb-4">
            All Campaigns
          </h2>

          {filtered.length === 0 ? (
            <div className="px-3 sm:px-12 py-20 text-center">
              <p className="text-text-muted text-base">
                No campaigns match your filters.
              </p>
              <button
                className="mt-3 text-text-secondary text-sm underline cursor-pointer"
                onClick={clearFilters}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-2 sm:gap-3 px-3 sm:px-12">
              {filtered.map((campaign) => (
                <button
                  key={campaign.brand + "-grid"}
                  type="button"
                  className="group/card relative cursor-pointer text-left focus-visible:outline-none lg:hover:z-30"
                  aria-label={`View ${campaign.title}`}
                >
                  <CampaignCard
                    campaign={campaign}
                    onClick={() => modal.open(campaign)}
                    isGrid
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ===== MODAL ===== */}
        {modal.isOpen && modal.campaign && (
          <CampaignModal
            campaign={modal.campaign}
            onClose={modal.close}
          />
        )}
      </div>
    </>
  );
}
