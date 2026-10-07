/**
 * Batting stats engine. Season and career numbers are always computed from
 * game-level rows (plate appearances first, imported per-game aggregates second),
 * never stored as totals. Anything that was not captured stays null and renders as "—".
 */
import type { Game, PAResult, PlateAppearance, PlayerGameStat } from "./types";

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

export function battingLine(slug: string, games: Game[], pas: PlateAppearance[], pgs: PlayerGameStat[], f: StatFilter = {}): BattingLine {
  const rows = playerGameLines(slug, games, pas, pgs, f);
  let sum: Partial1 | null = null;
  for (const r of rows) sum = add(sum, r.line);
  return finalize(sum, rows.length);
}

export const fmtRate = (n: number | null) => (n === null ? "—" : n >= 1 ? n.toFixed(3) : n.toFixed(3).replace(/^0/, ""));
export const fmtCount = (n: number | null) => (n === null ? "—" : String(n));
