/**
 * Persistent cache for betslip display metadata.
 * The Azuro SDK BetslipItem only stores IDs — this stores the
 * human-readable names so the betslip can show "Arsenal vs Chelsea"
 * instead of raw IDs like "30061006000000008298934400..."
 *
 * Persisted to sessionStorage so metadata survives page refreshes.
 */

export interface BetslipMeta {
  gameTitle: string;
  marketName: string;
  selectionName: string;
  sportName?: string;
  leagueName?: string;
  /** Unix seconds — game start time */
  startsAt?: number;
  team1Name?: string;
  team2Name?: string;
  team1Image?: string;
  team2Image?: string;
}

const STORAGE_KEY = "waliet-betslip-meta";

// In-memory cache backed by sessionStorage
const cache = new Map<string, BetslipMeta>();

// Hydrate from sessionStorage on load
if (typeof window !== "undefined") {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed === "object" && parsed !== null) {
        for (const [k, v] of Object.entries(parsed)) {
          cache.set(k, v as BetslipMeta);
        }
      }
    }
  } catch {}
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    const obj: Record<string, BetslipMeta> = {};
    for (const [k, v] of cache) obj[k] = v;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {}
}

function key(conditionId: string, outcomeId: string) {
  return `${conditionId}-${outcomeId}`;
}

export function setBetslipMeta(
  conditionId: string,
  outcomeId: string,
  meta: BetslipMeta
) {
  cache.set(key(conditionId, outcomeId), meta);
  persist();
}

export function getBetslipMeta(
  conditionId: string,
  outcomeId: string
): BetslipMeta | undefined {
  return cache.get(key(conditionId, outcomeId));
}

export function clearBetslipMeta(conditionId: string, outcomeId: string) {
  cache.delete(key(conditionId, outcomeId));
  persist();
}

export function clearAllBetslipMeta() {
  cache.clear();
  persist();
}
