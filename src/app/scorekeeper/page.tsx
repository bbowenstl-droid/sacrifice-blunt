import type { Metadata } from "next";
import { getAllGames, getPlayers, opponentName, getSeason, pendingGames } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { Container } from "@/components/ui";
import { Scorekeeper } from "./Scorekeeper";

export const metadata: Metadata = {
  title: "Scorekeeper",
  description: "Score a game on your phone and export the plate appearances.",
  robots: { index: false, follow: false },
};

export default function ScorekeeperPage() {
  const pending = new Set(pendingGames().map((g) => g.id));
  const games = [...getAllGames()].reverse().slice(0, 60).map((g) => {
    const s = getSeason(g.season_id)!;
    return { id: g.id, upcoming: pending.has(g.id), label: `${fmtDate(g.date, { year: true })} ${g.time} ${g.home_away === "home" ? "vs" : "at"} ${opponentName(g.opponent_id)} (${s.session} ${s.year})` };
  });
  const players = getPlayers().map((p) => ({ slug: p.slug, name: p.name, number: p.number }));
  return (
    <Container className="py-8">
      <h1 className="display text-[2.2rem]">Scorekeeper</h1>
      <div className="mt-4 max-w-2xl rounded-md border border-gold/50 bg-gold/[0.07] p-4 text-[0.92rem] leading-relaxed">
        <div className="font-bold text-gold-hi">Saves to this phone only</div>
        <p className="mt-1 text-chalk/85">
          This tool keeps the game on the device you&apos;re scoring on. Nothing you enter here is sent anywhere or changes the public site, and other people
          won&apos;t see it. When the game is over, export the plate appearances and send the file to whoever updates the site. They&apos;ll add it to the data and publish it.
        </p>
      </div>
      <p className="mb-6 mt-4 max-w-2xl text-mute">Choose the game, set the batting order, then tap each batter&apos;s result. Progress saves as you go, so a dropped signal at the field won&apos;t lose the game.</p>
      <Scorekeeper games={games} players={players} />
    </Container>
  );
}
