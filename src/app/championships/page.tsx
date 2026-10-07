import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getChampionships, getSeasons, getSeason, getGame, opponentName, getGames } from "@/lib/data";
import { rec, VERIFICATION_LABEL } from "@/lib/format";
import { Container, Tag } from "@/components/ui";
import { Rafters } from "@/components/Banner";

export const metadata: Metadata = {
  title: "Championship Vault",
  description: "Every Sacrifice Blunt and COTC championship, with title-game scores and how each title is verified.",
};

export default function Vault() {
  const titles = getChampionships();
  const seasons = getSeasons();
  const review = seasons.filter((s) => s.title_under_review);
  const featured = titles.find((t) => t.undefeated)!;
  const fs = getSeason(featured.season_id)!;
  const others = [...titles].reverse().filter((t) => t.id !== featured.id);

  return (
    <div className="bg-[radial-gradient(70%_40%_at_50%_0%,rgb(216_169_58/0.10),transparent_70%)]">
      <Container className="pt-10 text-center sm:pt-14">
        <div className="kicker text-gold">The Championship Vault</div>
        <h1 className="display mt-3 text-[2.6rem] sm:text-[4.6rem]">{titles.length} titles</h1>
        <p className="serif mx-auto mt-3 max-w-xl text-[1.1rem] italic text-mute">
          One under the original COTC name, four as Sacrifice Blunt. All count for the same franchise.
        </p>
        <div className="mt-10 sm:mt-14"><Rafters titles={titles} seasons={seasons} size="vault" /></div>
      </Container>

      {/* featured: the undefeated title */}
      <Container className="mt-16">
        <Link href={`/championships/${featured.slug}`} className="group block overflow-hidden rounded-lg border border-cardinal/50 bg-gradient-to-br from-cardinal/25 via-pitch to-night">
          <div className="grid gap-6 p-6 sm:p-10 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex gap-2"><Tag tone="gold">{fs.session} {fs.year}</Tag><Tag tone="cardinal">Undefeated</Tag></div>
              <div className="display num mt-5 text-[4.5rem] leading-none sm:text-[8rem]">{rec(fs.overall_wins, fs.overall_losses)}</div>
              <p className="mt-4 max-w-xl text-[1.05rem] leading-relaxed text-chalk/85">
                {rec(fs.regular_wins, fs.regular_losses)} in the regular season, {rec(fs.postseason_wins, fs.postseason_losses)} in the playoffs.
                The only undefeated season on record.
              </p>
              <p className="mt-3 text-[0.85rem] text-mute">{featured.verification.map((v) => VERIFICATION_LABEL[v]).join(" · ")}</p>
            </div>
            <div className="text-[0.9rem] font-semibold text-gold-hi group-hover:text-chalk">Inside the run</div>
          </div>
        </Link>
      </Container>

      <Container className="mt-6 grid gap-4 md:grid-cols-2">
        {others.map((t) => {
          const s = getSeason(t.season_id)!;
          const tg = t.title_game_id ? getGame(t.title_game_id) : null;
          const route = getGames({ seasonId: s.id, stage: "postseason" });
          return (
            <Link key={t.id} href={`/championships/${t.slug}`} className="group panel relative overflow-hidden border-gold/25 p-6 transition-colors hover:border-gold/60">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[0.8rem] font-semibold text-gold">{s.session}</div>
                  <div className="display num text-[3rem] leading-none">{s.year}</div>
                  <div className="mt-2 text-[0.88rem] text-mute">{s.team_name_at_time === "COTC" ? <>as <strong className="text-chalk">COTC</strong> · </> : null}{s.division}</div>
                </div>
                {t.evidence_image && (
                  <Image src={t.evidence_image} alt="Fall 2025 championship plaque" width={96} height={128} className="h-[128px] w-[96px] rounded object-cover ring-1 ring-gold/40" />
                )}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-line-soft pt-4 text-[0.82rem]">
                <div><div className="text-mute">Regular</div><div className="num font-bold">{rec(s.regular_wins, s.regular_losses)}</div></div>
                <div><div className="text-mute">Playoffs</div><div className="num font-bold">{rec(s.postseason_wins, s.postseason_losses)}</div></div>
                <div><div className="text-mute">Title game</div><div className="num font-bold">{tg ? `${tg.team_score}-${tg.opponent_score}` : "—"}</div></div>
              </div>
              {tg && <p className="mt-3 text-[0.82rem] text-mute">Beat {opponentName(tg.opponent_id)} in the final{route.length > 1 ? ` after ${route.length - 1} earlier playoff win${route.length > 2 ? "s" : ""}` : ""}.</p>}
              <p className="mt-2 text-[0.75rem] text-dim">{t.verification.map((v) => VERIFICATION_LABEL[v]).join(" · ")}</p>
            </Link>
          );
        })}
      </Container>

      {review.length > 0 && (
        <Container className="mt-10">
          <div className="rounded-md border border-dashed border-gold/40 p-5">
            <div className="text-[0.85rem] font-bold text-gold-hi">Under review</div>
            {review.map((s) => (
              <p key={s.id} className="mt-2 text-[0.9rem] leading-relaxed text-mute">
                <Link href={`/seasons/${s.slug}`} className="font-semibold text-chalk hover:text-cardinal-hi">{s.session} {s.year}</Link>: {s.postseason_note}
              </p>
            ))}
          </div>
        </Container>
      )}
    </div>
  );
}
