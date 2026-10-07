import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllGames, getGame, getSeason, opponentName, getOpponent, sameNightGames, gameNeighbors, headToHead,
  getPlateAppearances, getPlayer, liveStatus,
} from "@/lib/data";
import { lineFromPAs, finalize, fmtRate } from "@/lib/stats";
import { fmtLongDate, fmtDate, rec } from "@/lib/format";
import { Container, Breadcrumb, SectionTitle, Tag, Empty, ConfidenceBadge } from "@/components/ui";
import { StatusText } from "@/components/games";
import { SourceList } from "@/components/SourceList";

export const revalidate = 60;
export const dynamicParams = false;
export const generateStaticParams = () => getAllGames().map((g) => ({ slug: g.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const g = getGame((await params).slug);
  if (!g) return {};
  const s = getSeason(g.season_id)!;
  const score = g.status === "final" ? ` ${g.result} ${g.team_score}-${g.opponent_score}` : "";
  return { title: `${g.team_name_at_time} ${g.home_away === "home" ? "vs" : "at"} ${opponentName(g.opponent_id)}, ${fmtDate(g.date, { year: true })}${score}`, description: `${s.session} ${s.year} ${g.stage === "postseason" ? "playoff" : "regular-season"} game.` };
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const g = getGame((await params).slug);
  if (!g) notFound();
  const s = getSeason(g.season_id)!;
  const opp = getOpponent(g.opponent_id)!;
  const slate = sameNightGames(g);
  const { prev, next } = gameNeighbors(g);
  const h2h = headToHead(opp.id);
  const pas = getPlateAppearances().filter((p) => p.game_id === g.id);
  const batters = [...new Set(pas.sort((a, b) => a.pa_index - b.pa_index).map((p) => p.player_slug))];
  const status = liveStatus(g);
  const us = { name: g.team_name_at_time, score: g.team_score, won: g.result === "W" };
  const them = { name: opp.canonical_name, score: g.opponent_score, won: g.result === "L" };
  const [away, home] = g.home_away === "home" ? [them, us] : [us, them];

  return (
    <>
      <header className="border-b border-line-soft bg-pitch/60 stitch">
        <Container className="py-8">
          <Breadcrumb items={[{ label: "Seasons", href: "/seasons" }, { label: `${s.session} ${s.year}`, href: `/seasons/${s.slug}` }, { label: `${fmtDate(g.date)} vs ${opp.canonical_name}` }]} />
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone={g.stage === "postseason" ? "gold" : "default"}>{g.stage === "postseason" ? g.playoff_round_label ?? "Playoffs" : `Regular season · Week ${g.week}`}</Tag>
            {g.is_title_game && <Tag tone="gold">Championship game</Tag>}
            {g.bracket_game && <Tag>{g.bracket_game}</Tag>}
          </div>

          {/* scoreboard */}
          <div className="mt-6 overflow-hidden rounded-md border border-line bg-night">
            {[away, home].map((t, i) => (
              <div key={i} className={`flex items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 ${i === 0 ? "border-b border-line-soft" : ""}`}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-10 text-[0.72rem] font-semibold text-dim">{i === 0 ? "Away" : "Home"}</span>
                  <span className={`wide line-clamp-2 text-[1.05rem] font-black leading-tight sm:text-[1.7rem] ${t === us ? "" : "text-chalk/80"}`}>
                    {t === us && <span className="mr-2 inline-block h-4 w-[4px] rounded bg-cardinal align-middle" />}
                    {t.name}
                  </span>
                </div>
                <span className={`display num text-[2.4rem] sm:text-[3.4rem] ${t.won ? "text-chalk" : "text-dim"}`}>{t.score ?? (g.status === "final_result_only" ? (t.won ? "W" : "L") : "")}</span>
              </div>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft bg-pitch px-4 py-2 text-[0.82rem] text-mute sm:px-6">
              <span>{fmtLongDate(g.date)} · {g.time} · BMAC Field {g.field?.replace("F", "") ?? "—"}</span>
              <span className="font-semibold">
                {g.status === "final" ? <span className={g.result === "W" ? "text-chalk" : ""}>Final{g.result === "W" ? " · Win" : g.result === "L" ? " · Loss" : " · Tie"}</span> : <StatusText game={g} />}
              </span>
            </div>
          </div>
        </Container>
      </header>

      <Container className="grid gap-10 pt-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          <section>
            <SectionTitle note="Batting order and plate appearances, entered by the scorekeeper">Box score</SectionTitle>
            {pas.length ? (
              <div className="scroller panel px-2">
                <table className="stat-table text-[0.9rem]">
                  <thead><tr><th>Batter</th><th>PA</th><th>AB</th><th>R</th><th>H</th><th>2B</th><th>3B</th><th>HR</th><th>RBI</th><th>BB</th><th>K</th><th>AVG</th></tr></thead>
                  <tbody>
                    {batters.map((slug) => {
                      const l = finalize(lineFromPAs(pas.filter((p) => p.player_slug === slug)), 1);
                      return (
                        <tr key={slug}>
                          <td><Link href={`/players/${slug}`} className="font-semibold hover:text-cardinal-hi">{getPlayer(slug)?.name ?? slug}</Link></td>
                          <td>{l.pa}</td><td>{l.ab}</td><td>{l.r}</td><td>{l.h}</td><td>{l["2b"]}</td><td>{l["3b"]}</td><td>{l.hr}</td><td>{l.rbi}</td><td>{l.bb}</td><td>{l.k}</td><td>{fmtRate(l.avg)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty title={status === "scheduled" ? "Not played yet" : "No box score recorded for this game"}>
                {status === "scheduled"
                  ? "The lineup and box score appear here once the scorekeeper starts the game."
                  : "Historical games have final scores from TeamSideline but no batting detail. Lineups and batting lines appear here when they are entered."}
              </Empty>
            )}
          </section>

          {g.notes.length > 0 && (
            <section>
              <SectionTitle>Notes</SectionTitle>
              <ul className="space-y-2 text-[0.92rem] text-chalk/85">{g.notes.map((n, i) => <li key={i} className="serif">{n}</li>)}</ul>
            </section>
          )}

          <section>
            <SectionTitle note="Every game on the division schedule that night">Around the division</SectionTitle>
            <div className="scroller">
              <table className="stat-table text-[0.88rem]">
                <thead><tr><th>Time</th><th style={{ textAlign: "left" }}>Away</th><th></th><th style={{ textAlign: "left" }}>Home</th><th></th><th>Field</th></tr></thead>
                <tbody>
                  {slate.map((x, i) => {
                    const ours = [x.away, x.home].some((t) => t === "Sacrifice Blunt" || t === "COTC");
                    return (
                      <tr key={i} className={ours ? "bg-cardinal/[0.12] font-bold" : ""}>
                        <td className="text-mute">{x.time}</td>
                        <td style={{ textAlign: "left" }}>{x.away}</td><td className="num">{x.away_score ?? x.away_result ?? ""}</td>
                        <td style={{ textAlign: "left" }}>{x.home}</td><td className="num">{x.home_score ?? x.home_result ?? ""}</td>
                        <td className="text-mute">{x.field}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <section>
            <SectionTitle href={`/opponents/${opp.slug}`} linkLabel="Head-to-head">All-time vs {opp.canonical_name}</SectionTitle>
            <div className="panel flex items-center justify-between p-4">
              <div><div className="display num text-[2rem]">{rec(h2h.all.w, h2h.all.l)}</div><div className="text-[0.78rem] text-mute">{h2h.games.filter((x) => x.result).length} recorded meetings</div></div>
              <div className="text-right text-[0.82rem] text-mute">
                <div>Regular {rec(h2h.regular.w, h2h.regular.l)}</div>
                <div>Postseason {rec(h2h.postseason.w, h2h.postseason.l)}</div>
              </div>
            </div>
          </section>
          <section>
            <SectionTitle>Source</SectionTitle>
            <div className="mb-3"><ConfidenceBadge level={g.confidence} /></div>
            <SourceList ids={g.source_evidence_id ? [g.source_evidence_id] : []} />
            {(s.schedule_revision || s.playoff_revision) && (
              <p className="mt-2 text-[0.75rem] text-dim">TeamSideline {g.stage === "postseason" ? `playoff schedule revised ${s.playoff_revision}` : `schedule revised ${s.schedule_revision}`}.</p>
            )}
          </section>
          <nav className="flex justify-between gap-3 border-t border-line pt-4 text-[0.88rem]" aria-label="Game navigation">
            {prev ? <Link className="text-mute hover:text-chalk" href={`/games/${prev.slug}`}>← {fmtDate(prev.date)} {opponentName(prev.opponent_id)}</Link> : <span />}
            {next ? <Link className="text-right text-mute hover:text-chalk" href={`/games/${next.slug}`}>{fmtDate(next.date)} {opponentName(next.opponent_id)} →</Link> : <span />}
          </nav>
        </aside>
      </Container>
    </>
  );
}
