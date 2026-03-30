"use client";
import { BetType, useBets, useRedeemBet, useChain, usePrecalculatedCashouts, useCashout } from "@azuro-org/sdk";
import { useAccount } from "wagmi";
import type { Address } from "viem";

const AFFILIATE = (process.env.NEXT_PUBLIC_AFFILIATE_ADDRESS as Address) ?? "0x0000000000000000000000000000000000000000";

function CashoutButton({ bet }: { bet: any }) {
  const { data: cashoutData } = usePrecalculatedCashouts({
    bet: {
      tokenId: bet.tokenId,
      amount: bet.amount,
      outcomes: bet.outcomes,
      status: bet.status,
      totalOdds: bet.possibleWin / +bet.amount,
      freebetId: bet.freebetId,
    },
    query: { enabled: !bet.isWin && !bet.isLose && !bet.isCanceled && !bet.isCashedOut },
  });

  const { submit, cashoutTx } = useCashout({
    bet: { tokenId: bet.tokenId, outcomes: bet.outcomes },
    onSuccess: () => {},
  });

  if (!cashoutData?.isAvailable) return null;

  const isBusy = cashoutTx.isPending || cashoutTx.isProcessing;

  return (
    <button
      onClick={() => submit()}
      disabled={isBusy}
      className="h-7 px-3 rounded-md bg-yellow-500/15 text-yellow-400 text-[12px] font-semibold hover:bg-yellow-500/25 active:scale-[0.97] transition-all disabled:opacity-50"
    >
      {isBusy ? "..." : `Cashout $${Number(cashoutData.cashoutAmount).toFixed(2)}`}
    </button>
  );
}

function BetHistoryCard({ bet }: { bet: any }) {
  const { betToken } = useChain();
  const { submit, isPending, isProcessing } = useRedeemBet();

  const outcomes = bet.outcomes || [];
  const isCombo = outcomes.length > 1;
  const gameTitle = outcomes[0]?.game?.title ?? "Unknown game";
  const date = new Date(bet.createdAt * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const statusColor = bet.isWin ? "text-green-400" : bet.isLose ? "text-red-400" : bet.isCanceled ? "text-text-muted" : "text-yellow-400";
  const statusText = bet.isWin ? "Won" : bet.isLose ? "Lost" : bet.isCanceled ? "Canceled" : bet.isCashedOut ? "Cashed Out" : "Pending";

  return (
    <div className="bg-border-subtle rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-border-subtle">
        <span className="text-[11px] text-text-muted font-medium">#{bet.tokenId} · {date}</span>
        <span className={`text-[11px] font-semibold ${statusColor}`}>{statusText}</span>
      </div>
      <div className="px-3 py-2.5">
        <div className="text-[12px] text-text-secondary mb-1">
          {isCombo ? `Combo (${outcomes.length} events)` : outcomes[0]?.game?.sport?.name}
        </div>
        <div className="text-[13px] font-semibold text-text-primary truncate">{gameTitle}</div>
        {!isCombo && outcomes[0] && (
          <div className="text-[12px] text-text-secondary mt-1">
            {outcomes[0].marketName}: <span className="text-text-primary/80">{outcomes[0].selectionName}</span>
            <span className="text-accent-text ml-2 font-semibold">{outcomes[0].odds?.toFixed(2)}</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-3 py-2 border-t border-border-subtle">
        <span className="text-[12px] font-semibold text-text-primary">{bet.amount} {betToken?.symbol}</span>
        <div className="flex items-center gap-2">
          {!bet.isWin && !bet.isLose && !bet.isCanceled && !bet.isCashedOut && (
            <CashoutButton bet={bet} />
          )}
          {bet.isRedeemable && !bet.isRedeemed && (
            <button
              onClick={() => submit({ bets: [bet] })}
              disabled={isPending || isProcessing}
              className="h-7 px-3 rounded-md bg-green-500/20 text-green-400 text-[12px] font-semibold hover:bg-green-500/30 active:scale-[0.97] transition-all disabled:opacity-50"
            >
              {isPending || isProcessing ? "Claiming..." : `Claim ${bet.possibleWin?.toFixed(2)} ${betToken?.symbol}`}
            </button>
          )}
          {bet.isWin && bet.isRedeemed && (
            <span className="text-[12px] text-green-400/60 font-medium">
              +{bet.payout?.toFixed(2)} {betToken?.symbol}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function BetHistory() {
  const { address } = useAccount();

  if (!address) {
    return (
      <div className="p-4 text-center">
        <p className="text-[13px] text-text-muted">Connect wallet to see bet history</p>
      </div>
    );
  }

  return <BetHistoryInner address={address} />;
}

function BetHistoryInner({ address }: { address: Address }) {
  const { data, isLoading } = useBets({
    filter: { bettor: address, affiliate: AFFILIATE },
    itemsPerPage: 50,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-24 rounded-lg animate-pulse" style={{background:"var(--border-subtle)"}} />
        ))}
      </div>
    );
  }

  const allBets = data?.pages?.flatMap((page) => page.bets) ?? [];

  if (allBets.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="text-2xl mb-2">📋</div>
        <p className="text-[13px] text-text-muted">No bets yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {allBets.map((bet) => (
        <BetHistoryCard key={bet.tokenId} bet={bet} />
      ))}
    </div>
  );
}
