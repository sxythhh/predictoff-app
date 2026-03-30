"use client";

import { useState } from "react";
import { Betslip } from "./Betslip";
import { BetHistory } from "./BetHistory";

export function LiveBetslipSidebar() {
  const [tab, setTab] = useState<"betslip" | "history">("betslip");

  return (
    <aside className="w-[320px] shrink-0 border-l border-border-primary flex flex-col">
      <div className="flex border-b border-border-primary">
        <button
          onClick={() => setTab("betslip")}
          className={`flex-1 px-4 py-3 text-[14px] font-semibold transition-colors ${
            tab === "betslip"
              ? "text-text-primary border-b-2 border-accent"
              : "text-text-secondary hover:text-text-secondary"
          }`}
        >
          Betslip
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 px-4 py-3 text-[14px] font-semibold transition-colors ${
            tab === "history"
              ? "text-text-primary border-b-2 border-accent"
              : "text-text-secondary hover:text-text-secondary"
          }`}
        >
          My Bets
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === "betslip" ? <Betslip /> : <BetHistory />}
      </div>
    </aside>
  );
}
