"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV } from "@/lib/nav";


const TABS = [
  { href: "/", label: "Home", icon: "M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" },
  { href: "/schedule", label: "Schedule", icon: "M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm-1 5h16M9 3v4m6-4v4" },
  { href: "/seasons", label: "Seasons", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/championships", label: "Titles", icon: "M7 4h10v5a5 5 0 0 1-10 0zm5 10v4m-4 3h8M7 6H4v1a3 3 0 0 0 3 3m10-4h3v1a3 3 0 0 1-3 3" },
  { href: "/records", label: "Records", icon: "M5 20V10m7 10V4m7 16v-7" },
];

const active = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));

export function SiteHeader() {
  const path = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  return (
    <header className="no-print sticky top-0 z-40 border-b border-line-soft bg-night/88 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1180px] items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Sacrifice Blunt home">
          <Image src="/brand/badge-64.png" alt="" width={30} height={30} className="h-[30px] w-[30px]" priority />
          <span className="wide text-[1.02rem] font-black tracking-tight">Sacrifice Blunt</span>
        </Link>
        <nav aria-label="Main" className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active(path, n.href) ? "page" : undefined}
              className={`rounded px-2.5 py-1.5 text-[0.88rem] font-semibold transition-colors ${active(path, n.href) ? "text-chalk" : "text-mute hover:text-chalk"}`}
            >
              {n.label}
              {active(path, n.href) && <span className="mt-0.5 block h-[2px] rounded bg-cardinal" />}
            </Link>
          ))}
        </nav>
        <button
          className="ml-auto rounded border border-line px-3 py-1.5 text-[0.85rem] font-semibold text-mute lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-line-soft bg-pitch lg:hidden">
          <ul className="mx-auto grid max-w-[1180px] grid-cols-2 gap-px px-4 py-3">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className={`block rounded px-3 py-3 text-[0.98rem] font-semibold ${active(path, n.href) ? "bg-navy text-chalk" : "text-mute"}`}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

/** Thumb-reach tab bar for phones at the field. */
export function TabBar() {
  const path = usePathname() ?? "/";
  if (path.startsWith("/admin")) return null;
  return (
    <nav aria-label="Quick" className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-night/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      <ul className="grid grid-cols-5">
        {TABS.map((t) => {
          const on = active(path, t.href);
          return (
            <li key={t.href}>
              <Link href={t.href} aria-current={on ? "page" : undefined} className={`flex flex-col items-center gap-1 py-2 text-[0.68rem] font-semibold ${on ? "text-chalk" : "text-dim"}`}>
                <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={t.icon} />
                </svg>
                {t.label}
                <span className={`h-[2px] w-4 rounded ${on ? "bg-cardinal" : "bg-transparent"}`} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
