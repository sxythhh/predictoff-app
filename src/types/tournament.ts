export type TournamentFormat = "profit" | "pickem";
export type TournamentEntryType = "free" | "paid";
export type TournamentStatus = "draft" | "open" | "active" | "scoring" | "completed" | "cancelled";
export type TournamentScope = "open" | "curated";
export type TournamentVisibility = "public" | "unlisted" | "private";
export type ScoringMethod = "profit" | "roi" | "points";

export interface TournamentUser {
  id: string;
  walletAddress: string;
  displayName: string | null;
  avatar: string | null;
}

export interface Tournament {
  id: string;
  title: string;
  description: string | null;
  format: TournamentFormat;
  entryType: TournamentEntryType;
  entryFee: number | null;
  currency: string | null;
  prizePool: number;
  prizeStructure: Record<string, number> | null;
  maxParticipants: number | null;
  minParticipants: number;
  scoringMethod: ScoringMethod;
  scope: TournamentScope;
  allowedGameIds: string[] | null;
  allowedSports: string[] | null;
  registrationStart: number;
  registrationEnd: number;
  startsAt: number;
  endsAt: number;
  status: TournamentStatus;
  visibility: TournamentVisibility;
  inviteCode: string | null;
  participantCount: number;
  gameCount?: number;
  creator: TournamentUser;
  createdAt: string;
}

export interface TournamentListItem {
  id: string;
  title: string;
  description: string | null;
  format: TournamentFormat;
  entryType: TournamentEntryType;
  entryFee: number | null;
  currency: string | null;
  prizePool: number;
  scoringMethod: ScoringMethod;
  scope: TournamentScope;
  registrationStart: number;
  registrationEnd: number;
  startsAt: number;
  endsAt: number;
  status: TournamentStatus;
  participantCount: number;
  maxParticipants: number | null;
  creator: TournamentUser;
  createdAt: string;
}

export interface TournamentEntry {
  id: string;
  rank: number | null;
  score: number;
  totalStaked: number;
  totalPayout: number;
  correctPicks: number;
  totalPicks: number;
  prizeAmount: number | null;
  user: TournamentUser;
  joinedAt: string;
}

export interface TournamentGame {
  id: string;
  gameId: string;
  gameTitle: string | null;
  sportName: string | null;
  leagueName: string | null;
  startsAt: number;
  resolved: boolean;
  totalPicks: number;
  metadata: Record<string, any> | null;
}

export interface TournamentPick {
  id: string;
  tournamentGameId: string;
  conditionId: string;
  outcomeId: string;
  marketName: string | null;
  selectionName: string | null;
  isCorrect: boolean | null;
  pointsAwarded: number;
  game: {
    gameId: string;
    gameTitle: string | null;
    startsAt: number;
    resolved: boolean;
  };
}

export interface MyEntry {
  id: string;
  score: number;
  rank: number | null;
  totalStaked: number;
  totalPayout: number;
  correctPicks: number;
  totalPicks: number;
  prizeAmount: number | null;
  picks: TournamentPick[];
  betSnapshots: Array<{
    tokenId: string;
    gameId: string;
    amount: number;
    possibleWin: number;
    odds: number;
    isWin: boolean | null;
    isLose: boolean | null;
    payout: number | null;
    outcomes: any;
  }>;
}
