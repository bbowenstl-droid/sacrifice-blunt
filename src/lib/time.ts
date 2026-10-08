/**
 * Time helpers with no dataset import, so client components can use them without
 * pulling the whole dataset into the browser bundle. The site is static (GitHub Pages),
 * so anything that depends on "now" is computed in the browser after load.
 */
export type LiveStatus = "final" | "final_result_only" | "scheduled" | "awaiting" | "unreported" | "postponed" | "in_progress";
type Timed = { date: string; time: string; status: string; result?: string | null };

export function toMinutes(t: string) {
  const m = t.match(/(\d+):(\d+) ([AP]M)/);
  if (!m) return 0;
  let h = Number(m[1]) % 12;
  if (m[3] === "PM") h += 12;
  return h * 60 + Number(m[2]);
}

/** Game times are local to Bridgeton, MO (America/Chicago). Returns an absolute Date. */
export function gameStart(g: { date: string; time: string }): Date {
  const [y, mo, d] = g.date.split("-").map(Number);
  const mins = toMinutes(g.time);
  // US DST: second Sunday of March → first Sunday of November
  const nthSunday = (month: number, n: number) => {
    const first = new Date(Date.UTC(y, month, 1)).getUTCDay();
    return 1 + ((7 - first) % 7) + (n - 1) * 7;
  };
  const dstStart = Date.UTC(y, 2, nthSunday(2, 2));
  const dstEnd = Date.UTC(y, 10, nthSunday(10, 1));
  const local = Date.UTC(y, mo - 1, d);
  const offset = local >= dstStart && local < dstEnd ? 5 : 6;
  return new Date(Date.UTC(y, mo - 1, d, Math.floor(mins / 60) + offset, mins % 60));
}

/** Effective status at a point in time: an unplayed game in the future is "scheduled". */
export function liveStatus(g: Timed, now = new Date()): LiveStatus {
  if (g.status === "final" || g.status === "final_result_only" || g.status === "postponed") return g.status;
  const start = gameStart(g).getTime();
  if (now.getTime() < start) return "scheduled";
  if (now.getTime() - start < 1000 * 60 * 70) return "in_progress";
  // Played (or should have been) but no result has been entered yet
  return now.getTime() - start < 1000 * 60 * 60 * 24 * 3 ? "awaiting" : "unreported";
}

export const sameChicagoDay = (a: Date, b: Date) =>
  a.toLocaleDateString("en-US", { timeZone: "America/Chicago" }) === b.toLocaleDateString("en-US", { timeZone: "America/Chicago" });
