"use client";

import { useState, useEffect, useCallback } from "react";
import { useWrapTokens, useNativeBalance, useBetTokenBalance, useChain } from "@azuro-org/sdk";

export function WrapTokenModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"wrap" | "unwrap">("wrap");
  const [amount, setAmount] = useState("");

  const { betToken } = useChain();
  const { data: nativeBalance } = useNativeBalance();
  const { data: betTokenBalance } = useBetTokenBalance();
  const { wrap, unwrap, wrapTx, unwrapTx } = useWrapTokens();

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Reset on open
  useEffect(() => {
    if (open) setAmount("");
  }, [open, tab]);

  const handleWrap = useCallback(() => {
    if (!amount || +amount <= 0) return;
    wrap(amount);
  }, [amount, wrap]);

  const handleUnwrap = useCallback(() => {
    if (!amount || +amount <= 0) return;
    unwrap(amount);
  }, [amount, unwrap]);

  if (!open) return null;

  const isPending = tab === "wrap" ? wrapTx.isPending : unwrapTx.isPending;

  const nativeBal = nativeBalance?.balance
    ? Number(nativeBalance.balance).toFixed(4)
    : "0.0000";
  const nativeSymbol = "ETH";

  const tokenBal = betTokenBalance?.balance
    ? Number(betTokenBalance.balance).toFixed(4)
    : "0.0000";
  const tokenSymbol = betToken?.symbol ?? "USDT";

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
          <h2 className="text-[18px] font-bold text-text-primary">Wrap Tokens</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-input hover:bg-bg-active transition-colors text-text-primary"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex mx-5 mb-4 bg-border-subtle rounded-lg p-0.5">
          <button
            onClick={() => setTab("wrap")}
            className={`flex-1 py-2 rounded-md text-[13px] font-semibold transition-colors ${
              tab === "wrap"
                ? "bg-accent-muted text-accent-text"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            Wrap
          </button>
          <button
            onClick={() => setTab("unwrap")}
            className={`flex-1 py-2 rounded-md text-[13px] font-semibold transition-colors ${
              tab === "unwrap"
                ? "bg-accent-muted text-accent-text"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            Unwrap
          </button>
        </div>

        <div className="px-5 pb-5">
          {tab === "wrap" ? (
            <>
              {/* Native balance */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] text-text-muted">
                  Available balance
                </span>
                <span className="text-[13px] font-semibold text-text-secondary tabular-nums">
                  {nativeBal} {nativeSymbol}
                </span>
              </div>

              {/* Amount input */}
              <div className="relative mb-4">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-12 px-4 pr-20 rounded-xl bg-bg-input text-text-primary text-[16px] font-semibold outline-none border border-border-input focus:border-accent-text/50 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  onClick={() => setAmount(nativeBal)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-accent-text hover:text-accent-text/80 transition-colors"
                >
                  MAX
                </button>
              </div>

              {/* Wrap button */}
              <button
                onClick={handleWrap}
                disabled={isPending || !amount || +amount <= 0}
                className="w-full h-11 rounded-xl font-semibold text-[14px] transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-btn-primary-bg text-btn-primary-text hover:bg-accent-hover active:scale-[0.98]"
              >
                {isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Wrapping...
                  </span>
                ) : (
                  `Wrap to ${tokenSymbol}`
                )}
              </button>
            </>
          ) : (
            <>
              {/* Token balance */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] text-text-muted">
                  Available balance
                </span>
                <span className="text-[13px] font-semibold text-text-secondary tabular-nums">
                  {tokenBal} {tokenSymbol}
                </span>
              </div>

              {/* Amount input */}
              <div className="relative mb-4">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-12 px-4 pr-20 rounded-xl bg-bg-input text-text-primary text-[16px] font-semibold outline-none border border-border-input focus:border-accent-text/50 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  onClick={() => setAmount(tokenBal)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-accent-text hover:text-accent-text/80 transition-colors"
                >
                  MAX
                </button>
              </div>

              {/* Unwrap button */}
              <button
                onClick={handleUnwrap}
                disabled={isPending || !amount || +amount <= 0}
                className="w-full h-11 rounded-xl font-semibold text-[14px] transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-btn-primary-bg text-btn-primary-text hover:bg-accent-hover active:scale-[0.98]"
              >
                {isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Unwrapping...
                  </span>
                ) : (
                  `Unwrap to ${nativeSymbol}`
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
