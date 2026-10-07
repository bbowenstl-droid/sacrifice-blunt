import Link from "next/link";
import type { Season, SeasonGap } from "@/lib/types";
import { rec, ordinal } from "@/lib/format";

/**
 * Season-by-season regular-season win percentage, one bar per session in chronological
 * order. Missing sessions keep their slot (hatched) so gaps in the record stay visible.
 * Title seasons are gold AND carry a small banner marker, so identity is never color-only.
 */
export function SeasonChart({ seasons, gaps }: { seasons: Season[]; gaps: SeasonGap[] }) {
  type Slot = { kind: "season"; s: Season } | { kind: "gap"; g: SeasonGap };
  const slots: Slot[] = [
    ...seasons.map((s) => ({ kind: "season" as const, s, k: s.sort_key })),
    ...gaps.map((g) => ({ kind: "gap" as const, g, k: g.sort_key })),
  ].sort((a, b) => a.k - b.k);
  const H = 150;
  const firstSb = slots.findIndex((x) => x.kind === "season" && x.s.era_id === "sacrifice-blunt");
  let lastCotc = -1;
  slots.forEach((x, i) => { if (x.kind === "season" && x.s.era_id === "cotc") lastCotc = i; });
  return (
    <figure>
      <div className="scroller -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="relative min-w-[640px]">
          {/* 50% reference */}
          <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line" style={{ top: 22 + H / 2 }}>
            <span className="absolute -top-2.5 right-0 bg-night pl-1 text-[0.65rem] text-dim">.500</span>
          </div>
          <ol className="relative grid items-end gap-[6px]" style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))` }}>
            {slots.map((slot, i) => {
              if (slot.kind === "gap") {
                return (
                  <li key={`g${i}`} className="flex flex-col items-center" title={`${slot.g.session} ${slot.g.year}: no record supplied`}>
                    <div className="h-[22px]" />
                    <div className="flex w-full items-end" style={{ height: H }}>
                      <div className="h-[18px] w-full rounded-t-[4px] border border-dashed border-line/80 bg-[repeating-linear-gradient(135deg,transparent_0_4px,rgb(255_255_255/0.05)_4px_5px)]" />
                    </div>
                    <div className="mt-2 text-center text-[0.62rem] leading-tight text-dim">{slot.g.session.slice(0, 2)}<br />{String(slot.g.year).slice(2)}</div>
                  </li>
                );
              }
              const s = slot.s;
              const p = s.regular_wins / (s.regular_wins + s.regular_losses + s.regular_ties);
              const h = Math.max(4, p * H);
              const label = `${s.session} ${s.year} (${s.team_name_at_time}): ${rec(s.regular_wins, s.regular_losses)} regular season, ${ordinal(s.regular_place)} place${s.champion ? ", champion" : ""}`;
              return (
                <li key={s.id} className={`flex flex-col items-center ${i === firstSb ? "relative" : ""}`}>
                  <Link href={`/seasons/${s.slug}`} aria-label={label} title={label} className="group flex w-full flex-col items-center">
                    <div className="h-[22px] text-[0.7rem] font-bold">
                      {s.champion ? (
                        <svg viewBox="0 0 10 14" className="h-[14px] w-[10px] fill-gold" aria-hidden><path d="M0 0h10v14L5 11 0 14z" /></svg>
                      ) : null}
                    </div>
                    <div className="flex w-full items-end" style={{ height: H }}>
                      <div
                        className={`w-full rounded-t-[4px] transition-opacity group-hover:opacity-80 ${s.champion ? "bg-gold" : s.undefeated ? "bg-cardinal" : "bg-chalk/75"}`}
                        style={{ height: h }}
                      />
                    </div>
                    <div className="num mt-1 text-[0.68rem] font-bold">{rec(s.regular_wins, s.regular_losses)}</div>
                    <div className="text-center text-[0.62rem] leading-tight text-mute">{s.session.replace("Summer/Fall", "Su/F").slice(0, s.session === "Summer/Fall" ? 4 : 2)}<br />{String(s.year).slice(2)}</div>
                  </Link>
                </li>
              );
            })}
          </ol>
          {/* era rule */}
          <div className="mt-3 grid gap-[6px] text-[0.7rem] font-semibold" style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))` }}>
            <div className="border-t-2 border-mute/60 pt-1 text-mute" style={{ gridColumn: `1 / ${lastCotc + 2}` }}>COTC era</div>
            {firstSb - lastCotc > 1 && (
              <div className="border-t-2 border-dashed border-line pt-1 text-center text-dim" style={{ gridColumn: `${lastCotc + 2} / ${firstSb + 1}` }}>renamed</div>
            )}
            <div className="border-t-2 border-cardinal pt-1 text-cardinal-hi" style={{ gridColumn: `${firstSb + 1} / -1` }}>Sacrifice Blunt era</div>
          </div>
        </div>
      </div>
      <figcaption className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[0.78rem] text-mute">
        <span>Regular-season win percentage by session</span>
        <span className="flex items-center gap-1.5"><svg viewBox="0 0 10 14" className="h-3 w-2 fill-gold" aria-hidden><path d="M0 0h10v14L5 11 0 14z" /></svg>Championship season</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-3 border border-dashed border-line" />No record supplied</span>
      </figcaption>
    </figure>
  );
}
