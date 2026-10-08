import type { Metadata } from "next";
import Link from "next/link";
import { getReviewQueue, getSeasons, getAllEvidence, getGames, getMeta } from "@/lib/data";
import { rec, CONFIDENCE, fmtDate } from "@/lib/format";
import { asset } from "@/lib/site";
import { Container, PageHeader, SectionTitle, ConfidenceBadge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Sources & data notes",
  description: "Where every Sacrifice Blunt record comes from, how confident each one is, and what is still missing.",
};

export default function SourcesPage() {
  const seasons = getSeasons();
  const q = getReviewQueue();
  const open = q.filter((x) => x.severity === "decision");
  const log = q.filter((x) => x.severity !== "decision");
  const meta = getMeta();

  return (
    <>
      <PageHeader kicker="Sources & data notes" title="How we know">
        Every record on this site traces back to a TeamSideline standings export, a championship plaque, or a confirmation from team leadership.
        Each game&apos;s score was read from the original PDF, and every team&apos;s record was re-added from those games and checked against the printed standings. Data as of {fmtDate(meta.data_as_of, { year: true })}.
      </PageHeader>
      <Container className="space-y-12 pt-8">
        <section>
          <SectionTitle note="What each confidence label means">Confidence levels</SectionTitle>
          <ul className="grid gap-2 md:grid-cols-2">
            {Object.entries(CONFIDENCE).map(([k, c]) => (
              <li key={k} className="panel flex items-start gap-3 p-3 text-[0.88rem]">
                <ConfidenceBadge level={k as keyof typeof CONFIDENCE} />
                <span className="text-mute">{c.help}</span>
              </li>
            ))}
          </ul>
        </section>

        {open.length > 0 && (
          <section>
            <SectionTitle note="Known gaps in the record. Nothing here is guessed on the site.">Still open</SectionTitle>
            <ul className="space-y-2">
              {open.map((d) => <li key={d.id} className="panel border-gold/40 p-4 text-[0.92rem]">{d.message}</li>)}
            </ul>
          </section>
        )}

        <section>
          <SectionTitle>Every season and its sources</SectionTitle>
          <div className="scroller">
            <table className="stat-table text-[0.84rem]">
              <thead><tr><th>Season</th><th style={{ textAlign: "left" }}>Name</th><th>Regular</th><th>Post</th><th>Overall</th><th>Season</th><th>Regular</th><th>Postseason</th><th>Games</th><th style={{ textAlign: "left" }}>Sources</th></tr></thead>
              <tbody>
                {seasons.map((s) => (
                  <tr key={s.id}>
                    <td><Link href={`/seasons/${s.slug}`} className="font-semibold hover:text-cardinal-hi">{s.session} {s.year}</Link></td>
                    <td style={{ textAlign: "left" }}>{s.team_name_at_time}</td>
                    <td>{rec(s.regular_wins, s.regular_losses)}</td>
                    <td>{rec(s.postseason_wins, s.postseason_losses)}</td>
                    <td>{rec(s.overall_wins, s.overall_losses)}</td>
                    <td><ConfidenceBadge level={s.confidence} /></td>
                    <td><ConfidenceBadge level={s.regular_confidence} /></td>
                    <td><ConfidenceBadge level={s.postseason_confidence} /></td>
                    <td>{getGames({ seasonId: s.id }).length}</td>
                    <td style={{ textAlign: "left" }} className="text-mute">{s.source_notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <SectionTitle note="Original files. TeamSideline PDFs open in a new tab.">Source files</SectionTitle>
          <ul className="grid gap-2 md:grid-cols-2">
            {getAllEvidence().map((e) => (
              <li key={e.id} className="panel p-3 text-[0.86rem]">
                <div className="flex items-center justify-between gap-2">
                  {e.public_url ? (
                    <a href={asset(e.public_url)} target="_blank" rel="noopener" className="font-semibold hover:text-cardinal-hi">{e.title}</a>
                  ) : <span className="font-semibold">{e.title}</span>}
                  <ConfidenceBadge level={e.confidence} />
                </div>
                <div className="mt-1 text-mute">{e.coverage}</div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <SectionTitle note="Notes from building the dataset">Data log</SectionTitle>
          <ul className="space-y-1.5 text-[0.86rem]">
            {log.map((d) => (
              <li key={d.id} className="border-b border-line-soft py-1.5">
                <span className="mr-2 text-[0.72rem] font-bold text-dim">{d.entity}</span>
                {d.entity === "game" && d.entity_id ? <Link className="hover:text-cardinal-hi" href={`/games/${d.entity_id}`}>{d.message}</Link> : d.message}
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </>
  );
}
