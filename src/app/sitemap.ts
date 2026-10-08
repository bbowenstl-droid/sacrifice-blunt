import type { MetadataRoute } from "next";
import { getSeasons, getAllGames, getChampionships, getPlayers, opponentIndex } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "", "/schedule", "/seasons", "/championships", "/history", "/records", "/players", "/players/compare", "/opponents", "/sources",
    ...getSeasons().flatMap((s) => [`/seasons/${s.slug}`, `/schedule/${s.slug}`]),
    ...getChampionships().map((c) => `/championships/${c.slug}`),
    ...getAllGames().map((g) => `/games/${g.slug}`),
    ...getPlayers().map((p) => `/players/${p.slug}`),
    ...opponentIndex().map((o) => `/opponents/${o.opponent.slug}`),
  ];
  return paths.map((p) => ({ url: `${SITE_URL}${p}/` }));
}
