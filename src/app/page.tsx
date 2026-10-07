import Link from "next/link";
import Image from "next/image";
import {
  getChampionships, getSeasons, getCurrentSeason, getStandings, getGames, nextGame, latestResult,
  franchiseTotals, getGaps, opponentName, getSeason, liveStatus, gameStart, getAllGames, tally,
} from "@/lib/data";
import { teamRecords } from "@/lib/records";
import { rec, ordinal, fmtDate, fmtPct } from "@/lib/format";
import { Rafters } from "@/components/Banner";
import { Container, SectionTitle, StatTile, Tag, ResultChip } from "@/components/ui";
import { GameList, StandingsTable } from "@/components/games";
import { SeasonChart } from "@/components/SeasonChart";
import { PerfectRun } from "@/components/PerfectRun";

export const revalidate = 60;

export default function Home() {
  const now = new Date();
  const titles = getChampionships();
  const seasons = getSeasons();
  const totals = franchiseTotals();
  const current = getCurrentSeason();
  const standings = getStandings(current.id);
  const currentGames = getGames({ seasonId: current.id });
  const next = nextGame(now);
  const last = latestResult();
  const perfect = seasons.find((s) => s.undefeated)!;
  const perfectGames = getGames({ seasonId: perfect.id });
  const latestTitle = titles[titles.length - 1];
  const latestTitleSeason = getSeason(latestTitle.season_id)!;
  const records = teamRecords();
  const titleRound = tally(getAllGames().filter((g) => g.is_title_game));
  const recordTeaser = ["win-streak", "most-runs", "largest-win", "best-run-diff"].map((id) => records.find((r) => r.id === id)).filter(Boolean);
  const isToday = next && gameStart(next).toLocaleDateString("en-US", { timeZone: "America/Chicago" }) === now.toLocaleDateString("en-US", { timeZone: "America/Chicago" });
  const nextStatus = next ? liveStatus(next, now) : null;

  return (
    <>
      {/* ------------------------------------------------ hero */}
      <section className="relative overflow-hidden border-b border-line-soft">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_70%_0%,rgb(19_33_59/0.9),transparent_70%)]" aria-hidden />
        <div className="stitch pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <Container className="relative">
          <div className="pt-0">
            <Rafters titles={titles} seasons={seasons} />
          </div>
          <div className="grid items-end gap-8 pb-10 pt-4 sm:pt-6 md:grid-cols-[1fr_auto] md:pb-14">
            <div>
              <h1 className="sr-only">Sacrifice Blunt — {titles.length}-Time Champions</h1>
              <Image
                src="/brand/wordmark-light-960.webp"
                alt="Sac Blunt"
                width={960}
                height={560}
                priority
                className="h-auto w-[230px] sm:w-[300px]"
              />
              <p className="display mt-5 text-[2.9rem] text-chalk sm:text-[4.6rem] lg:text-[5.4rem]" aria-hidden>
                {titles.length}-Time<br />Champions
              </p>
              <p className="serif mt-4 max-w-xl text-[1.15rem] italic leading-snug text-mute sm:text-[1.3rem]">
                Home of the {rec(perfect.overall_wins, perfect.overall_losses)} {perfect.session} {perfect.year} undefeated champions.
              </p>
            </div>

            {/* next game / tonight card */}
            <div className="w-full md:w-[330px]">
              {next ? (
                <Link href={`/games/${next.slug}`} className="panel block overflow-hidden border-line transition-colors hover:border-mask/50">
                  <div className="flex items-center justify-between border-b border-line-soft px-4 py-2 text-[0.78rem] font-semibold">
                    <span className="flex items-center gap-2 text-mask">
                      <span className="live-dot h-2 w-2 rounded-full bg-mask" />
                      {nextStatus === "in_progress" ? "Under way" : isToday ? "Tonight" : "Next game"}
                    </span>
                    <span className="text-mute">{next.stage === "postseason" ? next.playoff_round_label?.replace(/ - .*/, "") : `Week ${next.week}`}</span>
                  </div>
                  <div className="px-4 py-4">
                    <div className="text-[0.82rem] text-mute">{next.home_away === "home" ? "vs" : "at"}</div>
                    <div className="wide text-[1.6rem] font-black leading-tight">{opponentName(next.opponent_id)}</div>
                    <div className="mt-3 flex items-center gap-3 text-[0.9rem]">
                      <span className="font-semibold">{fmtDate(next.date, { weekday: true })}</span>
                      <span className="text-mute">{next.time}</span>
                      <span className="text-mute">Field {next.field?.replace("F", "")}</span>
                    </div>
                  </div>
                  <div className="border-t border-line-soft bg-navy/40 px-4 py-2 text-[0.78rem] text-mute">
                    {current.session} {current.year} · {rec(current.regular_wins, current.regular_losses)} · {ordinal(current.regular_place)} of {current.league_size}
                  </div>
                </Link>
              ) : (
                <div className="panel p-4 text-[0.9rem] text-mute">No upcoming games on the schedule yet.</div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------ scoreline strip */}
      <section className="border-b border-line-soft bg-pitch">
        <Container className="grid grid-cols-2 divide-line-soft sm:grid-cols-4 sm:divide-x">
          {[
            { k: "Championships", v: String(totals.championships), href: "/championships" },
            { k: "Recorded record", v: rec(totals.overall.w, totals.overall.l), href: "/records" },
            { k: "Seasons on record", v: String(totals.seasons), href: "/seasons" },
            { k: "Undefeated seasons", v: String(totals.undefeated), href: `/seasons/${perfect.slug}` },
          ].map((x) => (
            <Link key={x.k} href={x.href} className="group px-1 py-4 sm:px-5">
              <div className="text-[0.75rem] font-semibold text-mute group-hover:text-chalk">{x.k}</div>
              <div className="display num mt-1 text-[1.75rem]">{x.v}</div>
            </Link>
          ))}
        </Container>
      </section>

      <Container className="space-y-16 pt-12">
        {/* ------------------------------------------------ current season */}
        <section aria-labelledby="current">
          <SectionTitle href={`/schedule/${current.slug}`} linkLabel="Full schedule" note={`${current.division} · ${current.league.replace(/ \/.*/, "")}`}>
            <span id="current">{current.session} {current.year}</span>
          </SectionTitle>
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <div className="mb-3 flex items-baseline gap-3">
                <span className="display num text-[2.4rem]">{rec(current.regular_wins, current.regular_losses)}</span>
                <span className="text-mute">{ordinal(current.regular_place)} of {current.league_size} · {current.regular_streak_end}</span>
              </div>
              <GameList games={[...currentGames].reverse()} now={now} />
            </div>
            <div>
              <div className="kicker mb-2">Standings</div>
              <div className="panel px-2 py-1"><StandingsTable rows={standings} compact /></div>
              {last && (
                <Link href={`/games/${last.slug}`} className="panel mt-4 flex items-center gap-4 p-4 hover:border-line">
                  <ResultChip result={last.result} size="lg" title={last.is_title_game} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.78rem] text-mute">Latest result · {fmtDate(last.date, { year: true })}</div>
                    <div className="truncate font-semibold">{last.home_away === "home" ? "vs" : "at"} {opponentName(last.opponent_id)}</div>
                  </div>
                  <div className="display num text-[1.6rem]">{last.team_score}-{last.opponent_score}</div>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ the perfect season */}
        <section aria-labelledby="perfect" className="relative overflow-hidden rounded-lg border border-cardinal/40 bg-gradient-to-br from-cardinal/[0.18] via-pitch to-pitch p-5 sm:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Tag tone="gold">Champions</Tag><Tag tone="cardinal">Undefeated</Tag>
              </div>
              <h2 id="perfect" className="display mt-4 text-[2.6rem] sm:text-[4rem]">
                {rec(perfect.overall_wins, perfect.overall_losses)}<span className="text-cardinal-hi">.</span>
              </h2>
              <p className="mt-2 max-w-xl text-[1.02rem] leading-relaxed text-mute">
                {perfect.session} {perfect.year}, {perfect.division}. A {rec(perfect.regular_wins, perfect.regular_losses)} regular season, then two playoff wins for the title.
                Outscored opponents {perfect.runs_for}-{perfect.runs_against} in the regular season.
              </p>
            </div>
            <Link href={`/championships/${perfect.slug}`} className="text-[0.9rem] font-semibold text-gold-hi hover:text-chalk">Inside the run</Link>
          </div>
          <div className="mt-6"><PerfectRun games={perfectGames} /></div>
        </section>

        {/* ------------------------------------------------ history snapshot */}
        <section aria-labelledby="history">
          <SectionTitle href="/seasons" linkLabel="All seasons" note={`Originally ${"COTC"}. One franchise since Fall 2019.`}>
            <span id="history">Every season on record</span>
          </SectionTitle>
          <SeasonChart seasons={getSeasons({ order: "asc" })} gaps={getGaps()} />
        </section>

        {/* ------------------------------------------------ modules */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Latest championship"
            value={`${latestTitleSeason.session} ${latestTitleSeason.year}`}
            sub={latestTitle.undefeated ? `Undefeated, ${rec(latestTitleSeason.overall_wins, latestTitleSeason.overall_losses)}` : latestTitleSeason.division}
            href={`/championships/${latestTitle.slug}`}
            accent="gold"
          />
          <StatTile
            label="Postseason record"
            value={rec(totals.postseason.w, totals.postseason.l)}
            sub={`${fmtPct(totals.postseason.w / (totals.postseason.w + totals.postseason.l))} in recorded playoff games`}
            href="/records"
          />
          <StatTile label="Championship-round games" value={rec(titleRound.w, titleRound.l)} sub="Includes Spring 2025's title-game win, which is under review" href="/championships" />
          <StatTile label="Regular season, all-time" value={rec(totals.regular.w, totals.regular.l)} sub={`${totals.seasons} recorded seasons, COTC included`} href="/seasons" />
        </section>

        <section aria-labelledby="records">
          <SectionTitle href="/records" linkLabel="Record book"><span id="records">From the record book</span></SectionTitle>
          <div className="grid gap-px overflow-hidden rounded-md border border-line-soft bg-line-soft sm:grid-cols-2">
            {recordTeaser.map((r) => r && (
              <Link key={r.id} href={r.href ?? "/records"} className="flex items-baseline justify-between gap-4 bg-night p-4 hover:bg-pitch">
                <div className="min-w-0">
                  <div className="text-[0.8rem] font-semibold text-mute">{r.label}</div>
                  <div className="mt-1 truncate text-[0.88rem]">{r.detail}</div>
                </div>
                <div className="display num shrink-0 text-[1.7rem]">{r.value.replace(" games", "").replace(" runs", "")}</div>
              </Link>
            ))}
          </div>
        </section>
      </Container>
    </>
  );
}
