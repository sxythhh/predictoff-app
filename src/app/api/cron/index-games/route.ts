export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSports } from "@azuro-org/toolkit";
import { GameState, GameOrderBy } from "@azuro-org/toolkit";
import { slugify } from "@/lib/slugify";

const CRON_SECRET = process.env.CRON_SECRET ?? "";
const IS_TESTNET = process.env.NEXT_PUBLIC_TESTNET === "true";
const CHAIN_ID = IS_TESTNET ? 80002 : 137;

// POST /api/cron/index-games — index all active Azuro games into our DB
export async function POST(request: NextRequest) {
  if (CRON_SECRET && request.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let totalGames = 0;
  let newTeams = 0;
  let newLeagues = 0;

  // Fetch both prematch and live games
  for (const gameState of [GameState.Prematch, GameState.Live] as const) {
    let sportsData;
    try {
      sportsData = await getSports({
        chainId: CHAIN_ID as any,
        gameState,
        numberOfGames: 1000,
        orderBy: GameOrderBy.StartsAt,
      });
    } catch (err) {
      console.error(`Failed to fetch ${gameState} sports:`, err);
      continue;
    }

    if (!sportsData?.length) continue;

    for (const sport of sportsData) {
      // Upsert sport
      const sportRecord = await prisma.indexedSport.upsert({
        where: { sportId: sport.sportId },
        create: { sportId: sport.sportId, slug: sport.slug, name: sport.name },
        update: { name: sport.name },
      });

      for (const country of sport.countries) {
        for (const league of country.leagues) {
          // Upsert league
          let leagueRecord;
          try {
            leagueRecord = await prisma.indexedLeague.upsert({
              where: { slug_sportId: { slug: league.slug, sportId: sportRecord.id } },
              create: {
                slug: league.slug,
                name: league.name,
                countrySlug: country.slug,
                countryName: country.name,
                sportId: sportRecord.id,
              },
              update: { name: league.name, countryName: country.name },
            });
          } catch { continue; }

          for (const game of league.games) {
            const participants = game.participants ?? [];
            if (participants.length < 2) continue;

            // Upsert home team
            const homeName = participants[0].name;
            const awayName = participants[1].name;
            let homeSlug = slugify(homeName);
            let awaySlug = slugify(awayName);

            // Ensure unique slugs by appending sport if collision
            if (homeSlug === awaySlug) awaySlug += `-${sport.slug}`;

            let homeTeam, awayTeam;
            try {
              homeTeam = await prisma.indexedTeam.upsert({
                where: { name_sportId: { name: homeName, sportId: sportRecord.id } },
                create: {
                  name: homeName,
                  slug: homeSlug,
                  image: participants[0].image ?? null,
                  sportId: sportRecord.id,
                },
                update: {
                  ...(participants[0].image ? { image: participants[0].image } : {}),
                },
              });
            } catch {
              // Slug collision — append sport slug
              try {
                homeTeam = await prisma.indexedTeam.upsert({
                  where: { name_sportId: { name: homeName, sportId: sportRecord.id } },
                  create: {
                    name: homeName,
                    slug: `${homeSlug}-${sport.slug}`,
                    image: participants[0].image ?? null,
                    sportId: sportRecord.id,
                  },
                  update: {},
                });
              } catch { continue; }
            }

            try {
              awayTeam = await prisma.indexedTeam.upsert({
                where: { name_sportId: { name: awayName, sportId: sportRecord.id } },
                create: {
                  name: awayName,
                  slug: awaySlug,
                  image: participants[1].image ?? null,
                  sportId: sportRecord.id,
                },
                update: {
                  ...(participants[1].image ? { image: participants[1].image } : {}),
                },
              });
            } catch {
              try {
                awayTeam = await prisma.indexedTeam.upsert({
                  where: { name_sportId: { name: awayName, sportId: sportRecord.id } },
                  create: {
                    name: awayName,
                    slug: `${awaySlug}-${sport.slug}`,
                    image: participants[1].image ?? null,
                    sportId: sportRecord.id,
                  },
                  update: {},
                });
              } catch { continue; }
            }

            if (!homeTeam || !awayTeam) continue;

            // Upsert game
            const state = gameState === GameState.Live ? "live" : "prematch";
            try {
              await prisma.indexedGame.upsert({
                where: { azuroGameId: game.gameId },
                create: {
                  azuroGameId: game.gameId,
                  title: game.title,
                  startsAt: parseInt(game.startsAt),
                  state,
                  homeTeamId: homeTeam.id,
                  awayTeamId: awayTeam.id,
                  leagueId: leagueRecord.id,
                  sportSlug: sport.slug,
                  countrySlug: country.slug,
                },
                update: {
                  state,
                  title: game.title,
                },
              });
              totalGames++;
            } catch { /* duplicate — skip */ }
          }
        }
      }
    }
  }

  return Response.json({ indexed: totalGames, newTeams, newLeagues });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
