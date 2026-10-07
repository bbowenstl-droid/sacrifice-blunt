import Link from "next/link";
import type { Championship, Season } from "@/lib/types";
import { rec } from "@/lib/format";

/**
 * Championship banner — the franchise's signature graphic. Each title hangs like a
 * rafter banner: navy cloth, gold trim, swallowtail hem. The undefeated title is
 * cut from cardinal cloth and hangs longer.
 */
export function Banner({
  title, season, size = "rafter", delay = 0, href,
}: { title: Championship; season: Season; size?: "rafter" | "vault"; delay?: number; href?: string }) {
  const special = title.undefeated;
  const isCotc = season.team_name_at_time !== "Sacrifice Blunt";
  const dims = size === "rafter"
    ? special ? "w-[64px] h-[150px] sm:w-[92px] sm:h-[206px]" : "w-[54px] h-[122px] sm:w-[78px] sm:h-[168px]"
    : special ? "w-[150px] h-[300px] sm:w-[176px] sm:h-[352px]" : "w-[124px] h-[250px] sm:w-[148px] sm:h-[296px]";
  const cloth = special ? "bg-cardinal" : "bg-navy";
  const clip = "[clip-path:polygon(0_0,100%_0,100%_100%,50%_88%,0_100%)]";
  const big = size === "vault";
  const body = (
    <div
      className={`banner-drop relative ${dims} ${clip} ${cloth} shrink-0`}
      style={{ animationDelay: `${delay}ms` }}
      aria-label={`${title.title}${isCotc ? " (as COTC)" : ""}${special ? `, undefeated ${rec(season.overall_wins, season.overall_losses)}` : ""}`}
    >
      {/* gold trim */}
      <div className={`absolute inset-[3px] ${clip} bg-gold`} />
      <div className={`absolute inset-[5px] ${clip} ${cloth} sm:inset-[6px]`} />
      {/* rod */}
      <div className="absolute inset-x-0 top-0 h-[5px] bg-gold-hi/90" />
      <div className={`relative flex h-full flex-col items-center pt-[14%] text-center ${special ? "text-white" : "text-chalk"}`}>
        <span className={`wide font-bold leading-none text-gold-hi ${big ? "text-[0.95rem]" : "text-[0.5rem] sm:text-[0.68rem]"}`}>
          {season.session}
        </span>
        <span className={`display num leading-none ${big ? "mt-2 text-[2.1rem] sm:text-[2.45rem]" : "mt-1 text-[0.92rem] sm:text-[1.3rem]"}`}>
          {season.year}
        </span>
        <span className={`mt-[10%] h-px w-1/2 bg-gold/70`} />
        <span className={`wide mt-[10%] font-extrabold leading-tight ${big ? "text-[0.92rem]" : "text-[0.42rem] sm:text-[0.58rem]"}`}>
          Champions
        </span>
        {special && (
          <span className={`display num mt-[8%] text-gold-hi ${big ? "text-[2.2rem]" : "text-[1rem] sm:text-[1.45rem]"}`}>{rec(season.overall_wins, season.overall_losses)}</span>
        )}
        {isCotc && (
          <span className={`mt-[8%] font-bold text-gold-hi/90 ${big ? "text-[0.8rem]" : "text-[0.42rem] sm:text-[0.55rem]"}`}>as COTC</span>
        )}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="group block outline-offset-4 transition-transform duration-200 hover:-translate-y-0.5">
      {body}
    </Link>
  ) : body;
}

export function Rafters({ titles, seasons, size = "rafter", link = true }: { titles: Championship[]; seasons: Season[]; size?: "rafter" | "vault"; link?: boolean }) {
  return (
    <div className="relative">
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-gold/50 to-transparent`} aria-hidden />
      <div className={`flex items-start ${size === "vault" ? "scroller -mx-4 justify-start gap-3 px-4 pb-2 sm:mx-0 sm:justify-center sm:gap-6 sm:px-0" : "justify-center gap-2 sm:gap-4"}`}>
        {titles.map((t, i) => (
          <Banner
            key={t.id}
            title={t}
            season={seasons.find((s) => s.id === t.season_id)!}
            size={size}
            delay={120 + i * 90}
            href={link ? `/championships/${t.slug}` : undefined}
          />
        ))}
      </div>
    </div>
  );
}
