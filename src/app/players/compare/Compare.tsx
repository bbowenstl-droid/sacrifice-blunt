"use client";
import { useEffect, useState } from "react";
import { fmtRate, fmtCount, type BattingLine } from "@/lib/stats";

type P = { slug: string; name: string; number: string | null; line: BattingLine };
const ROWS: { k: keyof BattingLine; label: string; rate?: boolean; lowerBetter?: boolean }[] = [
  { k: "g", label: "Games" }, { k: "pa", label: "Plate appearances" }, { k: "h", label: "Hits" }, { k: "2b", label: "Doubles" },
  { k: "3b", label: "Triples" }, { k: "hr", label: "Home runs" }, { k: "rbi", label: "RBI" }, { k: "r", label: "Runs" },
  { k: "bb", label: "Walks" }, { k: "k", label: "Strikeouts", lowerBetter: true }, { k: "tb", label: "Total bases" },
  { k: "avg", label: "AVG", rate: true }, { k: "obp", label: "OBP", rate: true }, { k: "slg", label: "SLG", rate: true }, { k: "ops", label: "OPS", rate: true },
];

export function Compare({ players }: { players: P[] }) {
  const [a, setA] = useState(players[0]?.slug ?? "");
  const [b, setB] = useState(players[1]?.slug ?? "");
  // Shareable links: ?a=troy&b=dan
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("a") && players.some((p) => p.slug === q.get("a"))) setA(q.get("a")!);
    if (q.get("b") && players.some((p) => p.slug === q.get("b"))) setB(q.get("b")!);
  }, [players]);
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("a", a); url.searchParams.set("b", b);
    window.history.replaceState(null, "", url);
  }, [a, b]);
  const pa = players.find((p) => p.slug === a)!, pb = players.find((p) => p.slug === b)!;
  if (!pa || !pb) return null;
  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3">
        {([["Player 1", a, setA], ["Player 2", b, setB]] as const).map(([label, val, set]) => (
          <label key={label} className="text-[0.82rem] text-mute">
            {label}
            <select value={val} onChange={(e) => set(e.target.value)} className="mt-1 block w-full rounded border border-line bg-pitch px-3 py-2 text-[0.95rem] font-semibold text-chalk">
              {players.map((p) => <option key={p.slug} value={p.slug}>{p.name}{p.number ? ` #${p.number}` : ""}</option>)}
            </select>
          </label>
        ))}
      </div>
      <div className="panel overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_1fr] border-b border-line bg-navy/40 px-4 py-3 text-center">
          <div className="wide truncate text-[1.1rem] font-black">{pa.name}</div>
          <div className="w-28 sm:w-40" />
          <div className="wide truncate text-[1.1rem] font-black">{pb.name}</div>
        </div>
        {ROWS.map((r) => {
          const va = pa.line[r.k] as number | null, vb = pb.line[r.k] as number | null;
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
      {pa.line.g === null && pb.line.g === null && <p className="mt-3 text-[0.85rem] text-mute">Neither player has batting data entered yet, so every value shows as a dash.</p>}
    </>
  );
}
