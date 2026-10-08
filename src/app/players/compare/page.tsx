import type { Metadata } from "next";
import { getPlayers, getAllGames, getPlateAppearances, getPlayerGameStats } from "@/lib/data";
import { battingLine } from "@/lib/stats";
import { Container, PageHeader } from "@/components/ui";
import { Compare } from "./Compare";

export const metadata: Metadata = { title: "Compare players", description: "Head-to-head career batting comparison." };

export default function ComparePage() {
  const games = getAllGames(), pas = getPlateAppearances(), pgs = getPlayerGameStats();
  // Career lines are computed at build time; the browser only switches between them.
  const players = getPlayers().map((p) => ({ slug: p.slug, name: p.name, number: p.number, line: battingLine(p.slug, games, pas, pgs) }));
  return (
    <>
      <PageHeader kicker="Players" title="Compare">Pick two players to line up their career numbers.</PageHeader>
      <Container className="pt-8"><Compare players={players} /></Container>
    </>
  );
}
