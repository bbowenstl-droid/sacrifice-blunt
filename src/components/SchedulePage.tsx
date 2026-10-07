import Link from "next/link";
import type { Season } from "@/lib/types";
import { getSeasons, getGames, getStandings, getLeagueGames, liveStatus } from "@/lib/data";
import { rec, ordinal } from "@/lib/format";
import { Container, SectionTitle, Tag } from "./ui";
import { GameList, StandingsTable, Bracket } from "./games";
import { SeasonPicker } from "./SeasonPicker";

export function SchedulePage({ season }: { season: Season }) {
  const now = new Date();
  const games = getGames({ seasonId: season.id });
  const upcoming = games.filter((g) => ["scheduled", "in_progress", "awaiting"].includes(liveStatus(g, now)));
  const done = games.filter((g) => !upcoming.includes(g));
  const isCurrent = getSeasons()[0].id === season.id;
  return (
    <>
      <header className="border-b border-line-soft bg-pitch/60 stitch">
        <Container className="flex flex-col gap-6 py-8 sm:py-10 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="kicker mb-2 flex items-center gap-2">
              Schedule &amp; results {isCurrent && <Tag tone="live">Current season</Tag>}
            </div>
            <h1 className="display text-[2.4rem] sm:text-[3.8rem]">{season.session} {season.year}</h1>
            <p className="mt-2 text-mute">{season.team_name_at_time} · {season.division}</p>
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <SeasonPicker base="/schedule" value={season.slug} options={getSeasons().map((s) => ({ slug: s.slug, label: `${s.session} ${s.year}${s.champion ? " · Champions" : ""}` }))} />
            <div className="flex gap-6">
              <div><div className="display num text-[1.9rem]">{rec(season.regular_wins, season.regular_losses)}</div><div className="text-[0.75rem] text-mute">Regular season</div></div>
              <div><div className="display num text-[1.9rem]">{ordinal(season.regular_place)}</div><div className="text-[0.75rem] text-mute">of {season.league_size}</div></div>
              <div><div className="display num text-[1.9rem]">{rec(season.postseason_wins, season.postseason_losses)}</div><div className="text-[0.75rem] text-mute">Postseason</div></div>
            </div>
          </div>
        </Container>
      </header>
      <Container className="grid gap-10 pt-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-10">
          {upcoming.length > 0 && (
            <section>
              <SectionTitle note="Times are Central. Fields at BMAC.">Upcoming</SectionTitle>
              <GameList games={upcoming} now={now} />
            </section>
          )}
          <section>
            <SectionTitle>Results</SectionTitle>
            <GameList games={[...done].reverse()} now={now} empty="No results yet." />
          </section>
        </div>
        <div className="space-y-10">
          <section>
            <SectionTitle>Standings</SectionTitle>
            <div className="panel px-2 py-1"><StandingsTable rows={getStandings(season.id)} compact /></div>
          </section>
          <section>
            <SectionTitle>Playoffs</SectionTitle>
            <Bracket games={getLeagueGames(season.id)} />
          </section>
          <Link href={`/seasons/${season.slug}`} className="block text-[0.9rem] font-semibold text-cardinal-hi hover:text-chalk">Season page, roster and sources</Link>
        </div>
      </Container>
    </>
  );
}
