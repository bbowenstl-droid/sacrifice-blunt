import Link from "next/link";
import { getReviewQueue, getSeasons, getAllGames, getMeta, getPlayers, getPlateAppearances, getOpponents, getChampionships } from "@/lib/data";
import { CONFIDENCE } from "@/lib/format";
import { Container, SectionTitle, StatTile, ConfidenceBadge } from "@/components/ui";

export default function AdminHome() {
  const q = getReviewQueue();
  const decisions = q.filter((x) => x.severity === "decision");
  const info = q.filter((x) => x.severity !== "decision");
  const seasons = getSeasons();
  const games = getAllGames();
  const meta = getMeta();
  const byConf = Object.entries(seasons.reduce<Record<string, number>>((a, s) => ((a[s.confidence] = (a[s.confidence] ?? 0) + 1), a), {}));

  return (
    <Container className="space-y-12 py-8">
      <div>
        <h1 className="display text-[2.2rem] sm:text-[3rem]">Franchise data</h1>
        <p className="mt-2 text-mute">Built {new Date(meta.built_at).toLocaleString("en-US", { timeZone: "America/Chicago" })} CT · data as of {meta.data_as_of}</p>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <StatTile label="Seasons" value={seasons.length} />
        <StatTile label="Our games" value={games.length} sub={`${games.filter((g) => g.result).length} with a result`} />
        <StatTile label="Opponents" value={getOpponents().length} />
        <StatTile label="Titles" value={getChampionships().length} accent="gold" />
        <StatTile label="Players" value={getPlayers().length} />
        <StatTile label="Plate appearances" value={getPlateAppearances().length} />
      </section>

      <section>
        <SectionTitle note="These need a call from team leadership before the site changes">Decisions needed</SectionTitle>
        <ul className="space-y-2">
          {decisions.map((d) => (
            <li key={d.id} className="panel border-gold/40 p-4 text-[0.92rem]">
              <div className="font-semibold">{d.message}</div>
              {d.entity === "season" && d.entity_id && <Link href={`/seasons/${d.entity_id}`} className="mt-1 inline-block text-[0.82rem] text-gold-hi">Open season</Link>}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[0.85rem] text-mute">
          To record a title confirmed by team leadership, add <code className="text-chalk">champion_confirmed_by_leadership: true</code>, a <code className="text-chalk">decision_date</code> and a <code className="text-chalk">championship_note</code> to that season in <code className="text-chalk">data/manual/season-annotations.json</code>, then rebuild. The handoff seed stays untouched and the build checks the title count, banners and championship list agree.
        </p>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <SectionTitle>Season confidence</SectionTitle>
          <ul className="space-y-2">
            {byConf.map(([k, n]) => (
              <li key={k} className="flex items-center justify-between border-b border-line-soft py-2 text-[0.9rem]">
                <span className="flex items-center gap-3"><ConfidenceBadge level={k as keyof typeof CONFIDENCE} /> <span className="text-mute">{CONFIDENCE[k as keyof typeof CONFIDENCE].help}</span></span>
                <span className="num font-bold">{n}</span>
              </li>
            ))}
          </ul>
          <div className="panel mt-4 p-4 text-[0.88rem] text-mute">
            <div className="font-semibold text-chalk">Spring 2026 source note</div>
            {seasons.find((s) => s.id === "2026-spring")?.championship_note}
          </div>
        </div>
        <div>
          <SectionTitle>Review log</SectionTitle>
          <ul className="max-h-[420px] space-y-1.5 overflow-auto pr-2 text-[0.86rem]">
            {info.map((d) => (
              <li key={d.id} className="border-b border-line-soft py-1.5">
                <span className="mr-2 text-[0.72rem] font-bold text-dim">{d.entity}</span>
                {d.entity === "game" && d.entity_id ? <Link className="hover:text-cardinal-hi" href={`/games/${d.entity_id}`}>{d.message}</Link> : d.message}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <SectionTitle>Adding data</SectionTitle>
        <ol className="grid gap-3 text-[0.9rem] md:grid-cols-3">
          <li className="panel p-4"><div className="font-bold">New TeamSideline season</div><p className="mt-1 text-mute">Save the print view as PDF into <code>archive/sources</code>, add the season to <code>seed-data.json</code>, then run <code>npm run ingest && npm run build:data</code>. The build fails if the PDF and seed disagree.</p></li>
          <li className="panel p-4"><div className="font-bold">Batting from a game</div><p className="mt-1 text-mute">Score it in the <Link href="/admin/scorekeeper" className="text-cardinal-hi">Scorekeeper</Link>, export, and append the rows to <code>data/manual/plate-appearances.json</code>. Season, career and record pages update on the next build.</p></li>
          <li className="panel p-4"><div className="font-bold">Players and rosters</div><p className="mt-1 text-mute">Edit <code>data/manual/players.json</code>. One identity per player; seasons link through <code>season_rosters</code>.</p></li>
        </ol>
      </section>
    </Container>
  );
}
