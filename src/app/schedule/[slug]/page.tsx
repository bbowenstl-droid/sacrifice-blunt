import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSeason, getSeasons } from "@/lib/data";
import { SchedulePage } from "@/components/SchedulePage";

export const revalidate = 60;
export const dynamicParams = false;
export const generateStaticParams = () => getSeasons().map((s) => ({ slug: s.slug }));
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = getSeason((await params).slug);
  return s ? { title: `${s.session} ${s.year} Schedule & Results` } : {};
}

export default async function ScheduleSeason({ params }: { params: Promise<{ slug: string }> }) {
  const s = getSeason((await params).slug);
  if (!s) notFound();
  return <SchedulePage season={s} />;
}
