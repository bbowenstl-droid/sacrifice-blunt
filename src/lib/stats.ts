/**
 * Batting stats engine. Season and career numbers are computed from game-level rows
 * (plate appearances first, imported per-game aggregates second), falling back to
 * season totals from a stat export or graphic when a season has no game-level data. Anything that was not captured stays null and renders as "—".
 */
import type { Game, PAResult, PlateAppearance, PlayerGameStat, SeasonBatting } from "./types";

export const COUNTING = ["g", "pa", "ab", "r", "h", "1b", "2b", "3b", "hr", "rbi", "bb", "k", "sac", "roe", "tb", "xbh"] as const;
export type CountingKey = (typeof COUNTING)[number];
export type BattingLine = Record<CountingKey, number | null> & {
  avg: number | null; obp: number | null; slg: number | null; ops: number | null;
};

const HIT: PAResult[] = ["1B", "2B", "3B", "HR"];
const NOT_AB: PAResult[] = ["BB", "HBP", "SAC"];

export function lineFromPAs(pas: PlateAppearance[]): Partial<Record<CountingKey, number>> & { hbp: number } {
  const c = (r: PAResult) => pas.filter((p) => p.result === r).length;
  return {
    pa: pas.length,
    ab: pas.filter((p) => !NOT_AB.includes(p.result)).length,
    r: pas.filter((p) => p.run_scored).length,
    h: pas.filter((p) => HIT.includes(p.result)).length,
    "1b": c("1B"), "2b": c("2B"), "3b": c("3B"), hr: c("HR"),
    rbi: pas.reduce((a, p) => a + (p.rbi || 0), 0),
    bb: c("BB"), k: c("K"), sac: c("SAC"), roe: c("ROE"), hbp: c("HBP"),
  };
}

type Partial1 = Partial<Record<CountingKey, number>> & { hbp?: number };

function add(a: Partial1 | null, b: Partial1): Partial1 {
  if (!a) return { ...b };
  const out: Partial1 = { ...a };
  for (const k of [...COUNTING, "hbp"] as const) {
    const av = a[k as CountingKey]; const bv = b[k as CountingKey];
    // a category is only known if every contributing game captured it
    (out as Record<string, number | undefined>)[k] = av === undefined || bv === undefined ? undefined : av + bv;
  }
  return out;
}

export function finalize(sum: Partial1 | null, games: number): BattingLine {
  const v = (k: CountingKey) => (sum && sum[k] !== undefined ? (sum[k] as number) : null);
  const h = v("h"), ab = v("ab"), bb = v("bb"), sac = v("sac");
  const s1 = v("1b"), s2 = v("2b"), s3 = v("3b"), hr = v("hr");
  const tb = s1 !== null && s2 !== null && s3 !== null && hr !== null ? s1 + 2 * s2 + 3 * s3 + 4 * hr : null;
  const xbh = s2 !== null && s3 !== null && hr !== null ? s2 + s3 + hr : null;
  const hbp = sum?.hbp ?? 0;
  const avg = h !== null && ab ? h / ab : null;
  // Slow-pitch convention used here: OBP = (H+BB+HBP)/(AB+BB+HBP+SF); sacrifices are treated as SF.
  const obpDen = ab !== null && bb !== null ? ab + bb + hbp + (sac ?? 0) : null;
  const obp = h !== null && bb !== null && obpDen ? (h + bb + hbp) / obpDen : null;
  const slg = tb !== null && ab ? tb / ab : null;
  return {
    g: sum ? games : null,
    pa: v("pa"), ab, r: v("r"), h, "1b": s1, "2b": s2, "3b": s3, hr, rbi: v("rbi"), bb, k: v("k"), sac, roe: v("roe"),
    tb, xbh, avg, obp, slg, ops: obp !== null && slg !== null ? obp + slg : null,
  };
}

export interface StatFilter {
  seasonId?: string;
  year?: number;
  stage?: "regular" | "postseason";
  lastN?: number;
}

/** Per-game batting lines for one player, newest first. */
export function playerGameLines(slug: string, games: Game[], pas: PlateAppearance[], pgs: PlayerGameStat[], f: StatFilter = {}) {
  const pool = games
    .filter((g) => !f.seasonId || g.season_id === f.seasonId)
    .filter((g) => !f.year || g.date.startsWith(String(f.year)))
    .filter((g) => !f.stage || g.stage === f.stage)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const rows: { game: Game; line: Partial1 }[] = [];
  for (const g of pool) {
    const mine = pas.filter((p) => p.game_id === g.id && p.player_slug === slug);
    if (mine.length) { rows.push({ game: g, line: lineFromPAs(mine) }); continue; }
    const agg = pgs.find((p) => p.game_id === g.id && p.player_slug === slug);
    if (agg) {
      const { game_id: _g, player_slug: _p, ...rest } = agg;
      rows.push({ game: g, line: rest as Partial1 });
    }
  }
  return f.lastN ? rows.slice(0, f.lastN) : rows;
}

/** Fields a source must have captured for its numbers to count toward AVG/OBP/SLG/OPS. */
const BOX: CountingKey[] = ["ab", "h", "1b", "2b", "3b", "hr", "bb"];
type Part = { line: Partial1; g?: number; published?: SeasonBatting["published"] };

/**
 * Combines sources that captured different stats (e.g. full season exports plus a season
 * graphic that only printed R/RBI/HR). Counting stats add up across every source that
 * recorded them; rate stats and total bases use only sources with a full box line, so a
 * season without at-bats never distorts a career average.
 */
export function combineLines(parts: Part[]): BattingLine {
  if (!parts.length) return finalize(null, 0);
  const lenient: Partial1 = {};
  let g: number | null = null;
  for (const p of parts) {
    for (const k of [...COUNTING, "hbp"] as const) {
      const v = p.line[k as CountingKey];
      if (v !== undefined) (lenient as Record<string, number>)[k] = ((lenient as Record<string, number>)[k] ?? 0) + v;
    }
    if (p.g !== undefined) g = (g ?? 0) + p.g;
  }
  let box: Partial1 | null = null;
  for (const p of parts.filter((x) => BOX.every((k) => x.line[k] !== undefined))) box = add(box, p.line);
  const fromBox = finalize(box, 0);
  const num = (k: CountingKey) => (lenient[k] !== undefined ? (lenient[k] as number) : null);
  const out: BattingLine = {
    g, pa: num("pa"), ab: num("ab"), r: num("r"), h: num("h"), "1b": num("1b"), "2b": num("2b"), "3b": num("3b"),
    hr: num("hr"), rbi: num("rbi"), bb: num("bb"), k: num("k"), sac: num("sac"), roe: num("roe"),
    tb: fromBox.tb, xbh: fromBox.xbh, avg: fromBox.avg, obp: fromBox.obp, slg: fromBox.slg, ops: fromBox.ops,
  };
  // Nothing with at-bats: fall back to the rates the source printed, but only for a single source.
  const pub = parts.filter((p) => p.published);
  if (!box && parts.length === 1 && pub.length === 1) {
    const r = pub[0].published!;
    out.avg = r.avg ?? null; out.obp = r.obp ?? null; out.slg = r.slg ?? null; out.ops = r.ops ?? null;
  }
  return out;
}

export function battingLine(
  slug: string, games: Game[], pas: PlateAppearance[], pgs: PlayerGameStat[], f: StatFilter = {}, seasonStats: SeasonBatting[] = [],
): BattingLine {
  const rows = playerGameLines(slug, games, pas, pgs, f);
  let sum: Partial1 | null = null;
  for (const r of rows) sum = add(sum, r.line);
  // Season totals can't be split by stage or by game, and game-level rows for a season replace them.
  const covered = new Set(rows.map((r) => r.game.season_id));
  const aggs = f.stage || f.lastN ? [] : seasonStats.filter((s) =>
    s.player_slug === slug && !covered.has(s.season_id) &&
    (!f.seasonId || s.season_id === f.seasonId) && (!f.year || s.season_id.startsWith(`${f.year}-`)));
  if (!aggs.length) return finalize(sum, rows.length);
  const parts: Part[] = sum ? [{ line: sum, g: rows.length }] : [];
  for (const a of aggs) {
    const { season_id: _s, player_slug: _p, g, published, source: _src, ...line } = a;
    parts.push({ line: line as Partial1, g, published });
  }
  return combineLines(parts);
}

/** True when any stat at all is known for this line. */
export const hasBatting = (l: BattingLine) => Object.values(l).some((v) => v !== null);

/** Seasons whose source had no at-bats, so they add to R/RBI/HR but not to the averages. */
export function countingOnlySeasons(slug: string, seasonStats: SeasonBatting[]) {
  return seasonStats.filter((s) => s.player_slug === slug && (s.ab === undefined || s.h === undefined)).map((s) => s.season_id);
}

export const fmtRate = (n: number | null) => (n === null ? "—" : n >= 1 ? n.toFixed(3) : n.toFixed(3).replace(/^0/, ""));
export const fmtCount = (n: number | null) => (n === null ? "—" : String(n));
