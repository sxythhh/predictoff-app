/**
 * Play Balance — simulated in-game currency for demo/testnet mode.
 * Users start with 1,000 PLAY tokens. No wallet needed.
 * Persisted to localStorage so it survives page refreshes.
 */

const STORAGE_KEY = "predictoff-play-balance";
const INITIAL_BALANCE = 1000;
const CURRENCY = "PLAY";

export { CURRENCY as PLAY_CURRENCY };

type BalanceListener = (balance: number) => void;
const listeners = new Set<BalanceListener>();

function notify(balance: number) {
  for (const fn of listeners) fn(balance);
}

export function getPlayBalance(): number {
  if (typeof window === "undefined") return INITIAL_BALANCE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      localStorage.setItem(STORAGE_KEY, String(INITIAL_BALANCE));
      return INITIAL_BALANCE;
    }
    const val = Number(stored);
    if (isNaN(val) || !isFinite(val)) return INITIAL_BALANCE;
    return val;
  } catch {
    return INITIAL_BALANCE;
  }
}

export function setPlayBalance(amount: number) {
  if (isNaN(amount) || !isFinite(amount)) return;
  const clamped = Math.max(0, Math.round(amount * 100) / 100);
  try {
    localStorage.setItem(STORAGE_KEY, String(clamped));
  } catch { /* quota exceeded — silently fail */ }
  notify(clamped);
}

export function deductPlayBalance(amount: number): boolean {
  const current = getPlayBalance();
  if (amount > current) return false;
  setPlayBalance(current - amount);
  return true;
}

export function addPlayBalance(amount: number) {
  setPlayBalance(getPlayBalance() + amount);
}

export function resetPlayBalance() {
  setPlayBalance(INITIAL_BALANCE);
}

export function subscribePlayBalance(fn: BalanceListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Simulated bet history */
export interface PlayBetLeg {
  gameTitle: string;
  marketName: string;
  selectionName: string;
  odds: number;
}

export interface PlayBet {
  id: string;
  gameTitle: string;
  marketName: string;
  selectionName: string;
  odds: number;
  amount: number;
  possibleWin: number;
  timestamp: number;
  /** Unix seconds — when the game starts. Bet settles after this time. */
  gameStartsAt?: number;
  status: "pending" | "won" | "lost";
  /** Individual legs for combo bets */
  legs?: PlayBetLeg[];
}

const BETS_KEY = "predictoff-play-bets";

export function getPlayBets(): PlayBet[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(BETS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Corrupt data — reset
    localStorage.removeItem(BETS_KEY);
    return [];
  }
}

export function addPlayBet(bet: Omit<PlayBet, "id" | "timestamp" | "status">): PlayBet {
  const newBet: PlayBet = {
    ...bet,
    id: `play-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    status: "pending",
  };
  const bets = [newBet, ...getPlayBets()].slice(0, 50); // keep last 50
  localStorage.setItem(BETS_KEY, JSON.stringify(bets));
  notify(getPlayBalance()); // trigger re-render
  return newBet;
}

export function settlePlayBet(betId: string, won: boolean) {
  const bets = getPlayBets().map((b) => {
    if (b.id !== betId) return b;
    const newStatus: PlayBet["status"] = won ? "won" : "lost";
    const settled = { ...b, status: newStatus };
    if (won) addPlayBalance(settled.possibleWin);
    return settled;
  });
  localStorage.setItem(BETS_KEY, JSON.stringify(bets));
  notify(getPlayBalance());
}

/** Auto-settle pending bets after the game has started (simulates game resolution).
 *  If gameStartsAt is set, waits until game start + 2 hours (simulated full time).
 *  If gameStartsAt is not set, settles after 2 minutes as fallback. */
export function autoSettlePendingBets() {
  const now = Date.now();
  const bets = getPlayBets();
  const pending = bets.filter((b) => {
    if (b.status !== "pending") return false;
    if (b.gameStartsAt) {
      // Settle ~2 hours after game starts (simulating full time result)
      const settleTime = b.gameStartsAt * 1000 + 2 * 60 * 60 * 1000;
      return now > settleTime;
    }
    // Fallback: settle after 24 hours if no start time stored
    return now - b.timestamp > 24 * 60 * 60 * 1000;
  });
  for (const bet of pending) {
    // ~40% win rate to keep it realistic
    const won = Math.random() < 0.4;
    settlePlayBet(bet.id, won);
  }
}
