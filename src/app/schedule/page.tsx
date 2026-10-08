import type { Metadata } from "next";
import { getCurrentSeason } from "@/lib/data";
import { SchedulePage } from "@/components/SchedulePage";

export const metadata: Metadata = { title: "Schedule & Results", description: "Current Sacrifice Blunt schedule, results, standings and playoff bracket." };

export default function Schedule() {
  return <SchedulePage season={getCurrentSeason()} />;
}
