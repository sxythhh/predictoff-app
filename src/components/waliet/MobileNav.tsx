"use client";

import { useTransition, useState, useCallback } from "react";
import { useLive, useBaseBetslip } from "@azuro-org/sdk";
import { usePathname } from "next/navigation";
import { useWebHaptics } from "web-haptics/react";
import { MobileBetslipDrawer } from "./MobileBetslipDrawer";

function NavBtn({ label, active, onClick, children, haptic }: {
  label: string; active: boolean; onClick: () => void; children: React.ReactNode; haptic: ReturnType<typeof useWebHaptics>;
}) {
  return (
    <button onClick={() => { haptic.trigger("selection"); onClick(); }} className={`flex-1 flex flex-col items-center py-1 cursor-pointer ${active ? "text-text-primary" : "text-text-muted"}`}>
      <div className="w-5 h-5 flex items-center justify-center">{children}</div>
      <span className="font-inter text-[11px] font-medium leading-[14px] mt-0.5">
        {label}
      </span>
    </button>
  );
}

export function GlobalMobileNav() {
  const { isLive, changeLive } = useLive();
  const { items } = useBaseBetslip();
  const [, startTransition] = useTransition();
  const [betslipOpen, setBetslipOpen] = useState(false);
  const haptic = useWebHaptics();
  const pathname = usePathname();

  const betslipCount = items.length;

  const navigate = useCallback((path: string) => {
    if (pathname !== path) window.location.href = path;
  }, [pathname]);

  const toggleBetslip = useCallback(() => {
    haptic.trigger("medium");
    setBetslipOpen((v) => !v);
  }, [haptic]);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden safe-area-pb">
        <div className="relative flex items-end h-[44px] bg-bg-card dark:bg-bg-surface">
          {/* Live */}
          <NavBtn label="Live" active={isLive} onClick={() => startTransition(() => changeLive(!isLive))} haptic={haptic}>
            <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
              <path d="M11.5094 9.80837C11.3425 9.8075 11.1795 9.75754 11.0408 9.66471C10.9021 9.57188 10.7937 9.44029 10.7292 9.28632C10.6648 9.13235 10.647 8.96281 10.6782 8.79883C10.7094 8.63484 10.7881 8.48365 10.9046 8.36409C11.5422 7.7234 11.9002 6.85627 11.9002 5.95237C11.9002 5.04846 11.5422 4.18134 10.9046 3.54064C10.7477 3.38006 10.6608 3.16391 10.6627 2.93942C10.6647 2.71493 10.7554 2.50035 10.9151 2.34255C11.0748 2.18475 11.2905 2.09656 11.515 2.09726C11.7395 2.09795 11.9546 2.18747 12.1133 2.34625C13.0654 3.3049 13.5998 4.60121 13.5998 5.95237C13.5998 7.30352 13.0654 8.59984 12.1133 9.55848C12.0341 9.63797 11.94 9.70099 11.8364 9.74388C11.7327 9.78677 11.6216 9.80869 11.5094 9.80837ZM6.08931 9.56358C6.16876 9.48507 6.23194 9.39166 6.27525 9.28871C6.31856 9.18575 6.34115 9.07527 6.34172 8.96358C6.34229 8.85188 6.32083 8.74117 6.27856 8.63778C6.2363 8.53439 6.17407 8.44035 6.09543 8.36103C5.45813 7.72038 5.10037 6.85347 5.10037 5.94982C5.10037 5.04616 5.45813 4.17926 6.09543 3.5386C6.17392 3.45924 6.23601 3.36519 6.27816 3.26184C6.3203 3.15848 6.34168 3.04783 6.34106 2.93621C6.34045 2.82459 6.31785 2.71419 6.27457 2.6113C6.23129 2.50841 6.16816 2.41506 6.0888 2.33656C6.00944 2.25807 5.91539 2.19598 5.81203 2.15384C5.70867 2.11169 5.59803 2.09031 5.48641 2.09093C5.37479 2.09154 5.26438 2.11414 5.1615 2.15742C5.05861 2.20071 4.96525 2.26383 4.88676 2.34319C3.93429 3.30188 3.39972 4.59842 3.39972 5.94982C3.39972 7.30122 3.93429 8.59775 4.88676 9.55644C4.96521 9.63595 5.05856 9.69922 5.16148 9.74262C5.2644 9.78602 5.37486 9.8087 5.48656 9.80936C5.59825 9.81002 5.70898 9.78866 5.8124 9.74648C5.91583 9.70431 6.00993 9.64216 6.08931 9.56358ZM14.8172 11.6198C16.2222 10.0655 17 8.04499 17 5.94982C17 3.85465 16.2222 1.83409 14.8172 0.27979C14.666 0.112612 14.4546 0.0123525 14.2294 0.00106689C14.0043 -0.0102187 13.7839 0.0683941 13.6167 0.219611C13.4495 0.370828 13.3493 0.582263 13.338 0.807402C13.3267 1.03254 13.4053 1.25294 13.5565 1.42012C14.6787 2.66196 15.2999 4.2761 15.2999 5.94982C15.2999 7.62354 14.6787 9.23768 13.5565 10.4795C13.4053 10.6467 13.3267 10.8671 13.338 11.0922C13.3493 11.3174 13.4495 11.5288 13.6167 11.68C13.7839 11.8312 14.0043 11.9099 14.2294 11.8986C14.4546 11.8873 14.666 11.787 14.8172 11.6198ZM3.38332 11.68C3.46621 11.6052 3.53354 11.5149 3.58148 11.414C3.62942 11.3132 3.65702 11.2039 3.6627 11.0925C3.66838 10.981 3.65204 10.8694 3.6146 10.7643C3.57717 10.6591 3.51937 10.5623 3.44452 10.4795C2.32239 9.23768 1.70115 7.62354 1.70115 5.94982C1.70115 4.2761 2.32239 2.66196 3.44452 1.42012C3.58846 1.25172 3.66102 1.03381 3.64678 0.812737C3.63254 0.591664 3.53262 0.384867 3.36827 0.236325C3.20391 0.087784 2.9881 0.00921726 2.76671 0.0173342C2.54533 0.0254511 2.33585 0.119611 2.18281 0.27979C0.777862 1.83409 0 3.85465 0 5.94982C0 8.04499 0.777862 10.0655 2.18281 11.6198C2.25767 11.7027 2.3481 11.7699 2.44896 11.8178C2.54981 11.8656 2.65911 11.8931 2.7706 11.8987C2.88209 11.9043 2.99359 11.8879 3.09872 11.8503C3.20385 11.8128 3.30056 11.7549 3.38332 11.68ZM8.50053 4.67485C8.16238 4.67485 7.83809 4.80918 7.59899 5.04828C7.35989 5.28738 7.22556 5.61168 7.22556 5.94982C7.22556 6.28796 7.35989 6.61225 7.59899 6.85135C7.83809 7.09046 8.16238 7.22478 8.50053 7.22478C8.83867 7.22478 9.16296 7.09046 9.40206 6.85135C9.64116 6.61225 9.77549 6.28796 9.77549 5.94982C9.77549 5.61168 9.64116 5.28738 9.40206 5.04828C9.16296 4.80918 8.83867 4.67485 8.50053 4.67485Z" fill="currentColor" />
            </svg>
          </NavBtn>

          {/* Sports / Home */}
          <NavBtn label="Sports" active={pathname === "/" && !isLive} onClick={() => navigate("/")} haptic={haptic}>
            <svg width="17" height="15" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 2.5C10 2.5 12.5 6 12.5 10C12.5 14 10 17.5 10 17.5M10 2.5C10 2.5 7.5 6 7.5 10C7.5 14 10 17.5 10 17.5M3 7.5H17M3 12.5H17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </NavBtn>

          {/* Betslip — center notch button */}
          <div className="relative flex flex-col items-center" style={{ width: 80 }}>
            <svg className="absolute bottom-0 text-bg-card dark:text-bg-surface" width="80" height="66" viewBox="0 0 80 66" fill="none" style={{ pointerEvents: "none" }}>
              <path fillRule="evenodd" clipRule="evenodd" d="M80 22H76C71 22 66.5 19 64 14.5C59 5 51 0 40 0C29 0 21 5 16 14.5C13.5 19 9 22 4 22H0V66H80V22Z" fill="currentColor"/>
            </svg>
            <button
              onClick={toggleBetslip}
              className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center bg-accent active:scale-95 transition-transform cursor-pointer"
              style={{ marginBottom: 6 }}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <rect x="4" y="2" width="12" height="16" rx="2" stroke="white" strokeWidth="1.5"/>
                <path d="M8 7H12M8 10H12M8 13H11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {betslipCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-[15px] h-[15px] flex items-center justify-center rounded-full border-[0.5px] border-black font-inter text-[10px] font-extrabold leading-none tracking-[-0.3px] text-white"
                  style={{
                    background: "#e6311f",
                    boxShadow: "inset 0px 2px 0px 0px #ff7b7b, 0px 1px 0px 0px #000",
                    WebkitTextStroke: "0.5px black",
                    paintOrder: "stroke fill",
                  }}
                >
                  {betslipCount}
                </span>
              )}
            </button>
            <span className="relative z-10 font-inter text-[11px] font-medium leading-[14px] text-text-muted" style={{ marginBottom: 4 }}>Betslip</span>
          </div>

          {/* Picks */}
          <NavBtn label="Picks" active={pathname === "/picks"} onClick={() => navigate("/picks")} haptic={haptic}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L12.5 7.5H18L13.5 11.5L15 17L10 13.5L5 17L6.5 11.5L2 7.5H7.5L10 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            </svg>
          </NavBtn>

          {/* Compete */}
          <NavBtn label="Compete" active={pathname === "/tournaments"} onClick={() => navigate("/tournaments")} haptic={haptic}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M4 2H12V6C12 8.21 10.21 10 8 10C5.79 10 4 8.21 4 6V2Z" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M6 12H10M8 10V12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </NavBtn>
        </div>
      </nav>

      {/* Betslip drawer */}
      <MobileBetslipDrawer open={betslipOpen} onClose={() => setBetslipOpen(false)} />

      {/* Bottom spacer */}
      <div className="h-[60px] lg:hidden" />
    </>
  );
}
