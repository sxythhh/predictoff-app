export const dynamic = "force-dynamic";

import { getSports, GameState, GameOrderBy, type ChainId } from "@azuro-org/toolkit";
import { polygon, polygonAmoy } from "wagmi/chains";

const IS_TESTNET = process.env.NEXT_PUBLIC_TESTNET === "true";
const CHAIN_ID = (IS_TESTNET ? polygonAmoy.id : polygon.id) as ChainId;

export async function GET() {
  try {
    const sports = await getSports({
      chainId: CHAIN_ID,
      gameState: GameState.Prematch,
      orderBy: GameOrderBy.Turnover,
      numberOfGames: 3,
    });

    return Response.json(sports, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("Prefetch sports error:", err);
    return Response.json([], { status: 500 });
  }
}
