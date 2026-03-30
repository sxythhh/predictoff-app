"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { campaigns } from "../campaigns";
import { notFound } from "next/navigation";

/* ============================================================
   FULL CAMPAIGN PAGE
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

function PlatformPill({ platform }: { platform: string }) {
  const label =
    platform === "youtube"
      ? "YouTube"
      : platform === "tiktok"
        ? "TikTok"
        : platform === "instagram"
          ? "Instagram"
          : platform === "x"
            ? "X"
            : platform;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white/80"
      style={{
        outline: "2px solid black",
        background:
          "linear-gradient(0deg, rgba(0,0,0,0.4), rgba(0,0,0,0.4)), radial-gradient(42.53% 86.44% at 50.57% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.32) 100%), #151515",
      }}
    >
      {label}
    </span>
  );
}

export default function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const campaign = campaigns.find((c) => c.id === id);

  if (!campaign) {
    notFound();
  }

  const [activeTab, setActiveTab] = useState("Overview");
  const budgetParts = campaign.budget.split("/");

  const handleBack = () => {
    const hasInternalHistory =
      document.referrer &&
      new URL(document.referrer).origin === window.location.origin;
    if (hasInternalHistory) router.back();
    else router.replace("/discover");
  };

  const surfaceStyle = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
  };

  const glassPill = (children: React.ReactNode) => (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white/80"
      style={{
        outline: "2px solid black",
        background:
          "linear-gradient(0deg, rgba(0,0,0,0.4), rgba(0,0,0,0.4)), radial-gradient(42.53% 86.44% at 50.57% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.32) 100%), #151515",
      }}
    >
      {children}
    </span>
  );

  const requirements = [
    "Include product in first 30 seconds",
    "Show unboxing experience",
    "Mention discount code",
    "Tag brand account",
    "Use campaign hashtag",
  ];

  const tabs = ["Overview", "Leaderboard", "Analytics"];

  return (
    <div className="min-h-screen bg-bg-card">
      {/* Sticky header */}
      <div
        className="sticky top-0 z-50 h-14 flex items-center px-6"
        style={{
          background: "rgba(21,21,21,0.8)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm font-medium text-text-primary/80 cursor-pointer hover:text-text-primary transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 4L6 8L10 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-6 pb-16">
        {/* Hero section */}
        <div className="flex flex-col lg:flex-row gap-8 pt-8">
          {/* Left column */}
          <div className="w-full lg:w-[520px] shrink-0">
            {/* Title */}
            <h1
              className="font-semibold text-text-primary mb-4"
              style={{ fontSize: 32, letterSpacing: "-0.6px" }}
            >
              {campaign.title}
            </h1>

            {/* Brand row */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-6 h-6 rounded-full shrink-0"
                style={{
                  background: "linear-gradient(135deg, #444, #666)",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.4)",
                }}
              />
              <span className="text-sm font-medium text-text-primary">
                {campaign.brand}
              </span>
              <VerifiedBadge />
            </div>

            {/* Description */}
            <p
              className="text-base leading-relaxed mb-6"
              style={{ color: "rgba(255,255,255,0.88)" }}
            >
              {campaign.description}
            </p>

            {/* Budget progress */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-base font-semibold text-text-primary">
                {budgetParts[0]}
                <span className="text-text-muted">/{budgetParts[1]}</span>
              </span>
              <div
                className="rounded-full overflow-hidden flex-1"
                style={{
                  height: 4,
                  background: "rgba(255,255,255,0.15)",
                }}
              >
                <div
                  className="h-full rounded-full bg-white"
                  style={{ width: `${campaign.progress}%` }}
                />
              </div>
              <span className="text-sm text-text-muted">
                {campaign.progress}%
              </span>
            </div>

            {/* Join button */}
            <button
              className="h-12 px-8 rounded-[40px] text-base font-semibold cursor-pointer mb-6"
              style={{
                background:
                  "radial-gradient(31.76% 50.52% at 64.86% 100.52%, rgba(255,63,213,0.35) 0%, rgba(255,63,213,0) 100%), radial-gradient(60.93% 50% at 51.43% 0%, rgba(255,255,255,0.265) 0%, rgba(255,255,255,0.005) 100%), linear-gradient(0deg, #1c1917, #1c1917)",
                boxShadow: "inset 0px 1px 0px rgba(255,255,255,0.08)",
                color: "#fff",
              }}
            >
              Join Campaign
            </button>

            {/* Platform pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {campaign.platforms.map((p) => (
                <PlatformPill key={p} platform={p} />
              ))}
              {glassPill(campaign.category)}
              {glassPill(<>{campaign.cpm}/1K</>)}
            </div>
          </div>

          {/* Right column - Hero thumbnail */}
          <div className="flex-1 min-w-0">
            <div
              className={`aspect-[280/152] w-full rounded-2xl bg-gradient-to-br ${campaign.gradient}`}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-10 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="h-9 px-5 rounded-full text-sm font-medium cursor-pointer transition-colors"
              style={
                activeTab === tab
                  ? {
                      background: "rgba(255,255,255,0.1)",
                      color: "#fff",
                    }
                  : {
                      background: "transparent",
                      color: "rgba(255,255,255,0.4)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }
              }
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content below tabs */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left content */}
          <div className="w-full lg:w-[520px] shrink-0 flex flex-col gap-8">
            {/* Requirements */}
            <div>
              <h3 className="text-base font-medium text-text-primary mb-3">
                Requirements
              </h3>
              <p
                className="text-xs font-medium mb-3"
                style={{ color: "rgba(255,255,255,0.56)" }}
              >
                Content Requirements
              </p>
              <div className="flex flex-col gap-2.5">
                {requirements.map((req) => (
                  <div key={req} className="flex items-start gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="shrink-0 mt-0.5"
                    >
                      <circle
                        cx="8"
                        cy="8"
                        r="6"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="1.2"
                        fill="none"
                      />
                      <path
                        d="M5.5 8L7.2 9.7L10.5 6.3"
                        stroke="rgba(255,255,255,0.5)"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span
                      className="text-sm"
                      style={{ color: "rgba(255,255,255,0.88)" }}
                    >
                      {req}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Earnings cards */}
            <div>
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
          </div>

          {/* Right sidebar */}
          <div className="flex-1 min-w-0">
            <div className="lg:sticky lg:top-[72px] flex flex-col gap-4">
              {/* Budget card */}
              <div className="rounded-2xl p-5" style={surfaceStyle}>
                <h4 className="text-sm font-medium text-text-secondary mb-3">
                  Budget
                </h4>
                <p className="text-2xl font-semibold text-text-primary mb-2">
                  {budgetParts[0]}
                  <span className="text-text-muted">/{budgetParts[1]}</span>
                </p>
                <div
                  className="rounded-full overflow-hidden mb-2"
                  style={{
                    height: 4,
                    background: "rgba(255,255,255,0.15)",
                  }}
                >
                  <div
                    className="h-full rounded-full bg-white"
                    style={{ width: `${campaign.progress}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted">
                  {campaign.progress}% distributed
                </p>
              </div>

              {/* Stats card */}
              <div className="rounded-2xl p-5" style={surfaceStyle}>
                <h4 className="text-sm font-medium text-text-secondary mb-4">
                  Stats
                </h4>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Creators</span>
                    <span className="text-sm font-semibold text-text-primary">
                      {campaign.creators}
                    </span>
                  </div>
                  <div
                    className="h-px"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">CPM</span>
                    <span className="text-sm font-semibold text-text-primary">
                      {campaign.cpm}
                    </span>
                  </div>
                  <div
                    className="h-px"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Category</span>
                    <span className="text-sm font-semibold text-text-primary">
                      {campaign.category}
                    </span>
                  </div>
                  <div
                    className="h-px"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Time Left</span>
                    <span className="text-sm font-semibold text-text-primary">
                      {campaign.time}
                    </span>
                  </div>
                  <div
                    className="h-px"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Approval Rate</span>
                    <span className="text-sm font-semibold text-text-primary">
                      92%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
