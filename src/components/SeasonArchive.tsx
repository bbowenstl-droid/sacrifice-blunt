"use client";
import Link from "next/link";
import { useState } from "react";
import type { Season, SeasonGap } from "@/lib/types";
import { CONFIDENCE, rec, ordinal } from "@/lib/format";

type Filter = "all" | "cotc" | "sacrifice-blunt" | "champions";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All seasons" },
  { id: "cotc", label: "COTC era" },
  { id: "sacrifice-blunt", label: "Sacrifice Blunt era" },
  { id: "champions", label: "Championships" },
];

export function SeasonArchive({ seasons, gaps }: { seasons: Season[]; gaps: SeasonGap[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [showGaps, setShowGaps] = useState(true);
  const list = seasons.filter((s) =>
    filter === "all" ? true : filter === "champions" ? s.champion : s.era_id === filter);
  type Row = { kind: "s"; s: Season; k: number } | { kind: "g"; g: SeasonGap; k: number };
  const rows: Row[] = [
    ...list.map((s) => ({ kind: "s" as const, s, k: s.sort_key })),
    ...(showGaps && filter === "all" ? gaps.map((g) => ({ kind: "g" as const, g, k: g.sort_key })) : []),
  ].sort((a, b) => b.k - a.k);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2" role="toolbar" aria-label="Filter seasons">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={`rounded-full border px-3.5 py-1.5 text-[0.85rem] font-semibold transition-colors ${
              filter === f.id ? "border-chalk bg-chalk text-night" : "border-line text-mute hover:text-chalk"
            }`}
          >
            {f.label}
            <span className="num ml-1.5 opacity-60">
              {f.id === "all" ? seasons.length : f.id === "champions" ? seasons.filter((s) => s.champion).length : seasons.filter((s) => s.era_id === f.id).length}
            </span>
          </button>
        ))}
        {filter === "all" && (
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-[0.82rem] text-mute">
            <input type="checkbox" checked={showGaps} onChange={(e) => setShowGaps(e.target.checked)} className="accent-cardinal" />
            Show sessions with no record
          </label>
        )}
      </div>

      {/* desktop table */}
      <div className="hidden md:block">
        <table className="stat-table text-[0.92rem]">
          <thead>
            <tr>
              <th>Season</th><th style={{ textAlign: "left" }}>Team</th><th style={{ textAlign: "left" }}>Division</th>
              <th>Regular</th><th>Place</th><th>Postseason</th><th style={{ textAlign: "left" }}>Finish</th><th style={{ textAlign: "left" }}>Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) =>
              r.kind === "g" ? (
                <tr key={`g-${r.k}`} className="text-dim">
                  <td>{r.g.session} {r.g.year}</td>
                  <td colSpan={7} style={{ textAlign: "left" }} className="italic">No record supplied</td>
                </tr>
              ) : (
                <tr key={r.s.id} className={r.s.champion ? "bg-gold/[0.06]" : ""}>
                  <td>
                    <Link href={`/seasons/${r.s.slug}`} className="flex items-center gap-2 font-bold hover:text-cardinal-hi">
                      {r.s.champion ? <span className="h-3.5 w-[3px] rounded bg-gold" aria-hidden /> : <span className="w-[3px]" />}
                      {r.s.session} {r.s.year}
                    </Link>
                  </td>
                  <td style={{ textAlign: "left" }} className={r.s.team_name_at_time === "COTC" ? "text-mute" : ""}>{r.s.team_name_at_time}</td>
                  <td style={{ textAlign: "left" }} className="text-mute">{r.s.division}</td>
                  <td className="num font-bold">{rec(r.s.regular_wins, r.s.regular_losses)}</td>
                  <td>{ordinal(r.s.regular_place)}<span className="text-dim">/{r.s.league_size}</span></td>
                  <td className="num">{rec(r.s.postseason_wins, r.s.postseason_losses)}</td>
                  <td style={{ textAlign: "left" }}><Finish s={r.s} /></td>
                  <td style={{ textAlign: "left" }} className="text-[0.78rem] text-mute">{CONFIDENCE[r.s.confidence].short}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {/* mobile cards */}
      <ul className="space-y-2 md:hidden">
        {rows.map((r) =>
          r.kind === "g" ? (
            <li key={`g-${r.k}`} className="rounded-md border border-dashed border-line-soft px-4 py-2.5 text-[0.85rem] text-dim">
              {r.g.session} {r.g.year} · no record supplied
            </li>
          ) : (
            <li key={r.s.id}>
              <Link href={`/seasons/${r.s.slug}`} className={`panel flex items-center gap-4 p-4 ${r.s.champion ? "border-gold/40" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-bold">
                    {r.s.session} {r.s.year}
                    {r.s.team_name_at_time === "COTC" && <span className="rounded border border-line px-1 text-[0.65rem] text-mute">COTC</span>}
                  </div>
                  <div className="mt-0.5 truncate text-[0.78rem] text-mute">{r.s.division}</div>
                  <div className="mt-1.5 text-[0.8rem]"><Finish s={r.s} /></div>
                </div>
                <div className="text-right">
                  <div className="display num text-[1.6rem]">{rec(r.s.regular_wins, r.s.regular_losses)}</div>
                  <div className="text-[0.75rem] text-mute">{ordinal(r.s.regular_place)} of {r.s.league_size}</div>
                </div>
              </Link>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

function Finish({ s }: { s: Season }) {
  if (s.champion) return <span className="font-bold text-gold-hi">Champion{s.undefeated ? " · undefeated" : ""}</span>;
  if (s.title_under_review) return <span className="text-gold">Won title game · under review</span>;
  if (s.playoff_finish) return <span className="text-chalk/85">{s.playoff_finish}</span>;
  if (s.playoff_status_note) return <span className="text-mask">{s.playoff_status_note}</span>;
  return <span className="text-dim">Not recorded</span>;
}
