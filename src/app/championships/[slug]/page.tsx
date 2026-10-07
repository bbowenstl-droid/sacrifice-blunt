import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getChampionships, getChampionship, getSeason, getGames, getGame, opponentName, getRoster } from "@/lib/data";
import { rec, VERIFICATION_LABEL, fmtLongDate } from "@/lib/format";
import { Container, Breadcrumb, SectionTitle, Tag, ConfidenceBadge } from "@/components/ui";
import { GameList } from "@/components/games";
import { Banner } from "@/components/Banner";
import { PerfectRun } from "@/components/PerfectRun";
import { SourceList } from "@/components/SourceList";

export const dynamicParams = false;
export const generateStaticParams = () => getChampionships().map((c) => ({ slug: c.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = getChampionship((await params).slug);
  if (!c) return {};
  const s = getSeason(c.season_id)!;
  return { title: `${c.title}${c.undefeated ? " (Undefeated)" : ""}`, description: `${s.team_name_at_time} won the ${s.session} ${s.year} ${s.division} championship.` };
}

export default async function ChampionshipPage({ params }: { params: Promise<{ slug: string }> }) {
  const c = getChampionship((await params).slug);
  if (!c) notFound();
  const s = getSeason(c.season_id)!;
  const games = getGames({ seasonId: s.id });
  const post = games.filter((g) => g.stage === "postseason");
  const tg = c.title_game_id ? getGame(c.title_game_id) : null;
  const roster = getRoster(s.id);

  return (
    <div className={c.undefeated ? "bg-[radial-gradient(60%_40%_at_20%_0%,rgb(200_16_46/0.22),transparent_70%)]" : "bg-[radial-gradient(60%_40%_at_20%_0%,rgb(216_169_58/0.12),transparent_70%)]"}>
      <Container className="pt-8">
        <Breadcrumb items={[{ label: "Championship Vault", href: "/championships" }, { label: `${s.session} ${s.year}` }]} />
        <div className="grid items-start gap-8 md:grid-cols-[auto_1fr]">
          <div className="hidden md:block"><Banner title={c} season={s} size="vault" /></div>
          <div className="pt-2">
            <div className="flex flex-wrap gap-2">
              <Tag tone="gold">Champions</Tag>
              {c.undefeated && <Tag tone="cardinal">Undefeated</Tag>}
              {s.team_name_at_time === "COTC" && <Tag>As COTC</Tag>}
            </div>
            <h1 className="display mt-4 text-[2.6rem] sm:text-[4.4rem]">{s.session} {s.year}<br /><span className="text-gold-hi">Champions</span></h1>
            <p className="mt-4 text-[1.02rem] text-mute">{s.team_name_at_time} · {s.division} · {s.league}</p>
            <div className="mt-6 grid max-w-xl grid-cols-3 gap-3">
              <div className="panel p-3"><div className="text-[0.75rem] text-mute">Regular season</div><div className="display num mt-1 text-[1.6rem]">{rec(s.regular_wins, s.regular_losses)}</div></div>
              <div className="panel p-3"><div className="text-[0.75rem] text-mute">Playoffs</div><div className="display num mt-1 text-[1.6rem]">{rec(s.postseason_wins, s.postseason_losses)}</div></div>
              <div className={`panel p-3 ${c.undefeated ? "border-cardinal/60" : ""}`}><div className="text-[0.75rem] text-mute">Overall</div><div className={`display num mt-1 text-[1.6rem] ${c.undefeated ? "text-cardinal-hi" : ""}`}>{rec(s.overall_wins, s.overall_losses)}</div></div>
            </div>
          </div>
        </div>
      </Container>

      <Container className="mt-12 space-y-12">
        {tg && (
          <section>
            <SectionTitle>The title game</SectionTitle>
            <Link href={`/games/${tg.slug}`} className="panel flex flex-wrap items-center justify-between gap-6 border-gold/40 p-6 hover:border-gold">
              <div>
                <div className="text-[0.82rem] text-mute">{fmtLongDate(tg.date)} · {tg.time} · Field {tg.field?.replace("F", "")}</div>
                <div className="wide mt-1 text-[1.3rem] font-black">{tg.team_name_at_time} {tg.home_away === "home" ? "vs" : "at"} {opponentName(tg.opponent_id)}</div>
                <div className="mt-1 text-[0.85rem] text-mute">{tg.playoff_round_label} · {tg.bracket_game}</div>
              </div>
              <div className="display num text-[3.4rem] text-gold-hi">{tg.team_score}-{tg.opponent_score}</div>
            </Link>
          </section>
        )}

        {c.undefeated ? (
          <section>
            <SectionTitle note="Every game, in order. Tap a game for details.">The run</SectionTitle>
            <PerfectRun games={games} />
          </section>
        ) : (
          <section className="grid gap-10 lg:grid-cols-2">
            <div><SectionTitle>Road to the title</SectionTitle><GameList games={post} /></div>
            <div><SectionTitle>Regular season</SectionTitle><GameList games={games.filter((g) => g.stage === "regular")} /></div>
          </section>
        )}

        <section className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionTitle>Proof</SectionTitle>
            {c.evidence_image && (
              <figure className="mb-4">
                <Image src={c.evidence_image} alt="2025 Bridgeton Fall Softball, Wednesday Men's Division 3B Champions plaque, Sacrifice Blunt" width={1152} height={1536} className="h-auto w-full max-w-sm rounded-md ring-1 ring-gold/40" />
                <figcaption className="mt-2 text-[0.8rem] text-mute">Championship plaque: 2025 Bridgeton Fall Softball, Wednesday Men&apos;s Division 3B, Champions — Sacrifice Blunt.</figcaption>
              </figure>
            )}
            <ul className="mb-4 flex flex-wrap gap-2">
              {c.verification.map((v) => <li key={v}><Tag>{VERIFICATION_LABEL[v]}</Tag></li>)}
              <li><ConfidenceBadge level={c.confidence} /></li>
            </ul>
            {c.notes && <p className="serif text-[1.02rem] leading-relaxed text-chalk/85">{c.notes}</p>}
          </div>
          <div>
            <SectionTitle>Sources</SectionTitle>
            <SourceList ids={s.source_evidence_ids} />
            {roster.length > 0 && (
              <div className="mt-6">
                <div className="kicker mb-2">Players on record</div>
                <p className="text-[0.92rem]">{roster.map((r, i) => <span key={r.player_slug}>{i > 0 && ", "}<Link className="hover:text-cardinal-hi" href={`/players/${r.player_slug}`}>{r.player.name}</Link></span>)}</p>
              </div>
            )}
          </div>
        </section>
      </Container>
    </div>
  );
}
