"use client";

import { useState } from "react";

/*
  Waliet logo: 3 vertical rounded bars, each with a diagonal cut (top-right corner sliced).
  The shape is created by clipping a diagonal fill against a rounded rectangle.

  Bar 1: rounded rect at x57-233, diagonal fill path inside
  Bar 2: rounded rect at x271-447, diagonal fill path inside
  Bar 3: rounded rect at x485-662, diagonal fill path inside
*/

// The actual clipped shapes from WalietSVG.svg — used for all animations
// Each bar = rounded rect clip + diagonal fill
const BAR_CLIPS = {
  bar1: "M57.03125 76.863v611.625c0 14.086 11.418 25.5 25.5 25.5h125.028c14.082 0 25.5-11.414 25.5-25.5V76.863c0-14.082-11.418-25.5-25.5-25.5H82.531c-14.082 0-25.5 11.418-25.5 25.5z",
  bar2: "M271.25 77.988v611.629c0 14.082 11.418 25.5 25.5 25.5h125.027c14.086 0 25.5-11.418 25.5-25.5V77.988c0-14.082-11.414-25.5-25.5-25.5H296.75c-14.082 0-25.5 11.418-25.5 25.5z",
  bar3: "M485.473 79.117v611.63c0 14.081 11.417 25.5 25.5 25.5H636c14.082 0 25.5-11.419 25.5-25.5V79.117c0-14.082-11.418-25.5-25.5-25.5H510.973c-14.082 0-25.5 11.418-25.5 25.5z",
};

// The diagonal fill shapes that create the cut effect — these ARE the visible logo shapes
const BAR_FILLS = {
  bar1: "M316.406 714.617L-0.962 392.527V-1.664h317.368v716.281",
  bar2: "M530.597 714.742L270.231 392.656V-1.535h260.366v716.277",
  bar3: "M744.816 714.871L484.45 392.785V-1.41h260.366v716.281",
};

function SplashVariant({ id, children, label }: { id: number; children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-[360px] h-[640px] rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center overflow-hidden relative">
        {children}
      </div>
      <span className="text-[13px] font-medium text-text-secondary">#{id} — {label}</span>
    </div>
  );
}

// Renders the full Waliet logo with proper clip paths
function WalietLogoFull({ prefix, fill = "white", style }: { prefix: string; fill?: string; style?: React.CSSProperties }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 735 735" width="200" height="200" style={style}>
      <defs>
        <clipPath id={`${prefix}-c1`}><path d={BAR_CLIPS.bar1}/></clipPath>
        <clipPath id={`${prefix}-c2`}><path d={BAR_CLIPS.bar2}/></clipPath>
        <clipPath id={`${prefix}-c3`}><path d={BAR_CLIPS.bar3}/></clipPath>
      </defs>
      <g clipPath={`url(#${prefix}-c1)`}><path fill={fill} d={BAR_FILLS.bar1}/></g>
      <g clipPath={`url(#${prefix}-c2)`}><path fill={fill} d={BAR_FILLS.bar2}/></g>
      <g clipPath={`url(#${prefix}-c3)`}><path fill={fill} d={BAR_FILLS.bar3}/></g>
    </svg>
  );
}

/* ═══════════════════════════════════════════
   1: WATER FILL — liquid rises inside actual logo shape
   ═══════════════════════════════════════════ */
function V1_WaterFill() {
  return (
    <SplashVariant id={1} label="Water Fill">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 735 735" width="200" height="200">
        <defs>
          {/* Clip to the FULL logo shape (all 3 bars with diagonal cuts) */}
          <clipPath id="wf-c1"><path d={BAR_CLIPS.bar1}/></clipPath>
          <clipPath id="wf-c2"><path d={BAR_CLIPS.bar2}/></clipPath>
          <clipPath id="wf-c3"><path d={BAR_CLIPS.bar3}/></clipPath>
          {/* Clip each bar's diagonal shape */}
          <clipPath id="wf-s1"><path d={BAR_FILLS.bar1}/></clipPath>
          <clipPath id="wf-s2"><path d={BAR_FILLS.bar2}/></clipPath>
          <clipPath id="wf-s3"><path d={BAR_FILLS.bar3}/></clipPath>
        </defs>

        {/* Ghost outline */}
        <g opacity="0.06">
          <g clipPath="url(#wf-c1)"><path fill="#fff" d={BAR_FILLS.bar1}/></g>
          <g clipPath="url(#wf-c2)"><path fill="#fff" d={BAR_FILLS.bar2}/></g>
          <g clipPath="url(#wf-c3)"><path fill="#fff" d={BAR_FILLS.bar3}/></g>
        </g>

        {/* Bar 1 — water fill clipped to both rounded rect AND diagonal shape */}
        <g clipPath="url(#wf-c1)">
          <g clipPath="url(#wf-s1)">
            <rect x="-10" y="0" width="350" height="750" fill="#33c771">
              <animate attributeName="y" values="750;-10;-10;750" dur="4s" repeatCount="indefinite" keyTimes="0;0.35;0.7;1" calcMode="spline" keySplines="0.22 1 0.36 1;0.5 0 0.5 1;0.76 0 0.24 1"/>
            </rect>
            {/* Wave shimmer */}
            <rect x="-10" y="0" width="350" height="750" fill="#2ab862" opacity="0.4">
              <animate attributeName="y" values="750;-20;-20;750" dur="4s" begin="0.15s" repeatCount="indefinite" keyTimes="0;0.35;0.7;1" calcMode="spline" keySplines="0.22 1 0.36 1;0.5 0 0.5 1;0.76 0 0.24 1"/>
            </rect>
          </g>
        </g>

        {/* Bar 2 — staggered */}
        <g clipPath="url(#wf-c2)">
          <g clipPath="url(#wf-s2)">
            <rect x="260" y="0" width="200" height="750" fill="#2ab862">
              <animate attributeName="y" values="750;-10;-10;750" dur="4s" begin="0.3s" repeatCount="indefinite" keyTimes="0;0.35;0.7;1" calcMode="spline" keySplines="0.22 1 0.36 1;0.5 0 0.5 1;0.76 0 0.24 1"/>
            </rect>
            <rect x="260" y="0" width="200" height="750" fill="#33c771" opacity="0.4">
              <animate attributeName="y" values="750;-20;-20;750" dur="4s" begin="0.45s" repeatCount="indefinite" keyTimes="0;0.35;0.7;1" calcMode="spline" keySplines="0.22 1 0.36 1;0.5 0 0.5 1;0.76 0 0.24 1"/>
            </rect>
          </g>
        </g>

        {/* Bar 3 — staggered more */}
        <g clipPath="url(#wf-c3)">
          <g clipPath="url(#wf-s3)">
            <rect x="475" y="0" width="200" height="750" fill="#33c771">
              <animate attributeName="y" values="750;-10;-10;750" dur="4s" begin="0.6s" repeatCount="indefinite" keyTimes="0;0.35;0.7;1" calcMode="spline" keySplines="0.22 1 0.36 1;0.5 0 0.5 1;0.76 0 0.24 1"/>
            </rect>
            <rect x="475" y="0" width="200" height="750" fill="#2ab862" opacity="0.4">
              <animate attributeName="y" values="750;-20;-20;750" dur="4s" begin="0.75s" repeatCount="indefinite" keyTimes="0;0.35;0.7;1" calcMode="spline" keySplines="0.22 1 0.36 1;0.5 0 0.5 1;0.76 0 0.24 1"/>
            </rect>
          </g>
        </g>
      </svg>
    </SplashVariant>
  );
}

/* ═══════════════════════════════════════════
   2: STAGGER SLIDE UP
   ═══════════════════════════════════════════ */
function V2_StaggerSlide() {
  return (
    <SplashVariant id={2} label="Stagger Slide Up">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 735 735" width="200" height="200" className="text-white">
        <defs>
          <clipPath id="ss-c1"><path d={BAR_CLIPS.bar1}/></clipPath>
          <clipPath id="ss-c2"><path d={BAR_CLIPS.bar2}/></clipPath>
          <clipPath id="ss-c3"><path d={BAR_CLIPS.bar3}/></clipPath>
        </defs>
        <g clipPath="url(#ss-c1)">
          <path fill="currentColor" d={BAR_FILLS.bar1}>
            <animateTransform attributeName="transform" type="translate" values="0 200;0 0;0 0;0 200" dur="3s" repeatCount="indefinite" keyTimes="0;0.25;0.7;1" calcMode="spline" keySplines="0.16 1 0.3 1;0.5 0 0.5 1;0.76 0 0.24 1"/>
          </path>
          <animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite" keyTimes="0;0.25;0.7;1"/>
        </g>
        <g clipPath="url(#ss-c2)">
          <path fill="currentColor" d={BAR_FILLS.bar2}>
            <animateTransform attributeName="transform" type="translate" values="0 200;0 0;0 0;0 200" dur="3s" begin="0.15s" repeatCount="indefinite" keyTimes="0;0.25;0.7;1" calcMode="spline" keySplines="0.16 1 0.3 1;0.5 0 0.5 1;0.76 0 0.24 1"/>
          </path>
          <animate attributeName="opacity" values="0;1;1;0" dur="3s" begin="0.15s" repeatCount="indefinite" keyTimes="0;0.25;0.7;1"/>
        </g>
        <g clipPath="url(#ss-c3)">
          <path fill="currentColor" d={BAR_FILLS.bar3}>
            <animateTransform attributeName="transform" type="translate" values="0 200;0 0;0 0;0 200" dur="3s" begin="0.3s" repeatCount="indefinite" keyTimes="0;0.25;0.7;1" calcMode="spline" keySplines="0.16 1 0.3 1;0.5 0 0.5 1;0.76 0 0.24 1"/>
          </path>
          <animate attributeName="opacity" values="0;1;1;0" dur="3s" begin="0.3s" repeatCount="indefinite" keyTimes="0;0.25;0.7;1"/>
        </g>
      </svg>
    </SplashVariant>
  );
}

/* ═══════════════════════════════════════════
   3: SCALE BOUNCE — bars pop in with elastic
   ═══════════════════════════════════════════ */
function V3_ScaleBounce() {
  return (
    <SplashVariant id={3} label="Scale Bounce">
      <div className="text-white animate-[bounce-loop_3s_ease-in-out_infinite]" style={{ width: 200, height: 200 }}>
        <WalietLogoFull prefix="sb" />
      </div>
      <style>{`
        @keyframes bounce-loop {
          0% { transform: scale(0); opacity: 0; }
          15% { transform: scale(1.15); opacity: 1; }
          25% { transform: scale(1); }
          70% { transform: scale(1); opacity: 1; }
          85% { transform: scale(1.05); }
          100% { transform: scale(0); opacity: 0; }
        }
      `}</style>
    </SplashVariant>
  );
}

/* ═══════════════════════════════════════════
   4: PULSE BREATHE — gentle scale pulse
   ═══════════════════════════════════════════ */
function V4_Pulse() {
  return (
    <SplashVariant id={4} label="Breathe Pulse">
      <div className="text-white animate-[breathe_2.5s_ease-in-out_infinite]" style={{ width: 200, height: 200 }}>
        <WalietLogoFull prefix="bp" />
      </div>
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1.05); opacity: 1; }
        }
      `}</style>
    </SplashVariant>
  );
}

/* ═══════════════════════════════════════════
   5: GLITCH — RGB split loop
   ═══════════════════════════════════════════ */
function V5_Glitch() {
  return (
    <SplashVariant id={5} label="Glitch">
      <div className="relative" style={{ width: 200, height: 200 }}>
        <div className="absolute inset-0 text-white z-10 animate-[g-main_3s_ease-out_infinite]">
          <WalietLogoFull prefix="g0" />
        </div>
        <div className="absolute inset-0 text-red-500/50 animate-[g-r_3s_ease-out_infinite]" style={{ mixBlendMode: "screen" }}>
          <WalietLogoFull prefix="g1" fill="#ef4444" />
        </div>
        <div className="absolute inset-0 text-cyan-500/50 animate-[g-b_3s_ease-out_infinite]" style={{ mixBlendMode: "screen" }}>
          <WalietLogoFull prefix="g2" fill="#06b6d4" />
        </div>
      </div>
      <style>{`
        @keyframes g-main {
          0%,5% { opacity: 0; } 6% { opacity: 1; } 7% { opacity: 0; }
          9% { opacity: 1; } 11% { opacity: 0; transform: translateX(4px); }
          13% { opacity: 1; transform: translateX(0); }
          50% { opacity: 1; } 52% { opacity: 0.8; transform: translateX(-2px); }
          53% { opacity: 1; transform: translateX(0); } 90% { opacity: 1; } 100% { opacity: 0; }
        }
        @keyframes g-r {
          0%,5% { transform: translate(0); opacity: 0.5; }
          7% { transform: translate(8px,-3px); } 11% { transform: translate(-4px,2px); }
          15% { transform: translate(0); opacity: 0; }
          50% { opacity: 0; } 51% { opacity: 0.5; transform: translate(5px,-2px); }
          54% { transform: translate(0); opacity: 0; } 100% { opacity: 0; }
        }
        @keyframes g-b {
          0%,5% { transform: translate(0); opacity: 0.5; }
          7% { transform: translate(-6px,3px); } 11% { transform: translate(3px,-2px); }
          15% { transform: translate(0); opacity: 0; }
          50% { opacity: 0; } 51% { opacity: 0.5; transform: translate(-4px,2px); }
          54% { transform: translate(0); opacity: 0; } 100% { opacity: 0; }
        }
      `}</style>
    </SplashVariant>
  );
}

/* ═══════════════════════════════════════════
   6: BLUR REVEAL
   ═══════════════════════════════════════════ */
function V6_BlurReveal() {
  return (
    <SplashVariant id={6} label="Blur Reveal">
      <div className="text-white animate-[blur-loop_3.5s_ease-in-out_infinite]" style={{ width: 200, height: 200 }}>
        <WalietLogoFull prefix="br" />
      </div>
      <style>{`
        @keyframes blur-loop {
          0% { filter: blur(30px); opacity: 0; transform: scale(1.3); }
          25% { filter: blur(0); opacity: 1; transform: scale(1); }
          70% { filter: blur(0); opacity: 1; transform: scale(1); }
          100% { filter: blur(30px); opacity: 0; transform: scale(0.8); }
        }
      `}</style>
    </SplashVariant>
  );
}

/* ═══════════════════════════════════════════
   7: NEON GLOW
   ═══════════════════════════════════════════ */
function V7_NeonGlow() {
  return (
    <SplashVariant id={7} label="Neon Glow">
      <div className="relative animate-[neon-loop_4s_ease-in-out_infinite]" style={{ width: 200, height: 200 }}>
        <div className="relative z-10"><WalietLogoFull prefix="n0" fill="#33c771" /></div>
        <div className="absolute inset-0 animate-[neon-pulse_2s_ease-in-out_infinite]" style={{ filter: "blur(12px)" }}>
          <WalietLogoFull prefix="n1" fill="#33c771" />
        </div>
        <div className="absolute inset-0" style={{ filter: "blur(30px)", opacity: 0.3 }}>
          <WalietLogoFull prefix="n2" fill="#33c771" />
        </div>
      </div>
      <style>{`
        @keyframes neon-loop {
          0% { opacity: 0; } 5% { opacity: 0.8; } 7% { opacity: 0.1; }
          9% { opacity: 0.9; } 12% { opacity: 0.3; } 18% { opacity: 1; }
          80% { opacity: 1; } 90% { opacity: 0.6; } 92% { opacity: 0.9; }
          95% { opacity: 0.2; } 100% { opacity: 0; }
        }
        @keyframes neon-pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
    </SplashVariant>
  );
}

/* ═══════════════════════════════════════════
   8: SLIDE FROM SIDES
   ═══════════════════════════════════════════ */
function V8_SlideFromSides() {
  return (
    <SplashVariant id={8} label="Slide From Sides">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 735 735" width="200" height="200">
        <defs>
          <clipPath id="sf-c1"><path d={BAR_CLIPS.bar1}/></clipPath>
          <clipPath id="sf-c2"><path d={BAR_CLIPS.bar2}/></clipPath>
          <clipPath id="sf-c3"><path d={BAR_CLIPS.bar3}/></clipPath>
        </defs>
        <g clipPath="url(#sf-c1)">
          <path fill="white" d={BAR_FILLS.bar1}>
            <animateTransform attributeName="transform" type="translate" values="-200 0;0 0;0 0;-200 0" dur="3.5s" repeatCount="indefinite" keyTimes="0;0.2;0.7;1" calcMode="spline" keySplines="0.16 1 0.3 1;0.5 0 0.5 1;0.76 0 0.24 1"/>
          </path>
          <animate attributeName="opacity" values="0;1;1;0" dur="3.5s" repeatCount="indefinite" keyTimes="0;0.2;0.7;1"/>
        </g>
        <g clipPath="url(#sf-c2)">
          <path fill="white" d={BAR_FILLS.bar2}>
            <animateTransform attributeName="transform" type="translate" values="0 -200;0 0;0 0;0 200" dur="3.5s" begin="0.1s" repeatCount="indefinite" keyTimes="0;0.2;0.7;1" calcMode="spline" keySplines="0.16 1 0.3 1;0.5 0 0.5 1;0.76 0 0.24 1"/>
          </path>
          <animate attributeName="opacity" values="0;1;1;0" dur="3.5s" begin="0.1s" repeatCount="indefinite" keyTimes="0;0.2;0.7;1"/>
        </g>
        <g clipPath="url(#sf-c3)">
          <path fill="white" d={BAR_FILLS.bar3}>
            <animateTransform attributeName="transform" type="translate" values="200 0;0 0;0 0;200 0" dur="3.5s" begin="0.2s" repeatCount="indefinite" keyTimes="0;0.2;0.7;1" calcMode="spline" keySplines="0.16 1 0.3 1;0.5 0 0.5 1;0.76 0 0.24 1"/>
          </path>
          <animate attributeName="opacity" values="0;1;1;0" dur="3.5s" begin="0.2s" repeatCount="indefinite" keyTimes="0;0.2;0.7;1"/>
        </g>
      </svg>
    </SplashVariant>
  );
}

/* ═══════════════════════════════════════════
   9: SPIN IN — whole logo rotates in
   ═══════════════════════════════════════════ */
function V9_SpinIn() {
  return (
    <SplashVariant id={9} label="Spin In">
      <div className="text-white animate-[spin-loop_3s_cubic-bezier(0.16,1,0.3,1)_infinite]" style={{ width: 200, height: 200 }}>
        <WalietLogoFull prefix="si" />
      </div>
      <style>{`
        @keyframes spin-loop {
          0% { transform: rotate(-180deg) scale(0); opacity: 0; }
          25% { transform: rotate(0) scale(1); opacity: 1; }
          70% { transform: rotate(0) scale(1); opacity: 1; }
          100% { transform: rotate(180deg) scale(0); opacity: 0; }
        }
      `}</style>
    </SplashVariant>
  );
}

/* ═══════════════════════════════════════════
   10: GRADIENT SWEEP — color wipes across shape
   ═══════════════════════════════════════════ */
function V10_GradientSweep() {
  return (
    <SplashVariant id={10} label="Gradient Sweep">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 735 735" width="200" height="200">
        <defs>
          <clipPath id="gw-c1"><path d={BAR_CLIPS.bar1}/></clipPath>
          <clipPath id="gw-c2"><path d={BAR_CLIPS.bar2}/></clipPath>
          <clipPath id="gw-c3"><path d={BAR_CLIPS.bar3}/></clipPath>
          <linearGradient id="gw-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#33c771"/>
            <stop offset="40%" stopColor="white"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
            <animateTransform attributeName="gradientTransform" type="translate" values="-2 0;1.5 0;-2 0" dur="3s" repeatCount="indefinite"/>
          </linearGradient>
        </defs>
        {/* Ghost */}
        <g opacity="0.04">
          <g clipPath="url(#gw-c1)"><path fill="#fff" d={BAR_FILLS.bar1}/></g>
          <g clipPath="url(#gw-c2)"><path fill="#fff" d={BAR_FILLS.bar2}/></g>
          <g clipPath="url(#gw-c3)"><path fill="#fff" d={BAR_FILLS.bar3}/></g>
        </g>
        {/* Swept */}
        <g clipPath="url(#gw-c1)"><path fill="url(#gw-grad)" d={BAR_FILLS.bar1}/></g>
        <g clipPath="url(#gw-c2)"><path fill="url(#gw-grad)" d={BAR_FILLS.bar2}/></g>
        <g clipPath="url(#gw-c3)"><path fill="url(#gw-grad)" d={BAR_FILLS.bar3}/></g>
      </svg>
    </SplashVariant>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function AnimationTestPage() {
  const [key, setKey] = useState(0);

  return (
    <div className="min-h-screen bg-bg-page text-text-primary p-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[24px] font-bold">Waliet Splash Animations</h1>
            <p className="text-[14px] text-text-muted mt-1">10 looping variations — actual logo shape with diagonal cuts</p>
          </div>
          <button
            onClick={() => setKey((k) => k + 1)}
            className="h-10 px-5 rounded-lg bg-accent text-btn-primary-text text-[14px] font-semibold hover:bg-accent-hover transition-colors"
          >
            Reset All
          </button>
        </div>

        <div key={key} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <V1_WaterFill />
          <V2_StaggerSlide />
          <V3_ScaleBounce />
          <V4_Pulse />
          <V5_Glitch />
          <V6_BlurReveal />
          <V7_NeonGlow />
          <V8_SlideFromSides />
          <V9_SpinIn />
          <V10_GradientSweep />
        </div>
      </div>
    </div>
  );
}
