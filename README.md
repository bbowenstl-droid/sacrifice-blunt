# Sacrifice Blunt — franchise site & stats archive

The permanent home of **Sacrifice Blunt** (originally **COTC**): schedule and results, every recorded season, the Championship Vault, the record book, head-to-head opponent history, player pages, sources, and a phone scorekeeper.

COTC and Sacrifice Blunt are **one franchise**. COTC seasons, games and the Fall 2021 title roll into every franchise total. The franchise has **6 championships** on record: Fall 2021 (as COTC), Spring 2023, Summer 2023, Spring 2025, Fall 2025 and Spring 2026 (undefeated: 12-0 regular season verified, 14-0 overall confirmed).

**Hosting:** a fully static site on **GitHub Pages**, built and published by GitHub Actions on every push to `main`.
Expected address once deployed: `https://bbowenstl-droid.github.io/sacrifice-blunt/`

---

## Publish it (works from an iPhone)

GitHub's mobile upload page can't upload folders, so pick one of these. All three end with the same live site.

### Option A — let Claude push it (fastest)
1. Link your GitHub account to Claude (Claude will prompt you if it isn't linked).
2. On github.com create an **empty public** repository named `sacrifice-blunt` (no README).
3. Tell Claude "push Sacrifice Blunt". It pushes the code; then do steps B2 and B7–B8 below (turn on Pages, watch the deploy, open the site).

### Option B — iPhone only, using a Codespace (browser-based VS Code, free tier)
1. **Create the repository.** Safari → github.com → profile picture → **Your repositories → New**. Name `sacrifice-blunt`, **Public**, check **Add a README file**, tap **Create repository**.
2. **Turn on Pages.** Repository **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. **Add the deploy workflow.** Repository home → **Add file → Create new file**. Name it `.github/workflows/deploy.yml`, paste the whole contents of that file from the ZIP (open it in the Files app → Share → Copy), tap **Commit changes**. (Its first run fails because the code isn't there yet — ignore that.)
4. **Open a Codespace.** Repository home → green **Code** button → **Codespaces** tab → **Create codespace on main**. Wait for the editor to load.
5. **Upload the ZIP.** In the left Explorer panel, long-press an empty area → **Upload…** → choose `sacrifice-blunt-github-pages.zip`.
6. **Unpack and publish.** Open the Terminal (☰ → Terminal → New Terminal) and paste:
   ```bash
   unzip -oq sacrifice-blunt-github-pages.zip && cp -a sacrifice-blunt/. . && rm -rf sacrifice-blunt sacrifice-blunt-github-pages.zip && git checkout HEAD -- .github && git add -A && git commit -qm "Sacrifice Blunt site" && git push
   ```
   (`git checkout HEAD -- .github` keeps the workflow you created in step 3, so the push doesn't need extra permissions.)
7. **Watch the deploy.** Repository → **Actions** → **Deploy to GitHub Pages**. Wait for *build* and *deploy* to show green checks (2–3 minutes). The deploy box shows the link.
8. **Open the site:** `https://bbowenstl-droid.github.io/sacrifice-blunt/`. In Safari, Share → **Add to Home Screen** for an app icon. Then delete the codespace (github.com/codespaces) so it doesn't use your free hours.

### Option C — from a computer
Create the repository as in B1 but **without** a README, turn on Pages (B2), then in the unzipped `sacrifice-blunt` folder:
```bash
git init && git add -A && git commit -m "Sacrifice Blunt site" && git branch -M main
git remote add origin https://github.com/bbowenstl-droid/sacrifice-blunt.git && git push -u origin main
```
(Or drag the folder's contents onto the repository's **Upload files** page in a desktop browser — make sure `.github/` comes along.)

### If the deploy fails
- **"Get Pages site failed"** at *Configure Pages*: Pages isn't on yet. Do B2, then **Actions → Deploy to GitHub Pages → Run workflow**.
- **Red X at Test / Typecheck / Build:** open the step to see the message. The build refuses to publish if any page or link would be broken.

### Updating the site later
Edit or upload a file in the repository (for example a new TeamSideline PDF + `seed-data.json`, or `data/manual/plate-appearances.json`), commit, and the Actions workflow rebuilds and republishes automatically.

---

## How the static build works

- `next.config.ts` uses `output: "export"`, `trailingSlash: true`, `images.unoptimized`, and a **single variable**, `PAGES_BASE_PATH`, for the repository sub-path (`/sacrifice-blunt`). The workflow reads it from `actions/configure-pages`, so renaming the repo or adding a custom domain needs no code change.
- `<Link>` and `/_next` assets get the prefix automatically; files from `public/` (logos, plaque, icons, PDFs) go through `asset()` in `src/lib/site.ts`. Canonical, Open Graph, sitemap and robots URLs come from `SITE_URL` (the Pages URL).
- Every dynamic route (`/seasons/[slug]`, `/schedule/[slug]`, `/games/[slug]`, `/players/[slug]`, `/championships/[slug]`, `/opponents/[slug]`) has `generateStaticParams` from the dataset and `dynamicParams = false`. **283 HTML pages** are exported.
- Anything that depends on the current time — the homepage "Tonight / Next game / Under way / Result pending" card and game status labels — is computed in the visitor's browser (`src/components/live.tsx`), because static HTML is built ahead of time.
- Player comparison runs in the browser and keeps shareable links (`/players/compare/?a=troy&b=dan`).
- `public/.nojekyll` and the exported `404.html` are included. The 15 original TeamSideline PDFs are published under `/source-files/` so every source link opens the real document.
- `scripts/verify-export.mjs` runs after every build and **fails the build** if any page is missing or any internal link/asset in any of the 283 HTML files would 404 under the base path, if an `/admin` route was exported, or if a secret-looking string appears.

### What changed from the Vercel version
| Before (Vercel) | Now (GitHub Pages) | Why |
|---|---|---|
| `/admin`, `/admin/data` behind Basic-auth middleware | Removed. Sources and data notes are public at `/sources/` (read-only). | Pages can't run server auth; a "protected" static page would be fake security. |
| `/admin/scorekeeper` | Public `/scorekeeper/`, clearly labelled **"Saves to this phone only"**, `noindex` | It never synced anywhere; now it says so. Export the JSON and add it to the data. |
| Server-rendered "Tonight" card, revalidating every minute | Client-side card | No server on Pages. |
| `/players/compare` read query params on the server | Client-side, same URLs | No server on Pages. |
| No public PDFs | `/source-files/*.pdf` | Source links now work. |

No secrets are used anywhere in the build or the client bundle.

**Shared, live scorekeeping later:** that needs a real backend. The schema in `supabase/` (Postgres, row-level security: public read, writes only for users whose `app_metadata.role = 'admin'`) is ready for it. The scorekeeper would sign in with Supabase Auth and write to `plate_appearances`; the static site would read from it at build time or in the browser with the public anon key only.

---

## Local development

```bash
npm ci
npm run dev            # http://localhost:3000
npm test               # 15 tests: titles, records, seed agreement, null-not-zero, time logic, base path
npm run typecheck
npm run build:pages    # static export into out/ with the /sacrifice-blunt base path (+ verify-export)
npm run preview        # PAGES_BASE_PATH=/sacrifice-blunt npm run preview → http://localhost:4000/sacrifice-blunt/
```

No Python is needed to build. Game data is parsed from the PDFs ahead of time and committed (`data/generated/teamsideline.json`). Only re-parsing new PDFs (`npm run ingest`) needs Python 3, `pdftotext` (poppler-utils), and nothing else.

## Where the data comes from

```
archive/                         ← the original handoff, untouched
  data/seed-data.json            ← canonical season + championship data
  sources/*.pdf                  ← 15 TeamSideline standings & results exports
  assets/                        ← official logos and the Fall 2025 plaque photo
data/generated/teamsideline.json ← game-level data parsed from the PDFs (committed)
data/manual/                     ← eras, players, rosters, season annotations, plate appearances
src/data/dataset.json            ← the normalized dataset the site reads (generated by build:data)
```

1. `npm run ingest` — `scripts/ingest_teamsideline.py` reads every PDF, re-joins wrapped team names by column position, respects each file's column order (2019 prints Home before Away), attaches rain-out notes, and recomputes **every team's W-L from the games** to compare with the printed standings. All 15 seasons match exactly.
2. `npm run build:data` — merges the seed, the parsed games and the manual files into `src/data/dataset.json`, and copies the PDFs to `public/source-files/`. **The build fails** if the seed and PDFs disagree on any record or standing, if a champion has no title-game win, if a parsed title-game win isn't counted or flagged, or if the championship list and champion seasons disagree.
3. `npm run build:sql` — writes `supabase/seed.sql` from the same dataset (tested against Postgres 16).

### Data rules the code enforces
- Unknown = `null` = "—" on the page; nothing unknown is ever shown as 0.
- Every season carries confidence for the season record, regular season and postseason, plus links to its sources.
- Regular season and postseason are stored separately; overall records are either confirmed or derived from the full game log, and labelled as such.
- Records, streaks, head-to-head and batting stats are computed from games and plate appearances — never typed in.

### Championship verification
| Title | Documentary source | Also |
|---|---|---|
| Fall 2021 (as COTC) | TeamSideline playoff results (19-9 title game) | |
| Spring 2023 | TeamSideline playoff results (12-10) | |
| Summer 2023 | TeamSideline playoff results (14-4) | Confirmed by team leadership |
| Spring 2025 | TeamSideline playoff results (13-12 over Cheers, after 13-9 and 18-7) | Verified by team leadership as a franchise title |
| Fall 2025 | TeamSideline playoff results (15-11) | Championship plaque photo |
| Spring 2026 | TeamSideline: 12-0 regular season and both playoff wins (11-4, 10-2) | 14-0 overall and undefeated title confirmed by team leadership |

Spring 2025 is recorded in `data/manual/season-annotations.json` (`champion_confirmed_by_leadership`); the original seed in `archive/` is unchanged. To record another title confirmed after the handoff, add the same fields to that season and rebuild — the build checks the count, banners and championship list agree.

### Other findings from the PDFs
- Runner-up finishes: Fall 2022 (13-12 to Thunder), Spring 2024 (13-8 to Fellas), Summer 2025 (19-6 to The Hard Hats).
- Summer 2021: lost 13-11 to Jack City in Round 2; two Aug 26 games vs Jack City have no posted result.
- Summer/Fall 2026: two July 1 wins vs Minimal Effort were recorded without a score; they count as wins but not in score-based records.
- Fall 2026: playoffs were scheduled for Oct 7, 2026. No playoff results were in the supplied PDF.
- No record was supplied for Spring–Fall 2020, Spring and Summer 2022, or Summer and Fall 2024; those sessions keep visible empty slots.

## Adding things
- **New season / updated standings:** save the TeamSideline print view as PDF into `archive/sources/`, add the season to `archive/data/seed-data.json`, run `npm run ingest && npm run build:data`, commit (including `data/generated/teamsideline.json`).
- **Batting data:** score on `/scorekeeper/`, export the JSON, append the rows to `data/manual/plate-appearances.json`, commit. Box scores, season/career splits, records and comparisons update on the next deploy.
- **Players & rosters:** `data/manual/players.json`.

## URL map
`/` · `/schedule/` · `/schedule/[season]/` · `/seasons/` · `/seasons/2026-spring/` · `/championships/` · `/championships/2026-spring/` · `/history/` · `/records/` · `/games/2026-fall-cheers-1/` · `/players/` · `/players/troy/` · `/players/compare/` · `/opponents/` · `/opponents/minimal-effort/` · `/sources/` · `/scorekeeper/`

## Brand assets
`scripts/prepare_brand_assets.py` makes web copies of the official logos in `public/brand/`. The only change is removing the flat background around the artwork so the marks sit on dark surfaces; nothing is redrawn, recolored or stretched.
