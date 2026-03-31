/**
 * Server-side Azuro subgraph queries for tournament scoring.
 * Queries bet data by wallet address and time range.
 */

// Subgraph endpoints by chain ID
const SUBGRAPH_URLS: Record<number, string> = {
  137: "https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-polygon-v3",
  100: "https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-gnosis-v3",
  8453: "https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-base-v3",
  80002: "https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-polygon-amoy-v3",
};

const DEFAULT_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_TESTNET === "true" ? "80002" : "137");

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status >= 500 && i < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1))); // exponential backoff
        continue;
      }
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error("Subgraph request failed after retries");
}

export interface SubgraphBet {
  tokenId: string;
  amount: string;
  potentialPayout: string;
  payout: string | null;
  status: string;
  result: string | null;
  isRedeemed: boolean;
  createdBlockTimestamp: string;
  resolvedBlockTimestamp: string | null;
  selections: Array<{
    conditionId: string;
    outcomeId: string;
    odds: string;
    result: string | null;
    outcome: {
      condition: {
        game: {
          gameId: string;
          title: string;
        };
      };
    };
  }>;
}

const BETS_QUERY = `
  query BetsByBettors($bettors: [String!]!, $createdGte: BigInt!, $createdLte: BigInt!, $first: Int!, $skip: Int!) {
    bets(
      where: {
        actor_in: $bettors
        createdBlockTimestamp_gte: $createdGte
        createdBlockTimestamp_lte: $createdLte
      }
      first: $first
      skip: $skip
      orderBy: createdBlockTimestamp
    ) {
      tokenId
      amount
      potentialPayout
      payout
      status
      result
      isRedeemed
      createdBlockTimestamp
      resolvedBlockTimestamp
      actor
      selections {
        conditionId
        outcomeId
        odds
        result
        outcome {
          condition {
            game {
              gameId
            }
          }
        }
      }
    }
  }
`;

export async function queryBetsByWallets(
  wallets: string[],
  startTimestamp: number,
  endTimestamp: number,
  chainId?: number,
): Promise<Map<string, SubgraphBet[]>> {
  const url = SUBGRAPH_URLS[chainId ?? DEFAULT_CHAIN_ID];
  if (!url) throw new Error(`No subgraph URL for chain ${chainId}`);

  const result = new Map<string, SubgraphBet[]>();
  for (const wallet of wallets) {
    result.set(wallet.toLowerCase(), []);
  }

  // Batch max 50 wallets per query
  const batchSize = 50;
  for (let i = 0; i < wallets.length; i += batchSize) {
    const batch = wallets.slice(i, i + batchSize).map((w) => w.toLowerCase());

    let skip = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const response = await fetchWithRetry(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: BETS_QUERY,
          variables: {
            bettors: batch,
            createdGte: String(startTimestamp),
            createdLte: String(endTimestamp),
            first: pageSize,
            skip,
          },
        }),
      });

      if (!response.ok) {
        console.error(`Subgraph query failed: ${response.status}`);
        break;
      }

      const data = await response.json();
      const bets: (SubgraphBet & { actor: string })[] = data?.data?.bets ?? [];

      for (const bet of bets) {
        const wallet = bet.actor.toLowerCase();
        const existing = result.get(wallet);
        if (existing) existing.push(bet);
      }

      hasMore = bets.length === pageSize;
      skip += pageSize;
    }
  }

  return result;
}

// Query condition resolution status for pick'em scoring
const CONDITIONS_QUERY = `
  query ConditionsByIds($conditionIds: [String!]!) {
    conditions(where: { conditionId_in: $conditionIds }) {
      conditionId
      status
      wonOutcomes {
        outcomeId
      }
    }
  }
`;

export interface ConditionResolution {
  conditionId: string;
  status: string;
  wonOutcomeIds: string[];
}

export async function queryConditionResolutions(
  conditionIds: string[],
  chainId?: number,
): Promise<Map<string, ConditionResolution>> {
  const url = SUBGRAPH_URLS[chainId ?? DEFAULT_CHAIN_ID];
  if (!url) throw new Error(`No subgraph URL for chain ${chainId}`);

  const result = new Map<string, ConditionResolution>();

  // Batch 100 at a time
  for (let i = 0; i < conditionIds.length; i += 100) {
    const batch = conditionIds.slice(i, i + 100);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: CONDITIONS_QUERY,
        variables: { conditionIds: batch },
      }),
    });

    if (!response.ok) continue;
    const data = await response.json();
    const conditions = data?.data?.conditions ?? [];

    for (const c of conditions) {
      result.set(c.conditionId, {
        conditionId: c.conditionId,
        status: c.status,
        wonOutcomeIds: c.wonOutcomes?.map((o: any) => o.outcomeId) ?? [],
      });
    }
  }

  return result;
}

// Query game resolution status for the resolution tracker
const GAME_RESOLUTION_QUERY = `
  query GameResolutions($gameIds: [String!]!) {
    games(where: { gameId_in: $gameIds }) {
      gameId
      status
      conditions(first: 1, where: { status: Resolved }) {
        conditionId
        wonOutcomes {
          outcomeId
        }
        outcomes {
          outcomeId
          selectionName
        }
      }
    }
  }
`;

export interface GameResolution {
  gameId: string;
  status: string;
  winnerOutcome: string | null;
}

export async function queryGameResolutions(
  gameIds: string[],
  chainId?: number,
): Promise<Map<string, GameResolution>> {
  const url = SUBGRAPH_URLS[chainId ?? DEFAULT_CHAIN_ID];
  if (!url) throw new Error(`No subgraph URL for chain ${chainId}`);

  const result = new Map<string, GameResolution>();

  for (let i = 0; i < gameIds.length; i += 50) {
    const batch = gameIds.slice(i, i + 50);

    const response = await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: GAME_RESOLUTION_QUERY,
        variables: { gameIds: batch },
      }),
    });

    if (!response.ok) continue;
    const data = await response.json();
    const games = data?.data?.games ?? [];

    for (const game of games) {
      let winnerOutcome: string | null = null;
      const condition = game.conditions?.[0];
      if (condition?.wonOutcomes?.length) {
        const wonId = condition.wonOutcomes[0].outcomeId;
        const wonOut = condition.outcomes?.find((o: any) => o.outcomeId === wonId);
        winnerOutcome = wonOut?.selectionName ?? null;
      }

      result.set(game.gameId, {
        gameId: game.gameId,
        status: game.status,
        winnerOutcome,
      });
    }
  }

  return result;
}
