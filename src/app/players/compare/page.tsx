import type { Metadata } from "next";
import { getPlayers, getPlayer, getAllGames, getPlateAppearances, getPlayerGameStats } from "@/lib/data";
import { battingLine, fmtRate, fmtCount, type BattingLine } from "@/lib/stats";
import { Container, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Compare players", description: "Head-to-head career batting comparison." };

const ROWS: { k: keyof BattingLine; label: string; rate?: boolean; lowerBetter?: boolean }[] = [
  { k: "g", label: "Games" }, { k: "pa", label: "Plate appearances" }, { k: "h", label: "Hits" }, { k: "2b", label: "Doubles" },
  { k: "3b", label: "Triples" }, { k: "hr", label: "Home runs" }, { k: "rbi", label: "RBI" }, { k: "r", label: "Runs" },
  { k: "bb", label: "Walks" }, { k: "k", label: "Strikeouts", lowerBetter: true }, { k: "tb", label: "Total bases" },
  { k: "avg", label: "AVG", rate: true }, { k: "obp", label: "OBP", rate: true }, { k: "slg", label: "SLG", rate: true }, { k: "ops", label: "OPS", rate: true },
];

export default async function Compare({ searchParams }: { searchParams: Promise<{ a?: string; b?: string }> }) {
  const sp = await searchParams;
  const players = getPlayers();
  const a = getPlayer(sp.a ?? "") ?? players[0];
  const b = getPlayer(sp.b ?? "") ?? players[1];
  const games = getAllGames(), pas = getPlateAppearances(), pgs = getPlayerGameStats();
  const la = battingLine(a.slug, games, pas, pgs), lb = battingLine(b.slug, games, pas, pgs);

  return (
    <>
      <PageHeader kicker="Players" title="Compare">Pick two players to line up their career numbers.</PageHeader>
      <Container className="pt-8">
        <form className="mb-6 grid grid-cols-[1fr_auto_1fr] items-end gap-3" action="/players/compare">
          {[["a", a.slug], ["b", b.slug]].map(([name, val], i) => (
            <label key={name} className={`text-[0.82rem] text-mute ${i === 1 ? "col-start-3" : ""}`}>
              Player {i + 1}
              <select name={name} defaultValue={val} className="mt-1 block w-full rounded border border-line bg-pitch px-3 py-2 text-[0.95rem] font-semibold text-chalk">
                {players.map((p) => <option key={p.slug} value={p.slug}>{p.name}{p.number ? ` #${p.number}` : ""}</option>)}
              </select>
            </label>
          ))}
          <button className="col-start-2 row-start-1 self-end rounded bg-chalk px-4 py-2 text-[0.9rem] font-bold text-night">Compare</button>
        </form>
        <div className="panel overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_1fr] border-b border-line bg-navy/40 px-4 py-3 text-center">
            <div className="wide truncate text-[1.1rem] font-black">{a.name}</div>
            <div className="w-28 text-[0.75rem] text-mute sm:w-40" />
            <div className="wide truncate text-[1.1rem] font-black">{b.name}</div>
          </div>
          {ROWS.map((r) => {
            const va = la[r.k] as number | null, vb = lb[r.k] as number | null;
            const winA = va !== null && vb !== null && (r.lowerBetter ? va < vb : va > vb);
            const winB = va !== null && vb !== null && (r.lowerBetter ? vb < va : vb > va);
            const f = (v: number | null) => (r.rate ? fmtRate(v) : fmtCount(v));
            return (
              <div key={r.k} className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-line-soft px-4 py-2 text-center last:border-0">
                <div className={`num text-[1.05rem] ${winA ? "font-black text-chalk" : "text-mute"}`}>{f(va)}</div>
                <div className="w-28 text-[0.78rem] text-mute sm:w-40">{r.label}</div>
                <div className={`num text-[1.05rem] ${winB ? "font-black text-chalk" : "text-mute"}`}>{f(vb)}</div>
              </div>
            );
          })}
        </div>
        {la.g === null && lb.g === null && <p className="mt-3 text-[0.85rem] text-mute">Neither player has batting data entered yet, so every value shows as a dash.</p>}
      </Container>
    </>
  );
}
