import type { Confidence } from "./types";

const toUTC = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
};
export const fmtDate = (d: string, opts: { year?: boolean; weekday?: boolean } = {}) =>
  toUTC(d).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    ...(opts.year ? { year: "numeric" } : {}),
    ...(opts.weekday ? { weekday: "short" } : {}),
  });
export const fmtLongDate = (d: string) =>
  toUTC(d).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric" });

export const rec = (w: number | null, l: number | null, t?: number | null) =>
  w === null || l === null ? "—" : t ? `${w}-${l}-${t}` : `${w}-${l}`;
export const fmtPct = (p: number | null) => (p === null ? "—" : p === 1 ? "1.000" : p.toFixed(3).replace(/^0/, ""));
export const ordinal = (n: number | null) => {
  if (n === null) return "—";
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
export const dash = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : String(v));

export const CONFIDENCE: Record<Confidence, { label: string; short: string; tone: "gold" | "chalk" | "mute" | "warn"; help: string }> = {
  verified: { label: "Verified", short: "Verified", tone: "chalk", help: "Backed by an official record (TeamSideline, plaque or trophy)." },
  confirmed: { label: "Confirmed by team leadership", short: "Confirmed", tone: "chalk", help: "Confirmed directly by team leadership." },
  verified_regular_season_only: { label: "Regular season verified", short: "Reg. season verified", tone: "chalk", help: "Regular season is backed by TeamSideline; postseason detail is handled separately." },
  mixed_verified_and_confirmed: { label: "Verified + confirmed", short: "Verified + confirmed", tone: "chalk", help: "Part of this is backed by official records and part is confirmed by team leadership." },
  partial: { label: "Partial", short: "Partial", tone: "warn", help: "Known to have happened, but the record is incomplete." },
  unknown: { label: "Not established", short: "Unknown", tone: "mute", help: "No record has been supplied yet." },
};

export const VERIFICATION_LABEL: Record<string, string> = {
  teamsideline_playoff_results: "TeamSideline playoff results",
  championship_plaque: "Championship plaque",
  team_leadership: "Team leadership",
};
