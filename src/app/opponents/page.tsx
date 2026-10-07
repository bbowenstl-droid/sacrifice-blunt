import type { Metadata } from "next";
import Link from "next/link";
import { opponentIndex, getSeason } from "@/lib/data";
import { rec, fmtPct } from "@/lib/format";
import { pct } from "@/lib/data";
import { Container, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Opponents", description: "All-time head-to-head records against every opponent Sacrifice Blunt and COTC have faced." };

export default function OpponentsPage() {
  const list = opponentIndex();
  return (
    <>
      <PageHeader kicker="Head-to-head" title="Opponents">
        {list.length} teams faced in the recorded game log, COTC era included. Sorted by most meetings.
      </PageHeader>
      <Container className="pt-8">
        <div className="hidden md:block">
          <table className="stat-table text-[0.92rem]">
            <thead><tr><th>Opponent</th><th>Games</th><th>Record</th><th>PCT</th><th>Postseason</th><th>Runs</th><th style={{ textAlign: "left" }}>First met</th><th style={{ textAlign: "left" }}>Last result</th></tr></thead>
            <tbody>
              {list.map((o) => {
                const first = o.first ? getSeason(o.first.season_id)! : null;
                return (
                  <tr key={o.opponent.id}>
                    <td><Link href={`/opponents/${o.opponent.slug}`} className="font-semibold hover:text-cardinal-hi">{o.opponent.canonical_name}</Link></td>
                    <td>{o.games.filter((g) => g.result).length}</td>
                    <td className="num font-bold">{rec(o.all.w, o.all.l)}</td>
                    <td>{fmtPct(pct(o.all))}</td>
                    <td className="text-mute">{o.postseason.w + o.postseason.l ? rec(o.postseason.w, o.postseason.l) : "—"}</td>
                    <td className="text-mute">{o.scoredGames ? `${o.runsFor}-${o.runsAgainst}` : "—"}</td>
                    <td style={{ textAlign: "left" }} className="text-mute">{first ? `${first.session} ${first.year}` : "—"}</td>
                    <td style={{ textAlign: "left" }}>{o.last ? <Link href={`/games/${o.last.slug}`} className="text-mute hover:text-chalk">{o.last.result} {o.last.team_score !== null ? `${o.last.team_score}-${o.last.opponent_score}` : ""} · {getSeason(o.last.season_id)!.session} {getSeason(o.last.season_id)!.year}</Link> : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ul className="space-y-2 md:hidden">
          {list.map((o) => (
            <li key={o.opponent.id}>
              <Link href={`/opponents/${o.opponent.slug}`} className="panel flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="truncate font-bold">{o.opponent.canonical_name}</div>
                  <div className="text-[0.78rem] text-mute">{o.games.filter((g) => g.result).length} games · {o.seasons.length} season{o.seasons.length > 1 ? "s" : ""}</div>
                </div>
                <div className="display num text-[1.5rem]">{rec(o.all.w, o.all.l)}</div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
