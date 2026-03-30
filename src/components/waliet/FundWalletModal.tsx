"use client";

import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { useChain, useBetTokenBalance } from "@azuro-org/sdk";
import { useTheme } from "@/components/ui/theme";

// LI.FI widget loaded lazily only when swap tab is active
import { lazy, Suspense } from "react";
const LiFiWidgetLazy = lazy(() =>
  import("@lifi/widget").then((mod) => ({ default: mod.LiFiWidget }))
);

// ── Chain config ──

const TOKEN_ADDRESSES: Record<number, string> = {
  137: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  100: "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d",
  8453: "0x4200000000000000000000000000000000000006",
  88888: "0x677F7e16C7Dd57be1D4C8aD1244883214953DC47",
};

const CHAIN_NAMES: Record<number, string> = {
  137: "Polygon",
  100: "Gnosis",
  8453: "Base",
  88888: "Chiliz",
};

const TRANSAK_CONFIG: Record<number, { network: string; token: string }> = {
  137: { network: "polygon", token: "USDT" },
  100: { network: "gnosis", token: "XDAI" },
  8453: { network: "base", token: "ETH" },
  88888: { network: "chiliz", token: "CHZ" },
};

function WidgetSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-5">
      <div className="h-12 rounded-xl bg-bg-input animate-pulse" />
      <div className="h-12 rounded-xl bg-bg-input animate-pulse" />
      <div className="h-24 rounded-xl bg-bg-input animate-pulse" />
      <div className="h-12 rounded-xl bg-bg-input animate-pulse" />
    </div>
  );
}

// ── Tab type ──

type FundTab = "swap" | "buy";

// ── Main Modal ──

export function FundWalletModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { address } = useAccount();
  const { appChain, betToken } = useChain();
  const { data: tokenBalance } = useBetTokenBalance();
  const { theme } = useTheme();
  const [tab, setTab] = useState<FundTab>("swap");

  const balance = tokenBalance?.balance ? Number(tokenBalance.balance).toFixed(2) : "0.00";
  const symbol = betToken?.symbol ?? "USDT";
  const networkName = CHAIN_NAMES[appChain.id] ?? "Polygon";
  const toTokenAddress = TOKEN_ADDRESSES[appChain.id];
  const transak = TRANSAK_CONFIG[appChain.id] ?? TRANSAK_CONFIG[137];

  // Transak iframe URL
  const transakUrl = `https://global.transak.com/?apiKey=STAGING&network=${transak.network}&defaultCryptoCurrency=${transak.token}&walletAddress=${address ?? ""}&disableWalletAddressForm=true&themeColor=22c55e&hideMenu=true`;

  // LI.FI config — colors pulled from our CSS variables
  const widgetConfig = useMemo(
    () => ({
      variant: "compact" as const,
      subvariant: "default" as const,
      appearance: theme as "light" | "dark",
      toChain: appChain.id,
      toToken: toTokenAddress,
      hiddenUI: [
        "appearance" as const,
        "language" as const,
        "poweredBy" as const,
        "walletMenu" as const,
        "history" as const,
      ],
      theme: {
        container: {
          background: "transparent",
          boxShadow: "none",
          borderRadius: "0px",
        },
        colorSchemes: {
          light: {
            palette: {
              primary: { main: "#16a34a" },
              secondary: { main: "#15803d" },
              background: {
                default: "#ffffff",
                paper: "#f5f5f7",
              },
              text: {
                primary: "#111111",
                secondary: "#666670",
              },
              grey: {
                100: "#f5f5f7",
                200: "#f0f0f2",
                300: "#e8e8ea",
                400: "#e0e0e3",
                500: "#d0d0d3",
                600: "#9999a3",
                700: "#666670",
                800: "#111111",
                900: "#111111",
              },
              divider: "#e0e0e3",
              action: {
                hover: "rgba(0,0,0,0.04)",
                selected: "rgba(0,0,0,0.06)",
                disabled: "rgba(0,0,0,0.15)",
                disabledBackground: "rgba(0,0,0,0.06)",
              },
            },
          },
          dark: {
            palette: {
              primary: { main: "#22c55e" },
              secondary: { main: "#16a34a" },
              background: {
                default: "#0e0e0e",
                paper: "#161616",
              },
              text: {
                primary: "#ffffff",
                secondary: "#8a8a8a",
              },
              grey: {
                100: "#161616",
                200: "#161616",
                300: "#1c1c1c",
                400: "#1c1c1c",
                500: "#262626",
                600: "#525252",
                700: "#8a8a8a",
                800: "#1c1c1c",
                900: "#ffffff",
              },
              divider: "#1c1c1c",
              action: {
                hover: "rgba(255,255,255,0.04)",
                selected: "rgba(255,255,255,0.06)",
                disabled: "rgba(255,255,255,0.15)",
                disabledBackground: "rgba(255,255,255,0.06)",
              },
            },
          },
        },
        shape: {
          borderRadius: 12,
          borderRadiusSecondary: 10,
        },
        typography: {
          fontFamily: '"ABC Oracle", sans-serif',
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
                borderColor: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
              },
            },
          },
          MuiInputCard: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
                borderColor: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
              },
            },
          },
        },
      },
      chains: {
        allow: [137, 100, 8453, 88888, 1, 42161, 10, 56],
      },
    }),
    [theme, appChain.id, toTokenAddress]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-[420px] mx-4 rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "var(--bg-modal)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 24px 48px -12px rgba(0,0,0,0.5)",
          maxHeight: "min(90vh, 750px)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
          <h2 className="text-[18px] font-bold text-text-primary">Fund Wallet</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-input hover:bg-bg-active transition-colors text-text-primary shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Balance bar */}
        <div className="flex items-center justify-between mx-5 mb-3 px-3 py-2 rounded-lg bg-bg-input border border-border-subtle shrink-0">
          <span className="text-[12px] text-text-muted">Balance on {networkName}</span>
          <span className="text-[13px] font-bold text-text-primary tabular-nums">
            {balance} <span className="text-text-muted font-medium">{symbol}</span>
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-subtle px-5 shrink-0">
          <button
            onClick={() => setTab("swap")}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold transition-colors ${
              tab === "swap" ? "text-text-primary" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M14 4L17 7L14 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 7H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M6 16L3 13L6 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 13H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Swap & Bridge
            {tab === "swap" && <div className="absolute bottom-[-1px] left-1 right-1 h-[2px] rounded-full bg-green-500" />}
          </button>
          <button
            onClick={() => setTab("buy")}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold transition-colors ${
              tab === "buy" ? "text-text-primary" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 8H18" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Buy with Card
            {tab === "buy" && <div className="absolute bottom-[-1px] left-1 right-1 h-[2px] rounded-full bg-green-500" />}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 lifi-theme-override">
          {tab === "swap" ? (
            <Suspense fallback={<WidgetSkeleton />}>
              <LiFiWidgetLazy integrator="predictoff" config={widgetConfig} />
            </Suspense>
          ) : (
            <div className="flex flex-col h-full">
              <iframe
                src={transakUrl}
                className="w-full flex-1 border-0 min-h-[500px]"
                allow="camera;microphone;payment"
                title="Buy crypto with card"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2 border-t border-border-subtle shrink-0">
          <p className="text-[11px] text-text-muted text-center">
            {tab === "swap"
              ? "Powered by LI.FI — swap tokens or bridge from any chain."
              : "Powered by Transak — buy with card, bank transfer, or Apple Pay."}
          </p>
        </div>
      </div>
    </div>
  );
}
