"use client";

import { useEffect, useCallback, useState } from "react";
import { useConnect, useAccount, useDisconnect, useBalance } from "wagmi";
import { useChain, useBetTokenBalance } from "@azuro-org/sdk";
import { useAuth } from "@/hooks/useAuth";
import { FundWalletModal } from "./FundWalletModal";

/* ─── Wallet icons ─── */
function MetaMaskIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="8" fill="#F6851B" />
      <path d="M21.5 7L14.7 12.1L15.9 9.1L21.5 7Z" fill="#E2761B" stroke="#E2761B" strokeWidth="0.3" />
      <path d="M6.5 7L13.2 12.2L12.1 9.1L6.5 7Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.3" />
      <path d="M19.2 18.5L17.3 21.4L21.1 22.5L22.2 18.6L19.2 18.5Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.3" />
      <path d="M5.8 18.6L6.9 22.5L10.7 21.4L8.8 18.5L5.8 18.6Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.3" />
    </svg>
  );
}

function WalletConnectIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="8" fill="#3B99FC" />
      <path d="M9.2 11.4C12 8.7 16 8.7 18.8 11.4L19.1 11.7C19.2 11.8 19.2 12 19.1 12.1L18 13.1C17.9 13.2 17.8 13.2 17.7 13.1L17.3 12.7C15.4 10.9 12.6 10.9 10.7 12.7L10.3 13.1C10.2 13.2 10 13.2 10 13.1L8.9 12.1C8.8 12 8.8 11.8 8.9 11.7L9.2 11.4ZM21.1 13.6L22 14.5C22.1 14.6 22.1 14.8 22 14.9L18.4 18.4C18.3 18.5 18.1 18.5 18 18.4L15.5 16C15.5 15.9 15.4 15.9 15.3 16L12.8 18.4C12.7 18.5 12.5 18.5 12.4 18.4L8.8 14.9C8.7 14.8 8.7 14.6 8.8 14.5L9.7 13.6C9.8 13.5 10 13.5 10.1 13.6L12.6 16C12.6 16.1 12.7 16.1 12.8 16L15.3 13.6C15.4 13.5 15.6 13.5 15.7 13.6L18.2 16C18.2 16.1 18.3 16.1 18.4 16L20.9 13.6C21 13.5 21 13.5 21.1 13.6Z" fill="white" />
    </svg>
  );
}

function CoinbaseIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="8" fill="#0052FF" />
      <rect x="8" y="8" width="12" height="12" rx="6" fill="white" />
      <rect x="11" y="12" width="2.5" height="4" rx="0.5" fill="#0052FF" />
      <rect x="14.5" y="12" width="2.5" height="4" rx="0.5" fill="#0052FF" />
    </svg>
  );
}

function BrowserWalletIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="8" fill="#333" />
      <rect x="6" y="9" width="16" height="11" rx="2" stroke="white" strokeWidth="1.5" fill="none" />
      <path d="M18 14.5C18 15.3 17.3 16 16.5 16C15.7 16 15 15.3 15 14.5C15 13.7 15.7 13 16.5 13C17.3 13 18 13.7 18 14.5Z" fill="white" />
    </svg>
  );
}

/* ─── Social login icons ─── */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function XTwitterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-text-primary">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-text-primary">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.52-3.23 0-1.44.64-2.2.52-3.06-.4C3.79 16.17 4.36 9.02 8.93 8.75c1.28.07 2.17.72 2.91.76.99-.1 1.94-.78 3-.83 1.28-.05 2.26.47 2.9 1.2-2.66 1.52-2.03 4.86.62 5.8-.5 1.29-1.15 2.56-2.31 4.6zM12.26 8.6C12.07 6.63 13.7 5 15.55 4.85c.25 2.22-2.02 3.88-3.29 3.75z" />
    </svg>
  );
}

/* ─── Social login button ─── */
function SocialButton({
  name,
  icon,
  onClick,
}: {
  name: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-border-subtle bg-border-subtle cursor-pointer active:scale-[0.98]"
    >
      {icon}
      <span className="text-[13px] font-semibold text-text-primary">{name}</span>
    </button>
  );
}

/* ─── Wallet option button ─── */
function WalletOption({
  name,
  icon,
  onClick,
  connecting,
  detected,
}: {
  name: string;
  icon: React.ReactNode;
  onClick: () => void;
  connecting?: boolean;
  detected?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={connecting}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border-subtle bg-border-subtle hover:bg-bg-input hover:border-border-input transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait"
    >
      {icon}
      <div className="flex-1 text-left">
        <span className="text-[14px] font-semibold text-text-primary">{name}</span>
        {detected && (
          <span className="ml-2 text-[11px] font-medium text-accent bg-accent-muted px-1.5 py-0.5 rounded">
            Detected
          </span>
        )}
      </div>
      {connecting ? (
        <svg className="animate-spin h-4 w-4 text-text-muted" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-muted">
          <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

/* ─── Connected state in header ─── */
export function WalletButton({ onClick }: { onClick: () => void }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { betToken } = useChain();
  const { data: tokenBalance } = useBetTokenBalance();
  const { data: nativeBalance } = useBalance({ address });

  if (!isConnected || !address) {
    return (
      <button
        onClick={onClick}
        className="h-9 px-3 flex items-center rounded-xl bg-white text-bg-page hover:bg-white/90 active:scale-[0.97] transition-all"
      >
        <span className="text-sm font-semibold">SIGN IN</span>
        <span className="text-sm font-semibold text-text-secondary mx-1.5">|</span>
        <span className="text-sm font-semibold">JOIN</span>
      </button>
    );
  }

  const bal = tokenBalance?.balance
    ? Number(tokenBalance.balance).toFixed(2)
    : nativeBalance
      ? Number(nativeBalance.formatted).toFixed(4)
      : null;
  const symbol = betToken?.symbol ?? nativeBalance?.symbol ?? "";

  return (
    <div className="flex items-center gap-2">
      {bal && (
        <span className="text-[13px] font-semibold text-text-secondary bg-bg-input px-3 py-1.5 rounded-lg tabular-nums">
          {bal} {symbol}
        </span>
      )}
      <button
        onClick={onClick}
        className="flex items-center gap-2 h-9 px-3 rounded-xl bg-bg-active border border-border-input hover:bg-bg-active transition-colors"
      >
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent to-accent-hover" />
        <span className="text-[13px] font-semibold text-text-primary">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </button>
    </div>
  );
}

/* ─── Modal ─── */
export function WalletModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { connectors, connect, isPending, variables } = useConnect();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const { betToken } = useChain();
  const { data: tokenBalance } = useBetTokenBalance();
  const { signInWithSocial } = useAuth();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [fundOpen, setFundOpen] = useState(false);

  // Close modal on successful NEW connect (only when connection status changes while modal is open)
  const [connectedOnOpen, setConnectedOnOpen] = useState(isConnected);
  useEffect(() => {
    if (open) setConnectedOnOpen(isConnected);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => {
    if (open && isConnected && !connectedOnOpen) onClose();
  }, [isConnected, connectedOnOpen, open, onClose]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleConnect = useCallback(
    (connectorId: string) => {
      const connector = connectors.find((c) => c.id === connectorId) ?? connectors[0];
      if (!connector) return;
      setConnectingId(connectorId);
      connect(
        { connector },
        {
          onSettled: () => setConnectingId(null),
        }
      );
    },
    [connectors, connect]
  );

  if (!open) return null;

  const hasInjected = typeof window !== "undefined" && !!(window as any).ethereum;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[400px] mx-4 rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-modal)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 48px -12px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-[18px] font-bold text-text-primary">
            {isConnected ? "Account" : "Connect Wallet"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-input hover:bg-bg-active transition-colors text-text-primary"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {isConnected && address ? (
          /* ─── Connected view ─── */
          <div className="px-5 pb-5">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-border-subtle border border-border-subtle mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center text-white font-bold text-sm">
                {address.slice(2, 4).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-text-primary">
                  {address.slice(0, 8)}...{address.slice(-6)}
                </p>
                <p className="text-[12px] text-text-muted mt-0.5">Connected</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(address);
                }}
                className="text-text-muted hover:text-text-secondary transition-colors"
                title="Copy address"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M3 11V3.5C3 2.67 3.67 2 4.5 2H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Balance + Fund */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-input border border-border-subtle mb-4">
              <div>
                <p className="text-[11px] text-text-muted">Balance</p>
                <p className="text-[16px] font-bold text-text-primary tabular-nums">
                  {tokenBalance?.balance ? Number(tokenBalance.balance).toFixed(2) : "0.00"}{" "}
                  <span className="text-[12px] text-text-muted font-medium">{betToken?.symbol ?? "—"}</span>
                </p>
              </div>
              <button
                onClick={() => setFundOpen(true)}
                className="h-9 px-4 rounded-lg bg-accent hover:bg-accent-hover text-btn-primary-text text-[13px] font-semibold transition-colors"
              >
                Fund Wallet
              </button>
            </div>

            <button
              onClick={() => {
                disconnect();
                onClose();
              }}
              className="w-full h-11 rounded-xl bg-red-500/10 text-red-400 text-[14px] font-semibold hover:bg-red-500/20 active:scale-[0.98] transition-all border border-red-500/10"
            >
              Disconnect
            </button>
          </div>
        ) : (
          /* ─── Connect view ─── */
          <div className="px-5 pb-5 flex flex-col gap-2">
            <p className="text-[13px] text-text-muted mb-1">
              Choose how you want to connect
            </p>

            {/* Social login options */}
            <div className="flex gap-2 mb-1">
              <SocialButton
                name="Google"
                icon={<GoogleIcon />}
                onClick={() => signInWithSocial("google")}
              />
              <SocialButton
                name="X"
                icon={<XTwitterIcon />}
                onClick={() => signInWithSocial("twitter")}
              />
              <SocialButton
                name="Apple"
                icon={<AppleIcon />}
                onClick={() => signInWithSocial("apple")}
              />
            </div>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-border-subtle" />
              <span className="text-[11px] text-text-muted">or connect wallet</span>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>

            {hasInjected && (
              <WalletOption
                name="Browser Wallet"
                icon={<BrowserWalletIcon />}
                onClick={() => handleConnect("injected")}
                connecting={connectingId === "injected"}
                detected
              />
            )}

            <WalletOption
              name="MetaMask"
              icon={<MetaMaskIcon />}
              onClick={() => handleConnect("injected")}
              connecting={connectingId === "injected" && !hasInjected}
            />

            <WalletOption
              name="WalletConnect"
              icon={<WalletConnectIcon />}
              onClick={() => handleConnect("walletConnect")}
              connecting={connectingId === "walletConnect"}
            />

            <WalletOption
              name="Coinbase Wallet"
              icon={<CoinbaseIcon />}
              onClick={() => handleConnect("coinbaseWalletSDK")}
              connecting={connectingId === "coinbaseWalletSDK"}
            />

            <p className="text-[11px] text-text-muted text-center mt-2">
              By connecting, you agree to the Terms of Service
            </p>
          </div>
        )}
      </div>

      {/* Fund Wallet sub-modal */}
      <FundWalletModal open={fundOpen} onClose={() => setFundOpen(false)} />
    </div>
  );
}
