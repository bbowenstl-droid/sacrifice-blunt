// Types mirror supabase/migrations/0001_init.sql. Nullable = unknown, never zero.

export type Confidence =
  | "verified"
  | "confirmed"
  | "partial"
  | "unknown"
  | "verified_regular_season_only"
  | "mixed_verified_and_confirmed";

export interface Franchise {
  id: string;
  current_name: string;
  original_name: string;
  earliest_verified_season_id: string;
  home_complex: string;
  coach_listed_on_teamsideline: string;
  notes: string;
  championship_count: number;
}

export interface Era {
  id: "cotc" | "sacrifice-blunt";
  name: string;
  display_name: string;
  first_season_id: string;
  last_season_id: string | null;
  start_note: string | null;
  end_note: string | null;
  logo_treatment: string;
  notes: string;
}

export interface Season {
  id: string;
  slug: string;
  year: number;
  session: string;
  sort_key: number;
  era_id: Era["id"];
  team_name_at_time: string;
  league: string;
  division: string;
  league_size: number | null;
  regular_wins: number;
  regular_losses: number;
  regular_ties: number;
  regular_place: number | null;
  regular_streak_end: string | null;
  postseason_wins: number | null;
  postseason_losses: number | null;
  overall_wins: number | null;
  overall_losses: number | null;
  overall_ties: number | null;
  overall_source: "seed" | "derived_from_games" | null;
  runs_for: number | null;
  runs_against: number | null;
  run_totals_note: string | null;
  regular_games_listed: number;
  playoff_finish: string | null;
  playoff_finish_code: string | null;
  playoff_status_note: string | null;
  champion: boolean;
  title_under_review: boolean;
  undefeated: boolean;
  confidence: Confidence;
  regular_confidence: Confidence;
  postseason_confidence: Confidence;
  championship_note: string | null;
  postseason_note: string | null;
  regular_season_note: string | null;
  source_notes: string;
  source_evidence_ids: string[];
  schedule_revision: string | null;
  playoff_revision: string | null;
}

export interface SeasonGap {
  year: number;
  session: string;
  sort_key: number;
  note: string;
}

export interface StandingRow {
  season_id: string;
  place: number;
  team: string;
  is_franchise: boolean;
  opponent_id: string | null;
  w: number;
  l: number;
  t: number;
  gb: string;
  gp: number;
  pct: number;
  streak: string;
  coach: string;
}

export interface Opponent {
  id: string;
  slug: string;
  canonical_name: string;
  aliases: string[];
}

export type GameStatus = "final" | "final_result_only" | "unreported" | "scheduled" | "postponed" | "in_progress";

export interface Game {
  id: string;
  slug: string;
  season_id: string;
  date: string;
  time: string;
  field: string | null;
  opponent_id: string;
  home_away: "home" | "away";
  team_score: number | null;
  opponent_score: number | null;
  result: "W" | "L" | "T" | null;
  status: GameStatus;
  stage: "regular" | "postseason";
  week: number | null;
  playoff_round: number | null;
  playoff_round_label: string | null;
  bracket_game: string | null;
  is_title_game: boolean;
  team_name_at_time: string;
  confidence: Confidence;
  source_evidence_id: string | null;
  notes: string[];
}

export interface LeagueGame {
  season_id: string;
  date: string;
  time: string;
  field: string | null;
  stage: "regular" | "postseason";
  week: number | null;
  round: number | null;
  round_label: string | null;
  bracket_game: string | null;
  away: string;
  home: string;
  away_score: number | null;
  home_score: number | null;
  away_result: string | null;
  home_result: string | null;
  status: GameStatus;
  notes: string[];
}

export interface Championship {
  id: string;
  slug: string;
  season_id: string;
  title: string;
  team_name_at_time: string;
  confidence: Confidence;
  verification: ("teamsideline_playoff_results" | "championship_plaque" | "team_leadership")[];
  undefeated: boolean;
  title_game_id: string | null;
  postseason_game_ids: string[];
  evidence_image: string | null;
  notes: string | null;
}

export interface Player {
  slug: string;
  name: string;
  short_name: string;
  number: string | null;
  positions: string[];
  active: boolean;
  photo: string | null;
  bio: string | null;
  confidence: Confidence;
  source: string;
  /** Fill-in player, listed apart from the regular roster. */
  sub?: boolean;
}

export interface RosterEntry {
  season_id: string;
  player_slug: string;
  number: string | null;
  positions: string[];
  confidence: Confidence;
}

export type PAResult = "1B" | "2B" | "3B" | "HR" | "BB" | "HBP" | "K" | "OUT" | "SAC" | "ROE" | "FC";

export interface PlateAppearance {
  game_id: string;
  player_slug: string;
  pa_index: number;
  inning: number | null;
  result: PAResult;
  rbi: number;
  run_scored: boolean;
  notes?: string | null;
}

export interface SeasonBatting {
  season_id: string;
  player_slug: string;
  g?: number; pa?: number; ab?: number; r?: number; h?: number;
  "1b"?: number; "2b"?: number; "3b"?: number; hr?: number;
  rbi?: number; bb?: number; k?: number; sac?: number; roe?: number;
  /** Rates printed by the source; only used when AB/H were not captured. */
  published?: { avg?: number; obp?: number; slg?: number; ops?: number };
  source: string;
}

export interface PlayerGameStat {
  game_id: string;
  player_slug: string;
  pa?: number; ab?: number; r?: number; h?: number;
  "1b"?: number; "2b"?: number; "3b"?: number; hr?: number;
  rbi?: number; bb?: number; k?: number; sac?: number; roe?: number;
}

export interface SourceEvidence {
  id: string;
  kind: "teamsideline_export" | "physical_plaque" | "leadership_confirmation";
  title: string;
  file: string | null;
  public_url: string | null;
  coverage: string;
  confidence: Confidence;
}

export interface ReviewItem {
  id: string;
  entity: string;
  entity_id: string | null;
  severity: "info" | "decision" | "error";
  message: string;
}

export interface Dataset {
  meta: { built_at: string; data_as_of: string; sources: string[] };
  franchise: Franchise;
  eras: Era[];
  seasons: Season[];
  gaps: SeasonGap[];
  standings: StandingRow[];
  opponents: Opponent[];
  games: Game[];
  league_games: LeagueGame[];
  championships: Championship[];
  players: Player[];
  season_rosters: RosterEntry[];
  roster_notes: Record<string, string>;
  plate_appearances: PlateAppearance[];
  player_game_stats: PlayerGameStat[];
  season_batting: SeasonBatting[];
  awards: unknown[];
  milestones: unknown[];
  media: unknown[];
  source_evidence: SourceEvidence[];
  review_queue: ReviewItem[];
}
