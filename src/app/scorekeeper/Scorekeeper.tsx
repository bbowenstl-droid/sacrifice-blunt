"use client";
import { useEffect, useMemo, useState } from "react";
import type { PAResult, PlateAppearance } from "@/lib/types";
import { lineFromPAs, finalize, fmtRate } from "@/lib/stats";

type GameOpt = { id: string; label: string; upcoming: boolean };
type PlayerOpt = { slug: string; name: string; number: string | null };
type State = { gameId: string; lineup: string[]; pas: PlateAppearance[]; current: number; inning: number; teamScore: string; oppScore: string };

const RESULTS: { r: PAResult; label: string; tone: string }[] = [
  { r: "1B", label: "1B", tone: "bg-chalk text-night" },
  { r: "2B", label: "2B", tone: "bg-chalk text-night" },
  { r: "3B", label: "3B", tone: "bg-chalk text-night" },
  { r: "HR", label: "HR", tone: "bg-gold text-night" },
  { r: "BB", label: "BB", tone: "bg-navy-2 text-chalk" },
  { r: "ROE", label: "ROE", tone: "bg-navy-2 text-chalk" },
  { r: "OUT", label: "Out", tone: "bg-pitch text-chalk border border-line" },
  { r: "K", label: "K", tone: "bg-pitch text-chalk border border-line" },
  { r: "SAC", label: "Sac", tone: "bg-pitch text-chalk border border-line" },
  { r: "FC", label: "FC", tone: "bg-pitch text-chalk border border-line" },
];
const KEY = "sb-scorekeeper-v1";
const load = (): State | null => { try { const v = localStorage.getItem(KEY); return v ? JSON.parse(v) : null; } catch { return null; } };
const save = (s: State) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable: keep in memory */ } };

export function Scorekeeper({ games, players }: { games: GameOpt[]; players: PlayerOpt[] }) {
  const defaultGame = games.find((g) => g.upcoming)?.id ?? games[0]?.id ?? "";
  const [s, setS] = useState<State>({ gameId: defaultGame, lineup: [], pas: [], current: 0, inning: 1, teamScore: "", oppScore: "" });
  const [rbi, setRbi] = useState(0);
  const [scored, setScored] = useState(false);
  const [step, setStep] = useState<"game" | "lineup" | "score" | "final">("game");
  const [copied, setCopied] = useState(false);

  useEffect(() => { const v = load(); if (v) { setS(v); if (v.lineup.length) setStep("score"); } }, []);
  useEffect(() => { save(s); }, [s]);

  const name = (slug: string) => players.find((p) => p.slug === slug)?.name ?? slug;
  const batter = s.lineup[s.current % Math.max(1, s.lineup.length)];
  const teamHR = s.pas.filter((p) => p.result === "HR").length;
  const box = useMemo(() => s.lineup.map((slug) => ({ slug, line: finalize(lineFromPAs(s.pas.filter((p) => p.player_slug === slug)), 1) })), [s.lineup, s.pas]);
  const runs = s.pas.filter((p) => p.run_scored).length;

  function record(result: PAResult) {
    if (!batter) return;
    const pa: PlateAppearance = { game_id: s.gameId, player_slug: batter, pa_index: s.pas.length + 1, inning: s.inning, result, rbi, run_scored: scored || result === "HR", notes: null };
    setS({ ...s, pas: [...s.pas, pa], current: s.current + 1 });
    setRbi(result === "HR" ? 0 : 0); setScored(false);
  }
  function undo() {
    if (!s.pas.length) return;
    setS({ ...s, pas: s.pas.slice(0, -1), current: Math.max(0, s.current - 1) });
  }
  function toggleRun(idx: number) {
    setS({ ...s, pas: s.pas.map((p, i) => (i === idx ? { ...p, run_scored: !p.run_scored } : p)) });
  }
  const exportRows = JSON.stringify(s.pas, null, 2);
  const finalPatch = JSON.stringify({ game_id: s.gameId, team_score: Number(s.teamScore), opponent_score: Number(s.oppScore), status: "final", plate_appearances: s.pas.length }, null, 2);

  function download() {
    const blob = new Blob([exportRows], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `${s.gameId}-plate-appearances.json`; a.click();
  }

  return (
    <div className="space-y-6">
      <ol className="flex gap-2 text-[0.8rem] font-semibold">
        {(["game", "lineup", "score", "final"] as const).map((k, i) => (
          <li key={k}>
            <button onClick={() => setStep(k)} className={`rounded-full border px-3 py-1 ${step === k ? "border-chalk bg-chalk text-night" : "border-line text-mute"}`}>
              {i + 1}. {{ game: "Game", lineup: "Lineup", score: "Score", final: "Finalize" }[k]}
            </button>
          </li>
        ))}
      </ol>

      {step === "game" && (
        <div className="panel p-5">
          <label className="text-[0.85rem] text-mute">Choose game
            <select value={s.gameId} onChange={(e) => setS({ ...s, gameId: e.target.value })} className="mt-1 block w-full rounded border border-line bg-night px-3 py-2.5 text-chalk">
              {games.map((g) => <option key={g.id} value={g.id}>{g.label}{g.upcoming ? " · upcoming" : ""}</option>)}
            </select>
          </label>
          <button onClick={() => setStep("lineup")} className="mt-4 rounded bg-chalk px-4 py-2.5 font-bold text-night">Set lineup</button>
        </div>
      )}

      {step === "lineup" && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="panel p-4">
            <div className="kicker mb-2">Tap to add to the batting order</div>
            <ul className="grid grid-cols-2 gap-2">
              {players.filter((p) => !s.lineup.includes(p.slug)).map((p) => (
                <li key={p.slug}><button onClick={() => setS({ ...s, lineup: [...s.lineup, p.slug] })} className="w-full rounded border border-line px-3 py-3 text-left text-[0.92rem] font-semibold hover:border-chalk">{p.number ? `#${p.number} ` : ""}{p.name}</button></li>
              ))}
            </ul>
          </div>
          <div className="panel p-4">
            <div className="kicker mb-2">Batting order</div>
            <ol className="space-y-1.5">
              {s.lineup.map((slug, i) => (
                <li key={slug} className="flex items-center gap-3 rounded border border-line-soft px-3 py-2">
                  <span className="num w-5 text-mute">{i + 1}</span><span className="flex-1 font-semibold">{name(slug)}</span>
                  <button aria-label="Move up" disabled={i === 0} onClick={() => { const l = [...s.lineup]; [l[i - 1], l[i]] = [l[i], l[i - 1]]; setS({ ...s, lineup: l }); }} className="px-2 text-mute disabled:opacity-30">↑</button>
                  <button aria-label="Remove" onClick={() => setS({ ...s, lineup: s.lineup.filter((x) => x !== slug) })} className="px-2 text-mute">✕</button>
                </li>
              ))}
            </ol>
            <button disabled={!s.lineup.length} onClick={() => setStep("score")} className="mt-4 rounded bg-chalk px-4 py-2.5 font-bold text-night disabled:opacity-40">Start scoring</button>
          </div>
        </div>
      )}

      {step === "score" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="panel p-4">
            <div className="flex items-center justify-between text-[0.85rem] text-mute">
              <span>Inning <button onClick={() => setS({ ...s, inning: Math.max(1, s.inning - 1) })} className="px-2">−</button><span className="num font-bold text-chalk">{s.inning}</span><button onClick={() => setS({ ...s, inning: s.inning + 1 })} className="px-2">+</button></span>
              <span>Runs <span className="num font-bold text-chalk">{runs}</span> · Team HR <span className={`num font-bold ${teamHR >= 3 ? "text-cardinal-hi" : "text-chalk"}`}>{teamHR}</span>/3</span>
            </div>
            <div className="mt-4 text-[0.8rem] text-mute">At bat</div>
            <div className="wide text-[1.8rem] font-black">{batter ? name(batter) : "Set a lineup"}</div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {RESULTS.map((x) => (
                <button key={x.r} onClick={() => record(x.r)} className={`rounded py-4 text-[1rem] font-black active:scale-95 ${x.tone}`}>{x.label}</button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-[0.9rem]">
              <span>RBI <button onClick={() => setRbi(Math.max(0, rbi - 1))} className="px-2 text-mute">−</button><span className="num font-bold">{rbi}</span><button onClick={() => setRbi(Math.min(4, rbi + 1))} className="px-2 text-mute">+</button></span>
              <label className="flex items-center gap-2"><input type="checkbox" checked={scored} onChange={(e) => setScored(e.target.checked)} className="accent-cardinal" /> Batter scored</label>
              <button onClick={undo} className="ml-auto rounded border border-line px-3 py-1.5 text-mute">Undo last</button>
            </div>
            <div className="mt-5 max-h-56 overflow-auto border-t border-line-soft pt-3 text-[0.85rem]">
              {[...s.pas].reverse().map((p) => {
                const idx = p.pa_index - 1;
                return (
                  <div key={p.pa_index} className="flex items-center justify-between border-b border-line-soft py-1.5">
                    <span><span className="text-dim">{p.inning}·</span> {name(p.player_slug)} <strong>{p.result}</strong>{p.rbi ? ` · ${p.rbi} RBI` : ""}</span>
                    <button onClick={() => toggleRun(idx)} className={`rounded px-2 py-0.5 text-[0.72rem] font-bold ${p.run_scored ? "bg-mask/20 text-mask" : "text-dim"}`}>{p.run_scored ? "Scored" : "Mark scored"}</button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="scroller panel px-2">
            <table className="stat-table text-[0.86rem]">
              <thead><tr><th>Batter</th><th>PA</th><th>AB</th><th>R</th><th>H</th><th>HR</th><th>RBI</th><th>BB</th><th>AVG</th></tr></thead>
              <tbody>
                {box.map(({ slug, line }, i) => (
                  <tr key={slug} className={slug === batter ? "bg-mask/10" : ""}>
                    <td><span className="num mr-2 text-dim">{i + 1}</span>{name(slug)}</td>
                    <td>{line.pa}</td><td>{line.ab}</td><td>{line.r}</td><td>{line.h}</td><td>{line.hr}</td><td>{line.rbi}</td><td>{line.bb}</td><td>{fmtRate(line.avg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === "final" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="panel p-5">
            <div className="kicker mb-3">Final score</div>
            <div className="flex items-center gap-3">
              <input inputMode="numeric" value={s.teamScore} onChange={(e) => setS({ ...s, teamScore: e.target.value.replace(/\D/g, "") })} placeholder="Us" className="w-24 rounded border border-line bg-night px-3 py-2 text-center text-[1.4rem] font-black" />
              <span className="text-mute">–</span>
              <input inputMode="numeric" value={s.oppScore} onChange={(e) => setS({ ...s, oppScore: e.target.value.replace(/\D/g, "") })} placeholder="Them" className="w-24 rounded border border-line bg-night px-3 py-2 text-center text-[1.4rem] font-black" />
            </div>
            {s.teamScore && Number(s.teamScore) !== runs && <p className="mt-2 text-[0.82rem] text-gold-hi">Runs marked as scored ({runs}) don&apos;t match the final score. Check the log before exporting.</p>}
            <pre className="mt-4 overflow-auto rounded bg-night p-3 text-[0.75rem] text-mute">{finalPatch}</pre>
          </div>
          <div className="panel p-5">
            <div className="kicker mb-3">Export {s.pas.length} plate appearances</div>
            <div className="flex flex-wrap gap-2">
              <button onClick={download} className="rounded bg-chalk px-4 py-2 font-bold text-night">Download JSON</button>
              <button onClick={async () => { try { await navigator.clipboard.writeText(exportRows); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { setCopied(false); } }} className="rounded border border-line px-4 py-2 font-semibold">{copied ? "Copied" : "Copy JSON"}</button>
              <button onClick={() => { if (confirm("Clear this game from this device?")) { setS({ gameId: defaultGame, lineup: [], pas: [], current: 0, inning: 1, teamScore: "", oppScore: "" }); setStep("game"); } }} className="rounded border border-line px-4 py-2 text-mute">Start a new game</button>
            </div>
            <p className="mt-3 text-[0.82rem] text-mute">This file stays on your phone until you send it. The site maintainer appends it to <code>data/manual/plate-appearances.json</code> and republishes; then the box score, player stats and records update for everyone.</p>
          </div>
        </div>
      )}
    </div>
  );
}
