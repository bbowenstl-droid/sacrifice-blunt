"use client";
import { useRouter } from "next/navigation";

export function SeasonPicker({ options, value, base }: { options: { slug: string; label: string }[]; value: string; base: string }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-[0.85rem] text-mute">
      <span>Season</span>
      <select
        value={value}
        onChange={(e) => router.push(`${base}/${e.target.value}`)}
        className="rounded border border-line bg-pitch px-3 py-2 font-semibold text-chalk"
      >
        {options.map((o) => <option key={o.slug} value={o.slug}>{o.label}</option>)}
      </select>
    </label>
  );
}
