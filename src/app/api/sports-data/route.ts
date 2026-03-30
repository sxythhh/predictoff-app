import { NextRequest } from "next/server";

/* ─── Sport → API base URL mapping ─── */

const SPORT_HOSTS: Record<string, string> = {
  football: "https://v3.football.api-sports.io",
  basketball: "https://v1.basketball.api-sports.io",
  hockey: "https://v1.hockey.api-sports.io",
  baseball: "https://v1.baseball.api-sports.io",
};

/* ─── Cache TTLs (seconds) ─── */

const CACHE_TTL: Record<string, number> = {
  standings: 300, // 5 min
  lineups: 60, // 1 min
  h2h: 3600, // 1 hr
  "find-fixture": 300, // 5 min
};

/* ─── In-memory cache ─── */

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: unknown, ttlSeconds: number) {
  cache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

/* ─── Team name normalization & similarity ─── */

function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(
      /\b(fc|cf|sc|ac|as|ss|afc|rc|cd|ud|rcd|ssc|bsc|fk|sk|if|bk|gf|sb|tsv|sv|vfb|vfl|1\.|sportverein)\b/gi,
      ""
    )
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  const wordsA = new Set(na.split(" "));
  const wordsB = new Set(nb.split(" "));
  const intersection = [...wordsA].filter((w) => wordsB.has(w));
  const union = new Set([...wordsA, ...wordsB]);
  if (union.size === 0) return 0;
  return intersection.length / union.size;
}

/* ─── Fetch from API-Sports ─── */

async function apiFetch(
  sport: string,
  endpoint: string,
  params: Record<string, string>
): Promise<unknown> {
  const apiKey = process.env.API_SPORTS_KEY;
  if (!apiKey) {
    throw new Error("API_SPORTS_KEY not configured");
  }

  const baseUrl = SPORT_HOSTS[sport];
  if (!baseUrl) {
    throw new Error(`Unsupported sport: ${sport}`);
  }

  const url = new URL(endpoint, baseUrl);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: {
      "x-apisports-key": apiKey,
    },
  });

  if (!res.ok) {
    throw new Error(`API-Sports responded ${res.status}`);
  }

  return res.json();
}

/* ─── Type-specific handlers ─── */

async function handleStandings(
  sport: string,
  params: URLSearchParams
): Promise<unknown> {
  const league = params.get("league");
  const season = params.get("season");
  if (!league) {
    return { data: null, error: "league is required" };
  }

  // Try requested season first, then fall back to recent seasons (free plan limitation)
  const seasonsToTry = season
    ? [season, "2024", "2023", "2022"]
    : ["2024", "2023", "2022"];
  // Deduplicate
  const uniqueSeasons = [...new Set(seasonsToTry)];

  for (const s of uniqueSeasons) {
    const cacheKey = `standings:${sport}:${league}:${s}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
      const raw = (await apiFetch(sport, "/standings", {
        league,
        season: s,
      })) as { response?: Array<{ league?: { standings?: unknown[][] } }> };

      const standings = raw?.response?.[0]?.league?.standings?.[0] ?? null;

      if (standings && Array.isArray(standings) && standings.length > 0) {
        const result = { data: standings, season: s };
        setCache(cacheKey, result, CACHE_TTL.standings);
        return result;
      }
    } catch {
      // Try next season
    }
  }

  return { data: null };
}

async function handleH2H(
  sport: string,
  params: URLSearchParams
): Promise<unknown> {
  const team1Id = params.get("team1Id");
  const team2Id = params.get("team2Id");
  if (!team1Id || !team2Id) {
    return { data: null, error: "team1Id and team2Id are required" };
  }

  const cacheKey = `h2h:${sport}:${team1Id}:${team2Id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const raw = (await apiFetch(sport, "/fixtures/headtohead", {
      h2h: `${team1Id}-${team2Id}`,
      last: "10",
    })) as { response?: unknown[] };

    const result = { data: raw?.response ?? null };
    setCache(cacheKey, result, CACHE_TTL.h2h);
    return result;
  } catch {
    return { data: null };
  }
}

async function handleLineups(
  sport: string,
  params: URLSearchParams
): Promise<unknown> {
  const fixtureId = params.get("fixtureId");
  if (!fixtureId) {
    return { data: null, error: "fixtureId is required" };
  }

  const cacheKey = `lineups:${sport}:${fixtureId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const raw = (await apiFetch(sport, "/fixtures/lineups", {
      fixture: fixtureId,
    })) as { response?: unknown[] };

    const result = { data: raw?.response ?? null };
    setCache(cacheKey, result, CACHE_TTL.lineups);
    return result;
  } catch {
    return { data: null };
  }
}

async function handleFindFixture(
  sport: string,
  params: URLSearchParams
): Promise<unknown> {
  const team1 = params.get("team1");
  const team2 = params.get("team2");
  const date = params.get("date"); // YYYY-MM-DD

  if (!team1 || !team2) {
    return { data: null, error: "team1 and team2 are required" };
  }
  if (!date) {
    return { data: null, error: "date is required (YYYY-MM-DD)" };
  }

  const cacheKey = `find-fixture:${sport}:${normalize(team1)}:${normalize(team2)}:${date}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const raw = (await apiFetch(sport, "/fixtures", {
      date,
    })) as {
      response?: Array<{
        fixture: { id: number };
        league: { id: number; name: string; season: number };
        teams: {
          home: { id: number; name: string; logo: string };
          away: { id: number; name: string; logo: string };
        };
      }>;
    };

    const fixtures = raw?.response;
    if (!fixtures || fixtures.length === 0) {
      const result = { data: null };
      setCache(cacheKey, result, CACHE_TTL["find-fixture"]);
      return result;
    }

    let bestMatch: {
      fixtureId: number;
      score: number;
      homeTeam: { id: number; name: string; logo: string };
      awayTeam: { id: number; name: string; logo: string };
      league: { id: number; name: string; season: number };
    } | null = null;

    for (const fx of fixtures) {
      const homeName = fx.teams.home.name;
      const awayName = fx.teams.away.name;

      const score1 =
        (similarity(team1, homeName) + similarity(team2, awayName)) / 2;
      const score2 =
        (similarity(team1, awayName) + similarity(team2, homeName)) / 2;
      const score = Math.max(score1, score2);

      if (score > (bestMatch?.score ?? 0) && score >= 0.4) {
        bestMatch = {
          fixtureId: fx.fixture.id,
          score,
          homeTeam: fx.teams.home,
          awayTeam: fx.teams.away,
          league: fx.league,
        };
      }
    }

    const result = bestMatch
      ? {
          data: {
            fixtureId: bestMatch.fixtureId,
            confidence: bestMatch.score,
            homeTeam: bestMatch.homeTeam,
            awayTeam: bestMatch.awayTeam,
            league: bestMatch.league,
          },
        }
      : { data: null };

    setCache(cacheKey, result, CACHE_TTL["find-fixture"]);
    return result;
  } catch {
    return { data: null };
  }
}

/* ─── Route handler ─── */

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const sport = searchParams.get("sport") ?? "football";

  if (!type) {
    return Response.json(
      { data: null, error: "type parameter is required" },
      { status: 400 }
    );
  }

  if (!SPORT_HOSTS[sport]) {
    return Response.json(
      { data: null, error: `Unsupported sport: ${sport}` },
      { status: 400 }
    );
  }

  let result: unknown;

  switch (type) {
    case "standings":
      result = await handleStandings(sport, searchParams);
      break;
    case "h2h":
      result = await handleH2H(sport, searchParams);
      break;
    case "lineups":
      result = await handleLineups(sport, searchParams);
      break;
    case "find-fixture":
      result = await handleFindFixture(sport, searchParams);
      break;
    default:
      return Response.json(
        { data: null, error: `Unknown type: ${type}` },
        { status: 400 }
      );
  }

  const ttl = CACHE_TTL[type] ?? 60;

  return Response.json(result, {
    headers: {
      "Cache-Control": `public, s-maxage=${ttl}, stale-while-revalidate=${Math.floor(ttl / 5)}`,
    },
  });
}
