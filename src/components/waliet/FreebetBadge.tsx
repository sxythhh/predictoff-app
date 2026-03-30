"use client";
import { useAvailableFreebets, useBaseBetslip } from "@azuro-org/sdk";
import { useAccount } from "wagmi";
import { type Address } from "viem";

const AFFILIATE = (process.env.NEXT_PUBLIC_AFFILIATE_ADDRESS as Address) ?? "0x0000000000000000000000000000000000000000";

export function FreebetBadge() {
  const { address } = useAccount();
  const { items } = useBaseBetslip();

  const selections = items.map((item) => ({
    conditionId: item.conditionId,
    outcomeId: item.outcomeId,
  }));

  const { data: freebets } = useAvailableFreebets({
    account: address!,
    affiliate: AFFILIATE,
    selections,
    query: { enabled: !!address && selections.length > 0 },
  });

  if (!freebets?.length) return null;

  return (
    <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[11px] font-semibold">
      {"\u{1F381}"} {freebets.length} free
    </span>
  );
}
