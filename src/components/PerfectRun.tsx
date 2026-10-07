import Link from "next/link";
import type { Game } from "@/lib/types";
import { opponentName } from "@/lib/data";
import { fmtDate } from "@/lib/format";

/** Every game of a season as a row of scoreboard tiles: the 14-0 run at a glance. */
export function PerfectRun({ games }: { games: Game[] }) {
  return (
    <ol className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
      {games.map((g, i) => {
        const post = g.stage === "postseason";
        return (
          <li key={g.id}>
            <Link
              href={`/games/${g.slug}`}
              className={`group flex h-full flex-col justify-between rounded-[4px] border p-2 transition-colors ${
                g.is_title_game ? "border-gold bg-gold/15" : post ? "border-gold/40 bg-pitch" : "border-line-soft bg-pitch hover:border-line"
              }`}
              title={`Game ${i + 1}: ${g.result} ${g.team_score}-${g.opponent_score} ${g.home_away === "home" ? "vs" : "at"} ${opponentName(g.opponent_id)}, ${fmtDate(g.date, { year: true })}`}
            >
              <div className="flex items-center justify-between text-[0.62rem] font-bold text-mute">
                <span className="num">{i + 1}</span>
                <span className={g.is_title_game ? "text-gold-hi" : post ? "text-gold" : ""}>{g.is_title_game ? "Final" : post ? "PO" : g.result}</span>
              </div>
              <div className="display num mt-2 whitespace-nowrap text-[1.15rem] leading-none sm:text-[1.4rem]">
                {g.team_score}<span className="text-dim">-</span><span className="text-mute">{g.opponent_score}</span>
              </div>
              <div className="mt-1.5 truncate text-[0.62rem] text-mute">{opponentName(g.opponent_id)}</div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
