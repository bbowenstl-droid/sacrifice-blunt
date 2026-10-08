import type { Metadata } from "next";
import { asset } from "@/lib/site";
import Link from "next/link";
import Image from "next/image";
import { getSeasons, getGaps, getEras, getGames, opponentName, franchiseTotals, getFranchise } from "@/lib/data";
import type { Season } from "@/lib/types";
import { rec, ordinal } from "@/lib/format";
import { Container, PageHeader, Tag } from "@/components/ui";

export const metadata: Metadata = {
  title: "History",
  description: "The franchise timeline from COTC (Fall 2019) to Sacrifice Blunt: every season, every title, and the rename in between.",
};

/** One factual sentence per season, written only from recorded data. */
function summary(s: Season) {
  const parts = [`${rec(s.regular_wins, s.regular_losses)} in the regular season, ${ordinal(s.regular_place)} of ${s.league_size}.`];
  const post = getGames({ seasonId: s.id, stage: "postseason" }).filter((g) => g.result);
  if (post.length) {
    const lines = post.map((g) => `${g.result === "W" ? "beat" : "lost to"} ${opponentName(g.opponent_id)}${g.team_score !== null ? ` ${Math.max(g.team_score, g.opponent_score!)}-${Math.min(g.team_score, g.opponent_score!)}` : ""}${g.is_title_game ? " in the title game" : ""}`);
    parts.push(`In the playoffs: ${lines.join(", then ")}.`);
  }
  if (s.title_under_review) parts.push("Title status is under review.");
  if (s.playoff_status_note) parts.push(`${s.playoff_status_note}.`);
  return parts.join(" ");
}

export default function HistoryPage() {
  const seasons = getSeasons({ order: "asc" });
  const gaps = getGaps();
  const eras = getEras();
  const f = getFranchise();
  const cotc = franchiseTotals("cotc");
  const sb = franchiseTotals("sacrifice-blunt");
  type Node = { kind: "s"; s: Season; k: number } | { kind: "g"; label: string; k: number } | { kind: "rename"; k: number };
  const lastCotc = seasons.filter((s) => s.era_id === "cotc").at(-1)!;
  const firstSb = seasons.find((s) => s.era_id === "sacrifice-blunt")!;
  const nodes: Node[] = [
    ...seasons.map((s) => ({ kind: "s" as const, s, k: s.sort_key })),
    ...gaps.map((g) => ({ kind: "g" as const, label: `${g.session} ${g.year}`, k: g.sort_key })),
    { kind: "rename" as const, k: (lastCotc.sort_key + firstSb.sort_key) / 2 },
  ].sort((a, b) => a.k - b.k);

  // collapse consecutive gaps into one line
  const collapsed: (Node | { kind: "gaps"; labels: string[]; k: number })[] = [];
  for (const n of nodes) {
    const prev = collapsed.at(-1);
    if (n.kind === "g" && prev && prev.kind === "gaps") prev.labels.push(n.label);
    else if (n.kind === "g") collapsed.push({ kind: "gaps", labels: [n.label], k: n.k });
    else collapsed.push(n);
  }

  return (
    <>
      <PageHeader kicker="Franchise history" title={<>One franchise.<br />Two names.</>}>
        {f.current_name} began as <strong className="text-chalk">{f.original_name}</strong>. The earliest verified season is Fall 2019. The team was renamed sometime
        between Fall 2021 and Fall 2022; the exact session isn&apos;t on record yet. Every COTC game, win and title counts toward the franchise.
      </PageHeader>

      <Container className="pt-10">
        <div className="grid gap-4 sm:grid-cols-2">
          {eras.map((e) => {
            const t = e.id === "cotc" ? cotc : sb;
            return (
              <div key={e.id} className={`panel p-5 ${e.id === "sacrifice-blunt" ? "border-cardinal/40" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="wide text-[1.2rem] font-black">{e.display_name}</div>
                  {e.id === "sacrifice-blunt" && <Image src={asset("/brand/badge-64.png")} alt="" width={32} height={32} />}
                </div>
                <p className="mt-1 text-[0.85rem] text-mute">{e.start_note} {e.end_note}</p>
                <div className="mt-4 grid grid-cols-3 gap-3 text-[0.8rem]">
                  <div><div className="text-mute">Seasons</div><div className="display num text-[1.5rem]">{t.seasons}</div></div>
                  <div><div className="text-mute">Regular</div><div className="display num text-[1.5rem]">{rec(t.regular.w, t.regular.l)}</div></div>
                  <div><div className="text-mute">Titles</div><div className="display num text-[1.5rem] text-gold-hi">{t.championships}</div></div>
                </div>
              </div>
            );
          })}
        </div>

        <ol className="relative mt-14 border-l border-line pl-6 sm:ml-[120px] sm:pl-10">
          {collapsed.map((n, i) => {
            if (n.kind === "rename") {
              return (
                <li key="rename" className="relative my-10">
                  <span className="absolute -left-[33px] top-1 h-4 w-4 rotate-45 border-2 border-cardinal bg-night sm:-left-[49px]" aria-hidden />
                  <div className="rounded-md border border-cardinal/50 bg-gradient-to-r from-cardinal/15 to-transparent p-5">
                    <div className="text-[0.8rem] font-semibold text-cardinal-hi">Between Fall 2021 and Fall 2022 · exact date not verified</div>
                    <div className="display mt-2 text-[1.8rem] sm:text-[2.4rem]">COTC <span className="text-dim">→</span> Sacrifice Blunt</div>
                    <p className="mt-2 max-w-xl text-[0.92rem] text-mute">Same franchise, new name. Fall 2021 is the last supplied season as COTC; Fall 2022 is the first as Sacrifice Blunt.</p>
                  </div>
                </li>
              );
            }
            if (n.kind === "gaps") {
              return (
                <li key={`gap-${i}`} className="relative my-6">
                  <span className="absolute -left-[29px] top-1.5 h-2 w-2 rounded-full border border-dashed border-dim sm:-left-[45px]" aria-hidden />
                  <p className="text-[0.85rem] italic text-dim">{n.labels.join(", ")}: no record supplied</p>
                </li>
              );
            }
            const s = (n as { s: Season }).s;
            return (
              <li key={s.id} className="relative my-6">
                <span className={`absolute top-1.5 rounded-full ${s.champion ? "-left-[32px] h-3.5 w-3.5 bg-gold ring-4 ring-gold/20 sm:-left-[48px]" : "-left-[29px] h-2 w-2 bg-mute sm:-left-[45px]"}`} aria-hidden />
                <div className="hidden w-[100px] text-right sm:absolute sm:-left-[160px] sm:top-0 sm:block">
                  <div className="text-[0.8rem] font-semibold text-mute">{s.session}</div>
                  <div className="display num text-[1.4rem]">{s.year}</div>
                </div>
                <Link href={`/seasons/${s.slug}`} className={`group block rounded-md p-4 -m-4 transition-colors hover:bg-white/[0.03]`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold sm:hidden">{s.session} {s.year}</span>
                    <span className="text-[0.85rem] text-mute">{s.team_name_at_time} · {s.division}</span>
                    {s.champion && <Tag tone="gold">Champions</Tag>}
                    {s.undefeated && <Tag tone="cardinal">Undefeated {rec(s.overall_wins, s.overall_losses)}</Tag>}
                    {s.title_under_review && <Tag tone="gold">Title under review</Tag>}
                  </div>
                  <p className={`serif mt-1.5 max-w-2xl text-[1.05rem] leading-relaxed ${s.champion ? "text-chalk" : "text-chalk/80"}`}>{summary(s)}</p>
                </Link>
              </li>
            );
          })}
        </ol>
      </Container>
    </>
  );
}
