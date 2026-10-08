#!/usr/bin/env node
/**
 * Post-build check for the static GitHub Pages export (runs after `next build`).
 * Fails the build if a page, asset or internal link would 404 on GitHub Pages.
 *   - every season / game / title / player / opponent page exists as out/<route>/index.html
 *   - every internal href/src in every HTML file starts with the base path and resolves to a file in out/
 *   - .nojekyll and 404.html exist; no /admin route and no secrets were exported
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const out = path.join(root, "out");
const base = (process.env.PAGES_BASE_PATH ?? "").replace(/\/$/, "");
const d = JSON.parse(fs.readFileSync(path.join(root, "src/data/dataset.json"), "utf8"));
const errors = [];
const exists = (rel) => fs.existsSync(path.join(out, rel));

if (!fs.existsSync(out)) { console.error("verify-export: out/ not found — did next build run with output: 'export'?"); process.exit(1); }
for (const f of [".nojekyll", "404.html", "index.html", "sitemap.xml", "robots.txt", "og.png", "manifest.webmanifest"]) if (!exists(f)) errors.push(`missing ${f}`);
if (exists("admin")) errors.push("an /admin route was exported; the public static site must not ship admin pages");

const routes = [
  "", "schedule", "seasons", "championships", "history", "records", "players", "players/compare", "opponents", "sources", "scorekeeper",
  ...d.seasons.flatMap((s) => [`seasons/${s.slug}`, `schedule/${s.slug}`]),
  ...d.championships.map((c) => `championships/${c.slug}`),
  ...d.games.map((g) => `games/${g.slug}`),
  ...d.players.map((p) => `players/${p.slug}`),
  ...[...new Set(d.games.map((g) => g.opponent_id))].map((o) => `opponents/${o}`),
];
for (const r of routes) if (!exists(path.join(r, "index.html"))) errors.push(`missing page /${r}/`);

// walk every exported HTML file and check internal references
const htmlFiles = [];
const walk = (dir) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); e.isDirectory() ? walk(p) : p.endsWith(".html") && htmlFiles.push(p); } };
walk(out);
const checked = new Set();
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  if (/ADMIN_PASSWORD|SUPABASE_SERVICE|service_role/.test(html)) errors.push(`possible secret reference in ${path.relative(out, file)}`);
  for (const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
    const url = m[1];
    if (url.startsWith("//")) continue;
    if (checked.has(url)) continue;
    checked.add(url);
    if (base && !(url === base || url.startsWith(base + "/"))) { errors.push(`unprefixed URL ${url} in ${path.relative(out, file)}`); continue; }
    const rel = decodeURIComponent(url.slice(base.length)).replace(/^\//, "");
    const ok = rel === "" ? exists("index.html") : exists(rel) && fs.statSync(path.join(out, rel)).isFile() || exists(path.join(rel, "index.html"));
    if (!ok) errors.push(`broken link ${url} (from ${path.relative(out, file)})`);
  }
}
if (errors.length) {
  console.error(`verify-export: ${errors.length} problem(s)\n - ` + errors.slice(0, 40).join("\n - "));
  process.exit(1);
}
console.log(`verify-export: OK — ${routes.length} routes, ${htmlFiles.length} HTML files, ${checked.size} unique internal URLs checked (base path "${base || "/"}")`);
