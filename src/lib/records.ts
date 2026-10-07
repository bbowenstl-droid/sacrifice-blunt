/**
 * Team records engine — computed from the game log every build, so new games
 * automatically update the book. Only scored games count toward score-based records.
 */
import { getAllGames, getSeasons, getGaps, getSeason, opponentName, getMeta, toMinutes } from "./data";
import type { Game, Season } from "./types";

export interface RecordEntry {
  id: string;
  group: "Single game" | "Season" | "Streaks" | "Franchise";
  label: string;
  value: string;
  detail: string;
  href?: string;
  holders?: { label: string; href: string }[];
  scopeNote?: string;
}

const scored = () => getAllGames().filter((g) => g.status === "final");
const gLabel = (g: Game) => {
  const s = getSeason(g.season_id)!;
  return `${g.result} ${g.team_score}-${g.opponent_score} ${g.home_away === "home" ? "vs" : "at"} ${opponentName(g.opponent_id)} · ${s.session} ${s.year}`;
};
const href = (g: Game) => `/games/${g.slug}`;

function topBy(games: Game[], score: (g: Game) => number, id: string, group: RecordEntry["group"], label: string, unit = "") {
  if (!games.length) return null;
  const best = Math.max(...games.map(score));
  const holders = games.filter((g) => score(g) === best);
  return {
    id, group, label,
    value: `${best}${unit}`,
    detail: holders.length === 1 ? gLabel(holders[0]) : `${holders.length} games tied`,
    href: holders.length === 1 ? href(holders[0]) : undefined,
    holders: holders.map((g) => ({ label: gLabel(g), href: href(g) })),
  } satisfies RecordEntry;
}

/** Win streaks. A streak is broken by a loss, an unreported game, or a missing session between two recorded ones. */
export function streaks() {
  const seasons = getSeasons({ order: "asc" });
  const gaps = getGaps();
  const hasGapBetween = (a: Season, b: Season) => gaps.some((x) => x.sort_key > a.sort_key && x.sort_key < b.sort_key);
  const games = getAllGames().filter((g) => g.status !== "scheduled");
  const asOf = getMeta().data_as_of;
  const ordered = seasons.flatMap((s) => games.filter((g) => g.season_id === s.id && (g.result || g.date < asOf))
    .sort((a, b) => a.date.localeCompare(b.date) || toMinutes(a.time) - toMinutes(b.time)));
  let best = { len: 0, start: null as Game | null, end: null as Game | null };
  let bestL = { len: 0, start: null as Game | null, end: null as Game | null };
  let curW = 0, curL = 0, startW: Game | null = null, startL: Game | null = null;
  let prevSeason: Season | null = null;
  for (const g of ordered) {
    const s = getSeason(g.season_id)!;
    if (prevSeason && prevSeason.id !== s.id && hasGapBetween(prevSeason, s)) { curW = 0; curL = 0; }
    prevSeason = s;
    if (g.result === "W") {
      if (curW === 0) startW = g;
      curW++; curL = 0;
      if (curW > best.len) best = { len: curW, start: startW, end: g };
    } else if (g.result === "L") {
      if (curL === 0) startL = g;
      curL++; curW = 0;
      if (curL > bestL.len) bestL = { len: curL, start: startL, end: g };
    } else { curW = 0; curL = 0; }
  }
  return { win: best, loss: bestL };
}

export function teamRecords(): RecordEntry[] {
  const all = scored();
  const wins = all.filter((g) => g.result === "W");
  const losses = all.filter((g) => g.result === "L");
  const out: (RecordEntry | null)[] = [
    topBy(all, (g) => g.team_score!, "most-runs", "Single game", "Most runs scored"),
    topBy(wins, (g) => g.team_score! - g.opponent_score!, "largest-win", "Single game", "Largest margin of victory", " runs"),
    topBy(all, (g) => g.team_score! + g.opponent_score!, "highest-combined", "Single game", "Highest-scoring game (combined)", " runs"),
    topBy(losses, (g) => g.team_score!, "most-runs-loss", "Single game", "Most runs scored in a loss"),
    topBy(wins.filter((g) => g.stage === "postseason"), (g) => g.team_score! - g.opponent_score!, "largest-playoff-win", "Single game", "Largest postseason margin", " runs"),
  ];

  // Season records (regular season, from seed records; runs only where every game is scored)
  const seasons = getSeasons();
  const bestPct = Math.max(...seasons.map((s) => s.regular_wins / (s.regular_wins + s.regular_losses + s.regular_ties)));
  const bestPctSeasons = seasons.filter((s) => s.regular_wins / (s.regular_wins + s.regular_losses + s.regular_ties) === bestPct);
  out.push({
    id: "best-regular", group: "Season", label: "Best regular season",
    value: bestPctSeasons.map((s) => `${s.regular_wins}-${s.regular_losses}`).join(", "),
    detail: bestPctSeasons.map((s) => `${s.session} ${s.year}`).join(", "),
    holders: bestPctSeasons.map((s) => ({ label: `${s.session} ${s.year}`, href: `/seasons/${s.slug}` })),
    href: bestPctSeasons.length === 1 ? `/seasons/${bestPctSeasons[0].slug}` : undefined,
  });
  const withOverall = seasons.filter((s) => s.overall_wins !== null);
  const mostWins = Math.max(...withOverall.map((s) => s.overall_wins!));
  const mw = withOverall.filter((s) => s.overall_wins === mostWins);
  out.push({
    id: "best-overall", group: "Season", label: "Best overall record (incl. postseason)",
    value: mw.map((s) => `${s.overall_wins}-${s.overall_losses}`).join(", "),
    detail: mw.map((s) => `${s.session} ${s.year}${s.undefeated ? " · undefeated" : ""}`).join(", "),
    href: mw.length === 1 ? `/seasons/${mw[0].slug}` : undefined,
  });
  const runSeasons = seasons.filter((s) => s.runs_for !== null);
  const perGame = (s: Season) => s.runs_for! / (s.regular_wins + s.regular_losses + s.regular_ties);
  const bestRpg = runSeasons.reduce((a, s) => (perGame(s) > perGame(a) ? s : a), runSeasons[0]);
  out.push({
    id: "most-runs-season", group: "Season", label: "Most runs, regular season",
    value: String(Math.max(...runSeasons.map((s) => s.runs_for!))),
    detail: runSeasons.filter((s) => s.runs_for === Math.max(...runSeasons.map((x) => x.runs_for!))).map((s) => `${s.session} ${s.year}`).join(", "),
    href: `/seasons/${runSeasons.find((s) => s.runs_for === Math.max(...runSeasons.map((x) => x.runs_for!)))!.slug}`,
    scopeNote: "Seasons where every regular-season game has a posted score.",
  });
  out.push({
    id: "best-run-diff", group: "Season", label: "Best run differential, regular season",
    value: (() => { const b = runSeasons.reduce((a, s) => (s.runs_for! - s.runs_against! > a.runs_for! - a.runs_against! ? s : a)); return `+${b.runs_for! - b.runs_against!}`; })(),
    detail: (() => { const b = runSeasons.reduce((a, s) => (s.runs_for! - s.runs_against! > a.runs_for! - a.runs_against! ? s : a)); return `${b.session} ${b.year} (${b.runs_for}-${b.runs_against})`; })(),
    href: (() => { const b = runSeasons.reduce((a, s) => (s.runs_for! - s.runs_against! > a.runs_for! - a.runs_against! ? s : a)); return `/seasons/${b.slug}`; })(),
  });
  out.push({
    id: "best-rpg", group: "Season", label: "Most runs per game, regular season",
    value: perGame(bestRpg).toFixed(1),
    detail: `${bestRpg.session} ${bestRpg.year}`,
    href: `/seasons/${bestRpg.slug}`,
  });

  const st = streaks();
  if (st.win.start && st.win.end) {
    const a = getSeason(st.win.start.season_id)!, b = getSeason(st.win.end.season_id)!;
    out.push({
      id: "win-streak", group: "Streaks", label: "Longest winning streak",
      value: `${st.win.len} games`,
      detail: `${fmtShort(st.win.start.date)} (${a.session} ${a.year}) → ${fmtShort(st.win.end.date)} (${b.session} ${b.year})`,
      href: `/games/${st.win.start.slug}`,
      scopeNote: "Counts across consecutive recorded sessions, including postseason games and wins recorded without a score.",
    });
  }
  return out.filter(Boolean) as RecordEntry[];
}

function fmtShort(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
