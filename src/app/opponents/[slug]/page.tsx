import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { opponentIndex, getOpponent, headToHead, getSeason, pct } from "@/lib/data";
import { rec, fmtPct } from "@/lib/format";
import { Container, Breadcrumb, SectionTitle, StatTile } from "@/components/ui";
import { GameList } from "@/components/games";

export const dynamicParams = false;
export const generateStaticParams = () => opponentIndex().map((o) => ({ slug: o.opponent.slug }));
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const o = getOpponent((await params).slug);
  if (!o) return {};
  const h = headToHead(o.id);
  return { title: `vs ${o.canonical_name}`, description: `Sacrifice Blunt is ${rec(h.all.w, h.all.l)} all-time against ${o.canonical_name}.` };
}

export default async function OpponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const o = getOpponent((await params).slug);
  if (!o) notFound();
  const h = headToHead(o.id);
  const bySeason = h.seasons.map((id) => ({ s: getSeason(id)!, games: h.games.filter((g) => g.season_id === id) })).sort((a, b) => b.s.sort_key - a.s.sort_key);
  return (
    <>
      <header className="border-b border-line-soft bg-pitch/60 stitch">
        <Container className="py-8 sm:py-12">
          <Breadcrumb items={[{ label: "Opponents", href: "/opponents" }, { label: o.canonical_name }]} />
          <div className="text-[0.95rem] text-mute">Sacrifice Blunt vs</div>
          <h1 className="display mt-1 text-[2.4rem] sm:text-[3.8rem]">{o.canonical_name}</h1>
          {o.aliases.length > 0 && <p className="mt-2 text-[0.85rem] text-mute">Also listed as: {o.aliases.join(", ")}</p>}
        </Container>
      </header>
      <Container className="space-y-12 pt-8">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="All-time" value={rec(h.all.w, h.all.l)} sub={`${fmtPct(pct(h.all))} · ${h.games.filter((g) => g.result).length} games`} />
          <StatTile label="Regular season" value={rec(h.regular.w, h.regular.l)} />
          <StatTile label="Postseason" value={h.postseason.w + h.postseason.l ? rec(h.postseason.w, h.postseason.l) : "—"} sub={h.postseason.w + h.postseason.l ? undefined : "Never met in the playoffs"} />
          <StatTile label="Runs (scored games)" value={h.scoredGames ? `${h.runsFor}-${h.runsAgainst}` : "—"} sub={h.scoredGames ? `${(h.runsFor / h.scoredGames).toFixed(1)} per game for` : undefined} />
        </section>
        {bySeason.map(({ s, games }) => (
          <section key={s.id}>
            <SectionTitle href={`/seasons/${s.slug}`} linkLabel="Season" note={`${s.team_name_at_time} · ${s.division}`}>
              {s.session} {s.year} <span className="ml-2 text-[0.95rem] font-semibold text-mute">{rec(games.filter((g) => g.result === "W").length, games.filter((g) => g.result === "L").length)}</span>
            </SectionTitle>
            <GameList games={games} />
          </section>
        ))}
        <p className="text-[0.85rem] text-mute"><Link href="/opponents" className="hover:text-chalk">← All opponents</Link></p>
      </Container>
    </>
  );
}
