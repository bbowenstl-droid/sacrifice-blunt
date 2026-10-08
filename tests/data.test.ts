import { describe, it, expect } from "vitest";
import { getSeasons, getChampionships, franchiseTotals, getSeason, getGames, getFranchise, getStandings } from "@/lib/data";
import { teamRecords, streaks } from "@/lib/records";
import { battingLine, finalize } from "@/lib/stats";
import type { Game, PlateAppearance } from "@/lib/types";

describe("franchise integrity (handoff acceptance criteria)", () => {
  it("counts six championships, including COTC Fall 2021 and leadership-confirmed Spring 2025", () => {
    const titles = getChampionships().map((c) => c.season_id);
    expect(titles).toEqual(["2021-fall", "2023-spring", "2023-summer", "2025-spring", "2025-fall", "2026-spring"]);
    expect(getFranchise().championship_count).toBe(6);
    expect(getSeason("2021-fall")!.team_name_at_time).toBe("COTC");
  });
  it("rolls COTC seasons into franchise totals", () => {
    const all = franchiseTotals();
    const cotc = franchiseTotals("cotc");
    const sb = franchiseTotals("sacrifice-blunt");
    expect(all.regular.w).toBe(cotc.regular.w + sb.regular.w);
    expect(all.regular.l).toBe(cotc.regular.l + sb.regular.l);
    expect(all.championships).toBe(6);
    expect(cotc.championships).toBe(1);
    expect(all.seasons).toBe(15);
  });
  it("matches every seed season record", () => {
    const expected: Record<string, [number, number, number]> = {
      "2019-fall": [1, 7, 5], "2021-spring": [3, 9, 4], "2021-summer": [7, 3, 3], "2021-fall": [6, 2, 2],
      "2022-fall": [6, 2, 2], "2023-spring": [9, 3, 2], "2023-summer": [9, 3, 1], "2023-fall": [4, 4, 3],
      "2024-spring": [6, 4, 3], "2025-spring": [6, 4, 2], "2025-summer": [1, 11, 6], "2025-fall": [5, 3, 3],
      "2026-spring": [12, 0, 1], "2026-summer": [6, 6, 4], "2026-fall": [1, 7, 5],
    };
    for (const [id, [w, l, p]] of Object.entries(expected)) {
      const s = getSeason(id)!;
      expect([s.regular_wins, s.regular_losses, s.regular_place]).toEqual([w, l, p]);
    }
  });
  it("shows Spring 2026 as 12-0 regular, 14-0 overall, with mixed confidence", () => {
    const s = getSeason("2026-spring")!;
    expect([s.regular_wins, s.regular_losses, s.overall_wins, s.overall_losses]).toEqual([12, 0, 14, 0]);
    expect(s.undefeated).toBe(true);
    expect(s.confidence).toBe("mixed_verified_and_confirmed");
  });
  it("never invents unknown values as zero", () => {
    const fall19 = getSeason("2019-fall")!; // playoff game listed, no result posted
    expect(fall19.postseason_wins).toBeNull();
    expect(fall19.overall_wins).toBeNull();
    expect(getSeason("2021-summer")!.runs_for).toBeNull(); // two unreported games
    for (const g of getGames()) if (!g.result) expect(g.team_score).toBeNull();
  });
  it("counts Spring 2025 after team leadership confirmed it, with its title game linked", () => {
    const s = getSeason("2025-spring")!;
    expect(s.champion).toBe(true);
    expect(s.title_under_review).toBe(false);
    const c = getChampionships().find((x) => x.season_id === "2025-spring")!;
    expect(c.title_game_id).toBe("2025-spring-cheers-1");
    expect(c.verification).toEqual(["teamsideline_playoff_results", "team_leadership"]);
    expect(s.confidence).toBe("verified");
    // Verified by leadership with TeamSideline as the documentary source; no invented confirmation date.
    expect(`${s.championship_note} ${s.postseason_note} ${s.source_notes}`).not.toMatch(/Oct(ober)? \d|2026-10-\d\d/);
  });
  it("matches the Fall 2026 standings in the handoff", () => {
    expect(getStandings("2026-fall").map((r) => `${r.team} ${r.w}-${r.l}`)).toEqual([
      "The Hard Hats 8-0", "Minimal Effort 5-3", "The Down Bad Boys 5-3", "Cheers 4-4", "Sacrifice Blunt 1-7", "Chester City 1-7",
    ]);
  });
  it("records the Fall 2026 season-ending playoff loss as leadership-reported", () => {
    const s = getSeason("2026-fall")!;
    expect([s.postseason_wins, s.postseason_losses, s.overall_wins, s.overall_losses]).toEqual([0, 1, 1, 8]);
    expect(s.playoff_finish).toBe("Lost in Round 1");
    const g = getGames({ seasonId: "2026-fall", stage: "postseason" });
    expect(g.map((x) => [x.result, x.team_score, x.opponent_score, x.confidence])).toEqual([["L", 9, 19, "confirmed"]]);
  });
  it("orders seasons newest first", () => {
    expect(getSeasons()[0].id).toBe("2026-fall");
  });
});

describe("records engine", () => {
  it("finds the longest win streak across consecutive sessions", () => {
    const s = streaks();
    expect(s.win.len).toBeGreaterThanOrEqual(14);
  });
  it("produces records only from data", () => {
    const r = teamRecords();
    expect(r.find((x) => x.id === "best-overall")!.value).toBe("14-0");
  });
});

describe("stats engine", () => {
  const g = (id: string): Game => ({ id, slug: id, season_id: "x", date: "2026-01-01", time: "6:30 PM", field: null, opponent_id: "o", home_away: "home", team_score: 1, opponent_score: 0, result: "W", status: "final", stage: "regular", week: 1, playoff_round: null, playoff_round_label: null, bracket_game: null, is_title_game: false, team_name_at_time: "Sacrifice Blunt", confidence: "verified", source_evidence_id: null, notes: [] });
  const pa = (game_id: string, pa_index: number, result: PlateAppearance["result"], rbi = 0, run_scored = false): PlateAppearance => ({ game_id, player_slug: "troy", pa_index, inning: 1, result, rbi, run_scored });
  it("computes slash line from plate appearances", () => {
    const pas = [pa("a", 1, "1B", 1, true), pa("a", 2, "HR", 2, true), pa("a", 3, "OUT"), pa("a", 4, "BB"), pa("b", 1, "2B"), pa("b", 2, "K")];
    const line = battingLine("troy", [g("a"), g("b")], pas, []);
    expect(line.g).toBe(2); expect(line.pa).toBe(6); expect(line.ab).toBe(5); expect(line.h).toBe(3);
    expect(line.tb).toBe(1 + 4 + 2); expect(line.rbi).toBe(3); expect(line.r).toBe(2);
    expect(line.avg).toBeCloseTo(0.6); expect(line.obp).toBeCloseTo(4 / 6); expect(line.slg).toBeCloseTo(7 / 5);
  });
  it("returns nulls (not zeros) when there is no data", () => {
    const line = finalize(null, 0);
    expect(line.avg).toBeNull(); expect(line.h).toBeNull(); expect(line.g).toBeNull();
  });
  it("keeps a category unknown if any contributing game did not capture it", () => {
    const line = battingLine("troy", [g("a"), g("b")], [], [
      { game_id: "a", player_slug: "troy", ab: 3, h: 2, "1b": 2, "2b": 0, "3b": 0, hr: 0, bb: 0 },
      { game_id: "b", player_slug: "troy", ab: 4, h: 1, bb: 1 },
    ]);
    expect(line.h).toBe(3); expect(line.ab).toBe(7); expect(line.hr).toBeNull(); expect(line.slg).toBeNull();
  });
});

describe("static site helpers", () => {
  it("knows when a game is upcoming, under way, or waiting on a result", async () => {
    const { liveStatus, gameStart } = await import("@/lib/time");
    const g = { date: "2026-10-07", time: "6:30 PM", status: "unreported", result: null };
    expect(gameStart(g).toISOString()).toBe("2026-10-07T23:30:00.000Z"); // 6:30 PM CDT
    expect(liveStatus(g, new Date("2026-10-07T21:00:00Z"))).toBe("scheduled");
    expect(liveStatus(g, new Date("2026-10-07T23:45:00Z"))).toBe("in_progress");
    expect(liveStatus(g, new Date("2026-10-08T03:00:00Z"))).toBe("awaiting");
    expect(gameStart({ date: "2026-01-10", time: "7:30 PM" }).toISOString()).toBe("2026-01-11T01:30:00.000Z"); // CST
  });
  it("prefixes public assets with the Pages base path", async () => {
    process.env.NEXT_PUBLIC_BASE_PATH = "/sacrifice-blunt";
    const { vi } = await import("vitest");
    vi.resetModules();
    const site = await import("@/lib/site");
    expect(site.asset("/brand/badge-64.png")).toBe("/sacrifice-blunt/brand/badge-64.png");
    expect(site.SITE_URL).toBe("https://bbowenstl-droid.github.io/sacrifice-blunt");
    delete process.env.NEXT_PUBLIC_BASE_PATH;
  });
});
