import Link from "next/link";
import type { ReactNode } from "react";
import type { Confidence, Game } from "@/lib/types";
import { CONFIDENCE } from "@/lib/format";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1180px] px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function PageHeader({ kicker, title, children, aside }: { kicker?: ReactNode; title: ReactNode; children?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="border-b border-line-soft bg-pitch/60 stitch">
      <Container className="flex flex-col gap-5 py-8 sm:py-12 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          {kicker && <div className="kicker mb-3">{kicker}</div>}
          <h1 className="display text-[2.4rem] sm:text-6xl">{title}</h1>
          {children && <div className="mt-4 max-w-2xl text-[1.02rem] leading-relaxed text-mute">{children}</div>}
        </div>
        {aside}
      </Container>
    </header>
  );
}

export function SectionTitle({ children, href, linkLabel, note }: { children: ReactNode; href?: string; linkLabel?: string; note?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 border-b border-line pb-2">
      <div>
        <h2 className="wide text-lg font-extrabold tracking-tight sm:text-xl">{children}</h2>
        {note && <p className="mt-0.5 text-[0.82rem] text-mute">{note}</p>}
      </div>
      {href && (
        <Link href={href} className="shrink-0 text-[0.85rem] font-semibold text-cardinal-hi hover:text-chalk">
          {linkLabel ?? "See all"}
        </Link>
      )}
    </div>
  );
}

export function ConfidenceBadge({ level, className = "" }: { level: Confidence; className?: string }) {
  const c = CONFIDENCE[level];
  const dot = { gold: "bg-gold", chalk: "bg-chalk/80", mute: "bg-dim", warn: "bg-gold-hi" }[c.tone];
  const ring = c.tone === "warn" ? "border-gold/40 text-gold-hi" : c.tone === "mute" ? "border-line text-dim" : "border-line text-mute";
  return (
    <span title={c.help} className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold ${ring} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
      {c.short}
    </span>
  );
}

export function ResultChip({ result, title, size = "sm" }: { result: Game["result"]; title?: boolean; size?: "sm" | "lg" }) {
  const base = size === "lg" ? "h-9 w-9 text-base" : "h-6 w-6 text-[0.75rem]";
  if (!result) return <span className={`${base} inline-grid place-items-center rounded border border-dashed border-line text-dim`}>–</span>;
  const tone = title && result === "W"
    ? "bg-gold text-night"
    : result === "W" ? "bg-chalk text-night" : result === "L" ? "border border-line text-mute" : "border border-line text-dim";
  return <span className={`${base} inline-grid shrink-0 place-items-center rounded font-black ${tone}`} aria-label={result === "W" ? "Win" : result === "L" ? "Loss" : "Tie"}>{result}</span>;
}

export function Tag({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "gold" | "cardinal" | "live" }) {
  const t = {
    default: "border-line text-mute",
    gold: "border-gold/50 text-gold-hi",
    cardinal: "border-cardinal/60 text-cardinal-hi",
    live: "border-mask/60 text-mask",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-[3px] border px-1.5 py-[1px] text-[0.68rem] font-bold ${t}`}>{children}</span>;
}

export function StatTile({ label, value, sub, href, accent }: { label: string; value: ReactNode; sub?: ReactNode; href?: string; accent?: "gold" | "cardinal" }) {
  const inner = (
    <div className={`panel h-full p-4 ${href ? "transition-colors hover:border-line" : ""}`}>
      <div className="text-[0.78rem] font-semibold text-mute">{label}</div>
      <div className={`display num mt-2 text-[2.1rem] ${accent === "gold" ? "text-gold-hi" : accent === "cardinal" ? "text-cardinal-hi" : ""}`}>{value}</div>
      {sub && <div className="mt-1.5 text-[0.8rem] leading-snug text-mute">{sub}</div>}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-line p-6 text-center">
      <div className="font-semibold">{title}</div>
      {children && <div className="mx-auto mt-1.5 max-w-md text-[0.88rem] leading-relaxed text-mute">{children}</div>}
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1.5 text-[0.82rem] text-mute">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-dim">/</span>}
          {it.href ? <Link className="hover:text-chalk" href={it.href}>{it.label}</Link> : <span className="text-chalk/80">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function KV({ items }: { items: { k: string; v: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-[0.92rem]">
      {items.map((it) => (
        <div key={it.k} className="contents">
          <dt className="text-mute">{it.k}</dt>
          <dd className="text-right font-semibold sm:text-left">{it.v}</dd>
        </div>
      ))}
    </dl>
  );
}
