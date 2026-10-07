import type { BattingLine } from "@/lib/stats";
import { fmtRate, fmtCount } from "@/lib/stats";

const COLS: { k: keyof BattingLine; label: string; rate?: boolean }[] = [
  { k: "g", label: "G" }, { k: "pa", label: "PA" }, { k: "ab", label: "AB" }, { k: "r", label: "R" }, { k: "h", label: "H" },
  { k: "1b", label: "1B" }, { k: "2b", label: "2B" }, { k: "3b", label: "3B" }, { k: "hr", label: "HR" }, { k: "rbi", label: "RBI" },
  { k: "bb", label: "BB" }, { k: "k", label: "K" }, { k: "sac", label: "SAC" }, { k: "roe", label: "ROE" }, { k: "tb", label: "TB" }, { k: "xbh", label: "XBH" },
  { k: "avg", label: "AVG", rate: true }, { k: "obp", label: "OBP", rate: true }, { k: "slg", label: "SLG", rate: true }, { k: "ops", label: "OPS", rate: true },
];

export function BattingTable({ rows }: { rows: { label: React.ReactNode; line: BattingLine; strong?: boolean }[] }) {
  return (
    <div className="scroller panel px-1">
      <table className="stat-table text-[0.86rem]">
        <thead>
          <tr><th className="sticky left-0 bg-pitch">Split</th>{COLS.map((c) => <th key={c.k}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={r.strong ? "font-bold" : ""}>
              <td className="sticky left-0 bg-pitch">{r.label}</td>
              {COLS.map((c) => {
                const v = r.line[c.k] as number | null;
                return <td key={c.k} className={v === null ? "text-dim" : ""}>{c.rate ? fmtRate(v) : fmtCount(v)}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
