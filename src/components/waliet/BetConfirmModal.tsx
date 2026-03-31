"use client";

import { useEffect } from "react";
import { useOddsFormat } from "./OddsFormatContext";

export interface BetConfirmData {
  selections: {
    gameTitle: string;
    marketName: string;
    selectionName: string;
    odds: number;
  }[];
  amount: string;
  possibleWin: string;
  currency: string;
  isCombo: boolean;
}

export function BetConfirmModal({
  open,
  data,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  data: BetConfirmData | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { formatOdds } = useOddsFormat();
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    if (open) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [open, onCancel]);

  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />

      {/* Modal */}
      <div className="relative w-[380px] max-w-[90vw] bg-bg-modal rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[16px] font-semibold text-text-primary">Confirm Bet</span>
          <button onClick={onCancel} className="text-text-muted hover:text-text-secondary transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Selections */}
        <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto">
          {data.selections.map((sel, i) => (
            <div key={i} className="bg-bg-input rounded-lg p-3">
              <div className="text-[11px] text-text-muted mb-1 truncate">{sel.gameTitle}</div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-text-primary truncate">
                  {sel.marketName}: {sel.selectionName}
                </span>
                <span className="text-[13px] font-bold text-accent tabular-nums shrink-0">
                  {formatOdds(sel.odds)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="border-t border-border-subtle pt-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-text-secondary">Stake</span>
            <span className="font-semibold text-text-primary">{data.amount} {data.currency}</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-text-secondary">Possible Win</span>
            <span className="font-bold text-status-win">{data.possibleWin} {data.currency}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-lg font-semibold text-[14px] bg-bg-input text-text-secondary hover:bg-bg-active transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-11 rounded-lg font-semibold text-[14px] bg-btn-primary-bg text-btn-primary-text hover:bg-accent-hover transition-colors active:scale-[0.98]"
          >
            Confirm Bet
          </button>
        </div>
      </div>
    </div>
  );
}
