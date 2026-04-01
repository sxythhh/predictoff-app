import type { BracketData, BracketTeam } from "@/types/bracket";

const teams: BracketTeam[] = [
  { id: "t1", name: "Na'Vi", seed: 1 },
  { id: "t2", name: "G2", seed: 16 },
  { id: "t3", name: "Heroic", seed: 8 },
  { id: "t4", name: "Team Liquid", seed: 9 },
  { id: "t5", name: "Faze Clan", seed: 4 },
  { id: "t6", name: "Astralis", seed: 13 },
  { id: "t7", name: "Complexity", seed: 5 },
  { id: "t8", name: "Team Vitality", seed: 12 },
  { id: "t9", name: "Evil Geniuses", seed: 2 },
  { id: "t10", name: "OG", seed: 15 },
  { id: "t11", name: "NIP", seed: 7 },
  { id: "t12", name: "Big Clan", seed: 10 },
  { id: "t13", name: "Fnatic", seed: 3 },
  { id: "t14", name: "KOI", seed: 14 },
  { id: "t15", name: "Team BDS", seed: 6 },
  { id: "t16", name: "Gen.G Esports", seed: 11 },
];

export const mockBracket: BracketData = {
  id: "bracket-major-2026",
  title: "CS Major 2026",
  teamCount: 16,
  rounds: [
    {
      name: "Round of 16",
      matches: [
        { id: "r1-1", roundIndex: 0, matchIndex: 0, scheduledAt: "2026-03-17T18:30:00Z", team1: teams[0], team2: teams[1], score1: 2, score2: 0, winnerId: "t1", status: "completed" },
        { id: "r1-2", roundIndex: 0, matchIndex: 1, scheduledAt: "2026-03-17T18:30:00Z", team1: teams[2], team2: teams[3], score1: 1, score2: 2, winnerId: "t4", status: "completed" },
        { id: "r1-3", roundIndex: 0, matchIndex: 2, scheduledAt: "2026-03-17T18:30:00Z", team1: teams[4], team2: teams[5], score1: 2, score2: 1, winnerId: "t5", status: "completed" },
        { id: "r1-4", roundIndex: 0, matchIndex: 3, scheduledAt: "2026-03-17T18:30:00Z", team1: teams[6], team2: teams[7], score1: 0, score2: 2, winnerId: "t8", status: "completed" },
        { id: "r1-5", roundIndex: 0, matchIndex: 4, scheduledAt: "2026-03-17T18:30:00Z", team1: teams[8], team2: teams[9], score1: 2, score2: 0, winnerId: "t9", status: "completed" },
        { id: "r1-6", roundIndex: 0, matchIndex: 5, scheduledAt: "2026-03-17T18:30:00Z", team1: teams[10], team2: teams[11], score1: 0, score2: 2, winnerId: "t12", status: "completed" },
        { id: "r1-7", roundIndex: 0, matchIndex: 6, scheduledAt: "2026-03-17T18:30:00Z", team1: teams[12], team2: teams[13], score1: 2, score2: 0, winnerId: "t13", status: "completed" },
        { id: "r1-8", roundIndex: 0, matchIndex: 7, scheduledAt: "2026-03-17T18:30:00Z", team1: teams[14], team2: teams[15], score1: 1, score2: 2, winnerId: "t16", status: "completed" },
      ],
    },
    {
      name: "Quarter Finals",
      matches: [
        { id: "qf-1", roundIndex: 1, matchIndex: 0, scheduledAt: "2026-03-20T18:30:00Z", team1: teams[0], team2: teams[3], score1: 2, score2: 1, winnerId: "t1", status: "completed" },
        { id: "qf-2", roundIndex: 1, matchIndex: 1, scheduledAt: "2026-03-20T18:30:00Z", team1: teams[4], team2: teams[7], score1: 0, score2: 2, winnerId: "t8", status: "completed" },
        { id: "qf-3", roundIndex: 1, matchIndex: 2, scheduledAt: "2026-03-21T18:30:00Z", team1: teams[8], team2: teams[11], score1: 2, score2: 0, winnerId: "t9", status: "completed" },
        { id: "qf-4", roundIndex: 1, matchIndex: 3, scheduledAt: "2026-03-21T18:30:00Z", team1: teams[12], team2: teams[15], score1: 2, score2: 1, winnerId: "t13", status: "completed" },
      ],
    },
    {
      name: "Semi Finals",
      matches: [
        { id: "sf-1", roundIndex: 2, matchIndex: 0, scheduledAt: "2026-03-24T20:00:00Z", team1: teams[0], team2: teams[7], score1: 0, score2: 0, winnerId: null, status: "upcoming" },
        { id: "sf-2", roundIndex: 2, matchIndex: 1, scheduledAt: "2026-03-24T20:00:00Z", team1: teams[8], team2: teams[12], score1: 0, score2: 0, winnerId: null, status: "upcoming" },
      ],
    },
    {
      name: "Grand Final",
      matches: [
        { id: "gf-1", roundIndex: 3, matchIndex: 0, scheduledAt: "2026-03-28T20:00:00Z", team1: null, team2: null, score1: null, score2: null, winnerId: null, status: "upcoming" },
      ],
    },
  ],
};
