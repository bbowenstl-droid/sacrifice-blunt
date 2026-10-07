import { getAllGames, getPlayers, opponentName, getSeason, liveStatus } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { Container } from "@/components/ui";
import { Scorekeeper } from "./Scorekeeper";

export default function ScorekeeperPage() {
  const now = new Date();
  const games = [...getAllGames()].reverse().slice(0, 60).map((g) => {
    const s = getSeason(g.season_id)!;
    return { id: g.id, upcoming: ["scheduled", "in_progress", "awaiting"].includes(liveStatus(g, now)), label: `${fmtDate(g.date, { year: true })} ${g.time} ${g.home_away === "home" ? "vs" : "at"} ${opponentName(g.opponent_id)} (${s.session} ${s.year})` };
  });
  const players = getPlayers().map((p) => ({ slug: p.slug, name: p.name, number: p.number }));
  return (
    <Container className="py-8">
      <h1 className="display text-[2.2rem]">Scorekeeper</h1>
      <p className="mb-6 mt-2 max-w-2xl text-mute">Choose the game, set the batting order, then tap each batter&apos;s result. Everything saves on this device as you go, so a dropped signal at the field won&apos;t lose the game.</p>
      <Scorekeeper games={games} players={players} />
    </Container>
  );
}
