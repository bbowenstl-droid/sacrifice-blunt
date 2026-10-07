import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getSeasons, getSeason, getGames, getStandings, getLeagueGames, getRoster, getRosterNote, adjacentSeasons, getEra, getChampionship,
} from "@/lib/data";
import { rec, ordinal } from "@/lib/format";
import { Container, Breadcrumb, SectionTitle, StatTile, Tag, Empty } from "@/components/ui";
import { GameList, StandingsTable, Bracket } from "@/components/games";
import { SourceList } from "@/components/SourceList";

export const revalidate = 300;
export const dynamicParams = false;
export const generateStaticParams = () => getSeasons().map((s) => ({ slug: s.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = getSeason((await params).slug);
  if (!s) return {};
  return {
    title: `${s.session} ${s.year}`,
    description: `${s.team_name_at_time} ${s.session} ${s.year}: ${rec(s.regular_wins, s.regular_losses)} regular season, ${ordinal(s.regular_place)} in ${s.division}${s.champion ? ". Champions." : "."}`,
  };
}

export default async function SeasonPage({ params }: { params: Promise<{ slug: string }> }) {
  const s = getSeason((await params).slug);
  if (!s) notFound();
  const games = getGames({ seasonId: s.id });
  const regular = games.filter((g) => g.stage === "regular");
  const post = games.filter((g) => g.stage === "postseason");
  const standings = getStandings(s.id);
  const league = getLeagueGames(s.id);
  const roster = getRoster(s.id);
  const { prev, next } = adjacentSeasons(s.slug);
  const era = getEra(s.era_id);
  const title = getChampionship(s.id);
  const cotc = s.team_name_at_time === "COTC";

  return (
    <>
      <header className={`border-b border-line-soft stitch ${s.champion ? "bg-gradient-to-b from-gold/[0.08] to-transparent" : "bg-pitch/60"}`}>
        <Container className="py-8 sm:py-12">
          <Breadcrumb items={[{ label: "Seasons", href: "/seasons" }, { label: `${s.session} ${s.year}` }]} />
          <div className="flex flex-wrap items-center gap-2">
            {s.champion && <Tag tone="gold">Champions</Tag>}
            {s.undefeated && <Tag tone="cardinal">Undefeated</Tag>}
            {s.title_under_review && <Tag tone="gold">Title under review</Tag>}
            <Link href="/history"><Tag>{era.display_name}</Tag></Link>
          </div>
          <h1 className="display mt-4 text-[2.6rem] sm:text-[4.2rem]">{s.session} {s.year}</h1>
          <p className="mt-3 text-[1.02rem] text-mute">
            {cotc ? <>Played as <strong className="text-chalk">COTC</strong>. </> : null}
            {s.division} · {s.league}
          </p>
        </Container>
      </header>

      <Container className="space-y-12 pt-8">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile label="Regular season" value={rec(s.regular_wins, s.regular_losses, s.regular_ties)} sub={s.regular_streak_end ? `Finished on: ${s.regular_streak_end}` : undefined} />
          <StatTile label="Standing" value={ordinal(s.regular_place)} sub={s.league_size ? `of ${s.league_size} teams` : undefined} />
          <StatTile label="Postseason" value={rec(s.postseason_wins, s.postseason_losses)} sub={s.postseason_wins === null ? (s.playoff_status_note ?? "No result recorded") : undefined} />
          <StatTile label="Overall" value={rec(s.overall_wins, s.overall_losses)} sub={s.overall_source === "seed" ? "Confirmed by team leadership" : s.overall_source === "derived_from_games" ? "Regular season + postseason games" : "Not established"} accent={s.undefeated ? "cardinal" : undefined} />
          <StatTile label="Runs for / against" value={s.runs_for === null ? "—" : `${s.runs_for}-${s.runs_against}`} sub={s.run_totals_note ?? "Regular season"} />
        </section>

        {(s.champion || s.title_under_review || s.playoff_finish || s.playoff_status_note) && (
          <section className={`rounded-md border p-5 ${s.champion ? "border-gold/50 bg-gold/[0.07]" : "border-line bg-pitch"}`}>
            <div className="text-[0.8rem] font-semibold text-mute">Postseason</div>
            <div className={`wide mt-1 text-[1.5rem] font-black ${s.champion ? "text-gold-hi" : ""}`}>
              {s.champion ? `${s.session} ${s.year} Champions` : s.playoff_finish ?? s.playoff_status_note}
            </div>
            {(s.championship_note || s.postseason_note) && (
              <p className="serif mt-2 max-w-3xl text-[1.02rem] leading-relaxed text-chalk/85">{s.postseason_note ?? s.championship_note}</p>
            )}
            {title && <Link href={`/championships/${title.slug}`} className="mt-3 inline-block text-[0.9rem] font-semibold text-gold-hi hover:text-chalk">Open in the Championship Vault</Link>}
          </section>
        )}

        <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr]">
          <div className="space-y-10">
            {post.length > 0 && (
              <section>
                <SectionTitle>Postseason</SectionTitle>
                <GameList games={post} />
              </section>
            )}
            <section>
              <SectionTitle note={s.regular_season_note ?? undefined}>Regular season</SectionTitle>
              <GameList games={regular} />
            </section>
          </div>
          <div className="space-y-10">
            <section>
              <SectionTitle note="Final regular-season standings from TeamSideline">Standings</SectionTitle>
              <div className="panel px-2 py-1"><StandingsTable rows={standings} /></div>
            </section>
            <section>
              <SectionTitle>Roster</SectionTitle>
              {roster.length ? (
                <>
                  <ul className="grid grid-cols-2 gap-2">
                    {roster.map((r) => (
                      <li key={r.player_slug}>
                        <Link href={`/players/${r.player_slug}`} className="panel flex items-center gap-3 px-3 py-2.5 hover:border-line">
                          <span className="display num w-8 text-center text-[1.1rem] text-mute">{r.number ?? "—"}</span>
                          <span className="truncate font-semibold">{r.player.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {getRosterNote(s.id) && <p className="mt-2 text-[0.8rem] text-mute">{getRosterNote(s.id)}</p>}
                </>
              ) : (
                <Empty title="Roster not recorded yet">Players will appear here once team leadership adds this season&apos;s roster.</Empty>
              )}
            </section>
            <section>
              <SectionTitle>How this season is sourced</SectionTitle>
              <SourceList
                ids={s.source_evidence_ids}
                rows={[
                  { label: "Season record", level: s.confidence, note: s.championship_note },
                  { label: "Regular season", level: s.regular_confidence, note: "Every team's record re-derived from the game-by-game results and matched to the printed standings." },
                  { label: "Postseason", level: s.postseason_confidence },
                ]}
              />
            </section>
          </div>
        </div>

        {league.some((g) => g.stage === "postseason") && (
          <section>
            <SectionTitle note="All playoff games in the division, from TeamSideline">Playoff bracket</SectionTitle>
            <Bracket games={league} />
          </section>
        )}

        <nav className="flex justify-between gap-4 border-t border-line pt-6 text-[0.92rem]" aria-label="Season navigation">
          {prev ? <Link href={`/seasons/${prev.slug}`} className="font-semibold text-mute hover:text-chalk">← {prev.session} {prev.year}</Link> : <span />}
          {next ? <Link href={`/seasons/${next.slug}`} className="font-semibold text-mute hover:text-chalk">{next.session} {next.year} →</Link> : <span />}
        </nav>
      </Container>
    </>
  );
}
