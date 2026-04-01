export interface BracketTeam {
  id: string;
  name: string;
  logo?: string;
  seed?: number;
}

export interface BracketMatch {
  id: string;
  roundIndex: number;
  matchIndex: number;
  scheduledAt: string;
  team1: BracketTeam | null;
  team2: BracketTeam | null;
  score1: number | null;
  score2: number | null;
  winnerId: string | null;
  status: "upcoming" | "live" | "completed";
}

export interface BracketRound {
  name: string;
  matches: BracketMatch[];
}

export interface BracketData {
  id: string;
  title: string;
  teamCount: 4 | 8 | 16;
  rounds: BracketRound[];
}
