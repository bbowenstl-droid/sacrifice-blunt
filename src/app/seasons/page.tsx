import type { Metadata } from "next";
import { getSeasons, getGaps, franchiseTotals } from "@/lib/data";
import { rec } from "@/lib/format";
import { Container, PageHeader } from "@/components/ui";
import { SeasonArchive } from "@/components/SeasonArchive";

export const metadata: Metadata = {
  title: "Seasons",
  description: "Every recorded Sacrifice Blunt and COTC season: records, standings, playoff finishes and championships.",
};

export default function SeasonsPage() {
  const t = franchiseTotals();
  return (
    <>
      <PageHeader kicker="Season archive" title="Seasons" aside={
        <div className="flex gap-8 text-right">
          <div><div className="display num text-[2rem]">{rec(t.regular.w, t.regular.l)}</div><div className="text-[0.78rem] text-mute">Regular season</div></div>
          <div><div className="display num text-[2rem]">{rec(t.postseason.w, t.postseason.l)}</div><div className="text-[0.78rem] text-mute">Postseason</div></div>
          <div><div className="display num text-[2rem] text-gold-hi">{t.championships}</div><div className="text-[0.78rem] text-mute">Titles</div></div>
        </div>
      }>
        Every season the franchise has on record, from COTC&apos;s first verified season in Fall 2019 to today. Sessions with no supplied record keep their place in the list so the gaps stay honest.
      </PageHeader>
      <Container className="pt-8">
        <SeasonArchive seasons={getSeasons()} gaps={getGaps()} />
      </Container>
    </>
  );
}
