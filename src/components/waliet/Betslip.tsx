"use client";

import { useState } from "react";
import {
  useBaseBetslip,
  useDetailedBetslip,
  useChain,
  useBetTokenBalance,
  useBet,
  useBetFee,
} from "@azuro-org/sdk";
import { type Address } from "viem";
import { useAccount } from "wagmi";
import { getBetslipMeta } from "./betslip-meta";
import { WrapTokenModal } from "./WrapTokenModal";

const AFFILIATE =
  (process.env.NEXT_PUBLIC_AFFILIATE_ADDRESS as Address) ??
  "0x0000000000000000000000000000000000000000";

function BetslipCard({
  item,
  odds,
  onRemove,
  showLegOdds,
}: {
  item: AzuroSDK.BetslipItem;
  odds: number | undefined;
  onRemove: () => void;
  showLegOdds: boolean;
}) {
  const meta = getBetslipMeta(item.conditionId, item.outcomeId);
  const isForbidden = item.isExpressForbidden;

  return (
    <div className="bg-bg-input rounded-lg p-3 relative group">
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 text-text-muted hover:text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
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
      <div className="text-[11px] text-text-muted mb-1 truncate pr-4">
        {meta?.gameTitle ?? `Game ${item.gameId}`}
        {isForbidden && (
          <span className="ml-1" title="Cannot be used in combo bets">
            {"\u26A0\uFE0F"}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-text-primary truncate">
          {meta ? `${meta.marketName}: ${meta.selectionName}` : `#${item.outcomeId}`}
        </span>
        {showLegOdds && (
          <span className="text-[13px] font-bold text-accent-text tabular-nums shrink-0">
            {odds?.toFixed(2) ?? "\u2014"}
          </span>
        )}
        {!showLegOdds && (
          <span className="text-[13px] font-bold text-accent-text tabular-nums shrink-0">
            {odds?.toFixed(2) ?? "\u2014"}
          </span>
        )}
      </div>
    </div>
  );
}

export function Betslip() {
  const { address } = useAccount();
  const { betToken } = useChain();
  const { items, removeItem, clear } = useBaseBetslip();
  const {
    odds,
    totalOdds,
    minBet,
    maxBet,
    betAmount,
    changeBetAmount,
    disableReason,
    isBetAllowed,
    isOddsFetching,
    isStatesFetching,
    isBetCalculationFetching,
    freebets,
    selectedFreebet,
    selectFreebet,
    isFreebetsFetching,
  } = useDetailedBetslip();
  const { data: balanceData } = useBetTokenBalance();
  const { data: feeData } = useBetFee();

  const [wrapOpen, setWrapOpen] = useState(false);

  const {
    submit,
    approveTx,
    betTx,
    isApproveRequired,
    isAllowanceLoading,
    isRelayerFeeLoading,
  } = useBet({
    betAmount,
    slippage: 10,
    affiliate: AFFILIATE,
    selections: items.map((item) => ({
      conditionId: item.conditionId,
      outcomeId: item.outcomeId,
    })),
    odds: odds ?? {},
    totalOdds,
    freebet: selectedFreebet,
    onSuccess: () => {
      clear();
    },
    onError: (err) => {
      console.error("Bet error:", err);
    },
  });

  const isPending = approveTx.isPending || betTx.isPending;
  const isProcessing = approveTx.isProcessing || betTx.isProcessing;
  const isLoading =
    isOddsFetching ||
    isStatesFetching ||
    isAllowanceLoading ||
    isPending ||
    isProcessing ||
    isRelayerFeeLoading;

  const possibleWin = totalOdds ? (totalOdds * +betAmount).toFixed(2) : "0.00";
  const isOverMax = maxBet !== undefined && +betAmount > maxBet;
  const isUnderMin = minBet !== undefined && +betAmount > 0 && +betAmount < minBet;
  const balance = balanceData?.balance ? Number(balanceData.balance) : undefined;
  const isOverBalance = balance !== undefined && +betAmount > balance;
  const isCombo = items.length > 1;

  const DISABLE_MESSAGES: Record<string, string> = {
    ConditionState: "One or more markets are unavailable",
    BetAmountGreaterThanMaxBet: `Max bet is ${maxBet?.toFixed(2)} ${betToken?.symbol ?? ""}`,
    BetAmountLowerThanMinBet: `Min bet is ${minBet?.toFixed(2)} ${betToken?.symbol ?? ""}`,
    ComboWithForbiddenItem: "One selection can\u2019t be combined in a combo",
    ComboWithSameGame: "Can\u2019t combine selections from the same game",
    SelectedOutcomesTemporarySuspended: "Selections temporarily suspended",
    TotalOddsTooLow: "Total odds too low for combo bet",
  };

  if (items.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="text-2xl mb-2">{"\uD83C\uDFAB"}</div>
        <p className="text-[13px] font-semibold text-text-secondary">
          Betslip is empty
        </p>
        <p className="text-[12px] text-text-muted mt-1">
          Click on odds to add selections
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-[14px] font-semibold text-text-primary">
          {items.length === 1 ? "Single" : `Combo (${items.length})`}
        </span>
        <button
          onClick={clear}
          className="text-[12px] text-text-muted hover:text-text-secondary transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Combo warnings */}
      {isCombo && (disableReason === "ComboWithSameGame" || disableReason === "ComboWithForbiddenItem") && (
        <div className="mx-3 mb-2 flex items-center gap-1.5 text-[11px] text-amber-400/80 px-2 py-2 rounded-lg bg-amber-500/[0.08] border border-amber-500/[0.12]">
          <span>{"\u26A0\uFE0F"}</span>
          <span>{DISABLE_MESSAGES[disableReason]}</span>
        </div>
      )}

      {/* Cards */}
      <div className="flex flex-col gap-2 px-3 max-h-[300px] overflow-y-auto">
        {items.map((item) => {
          const oddsKey = `${item.conditionId}-${item.outcomeId}`;
          return (
            <BetslipCard
              key={oddsKey}
              item={item}
              odds={odds?.[oddsKey]}
              onRemove={() => removeItem(item)}
              showLegOdds={isCombo}
            />
          );
        })}
      </div>

      {/* Amount + Place Bet */}
      <div className="px-3 pt-3 pb-4">
        {/* Amount input — hidden when freebet selected */}
        {!selectedFreebet && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 relative">
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => changeBetAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full h-10 px-3 pr-16 rounded-lg bg-bg-input text-text-primary text-[14px] font-semibold outline-none transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                    isOverMax || isOverBalance
                      ? "border border-red-500/40 focus:border-red-500/60"
                      : "border border-border-input focus:border-accent/50"
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-text-muted">
                  {betToken?.symbol ?? "USDT"}
                </span>
              </div>
            </div>

            {/* Min/Max bet limits */}
            <div className="flex items-center justify-between mb-2 px-0.5">
              <div className="text-[11px] text-text-muted tabular-nums">
                {isBetCalculationFetching ? (
                  <span className="inline-block w-16 h-3 rounded bg-bg-input animate-pulse" />
                ) : minBet !== undefined ? (
                  <span>
                    Min:{" "}
                    <button
                      onClick={() => changeBetAmount(String(minBet))}
                      className="text-text-muted hover:text-text-secondary transition-colors"
                    >
                      {minBet.toFixed(2)}
                    </button>
                  </span>
                ) : null}
              </div>
              <div className="text-[11px] text-text-muted tabular-nums">
                {isBetCalculationFetching ? (
                  <span className="inline-block w-20 h-3 rounded bg-bg-input animate-pulse" />
                ) : maxBet !== undefined ? (
                  <span>
                    Max:{" "}
                    <button
                      onClick={() => changeBetAmount(String(maxBet))}
                      className="text-text-muted hover:text-text-secondary transition-colors font-semibold"
                    >
                      {maxBet.toFixed(2)}
                    </button>{" "}
                    <span className="text-text-muted">{betToken?.symbol}</span>
                  </span>
                ) : null}
              </div>
            </div>

            {/* Quick amounts */}
            <div className="flex gap-1.5 mb-3">
              {["5", "10", "25", "50", "100"].map((v) => {
                const exceedsMax = maxBet !== undefined && +v > maxBet;
                return (
                  <button
                    key={v}
                    onClick={() => changeBetAmount(v)}
                    disabled={exceedsMax}
                    className={`flex-1 h-7 rounded-md text-[12px] font-semibold transition-colors ${
                      betAmount === v
                        ? "bg-accent-muted text-accent-text"
                        : exceedsMax
                          ? "bg-border-subtle text-text-muted cursor-not-allowed"
                          : "bg-bg-input text-text-secondary hover:bg-white/[0.10]"
                    }`}
                  >
                    {v}
                  </button>
                );
              })}
              {/* MAX button */}
              {maxBet !== undefined && (
                <button
                  onClick={() =>
                    changeBetAmount(
                      String(Math.min(maxBet, balance ?? maxBet))
                    )
                  }
                  className="flex-1 h-7 rounded-md text-[12px] font-semibold bg-accent-muted text-accent-text/70 hover:bg-accent-muted hover:text-accent-text transition-colors"
                >
                  MAX
                </button>
              )}
            </div>
          </>
        )}

        {/* Total odds (combo) */}
        {isCombo && (
          <div className="flex items-center justify-between mb-2 text-[12px]">
            <span className="text-text-muted">Total Odds</span>
            <span className="font-semibold text-text-primary tabular-nums">
              {totalOdds?.toFixed(2) ?? "\u2014"}
            </span>
          </div>
        )}

        {/* Balance + Wrap button */}
        {balanceData?.balance && (
          <div className="flex items-center justify-between mb-3 text-[12px]">
            <span className="text-text-muted">Balance</span>
            <span className="flex items-center gap-2">
              <span className="font-medium text-text-secondary tabular-nums">
                {Number(balanceData.balance).toFixed(2)} {betToken?.symbol}
              </span>
              <button
                onClick={() => setWrapOpen(true)}
                className="text-[11px] font-semibold text-accent-text/70 hover:text-accent-text bg-accent-muted px-2 py-0.5 rounded transition-colors"
              >
                Wrap
              </button>
            </span>
          </div>
        )}

        {/* Freebet selector */}
        {freebets && freebets.length > 0 && (
          <div className="mb-3">
            <div className="text-[11px] text-text-muted mb-1.5">
              Free Bets Available
            </div>
            <div className="flex flex-col gap-1.5">
              {/* No freebet option */}
              <button
                onClick={() => selectFreebet(undefined)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[12px] font-medium transition-colors ${
                  !selectedFreebet
                    ? "bg-accent-muted text-accent-text ring-1 ring-accent/30"
                    : "bg-border-subtle text-text-secondary hover:bg-bg-input"
                }`}
              >
                <span>Use real balance</span>
              </button>
              {freebets.map((fb: any) => (
                <button
                  key={fb.id}
                  onClick={() => selectFreebet(fb)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[12px] font-medium transition-colors ${
                    selectedFreebet?.id === fb.id
                      ? "bg-green-500/15 text-green-400 ring-1 ring-green-500/30"
                      : "bg-border-subtle text-text-secondary hover:bg-bg-input"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{"\uD83C\uDF81"}</span>
                    <span>Free Bet</span>
                  </span>
                  <span className="font-semibold">
                    {fb.amount} {betToken?.symbol}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Relayer fee */}
        {feeData?.formattedRelayerFeeAmount && (
          <div className="flex items-center justify-between mb-2 text-[11px]">
            <span className="text-text-muted">Relayer fee</span>
            <span className="text-text-muted tabular-nums">
              {feeData.formattedRelayerFeeAmount} {betToken?.symbol}
            </span>
          </div>
        )}

        {/* Disable reason */}
        {disableReason &&
          disableReason !== "ComboWithSameGame" &&
          disableReason !== "ComboWithForbiddenItem" && (
            <div className="flex items-center gap-1.5 text-[11px] text-red-400/80 mb-2 px-1 py-1.5 rounded-md bg-red-500/[0.06]">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className="shrink-0"
              >
                <circle
                  cx="6"
                  cy="6"
                  r="5.5"
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <path
                  d="M6 3.5V6.5M6 8V8.01"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
              <span>{DISABLE_MESSAGES[disableReason] ?? disableReason}</span>
            </div>
          )}

        {/* Over balance warning */}
        {isOverBalance && !disableReason && (
          <div className="flex items-center gap-1.5 text-[11px] text-yellow-400/80 mb-2 px-1 py-1.5 rounded-md bg-yellow-500/[0.06]">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="shrink-0"
            >
              <path
                d="M6 1L11 10H1L6 1Z"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M6 5V7M6 8.5V8.51"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </svg>
            <span>
              Insufficient balance ({balance?.toFixed(2)} {betToken?.symbol})
            </span>
          </div>
        )}

        {/* Place Bet button */}
        {!address ? (
          <div className="text-center text-[13px] text-text-muted py-3">
            Connect wallet to place bets
          </div>
        ) : (
          <button
            onClick={submit}
            disabled={isLoading || !isBetAllowed || (!selectedFreebet && !+betAmount)}
            className="w-full h-11 rounded-lg font-semibold text-[14px] transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-btn-primary-bg text-btn-primary-text hover:bg-accent-hover active:scale-[0.98]"
          >
            {isLoading ? (
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
                Processing...
              </span>
            ) : isApproveRequired ? (
              "Approve"
            ) : (
              <span className="flex items-center justify-between px-4">
                <span>
                  {selectedFreebet ? "Place Free Bet" : "Place Bet"}
                </span>
                <span className="bg-black/20 px-2.5 py-1 rounded text-[12px]">
                  Win {selectedFreebet ? (totalOdds ? (totalOdds * +selectedFreebet.amount).toFixed(2) : "0.00") : possibleWin}{" "}
                  {betToken?.symbol}
                </span>
              </span>
            )}
          </button>
        )}
      </div>

      {/* Wrap Token Modal */}
      <WrapTokenModal open={wrapOpen} onClose={() => setWrapOpen(false)} />
    </div>
  );
}
