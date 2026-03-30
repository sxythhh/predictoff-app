/**
 * In-memory cache for betslip display metadata.
 * The Azuro SDK BetslipItem only stores IDs — this stores the
 * human-readable names so the betslip can show "Arsenal vs Chelsea"
 * instead of raw IDs like "30061006000000008298934400..."
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

const cache = new Map<string, BetslipMeta>();

function key(conditionId: string, outcomeId: string) {
  return `${conditionId}-${outcomeId}`;
}

export function setBetslipMeta(
  conditionId: string,
  outcomeId: string,
  meta: BetslipMeta
) {
  cache.set(key(conditionId, outcomeId), meta);
}

export function getBetslipMeta(
  conditionId: string,
  outcomeId: string
): BetslipMeta | undefined {
  return cache.get(key(conditionId, outcomeId));
}

export function clearBetslipMeta(conditionId: string, outcomeId: string) {
  cache.delete(key(conditionId, outcomeId));
}
