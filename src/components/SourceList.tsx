import { getEvidence } from "@/lib/data";
import { ConfidenceBadge } from "./ui";
import type { Confidence } from "@/lib/types";

export function SourceList({ ids, rows }: { ids: string[]; rows?: { label: string; level: Confidence; note?: string | null }[] }) {
  return (
    <div className="panel p-4 text-[0.88rem]">
      {rows && rows.length > 0 && (
        <dl className="mb-4 space-y-2.5 border-b border-line-soft pb-4">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-mute">{r.label}</dt>
                <dd><ConfidenceBadge level={r.level} /></dd>
              </div>
              {r.note && <p className="mt-1 text-[0.8rem] leading-relaxed text-dim">{r.note}</p>}
            </div>
          ))}
        </dl>
      )}
      <div className="kicker mb-2">Sources</div>
      <ul className="space-y-2">
        {ids.map((id) => {
          const e = getEvidence(id);
          if (!e) return null;
          return (
            <li key={id} className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mute" aria-hidden />
              <div>
                {e.public_url ? <a href={e.public_url} className="font-semibold hover:text-cardinal-hi">{e.title}</a> : <span className="font-semibold">{e.title}</span>}
                <div className="text-[0.78rem] text-mute">
                  {e.kind === "teamsideline_export" ? "TeamSideline standings & results export" : e.kind === "physical_plaque" ? "Photo of physical plaque" : "Direct confirmation"} · {e.coverage}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
