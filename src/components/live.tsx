"use client";
/**
 * Time-aware bits for the static site. The HTML is built ahead of time, so "Tonight",
 * "Under way" and "Result pending" are worked out in the visitor's browser.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { liveStatus, gameStart, sameChicagoDay, type LiveStatus } from "@/lib/time";

function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

type TimedGame = { date: string; time: string; status: string; result: string | null };

export function LiveStatusText({ game }: { game: TimedGame }) {
  const now = useNow();
  // Before the browser clock is known, show the scheduled time (or the stored status for old games).
  const st: LiveStatus = now ? liveStatus(game, now) : game.status === "final_result_only" ? "final_result_only" : "scheduled";
  if (st === "scheduled") return <span className="text-mask">{game.time}</span>;
  if (st === "in_progress") return <span className="flex items-center gap-1.5 text-mask"><span className="live-dot h-1.5 w-1.5 rounded-full bg-mask" />Under way</span>;
  if (st === "awaiting") return <span className="text-mute">Result pending</span>;
  if (st === "unreported") return <span className="text-dim">No result posted</span>;
  if (st === "final_result_only") return <span className="text-mute">{game.result === "W" ? "Win" : "Loss"} · no score</span>;
  return null;
}

export type CardGame = TimedGame & {
  slug: string; opponent: string; home_away: "home" | "away"; field: string | null;
  label: string; dateLabel: string;
};

export function NextGameCard({ games, footer }: { games: CardGame[]; footer: string }) {
  const now = useNow();
  // Next game = first one not yet more than ~70 minutes past its start.
  // If nothing is left to play, keep showing the most recent game for a few days while its result is pending.
  const next = now
    ? games.find((g) => gameStart(g).getTime() + 70 * 60 * 1000 > now.getTime())
      ?? [...games].reverse().find((g) => now.getTime() - gameStart(g).getTime() < 3 * 24 * 60 * 60 * 1000) ?? null
    : games[0] ?? null;
  if (!next) {
    return <div className="panel p-4 text-[0.9rem] text-mute">No upcoming games on the schedule yet. Check back when the next schedule is posted.</div>;
  }
  const st = now ? liveStatus(next, now) : "scheduled";
  const heading = !now ? "Next game"
    : st === "in_progress" ? "Under way"
    : st === "awaiting" ? (sameChicagoDay(gameStart(next), now) ? "Tonight · result pending" : "Result pending")
    : sameChicagoDay(gameStart(next), now) ? "Tonight" : "Next game";
  return (
    <Link href={`/games/${next.slug}/`} className="panel block overflow-hidden border-line transition-colors hover:border-mask/50">
      <div className="flex items-center justify-between border-b border-line-soft px-4 py-2 text-[0.78rem] font-semibold">
        <span className="flex items-center gap-2 text-mask">
          <span className="live-dot h-2 w-2 rounded-full bg-mask" />
          {heading}
        </span>
        <span className="text-mute">{next.label}</span>
      </div>
      <div className="px-4 py-4">
        <div className="text-[0.82rem] text-mute">{next.home_away === "home" ? "vs" : "at"}</div>
        <div className="wide text-[1.6rem] font-black leading-tight">{next.opponent}</div>
        <div className="mt-3 flex items-center gap-3 text-[0.9rem]">
          <span className="font-semibold">{next.dateLabel}</span>
          <span className="text-mute">{next.time}</span>
          {next.field && <span className="text-mute">Field {next.field.replace("F", "")}</span>}
        </div>
      </div>
      <div className="border-t border-line-soft bg-navy/40 px-4 py-2 text-[0.78rem] text-mute">{footer}</div>
    </Link>
  );
}
