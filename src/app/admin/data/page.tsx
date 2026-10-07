import Link from "next/link";
import { getSeasons, getAllEvidence, getGames } from "@/lib/data";
import { rec } from "@/lib/format";
import { Container, SectionTitle, ConfidenceBadge } from "@/components/ui";

export default function AdminData() {
  const seasons = getSeasons();
  return (
    <Container className="space-y-12 py-8">
      <h1 className="display text-[2.2rem]">Data &amp; sources</h1>
      <section>
        <SectionTitle>Seasons — full metadata</SectionTitle>
        <div className="scroller">
          <table className="stat-table text-[0.82rem]">
            <thead><tr><th>Season</th><th>Name</th><th>Reg</th><th>Post</th><th>Overall</th><th>Overall source</th><th>Season conf.</th><th>Reg. conf.</th><th>Post conf.</th><th>Games</th><th style={{ textAlign: "left" }}>Source notes</th></tr></thead>
            <tbody>
              {seasons.map((s) => (
                <tr key={s.id}>
                  <td><Link href={`/seasons/${s.slug}`} className="font-semibold hover:text-cardinal-hi">{s.id}</Link></td>
                  <td>{s.team_name_at_time}</td>
                  <td>{rec(s.regular_wins, s.regular_losses)}</td>
                  <td>{rec(s.postseason_wins, s.postseason_losses)}</td>
                  <td>{rec(s.overall_wins, s.overall_losses)}</td>
                  <td className="text-mute">{s.overall_source ?? "—"}</td>
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
        <SectionTitle>Source evidence</SectionTitle>
        <ul className="grid gap-2 md:grid-cols-2">
          {getAllEvidence().map((e) => (
            <li key={e.id} className="panel p-3 text-[0.86rem]">
              <div className="flex items-center justify-between gap-2"><span className="font-semibold">{e.title}</span><ConfidenceBadge level={e.confidence} /></div>
              <div className="mt-1 text-mute">{e.coverage}</div>
              {e.file && <code className="mt-1 block text-[0.75rem] text-dim">{e.file}</code>}
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
