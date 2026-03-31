"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import SearchModal from "./SearchModal";
import { WalletModal } from "@/components/waliet/WalletModal";
import { SettingsDrawer } from "@/components/waliet/SettingsDrawer";
import { usePlayBalance } from "@/components/waliet/usePlayBalance";
import { useAccount } from "wagmi";
import { useSidebar } from "@/components/sidebar/sidebar-context";
import { useProximityHover } from "@/hooks/use-proximity-hover";
import { springs } from "@/lib/springs";

function WalietLogo({ className }: { className?: string }) {
  return (
    <img
      src="/images/waliet-logo.png"
      alt="Waliet"
      className={className}
      style={{ filter: "invert(var(--logo-invert))" }}
    />
  );
}

function UsdtIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 28 28" fill="none" className="shrink-0">
      <path d="M26.6965 14.366C26.6965 21.4535 20.9506 27.1994 13.8631 27.1994C6.77562 27.1994 1.02979 21.4535 1.02979 14.366C1.02979 7.27855 6.77562 1.53271 13.8631 1.53271C20.9506 1.53271 26.6965 7.27855 26.6965 14.366Z" fill="#26A17B"/>
      <path d="M15.5423 15.1084C15.4536 15.1142 14.9986 15.1411 13.9836 15.1411C13.174 15.1411 12.6035 15.1177 12.4028 15.1072V15.1096C9.28432 14.9731 6.95682 14.4294 6.95682 13.7796C6.95682 13.1297 9.28432 12.5884 12.4028 12.4496V14.5694C12.607 14.5846 13.1903 14.6184 13.9976 14.6184C14.966 14.6184 15.4513 14.5787 15.5423 14.5706V12.4507C18.6538 12.5896 20.9755 13.1321 20.9755 13.7807C20.9755 14.4294 18.6538 14.9707 15.5423 15.1096M15.5423 12.2314V10.3321H19.8847V7.43872H8.06048V10.3321H12.4028V12.2291C8.87365 12.3912 6.21948 13.0901 6.21948 13.9277C6.21948 14.7654 8.87365 15.4642 12.4028 15.6264V21.7082H15.5411V15.6252C19.0645 15.4631 21.7128 14.7642 21.7128 13.9277C21.7128 13.0912 19.0645 12.3924 15.5411 12.2302" fill="white"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M15.1286 15.1286L11.0124 11.0124M11.0124 11.0124C12.1265 9.89831 12.7523 8.3873 12.7523 6.81177C12.7523 5.23623 12.1265 3.72522 11.0124 2.61115C9.89831 1.49708 8.3873 0.871199 6.81177 0.871199C5.23623 0.871199 3.72522 1.49708 2.61115 2.61115C1.49708 3.72522 0.871199 5.23623 0.871199 6.81177C0.871199 8.3873 1.49708 9.89831 2.61115 11.0124C3.72522 12.1265 5.23623 12.7523 6.81177 12.7523C8.3873 12.7523 9.89831 12.1265 11.0124 11.0124Z" stroke="#616161" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── Header Tabs (glassmorphic, from Figma) ── */

const HEADER_TABS = [
  { id: "sports", label: "Events" },
  { id: "picks", label: "Picks" },
  { id: "tournaments", label: "Tournaments" },
  { id: "tipsters", label: "Tipsters" },
] as const;

function HeaderTabs({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMouseInside = useRef(false);
  const selectedIndex = HEADER_TABS.findIndex((t) => t.id === activeTab);

  const {
    activeIndex: hoveredIndex,
    itemRects: tabRects,
    handlers,
    registerItem: registerTab,
    measureItems: measureTabs,
  } = useProximityHover(containerRef, { axis: "x" });

  useEffect(() => { measureTabs(); }, [measureTabs]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    isMouseInside.current = true;
    handlers.onMouseMove(e);
  }, [handlers]);

  const handleMouseLeave = useCallback(() => {
    isMouseInside.current = false;
    handlers.onMouseLeave();
  }, [handlers]);

  const selectedRect = tabRects[selectedIndex];
  const hoverRect = hoveredIndex !== null ? tabRects[hoveredIndex] : null;
  const isHoveringSelected = hoveredIndex === selectedIndex;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="hidden lg:flex items-center relative h-full select-none"
    >
      {/* Active underline */}
      {selectedRect && (
        <motion.div
          className="pointer-events-none absolute bottom-[-1px] h-[2px] rounded-full bg-text-primary"
          initial={false}
          animate={{
            left: selectedRect.left,
            width: selectedRect.width,
            opacity: 1,
          }}
          transition={{ ...springs.moderate, opacity: { duration: 0.16 } }}
        />
      )}

      {/* Hover underline */}
      <AnimatePresence>
        {hoverRect && !isHoveringSelected && selectedRect && (
          <motion.div
            className="pointer-events-none absolute bottom-[-1px] h-[2px] rounded-full bg-text-primary/15"
            initial={{ left: selectedRect.left, width: selectedRect.width, opacity: 0 }}
            animate={{ left: hoverRect.left, width: hoverRect.width, opacity: 0.5 }}
            exit={
              !isMouseInside.current && selectedRect
                ? { left: selectedRect.left, width: selectedRect.width, opacity: 0, transition: { ...springs.moderate, opacity: { duration: 0.12 } } }
                : { opacity: 0, transition: { duration: 0.12 } }
            }
            transition={{ ...springs.moderate, opacity: { duration: 0.16 } }}
          />
        )}
      </AnimatePresence>

      {HEADER_TABS.map((tab, index) => {
        const isActive = selectedIndex === index;
        const isHovered = hoveredIndex === index;
        return (
          <button
            key={tab.id}
            ref={(el) => { registerTab(index, el); }}
            data-proximity-index={index}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className="relative z-10 flex items-center justify-center px-4 h-full cursor-pointer bg-transparent border-none outline-none"
          >
            {/* Invisible bold text to reserve space */}
            <span className="invisible text-[13px] font-bold tracking-[-0.3px]" aria-hidden="true">{tab.label}</span>
            <span
              className={`absolute text-[13px] tracking-[-0.3px] transition-[color,font-weight] duration-75 ${
                isActive || isHovered ? "text-text-primary font-semibold" : "text-text-muted font-medium"
              }`}
              style={{ fontWeight: isActive ? 700 : isHovered ? 600 : 500 }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Search Button (from Figma) ── */

function SearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-[276px] h-[35px] rounded-[5px] px-[8px] pr-[5px] bg-bg-card hover:bg-bg-hover transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-center w-[18px] h-[18px] shrink-0">
        <SearchIcon />
      </div>
      <span className="flex-1 text-[14px] font-medium tracking-[-0.4px] text-[#616161] text-left">
        Find anything
      </span>
      <div className="flex items-center justify-center w-[22px] h-[25px] rounded-[5px] shrink-0 bg-bg-active">
        <span className="font-inter text-[12px] font-normal text-text-muted">/</span>
      </div>
    </button>
  );
}

/* ── Wallet Button ── */

function HeaderWalletButton({ onWalletClick }: { onWalletClick: () => void }) {
  const { balance: playBalance, currency: playCurrency } = usePlayBalance();

  const displayBalance = playBalance.toFixed(2);
  const displaySymbol = playCurrency;

  return (
    <button
      onClick={onWalletClick}
      className="flex items-center h-10 rounded-lg overflow-hidden shadow-[0_2px_4px_-2px_rgba(0,0,0,0.1),0_4px_6px_-1px_rgba(0,0,0,0.1)] cursor-pointer"
    >
      <div className="flex items-center gap-2 h-full px-4 bg-bg-hover">
        <span className="text-[15px] font-semibold text-text-primary tabular-nums">
          ${displayBalance}
        </span>
        <UsdtIcon />
        <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
          <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="flex items-center justify-center h-full px-5 bg-btn-wallet-bg">
        <span className="text-[15px] font-semibold text-white">Wallet</span>
      </div>
    </button>
  );
}

/* ── Header ── */

/* ── Balance Pill (replaces wallet button + settings gear) ── */

function HeaderBalancePill() {
  const { balance: playBalance, currency: playCurrency } = usePlayBalance();
  const { isConnected, address } = useAccount();
  const [showUsdt, setShowUsdt] = useState(false);

  const usdtBalance = playBalance.toFixed(2);
  const usdtSymbol = playCurrency;

  return (
    <div
      className="flex items-center gap-1.5 h-10 rounded-full px-1"
      style={{ backdropFilter: "blur(40px)" }}
    >
      {/* Balance section */}
      <div className="flex items-center gap-2 h-8 rounded-2xl px-3" style={{ background: "rgba(47, 47, 47, 0.80)", boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.08), inset 0 -1px 0 0 rgba(0,0,0,0.2), inset 0 0 12px 0 rgba(255,255,255,0.03)" }}>
        {showUsdt ? (
          <>
            {/* USDT icon */}
            <UsdtIcon />
            <span className="font-inter text-[15px] font-bold text-[#f0f0f0]">{usdtBalance}</span>
            <span className="font-inter text-[12px] font-semibold text-[#dedede]">{usdtSymbol}</span>
          </>
        ) : (
          <>
            {/* Points badge icon — 1:1 from Figma */}
            <svg width="16" height="19" viewBox="0 0 138 166" fill="none" className="shrink-0">
              <path d="M64.2725 7.12372C67.2002 5.4441 70.7998 5.4441 73.7275 7.12372L132.728 40.9714C135.68 42.6649 137.5 45.8084 137.5 49.2116V116.793C137.5 120.196 135.679 123.339 132.727 125.033L82.2979 153.959L73.7275 158.876C70.7998 160.555 67.2002 160.555 64.2725 158.876L55.7021 153.959L5.27344 125.033C2.32124 123.339 0.500171 120.196 0.5 116.793V49.2116L0.504883 48.8932C0.614587 45.6133 2.41278 42.612 5.27246 40.9714L64.2725 7.12372Z" fill="url(#p0)" stroke="url(#p1)"/>
              <path d="M132.507 49.4897V116.507C132.507 118.317 131.535 119.991 129.959 120.896L82.5468 148.09L71.5472 154.4C69.9673 155.309 68.0282 155.309 66.448 154.4L55.4529 148.094L8.0361 120.896C6.46037 119.991 5.48865 118.317 5.48865 116.507V49.4897C5.48865 47.6805 6.46037 46.0104 8.0361 45.1057L66.448 11.5969C68.0282 10.6923 69.9673 10.6923 71.5472 11.5969L129.959 45.1057C131.535 46.0104 132.507 47.6805 132.507 49.4897Z" fill="url(#p2)"/>
              <g filter="url(#pf)">
                <path d="M121.041 100.945V65.2763C121.041 57.9738 117.053 51.2234 110.584 47.5744L78.9772 29.7399C72.5077 26.0867 64.5328 26.0867 58.0636 29.7399L26.4569 47.5744C19.9875 51.2276 16 57.9738 16 65.2763V100.945C16 108.247 19.9875 114.998 26.4569 118.647L58.0636 136.481C64.5328 140.135 72.5077 140.135 78.9772 136.481L110.584 118.647C117.053 114.994 121.041 108.247 121.041 100.945Z" fill="url(#p3)"/>
              </g>
              <defs>
                <filter id="pf" x="15.4617" y="27" width="105.579" height="113.836" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                  <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                  <feOffset dy="1.61498"/><feComposite in2="hardAlpha" operator="out"/>
                  <feColorMatrix type="matrix" values="0 0 0 0 0.0481095 0 0 0 0 0.847975 0 0 0 0 0.382536 0 0 0 1 0"/>
                  <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                  <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                  <feMorphology radius="11.8432" operator="erode" in="SourceAlpha" result="effect2_innerShadow"/>
                  <feOffset dx="-0.538325" dy="1.07665"/><feGaussianBlur stdDeviation="1.30196"/>
                  <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"/>
                  <feBlend mode="normal" in2="shape"/>
                </filter>
                <linearGradient id="p0" x1="69" y1="3.83563" x2="69" y2="162.164" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#272626" stopOpacity="0.08"/><stop offset="1" stopColor="#1D1B19" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="p1" x1="69" y1="3.83563" x2="69" y2="162.164" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#252424" stopOpacity="0.03"/><stop offset="1" stopColor="#292B29" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="p2" x1="68.9976" y1="10.9185" x2="68.9976" y2="155.082" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0CF46D"/><stop offset="1" stopColor="#10BC58"/>
                </linearGradient>
                <linearGradient id="p3" x1="68.5204" y1="27" x2="68.5204" y2="139.221" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#25B662"/><stop offset="1" stopColor="#158A46"/>
                </linearGradient>
              </defs>
            </svg>
            <span className="font-inter text-[15px] font-bold text-[#f0f0f0]">0</span>
            <span className="font-inter text-[12px] font-semibold text-[#dedede]">pts</span>
          </>
        )}
        {/* Swap icon inside the pill */}
        <button
          type="button"
          onClick={() => setShowUsdt(!showUsdt)}
          className="flex items-center justify-center w-5 h-5 ml-0.5 rounded-full hover:bg-white/10 transition-colors"
          title={showUsdt ? "Show points" : "Show balance"}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#999]">
            <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16"/>
          </svg>
        </button>
      </div>

      {/* Profile avatar with rank badge — links to profile page */}
      <Link href="/profile" className="relative w-[42px] h-[46px] shrink-0 block">
        {/* Rank badge frame (SVG) */}
        <svg viewBox="0 0 72 72" fill="none" className="absolute inset-0 w-full h-full z-10 pointer-events-none">
          <path fillRule="evenodd" clipRule="evenodd" d="M45.3038 60.1251C42.4169 61.2392 39.2798 61.85 36.0001 61.85C21.7235 61.85 10.1501 50.2765 10.1501 36C10.1501 21.7234 21.7235 10.15 36.0001 10.15C50.2766 10.15 61.8501 21.7234 61.8501 36C61.8501 41.5371 60.1091 46.6676 57.1447 50.874L59.3782 52.4967C59.9313 52.8986 60.1628 53.611 59.9515 54.2612L57.3635 62.2263C57.1522 62.8766 56.5462 63.3169 55.8625 63.3169H47.4875C46.8038 63.3169 46.1978 62.8766 45.9865 62.2263L45.3038 60.1251ZM44.1117 56.4563C41.6017 57.4524 38.8648 58 36 58C23.8498 58 14 48.1503 14 36C14 23.8497 23.8498 14 36 14C48.1503 14 58 23.8497 58 36C58 40.6913 56.5316 45.0397 54.0294 48.6106L52.6027 47.574C52.0495 47.1721 51.3005 47.1721 50.7473 47.574L43.9718 52.4967C43.4187 52.8986 43.1872 53.611 43.3985 54.2612L44.1117 56.4563Z" fill="url(#badge-grad)"/>
          <mask id="badge-mask" style={{maskType:"alpha"}} maskUnits="userSpaceOnUse" x="10" y="10" width="52" height="54">
            <path fillRule="evenodd" clipRule="evenodd" d="M45.3038 60.1251C42.4169 61.2392 39.2798 61.85 36.0001 61.85C21.7235 61.85 10.1501 50.2765 10.1501 36C10.1501 21.7234 21.7235 10.15 36.0001 10.15C50.2766 10.15 61.8501 21.7234 61.8501 36C61.8501 41.5371 60.1091 46.6676 57.1447 50.874L59.3782 52.4967C59.9313 52.8986 60.1628 53.611 59.9515 54.2612L57.3635 62.2263C57.1522 62.8766 56.5462 63.3169 55.8625 63.3169H47.4875C46.8038 63.3169 46.1978 62.8766 45.9865 62.2263L45.3038 60.1251ZM44.1117 56.4563C41.6017 57.4524 38.8648 58 36 58C23.8498 58 14 48.1503 14 36C14 23.8497 23.8498 14 36 14C48.1503 14 58 23.8497 58 36C58 40.6913 56.5316 45.0397 54.0294 48.6106L52.6027 47.574C52.0495 47.1721 51.3005 47.1721 50.7473 47.574L43.9718 52.4967C43.4187 52.8986 43.1872 53.611 43.3985 54.2612L44.1117 56.4563Z" fill="white"/>
          </mask>
          <g mask="url(#badge-mask)">
            <g opacity="0.3" style={{mixBlendMode:"multiply"}}>
              <path fillRule="evenodd" clipRule="evenodd" d="M44 7L36.0001 37L36 37L9.13002 21.4436L20.4437 10.1299L36 36.9998L28 7H44ZM36.0001 37L20.4437 63.8701L9.13002 52.5564L36.0001 37ZM36.0001 37L51.5564 10.1299L62.8701 21.4437L36.0001 37ZM36.0001 37L66 29V45L36.0001 37ZM36.0001 37L44 67H28L36.0001 37ZM36.0001 37L6.00003 45L6.00003 29L36.0001 37Z" fill="#FFD640"/>
            </g>
          </g>
          {/* Decorative lines */}
          <path opacity="0.2" d="M16.57 47.45C20.5 54.1 27.73 58.55 36 58.55C37.34 58.55 38.65 58.43 39.92 58.21" stroke="#F68A2D" strokeWidth="1.1" strokeLinecap="round"/>
          <path opacity="0.3" d="M24.43 55.36C27.81 57.39 31.77 58.55 36 58.55" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
          <path opacity="0.2" d="M15.34 26.94C18.83 19 26.77 13.45 36 13.45C45.23 13.45 53.17 19 56.66 26.94" stroke="#DA731B" strokeWidth="1.1" strokeLinecap="round"/>
          <path opacity="0.4" d="M61.3 36C61.3 22.03 49.97 10.7 36 10.7C22.03 10.7 10.7 22.03 10.7 36" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
          {/* Star badge */}
          <g filter="url(#badge-shadow)">
            <path fillRule="evenodd" clipRule="evenodd" d="M51.675 59.032L49.467 59.817C49.088 59.952 48.692 59.664 48.703 59.263L48.768 56.92L47.338 55.062C47.093 54.744 47.245 54.278 47.63 54.165L49.878 53.502L51.203 51.569C51.43 51.237 51.92 51.237 52.147 51.569L53.472 53.502L55.72 54.165C56.106 54.278 56.257 54.744 56.012 55.062L54.582 56.92L54.647 59.263C54.658 59.664 54.262 59.952 53.883 59.817L51.675 59.032Z" fill="url(#star-grad)"/>
          </g>
          <path fillRule="evenodd" clipRule="evenodd" d="M51.675 59.032L49.467 59.817C49.088 59.952 48.692 59.664 48.703 59.263L48.768 56.92L47.338 55.062C47.093 54.744 47.245 54.278 47.63 54.165L49.878 53.502L51.203 51.569C51.43 51.237 51.92 51.237 52.147 51.569L53.472 53.502L55.72 54.165C56.106 54.278 56.257 54.744 56.012 55.062L54.582 56.92L54.647 59.263C54.658 59.664 54.262 59.952 53.883 59.817L51.675 59.032Z" stroke="#FFE9D1" strokeWidth="1.1" strokeLinecap="round"/>
          <defs>
            <filter id="badge-shadow" x="46.67" y="50.77" width="10.01" height="10.63" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="bg"/><feBlend in="SourceGraphic" in2="bg" result="shape"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="a"/><feOffset dy="1"/><feGaussianBlur stdDeviation="0.5"/><feComposite in2="a" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix type="matrix" values="0 0 0 0 0.92 0 0 0 0 0.45 0 0 0 0 0.11 0 0 0 1 0"/><feBlend in2="shape"/>
            </filter>
            <linearGradient id="badge-grad" x1="10.15" y1="10.15" x2="10.15" y2="63.32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDDA9D"/><stop offset="1" stopColor="#EFB35E"/>
            </linearGradient>
            <linearGradient id="star-grad" x1="46.58" y1="50.88" x2="46.58" y2="61.07" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FD9B41"/><stop offset="1" stopColor="#F48224"/>
            </linearGradient>
          </defs>
        </svg>
        {/* Avatar centered in the ring */}
        <div className="absolute" style={{ top: "10px", left: "8px" }}>
          <div className="w-[26px] h-[26px] rounded-full overflow-hidden bg-bg-surface flex items-center justify-center">
            {isConnected && address ? (
              <div className="w-full h-full rounded-full" style={{ background: `linear-gradient(135deg, hsl(${parseInt(address.slice(2, 6), 16) % 360}, 70%, 50%), hsl(${(parseInt(address.slice(6, 10), 16) % 360)}, 60%, 40%))` }} />
            ) : (
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className="text-text-muted">
                <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 17.5C3 14.5 6 12.5 10 12.5C14 12.5 17 14.5 17 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function HeaderClient({ activePage, onPageChange }: { activePage?: string; onPageChange?: (page: string) => void } = {}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";

  const headerTab = pathname.startsWith("/picks") ? "picks"
    : pathname.startsWith("/tournament") ? "tournaments"
    : pathname.startsWith("/tipster") ? "tipsters"
    : "sports";
  const handleTabChange = useCallback((tab: string) => {
    if (tab === "sports" && pathname === "/") {
      onPageChange?.("sports");
      return;
    }
    const routes: Record<string, string> = { sports: "/", picks: "/picks", tournaments: "/tournaments", tipsters: "/tipsters" };
    const target = routes[tab];
    if (target && pathname !== target) window.location.href = target;
  }, [onPageChange, pathname]);
  const handleClose = useCallback(() => setSearchOpen(false), []);
  const handleWalletClose = useCallback(() => setWalletOpen(false), []);

  const { collapsed, setCollapsed, settingsOpen, setSettingsOpen } = useSidebar();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !searchOpen) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchOpen]);

  return (
    <>
      <header className="w-full border-b border-border-primary bg-bg-page">
        <div className="w-full h-14 flex items-center px-3 relative">
          {/* Left: logo + search */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <WalietLogo className="w-6 h-6" />
              <span className="text-[18px] font-bold tracking-tight text-text-primary -ml-0.5">Waliet</span>
            </div>
            <div className="hidden lg:block ml-1">
              <SearchButton onClick={() => setSearchOpen(true)} />
            </div>
          </div>

          {/* Center: tab bar (absolutely centered) */}
          <div className="absolute left-1/2 -translate-x-1/2 h-full">
            <HeaderTabs activeTab={headerTab} onTabChange={handleTabChange} />
          </div>

          {/* Right: search + balance pill */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Mobile search icon */}
            <button
              onClick={() => setSearchOpen(true)}
              className="lg:hidden flex items-center justify-center w-11 h-11 rounded-lg hover:bg-bg-hover transition-colors"
            >
              <SearchIcon />
            </button>
            <HeaderBalancePill />
          </div>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={handleClose} />
      <WalletModal open={walletOpen} onClose={handleWalletClose} />
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
