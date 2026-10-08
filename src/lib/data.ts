/**
 * Repository layer. Every page reads through these functions, never from the JSON directly,
 * so swapping the JSON source for Supabase/Postgres later only touches this file.
 */
import raw from "@/data/dataset.json";
import { toMinutes, gameStart } from "./time";
import type { Dataset, Game, Season, Opponent, Championship, Player, StandingRow, LeagueGame } from "./types";

const db = raw as unknown as Dataset;

const bySortDesc = (a: Season, b: Season) => b.sort_key - a.sort_key;
const gameKey = (g: { date: string; time: string }) => `${g.date} ${toMinutes(g.time).toString().padStart(4, "0")}`;

export { toMinutes, gameStart, liveStatus } from "./time";

// ---------- franchise / eras ----------
export const getFranchise = () => db.franchise;
export const getEras = () => db.eras;
export const getEra = (id: string) => db.eras.find((e) => e.id === id)!;
export const getMeta = () => db.meta;

// ---------- seasons ----------
export function getSeasons(opts: { era?: string; champions?: boolean; order?: "asc" | "desc" } = {}) {
  let list = [...db.seasons];
  if (opts.era) list = list.filter((s) => s.era_id === opts.era);
  if (opts.champions) list = list.filter((s) => s.champion);
  list.sort(bySortDesc);
  if (opts.order === "asc") list.reverse();
  return list;
}
export const getSeason = (slug: string) => db.seasons.find((s) => s.slug === slug) ?? null;
export const getGaps = () => db.gaps;
export const getCurrentSeason = () => getSeasons()[0];
export const seasonLabel = (s: Pick<Season, "session" | "year">) => `${s.session} ${s.year}`;
export function adjacentSeasons(slug: string) {
  const asc = getSeasons({ order: "asc" });
  const i = asc.findIndex((s) => s.slug === slug);
  return { prev: asc[i - 1] ?? null, next: asc[i + 1] ?? null };
}
export const getStandings = (seasonId: string): StandingRow[] =>
  db.standings.filter((r) => r.season_id === seasonId).sort((a, b) => a.place - b.place);

// ---------- games ----------
export function getGames(filter: { seasonId?: string; opponentId?: string; stage?: "regular" | "postseason" } = {}) {
  return db.games
    .filter((g) => (!filter.seasonId || g.season_id === filter.seasonId))
    .filter((g) => (!filter.opponentId || g.opponent_id === filter.opponentId))
    .filter((g) => (!filter.stage || g.stage === filter.stage))
    .sort((a, b) => gameKey(a).localeCompare(gameKey(b)));
}
export const getGame = (slug: string) => db.games.find((g) => g.slug === slug) ?? null;
export function getLeagueGames(seasonId: string): LeagueGame[] {
  return db.league_games.filter((g) => g.season_id === seasonId).sort((a, b) => gameKey(a).localeCompare(gameKey(b)));
}
export function sameNightGames(game: Game) {
  return db.league_games.filter((g) => g.season_id === game.season_id && g.date === game.date && g.status !== "postponed");
}
export function gameNeighbors(game: Game) {
  const list = getGames({ seasonId: game.season_id });
  const i = list.findIndex((g) => g.id === game.id);
  return { prev: list[i - 1] ?? null, next: list[i + 1] ?? null };
}

export function nextGame(now = new Date()) {
  return db.games
    .filter((g) => !g.result && gameStart(g).getTime() + 1000 * 60 * 70 > now.getTime())
    .sort((a, b) => gameStart(a).getTime() - gameStart(b).getTime())[0] ?? null;
}
/**
 * Games on the schedule without a result as of the data date. On the static site the
 * browser decides which of these is "next" / "tonight" / "under way" at view time.
 */
export function pendingGames() {
  const asOf = db.meta.data_as_of;
  return db.games
    .filter((g) => !g.result && g.status !== "postponed" && g.date >= asOf)
    .sort((a, b) => gameStart(a).getTime() - gameStart(b).getTime());
}
export function latestResult() {
  const done = db.games.filter((g) => g.result);
  return done.sort((a, b) => gameKey(b).localeCompare(gameKey(a)))[0] ?? null;
}
export function recentResults(n: number) {
  return db.games.filter((g) => g.result).sort((a, b) => gameKey(b).localeCompare(gameKey(a))).slice(0, n);
}

// ---------- opponents ----------
export const getOpponents = () => db.opponents;
export const getOpponent = (idOrSlug: string): Opponent | null => db.opponents.find((o) => o.id === idOrSlug || o.slug === idOrSlug) ?? null;
export const opponentName = (id: string) => getOpponent(id)?.canonical_name ?? id;

export interface Record3 { w: number; l: number; t: number; }
export const emptyRec = (): Record3 => ({ w: 0, l: 0, t: 0 });
export function tally(games: Game[]): Record3 {
  const r = emptyRec();
  for (const g of games) {
    if (g.result === "W") r.w++;
    else if (g.result === "L") r.l++;
    else if (g.result === "T") r.t++;
  }
  return r;
}
export const pct = (r: Record3) => (r.w + r.l + r.t ? (r.w + r.t / 2) / (r.w + r.l + r.t) : null);

export function headToHead(opponentId: string) {
  const games = getGames({ opponentId });
  const scored = games.filter((g) => g.status === "final");
  return {
    games,
    all: tally(games),
    regular: tally(games.filter((g) => g.stage === "regular")),
    postseason: tally(games.filter((g) => g.stage === "postseason")),
    runsFor: scored.reduce((a, g) => a + (g.team_score ?? 0), 0),
    runsAgainst: scored.reduce((a, g) => a + (g.opponent_score ?? 0), 0),
    scoredGames: scored.length,
    seasons: [...new Set(games.map((g) => g.season_id))],
    first: games[0] ?? null,
    last: [...games].reverse().find((g) => g.result) ?? null,
  };
}
export function opponentIndex() {
  return db.opponents
    .map((o) => ({ opponent: o, ...headToHead(o.id) }))
    .filter((o) => o.games.length > 0)
    .sort((a, b) => b.games.length - a.games.length || a.opponent.canonical_name.localeCompare(b.opponent.canonical_name));
}

// ---------- franchise totals (recorded seasons only) ----------
export function franchiseTotals(era?: string) {
  const seasons = getSeasons({ era });
  const ids = new Set(seasons.map((s) => s.id));
  const games = db.games.filter((g) => ids.has(g.season_id));
  const regular = seasons.reduce((r, s) => ({ w: r.w + s.regular_wins, l: r.l + s.regular_losses, t: r.t + s.regular_ties }), emptyRec());
  const postseason = tally(games.filter((g) => g.stage === "postseason"));
  // Seed-confirmed overall records that exceed the game log (none today) would be added here.
  return {
    seasons: seasons.length,
    regular,
    postseason,
    overall: { w: regular.w + postseason.w, l: regular.l + postseason.l, t: regular.t + postseason.t },
    championships: seasons.filter((s) => s.champion).length,
    undefeated: seasons.filter((s) => s.undefeated).length,
    playoffAppearances: seasons.filter((s) => s.postseason_wins !== null).length,
    titleGames: games.filter((g) => g.is_title_game && g.result).length,
  };
}

// ---------- championships ----------
export const getChampionships = (): Championship[] =>
  [...db.championships].sort((a, b) => getSeason(a.season_id)!.sort_key - getSeason(b.season_id)!.sort_key);
export const getChampionship = (slug: string) => db.championships.find((c) => c.slug === slug) ?? null;

// ---------- players ----------
export const getPlayers = (): Player[] => [...db.players].sort((a, b) => a.name.localeCompare(b.name));
export const getPlayer = (slug: string) => db.players.find((p) => p.slug === slug) ?? null;
export const getRoster = (seasonId: string) =>
  db.season_rosters.filter((r) => r.season_id === seasonId).map((r) => ({ ...r, player: getPlayer(r.player_slug)! }));
export const getPlayerSeasons = (slug: string) =>
  db.season_rosters.filter((r) => r.player_slug === slug).map((r) => ({ ...r, season: getSeason(r.season_id)! }));
export const getRosterNote = (seasonId: string) => db.roster_notes[seasonId] ?? null;
export const getPlateAppearances = () => db.plate_appearances;
export const getPlayerGameStats = () => db.player_game_stats;
export const getSeasonBatting = () => db.season_batting;
export const getSeasonLabel = (id: string) => { const s = getSeason(id); return s ? `${s.session} ${s.year}` : id; };

// ---------- evidence / admin ----------
export const getEvidence = (id: string) => db.source_evidence.find((e) => e.id === id) ?? null;
export const getAllEvidence = () => db.source_evidence;
export const getReviewQueue = () => db.review_queue;
export const getAllGames = () => db.games;
