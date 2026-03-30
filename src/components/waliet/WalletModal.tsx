"use client";

import { useEffect, useCallback, useState } from "react";
import { useConnect, useAccount, useDisconnect, useBalance } from "wagmi";
import { useChain, useBetTokenBalance } from "@azuro-org/sdk";
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
