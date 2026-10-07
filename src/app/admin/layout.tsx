import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/scorekeeper", label: "Scorekeeper" },
  { href: "/admin/data", label: "Data & sources" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="border-b border-line-soft bg-navy/30">
        <div className="mx-auto flex max-w-[1180px] items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          <span className="mr-3 rounded bg-cardinal px-2 py-0.5 text-[0.72rem] font-bold">Admin</span>
          {LINKS.map((l) => <Link key={l.href} href={l.href} className="whitespace-nowrap rounded px-3 py-1.5 text-[0.88rem] font-semibold text-mute hover:text-chalk">{l.label}</Link>)}
        </div>
      </div>
      {children}
    </div>
  );
}
