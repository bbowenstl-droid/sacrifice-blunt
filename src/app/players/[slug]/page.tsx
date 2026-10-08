import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayers, getPlayer, getPlayerSeasons, getAllGames, getPlateAppearances, getPlayerGameStats, getSeasonBatting, getSeasonLabel, getChampionship, opponentName } from "@/lib/data";
import { battingLine, playerGameLines, finalize, hasBatting, countingOnlySeasons } from "@/lib/stats";
import { fmtDate } from "@/lib/format";
import { Container, Breadcrumb, SectionTitle, Tag, Empty, ConfidenceBadge } from "@/components/ui";
import { BattingTable } from "@/components/BattingTable";

export const dynamicParams = false;
export const generateStaticParams = () => getPlayers().map((p) => ({ slug: p.slug }));
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getPlayer((await params).slug);
  return p ? { title: p.name, description: `${p.name}${p.number ? ` #${p.number}` : ""} — Sacrifice Blunt career stats, season splits and championships.` } : {};
}

export default async function PlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = getPlayer((await params).slug);
  if (!p) notFound();
  const games = getAllGames(), pas = getPlateAppearances(), pgs = getPlayerGameStats(), sb = getSeasonBatting();
  const seasons = getPlayerSeasons(p.slug).sort((a, b) => b.season.sort_key - a.season.sort_key);
  const titles = seasons.filter((s) => s.season.champion).map((s) => getChampionship(s.season_id)!);
  const recent = playerGameLines(p.slug, games, pas, pgs, { lastN: 10 });
  const splits = [
    { label: "Career", line: battingLine(p.slug, games, pas, pgs, {}, sb), strong: true },
    { label: "Regular season", line: battingLine(p.slug, games, pas, pgs, { stage: "regular" }, sb) },
    { label: "Playoffs", line: battingLine(p.slug, games, pas, pgs, { stage: "postseason" }, sb) },
    { label: "Last 5 games", line: battingLine(p.slug, games, pas, pgs, { lastN: 5 }, sb) },
    { label: "Last 10 games", line: battingLine(p.slug, games, pas, pgs, { lastN: 10 }, sb) },
  ];
  const bySeason = seasons.map((s) => ({
    label: <Link href={`/seasons/${s.season_id}`} className="hover:text-cardinal-hi">{s.season.session} {s.season.year}</Link>,
    line: battingLine(p.slug, games, pas, pgs, { seasonId: s.season_id }, sb),
  }));
  const years = [...new Set(seasons.map((s) => s.season.year))];
  const byYear = years.map((y) => ({ label: String(y), line: battingLine(p.slug, games, pas, pgs, { year: y }, sb) }));
  const hasData = hasBatting(splits[0].line);
  const partialSeasons = countingOnlySeasons(p.slug, sb).map(getSeasonLabel);
  const hasSeasonTotals = sb.some((x) => x.player_slug === p.slug);
  const hasScorebook = pgs.some((x) => x.player_slug === p.slug && x.game_id.startsWith("2026-fall"));

  return (
    <>
      <header className="relative overflow-hidden border-b border-line-soft bg-pitch/60 stitch">
        <span className="display num pointer-events-none absolute -right-4 -top-6 select-none text-[12rem] leading-none text-white/[0.04] sm:text-[18rem]" aria-hidden>{p.number ?? ""}</span>
        <Container className="relative py-8 sm:py-12">
          <Breadcrumb items={[{ label: "Players", href: "/players" }, { label: p.name }]} />
          <div className="flex items-end gap-5">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-md border border-line bg-navy sm:h-24 sm:w-24">
              <span className={`display num text-[2.4rem] ${p.number ? "" : "text-dim"}`}>{p.number ? `#${p.number}` : "—"}</span>
            </div>
            <div>
              <h1 className="display text-[2.4rem] sm:text-[3.8rem]">{p.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.88rem] text-mute">
                {p.positions.length ? p.positions.join(" / ") : "Positions not recorded"}
                <ConfidenceBadge level={p.confidence} />
                {titles.map((t) => <Tag key={t.id} tone="gold">{t.title.replace(" Champion", "")} champion</Tag>)}
              </div>
            </div>
          </div>
        </Container>
      </header>

      <Container className="space-y-12 pt-8">
        <section>
          <SectionTitle note={hasData ? undefined : "No batting data entered for this player yet"}>Batting</SectionTitle>
          <BattingTable rows={splits} />
          {!hasData && <p className="mt-2 text-[0.82rem] text-mute">Every stat is calculated from scored games. Dashes mean the data hasn&apos;t been entered — not zero.</p>}
          {hasSeasonTotals && (
            <p className="mt-2 text-[0.82rem] text-mute">
              Earlier seasons come from season totals (stat-app exports and season stat boards), which aren&apos;t split by regular season, playoffs or game, so those rows only cover game-by-game seasons.
              {partialSeasons.length > 0 && <> {partialSeasons.join(", ")} only recorded AVG, R, RBI, HR and OPS: those runs, RBI and homers count in the career line, but the career averages use seasons with at-bats.</>}
              {" "}Dashes mean not recorded — not zero.
            </p>
          )}
          {hasScorebook && <p className="mt-2 text-[0.82rem] text-mute">Fall 2026 is game by game from the team scorebook; some runs and RBI were estimated so each game matches its final score.</p>}
        </section>

        {bySeason.length > 0 && (
          <section className="grid gap-8 lg:grid-cols-2">
            <div><SectionTitle>By season</SectionTitle><BattingTable rows={bySeason} /></div>
            <div><SectionTitle>By year</SectionTitle><BattingTable rows={byYear} /></div>
          </section>
        )}

        <section className="grid gap-8 lg:grid-cols-2">
          <div>
            <SectionTitle>Recent games</SectionTitle>
            {recent.length ? (
              <ul className="divide-y divide-line-soft">
                {recent.map(({ game, line }) => {
                  const l = finalize(line, 1);
                  return (
                    <li key={game.id}>
                      <Link href={`/games/${game.slug}`} className="flex justify-between py-2 text-[0.9rem] hover:text-cardinal-hi">
                        <span>{fmtDate(game.date)} {game.home_away === "home" ? "vs" : "at"} {opponentName(game.opponent_id)}</span>
                        <span className="num">{l.h ?? "—"}-{l.ab ?? "—"}{l.hr ? `, ${l.hr} HR` : ""}{l.rbi ? `, ${l.rbi} RBI` : ""}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : <Empty title="No games scored yet" />}
          </div>
          <div>
            <SectionTitle>Timeline</SectionTitle>
            {seasons.length ? (
              <ol className="space-y-2 border-l border-line pl-5">
                {seasons.map((s) => (
                  <li key={s.season_id} className="relative">
                    <span className={`absolute -left-[25px] top-2 h-2 w-2 rounded-full ${s.season.champion ? "bg-gold" : "bg-mute"}`} />
                    <Link href={`/seasons/${s.season_id}`} className="font-semibold hover:text-cardinal-hi">{s.season.session} {s.season.year}</Link>
                    <span className="ml-2 text-[0.85rem] text-mute">{s.season.team_name_at_time}{s.number ? ` · #${s.number}` : ""}{s.season.champion ? " · Champions" : ""}</span>
                  </li>
                ))}
              </ol>
            ) : <Empty title="No seasons recorded yet" />}
            <p className="mt-4 text-[0.78rem] text-dim">Source: {p.source}</p>
          </div>
        </section>
      </Container>
    </>
  );
}
