import type { MetadataRoute } from "next";
import { getSeasons, getAllGames, getChampionships, getPlayers, opponentIndex } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const paths = [
    "", "/schedule", "/seasons", "/championships", "/history", "/records", "/players", "/opponents",
    ...getSeasons().flatMap((s) => [`/seasons/${s.slug}`, `/schedule/${s.slug}`]),
    ...getChampionships().map((c) => `/championships/${c.slug}`),
    ...getAllGames().map((g) => `/games/${g.slug}`),
    ...getPlayers().map((p) => `/players/${p.slug}`),
    ...opponentIndex().map((o) => `/opponents/${o.opponent.slug}`),
  ];
  return paths.map((p) => ({ url: `${base}${p}` }));
}
