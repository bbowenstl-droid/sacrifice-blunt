import Link from "next/link";
import type { Game, LeagueGame, StandingRow } from "@/lib/types";
import { getSeason, opponentName, liveStatus, getOpponent, getGames } from "@/lib/data";
import { fmtDate, fmtPct } from "@/lib/format";
import { ResultChip, Tag } from "./ui";

export function StatusText({ game, now }: { game: Game; now?: Date }) {
  const st = liveStatus(game, now);
  if (st === "scheduled") return <span className="text-mask">{game.time}</span>;
  if (st === "in_progress") return <span className="flex items-center gap-1.5 text-mask"><span className="live-dot h-1.5 w-1.5 rounded-full bg-mask" />Under way</span>;
  if (st === "awaiting") return <span className="text-mute">Result pending</span>;
  if (st === "unreported") return <span className="text-dim">No result posted</span>;
  if (st === "final_result_only") return <span className="text-mute">{game.result === "W" ? "Win" : "Loss"} · no score</span>;
  return null;
}

/** A single game row — scoreboard style. Works from 320px up. */
export function GameRow({ game, showSeason = false, now }: { game: Game; showSeason?: boolean; now?: Date }) {
  const season = getSeason(game.season_id)!;
  const opp = opponentName(game.opponent_id);
  const scored = game.status === "final";
  return (
    <Link
      href={`/games/${game.slug}`}
      className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-line-soft px-1 py-2.5 transition-colors hover:bg-white/[0.025] sm:grid-cols-[88px_auto_1fr_auto] sm:px-2"
    >
      <div className="hidden text-[0.8rem] text-mute sm:block">
        <div className="font-semibold text-chalk/90">{fmtDate(game.date, { weekday: true })}</div>
        <div>{showSeason ? `${season.session} ${season.year}` : `${game.time}${game.field ? ` · ${game.field}` : ""}`}</div>
      </div>
      <ResultChip result={game.result} title={game.is_title_game} />
      <div className="min-w-0">
        <div className="truncate text-[0.95rem] font-semibold">
          <span className="text-mute">{game.home_away === "home" ? "vs" : "at"}</span> {opp}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[0.75rem] text-mute">
          <span className="sm:hidden">{fmtDate(game.date)}{showSeason ? ` · ${season.session} ${season.year}` : ` · ${game.time}`}</span>
          {game.stage === "postseason" && <Tag tone={game.is_title_game ? "gold" : "default"}>{game.is_title_game ? "Title game" : game.playoff_round_label?.replace(/ - .*/, "") ?? "Playoffs"}</Tag>}
          {game.team_name_at_time === "COTC" && showSeason && <Tag>COTC</Tag>}
        </div>
      </div>
      <div className="num text-right">
        {scored ? (
          <span className="display text-[1.35rem]">
            <span className={game.result === "W" ? "text-chalk" : "text-mute"}>{game.team_score}</span>
            <span className="mx-1 text-dim">–</span>
            <span className={game.result === "L" ? "text-chalk" : "text-mute"}>{game.opponent_score}</span>
          </span>
        ) : (
          <span className="text-[0.8rem]"><StatusText game={game} now={now} /></span>
        )}
      </div>
    </Link>
  );
}

export function GameList({ games, showSeason, now, empty }: { games: Game[]; showSeason?: boolean; now?: Date; empty?: string }) {
  if (!games.length) return <p className="py-6 text-center text-mute">{empty ?? "No games recorded."}</p>;
  return <div className="border-t border-line-soft">{games.map((g) => <GameRow key={g.id} game={g} showSeason={showSeason} now={now} />)}</div>;
}

export function StandingsTable({ rows, compact = false }: { rows: StandingRow[]; compact?: boolean }) {
  return (
    <div className="scroller">
      <table className="stat-table text-[0.9rem]">
        <thead>
          <tr>
            <th className="w-8">#</th>
            <th style={{ textAlign: "left" }}>Team</th>
            <th>W</th><th>L</th>{!compact && <th>T</th>}<th>PCT</th><th>GB</th>{!compact && <th>Streak</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const opp = r.opponent_id && getGames({ opponentId: r.opponent_id }).length ? getOpponent(r.opponent_id) : null;
            return (
              <tr key={r.team} className={r.is_franchise ? "bg-cardinal/[0.13] font-bold" : ""}>
                <td className="text-mute">{r.place}</td>
                <td style={{ textAlign: "left" }}>
                  {r.is_franchise ? (
                    <span className="flex items-center gap-2"><span className="h-3 w-[3px] rounded bg-cardinal" />{r.team}</span>
                  ) : opp ? <Link className="hover:text-cardinal-hi" href={`/opponents/${opp.slug}`}>{r.team}</Link> : r.team}
                </td>
                <td>{r.w}</td><td>{r.l}</td>{!compact && <td>{r.t}</td>}<td>{fmtPct(r.pct)}</td><td className="text-mute">{r.gb}</td>
                {!compact && <td className="text-mute">{r.streak}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const isOurs = (t: string) => t === "Sacrifice Blunt" || t === "COTC";

/** Playoff bracket as rounds of matchups (league-wide), highlighting our games. */
export function Bracket({ games }: { games: LeagueGame[] }) {
  const post = games.filter((g) => g.stage === "postseason");
  if (!post.length) return null;
  const rounds = [...new Set(post.map((g) => g.round))].sort((a, b) => (a ?? 0) - (b ?? 0));
  return (
    <div className="grid gap-4 md:grid-flow-col md:auto-cols-fr">
      {rounds.map((r) => {
        const list = post.filter((g) => g.round === r);
        return (
          <div key={r ?? 0}>
            <div className="kicker mb-2">{list[0].round_label?.replace("Playoff ", "")}</div>
            <div className="space-y-2">
              {list.map((g, i) => (
                <div key={i} className={`panel overflow-hidden text-[0.88rem] ${[g.away, g.home].some(isOurs) ? "border-cardinal/50" : ""}`}>
                  <div className="flex items-center justify-between border-b border-line-soft px-3 py-1 text-[0.7rem] text-mute">
                    <span>{g.bracket_game} · {fmtDate(g.date)} · {g.time}</span><span>{g.field}</span>
                  </div>
                  {(["away", "home"] as const).map((side) => {
                    const team = g[side];
                    const score = g[`${side}_score`];
                    const res = g[`${side}_result`];
                    const other = side === "away" ? g.home_score : g.away_score;
                    const won = score !== null && other !== null ? score > other : res === "W";
                    return (
                      <div key={side} className={`flex items-center justify-between px-3 py-1.5 ${isOurs(team) ? "font-bold" : ""} ${won ? "" : "text-mute"}`}>
                        <span className="flex items-center gap-2 truncate">
                          {isOurs(team) && <span className="h-3 w-[3px] rounded bg-cardinal" />}
                          <span className={/Winner|Loser/.test(team) ? "italic text-dim" : ""}>{team}</span>
                        </span>
                        <span className="num font-bold">{score ?? res ?? ""}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
