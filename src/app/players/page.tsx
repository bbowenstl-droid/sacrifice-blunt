import type { Metadata } from "next";
import Link from "next/link";
import { getPlayers, getPlayerSeasons, getAllGames, getPlateAppearances, getPlayerGameStats, getSeasonBatting } from "@/lib/data";
import { battingLine, fmtRate, fmtCount } from "@/lib/stats";
import { Container, PageHeader, ConfidenceBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Players", description: "Sacrifice Blunt player database: rosters, career batting and season splits." };

export default function PlayersPage() {
  const players = getPlayers();
  const games = getAllGames(), pas = getPlateAppearances(), pgs = getPlayerGameStats(), sb = getSeasonBatting();
  return (
    <>
      <PageHeader kicker="Player database" title="Players" aside={<Link href="/players/compare" className="rounded border border-line px-4 py-2 text-[0.9rem] font-semibold hover:border-chalk">Compare players</Link>}>
        Everyone team leadership has named so far. Historical rosters are still being filled in, so this list is incomplete. Career batting combines every season on file; a dash means not recorded, not zero.
      </PageHeader>
      <Container className="pt-8">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((p) => {
            const line = battingLine(p.slug, games, pas, pgs, {}, sb);
            const seasons = getPlayerSeasons(p.slug);
            return (
              <li key={p.slug}>
                <Link href={`/players/${p.slug}`} className="panel group flex items-stretch overflow-hidden transition-colors hover:border-line">
                  <div className="flex w-[74px] shrink-0 items-center justify-center border-r border-line-soft bg-navy/50">
                    <span className={`display num text-[1.9rem] ${p.number ? "" : "text-dim"}`}>{p.number ?? "—"}</span>
                  </div>
                  <div className="min-w-0 flex-1 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[1.05rem] font-bold group-hover:text-cardinal-hi">{p.name}</span>
                      {p.confidence !== "confirmed" && <ConfidenceBadge level={p.confidence} />}
                    </div>
                    <div className="mt-0.5 text-[0.8rem] text-mute">
                      {seasons.length ? seasons.map((s) => `${s.season.session} ${s.season.year}`).join(", ") : "Seasons not recorded"}
                    </div>
                    <div className="mt-3 flex gap-5 text-[0.8rem]">
                      <span><span className="text-mute">AVG </span><span className="num font-bold">{fmtRate(line.avg)}</span></span>
                      <span><span className="text-mute">HR </span><span className="num font-bold">{fmtCount(line.hr)}</span></span>
                      <span><span className="text-mute">RBI </span><span className="num font-bold">{fmtCount(line.rbi)}</span></span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </>
  );
}
