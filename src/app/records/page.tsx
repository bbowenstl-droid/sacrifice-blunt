import type { Metadata } from "next";
import Link from "next/link";
import { teamRecords } from "@/lib/records";
import { getSeasons, franchiseTotals, getPlayers, getAllGames, getPlateAppearances, getPlayerGameStats, getSeasonBatting, tally, getChampionships, getSeason } from "@/lib/data";
import { battingLine, fmtRate, hasBatting, type BattingLine } from "@/lib/stats";
import { rec, fmtPct, ordinal } from "@/lib/format";
import { Container, PageHeader, SectionTitle, Empty } from "@/components/ui";

export const metadata: Metadata = { title: "Record Book", description: "Sacrifice Blunt team and individual records, computed from every recorded game." };

const LEADER_CATS: { key: keyof BattingLine; label: string; rate?: boolean; minPA?: number }[] = [
  { key: "h", label: "Hits" }, { key: "hr", label: "Home runs" }, { key: "rbi", label: "RBI" }, { key: "r", label: "Runs" },
  { key: "avg", label: "Batting average", rate: true, minPA: 30 }, { key: "ops", label: "OPS", rate: true, minPA: 30 },
];

export default function RecordsPage() {
  const records = teamRecords();
  const groups = ["Franchise", "Season", "Single game", "Streaks"] as const;
  const t = franchiseTotals();
  const seasons = getSeasons();
  const ranked = [...seasons].sort((a, b) => b.regular_wins / (b.regular_wins + b.regular_losses) - a.regular_wins / (a.regular_wins + a.regular_losses) || b.regular_wins - a.regular_wins);
  const titleRound = tally(getAllGames().filter((g) => g.is_title_game));

  const games = getAllGames(), pas = getPlateAppearances(), pgs = getPlayerGameStats(), sb = getSeasonBatting();
  const lines = getPlayers().map((p) => ({ p, line: battingLine(p.slug, games, pas, pgs, {}, sb) })).filter((x) => hasBatting(x.line));

  const franchise = [
    { label: "Championships", value: String(t.championships), detail: getChampionships().map((c) => { const x = getSeason(c.season_id)!; return `${x.session} ${x.year}${x.team_name_at_time === "COTC" ? " (as COTC)" : ""}`; }).join(", "), href: "/championships" },
    { label: "Recorded all-time record", value: rec(t.overall.w, t.overall.l), detail: `${rec(t.regular.w, t.regular.l)} regular season · ${rec(t.postseason.w, t.postseason.l)} postseason`, href: "/seasons" },
    ...seasons.filter((x) => x.undefeated).slice(0, 1).map((u) => ({ label: "Undefeated seasons", value: String(t.undefeated), detail: seasons.filter((x) => x.undefeated).map((x) => `${x.session} ${x.year} (${rec(x.overall_wins, x.overall_losses)} overall)`).join(", "), href: `/seasons/${u.slug}` })),
    { label: "Championship-round record", value: rec(titleRound.w, titleRound.l), detail: "Every championship-round game with a recorded result", href: "/championships" },
    { label: "Postseason win percentage", value: fmtPct(t.postseason.w / (t.postseason.w + t.postseason.l)), detail: `${t.playoffAppearances} seasons with a recorded playoff result` },
  ];

  return (
    <>
      <PageHeader kicker="Record book" title="Records">
        Computed from every recorded game, COTC included, each time the site is built. Score-based records only use games with a posted score.
        Records cover the {seasons.length} seasons on file, so they read as &ldquo;on record&rdquo; rather than all-time until the missing sessions are filled in.
      </PageHeader>
      <Container className="space-y-14 pt-10">
        <section>
          <SectionTitle>Team records</SectionTitle>
          <div className="space-y-8">
            {groups.map((grp) => {
              const items = grp === "Franchise" ? franchise.map((f, i) => ({ id: `f${i}`, ...f, scopeNote: undefined })) : records.filter((r) => r.group === grp);
              return (
                <div key={grp}>
                  <div className="kicker mb-2">{grp}</div>
                  <div className="grid gap-px overflow-hidden rounded-md border border-line-soft bg-line-soft md:grid-cols-2 md:[&>*:last-child:nth-child(odd)]:col-span-2">
                    {items.map((r) => {
                      const body = (
                        <div className="flex h-full items-center justify-between gap-4 bg-night p-4 transition-colors hover:bg-pitch">
                          <div className="min-w-0">
                            <div className="text-[0.82rem] font-semibold text-mute">{r.label}</div>
                            <div className="mt-1 text-[0.9rem]">{r.detail}</div>
                            {r.scopeNote && <div className="mt-1 text-[0.75rem] text-dim">{r.scopeNote}</div>}
                          </div>
                          <div className="display num shrink-0 text-right text-[1.8rem]">{r.value}</div>
                        </div>
                      );
                      return r.href ? <Link key={r.id} href={r.href}>{body}</Link> : <div key={r.id}>{body}</div>;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <SectionTitle note="Ranked by regular-season win percentage">Best seasons</SectionTitle>
          <div className="scroller">
            <table className="stat-table text-[0.9rem]">
              <thead><tr><th>Rank</th><th style={{ textAlign: "left" }}>Season</th><th>Regular</th><th>PCT</th><th>Place</th><th>Overall</th><th>Run diff</th><th style={{ textAlign: "left" }}>Finish</th></tr></thead>
              <tbody>
                {ranked.map((s, i) => (
                  <tr key={s.id}>
                    <td className="text-mute">{i + 1}</td>
                    <td style={{ textAlign: "left" }}><Link href={`/seasons/${s.slug}`} className="font-semibold hover:text-cardinal-hi">{s.session} {s.year}</Link>{s.team_name_at_time === "COTC" && <span className="ml-2 text-[0.75rem] text-mute">COTC</span>}</td>
                    <td className="num font-bold">{rec(s.regular_wins, s.regular_losses)}</td>
                    <td>{fmtPct(s.regular_wins / (s.regular_wins + s.regular_losses))}</td>
                    <td>{ordinal(s.regular_place)}</td>
                    <td>{rec(s.overall_wins, s.overall_losses)}</td>
                    <td>{s.runs_for === null ? "—" : `${s.runs_for - s.runs_against! > 0 ? "+" : ""}${s.runs_for - s.runs_against!}`}</td>
                    <td style={{ textAlign: "left" }} className={s.champion ? "font-bold text-gold-hi" : "text-mute"}>{s.champion ? "Champion" : s.title_under_review ? "Title under review" : s.playoff_finish ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <SectionTitle>Individual records</SectionTitle>
          {lines.length === 0 ? (
            <Empty title="No individual batting data on record yet">
              Career and single-season leaders are calculated from plate appearances. They will fill in automatically as the scorekeeper records games — nothing here is typed in by hand.
            </Empty>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {LEADER_CATS.map((c) => {
                const pool = lines.filter((x) => x.line[c.key] !== null && (!c.minPA || (x.line.pa ?? 0) >= c.minPA))
                  .sort((a, b) => (b.line[c.key] as number) - (a.line[c.key] as number)).slice(0, 5);
                return (
                  <div key={c.key} className="panel p-4">
                    <div className="kicker mb-2">Career {c.label.toLowerCase()}{c.minPA ? ` (min. ${c.minPA} PA)` : ""}</div>
                    {pool.length ? (
                      <ol className="space-y-1.5">
                        {pool.map((x, i) => (
                          <li key={x.p.slug} className="flex justify-between text-[0.92rem]">
                            <Link href={`/players/${x.p.slug}`} className={i === 0 ? "font-bold" : ""}>{x.p.name}</Link>
                            <span className="num font-bold">{c.rate ? fmtRate(x.line[c.key] as number) : (x.line[c.key] as number)}</span>
                          </li>
                        ))}
                      </ol>
                    ) : <p className="text-[0.85rem] text-mute">Not enough data yet.</p>}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </Container>
    </>
  );
}
