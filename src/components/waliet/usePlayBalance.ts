"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  getPlayBalance,
  subscribePlayBalance,
  deductPlayBalance,
  addPlayBalance,
  resetPlayBalance,
  addPlayBet,
  getPlayBets,
  autoSettlePendingBets,
  type PlayBet,
  PLAY_CURRENCY,
} from "./play-balance";

export { PLAY_CURRENCY };

export function usePlayBalance() {
  const balance = useSyncExternalStore(
    subscribePlayBalance,
    getPlayBalance,
    () => 1000
  );

  // Auto-settle old pending bets every 10s
  useEffect(() => {
    const interval = setInterval(autoSettlePendingBets, 10_000);
    return () => clearInterval(interval);
  }, []);

  return {
    balance,
    currency: PLAY_CURRENCY,
    deduct: deductPlayBalance,
    add: addPlayBalance,
    reset: resetPlayBalance,
  };
}

export function usePlayBets() {
  const [bets, setBets] = useState<PlayBet[]>([]);

  // Re-fetch on balance changes (which happen on settle/bet)
  const balance = useSyncExternalStore(
    subscribePlayBalance,
    getPlayBalance,
    () => 1000
  );

  useEffect(() => {
    setBets(getPlayBets());
  }, [balance]);

  return bets;
}

export function usePlacPlayBet() {
  return useCallback(
    (bet: { gameTitle: string; marketName: string; selectionName: string; odds: number; amount: number; gameStartsAt?: number; legs?: import("./play-balance").PlayBetLeg[] }) => {
      const success = deductPlayBalance(bet.amount);
      if (!success) return null;
      return addPlayBet({
        ...bet,
        possibleWin: Math.round(bet.odds * bet.amount * 100) / 100,
      });
    },
    []
  );
}
