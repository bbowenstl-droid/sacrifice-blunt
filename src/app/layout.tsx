import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
import { SiteHeader, TabBar } from "@/components/Nav";
import { NAV } from "@/lib/nav";
import { getFranchise, getMeta } from "@/lib/data";
import { fmtDate } from "@/lib/format";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "Sacrifice Blunt — 5-Time Champions", template: "%s · Sacrifice Blunt" },
  description:
    "Official history, stats archive and record book of Sacrifice Blunt (originally COTC), men's slow-pitch softball at Bridgeton Municipal Athletic Complex. Home of the 14-0 Spring 2026 undefeated champions.",
  applicationName: "Sacrifice Blunt",
  icons: { icon: [{ url: "/brand/icon-32.png", sizes: "32x32" }, { url: "/brand/icon-192.png", sizes: "192x192" }], apple: "/brand/icon-180.png" },
  manifest: "/manifest.webmanifest",
  openGraph: { type: "website", siteName: "Sacrifice Blunt", images: [{ url: "/og.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#07090e", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const f = getFranchise();
  const meta = getMeta();
  return (
    <html lang="en">
      <body className="min-h-dvh pb-[calc(64px+env(safe-area-inset-bottom))] lg:pb-0">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-chalk focus:px-3 focus:py-2 focus:text-night">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <footer className="no-print mt-20 border-t border-line-soft bg-pitch/50">
          <div className="mx-auto grid max-w-[1180px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]">
            <div>
              <Image src="/brand/wordmark-light-480.webp" alt="Sac Blunt" width={180} height={104} className="h-auto w-[180px]" />
              <p className="mt-4 max-w-sm text-[0.88rem] leading-relaxed text-mute">
                {f.current_name}, originally {f.original_name}. Men&apos;s slow-pitch softball at {f.home_complex.replace(", Bridgeton, MO", "")}.
                {` ${f.championship_count} championships`} on record since {`Fall 2019`}.
              </p>
            </div>
            <div>
              <div className="kicker mb-3">Explore</div>
              <ul className="grid grid-cols-2 gap-y-2 text-[0.9rem]">
                {NAV.map((n) => <li key={n.href}><Link className="text-mute hover:text-chalk" href={n.href}>{n.label}</Link></li>)}
              </ul>
            </div>
            <div className="text-[0.82rem] leading-relaxed text-mute">
              <div className="kicker mb-3">About the data</div>
              <p>
                Records come from TeamSideline standings exports, a championship plaque, and confirmations from team leadership.
                Every season shows how it was verified. Missing data shows as “—”, never as zero.
              </p>
              <p className="mt-2 text-dim">Data as of {fmtDate(meta.data_as_of, { year: true })}.</p>
            </div>
          </div>
        </footer>
        <TabBar />
      </body>
    </html>
  );
}
