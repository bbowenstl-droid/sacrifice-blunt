# Sacrifice Blunt — franchise site & stats archive

The permanent home of **Sacrifice Blunt** (originally **COTC**): schedule and results, every recorded season, the Championship Vault, the record book, head-to-head opponent history, player pages, and the admin tools for scorekeeping.

COTC and Sacrifice Blunt are **one franchise**. COTC seasons, games and the Fall 2021 title roll into every franchise total.

## Quick start

```bash
npm install
cp .env.example .env.local      # set ADMIN_PASSWORD
npm run dev                     # http://localhost:3000
npm test                        # data, records and stats engine checks
npm run build && npm start      # production
```

Deploy: push to GitHub and import into **Vercel** (zero config). Set `ADMIN_USER`, `ADMIN_PASSWORD` and `NEXT_PUBLIC_SITE_URL` in the project's environment variables.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS 4
- ~280 pages are pre-rendered; the home and schedule pages refresh every minute so "Tonight" and game status stay current
- Fonts are self-hosted (Archivo with its width axis, Source Serif 4) — no external requests
- Postgres/Supabase schema ready in `supabase/` (see *Moving to Supabase*)

## Where the data comes from

```
archive/                         ← the original handoff, untouched (source of truth)
  data/seed-data.json            ← canonical season + championship data
  sources/*.pdf                  ← 15 TeamSideline standings & results exports
  assets/                        ← official logos and the Fall 2025 plaque photo
data/generated/teamsideline.json ← game-level data parsed from the PDFs
data/manual/                     ← hand-maintained: eras, players, rosters, annotations, plate appearances
src/data/dataset.json            ← the normalized dataset the site reads (generated)
```

Pipeline:

1. `npm run ingest` — `scripts/ingest_teamsideline.py` reads every PDF (`pdftotext -layout`), re-joins wrapped team names by column position, respects each file's column order (2019 prints Home before Away), attaches rain-out notes, and resolves names against that season's standings. It then recomputes **every team's W-L from the games** and compares it to the printed standings. All 15 seasons match exactly.
2. `npm run build:data` — `scripts/build-dataset.mjs` merges the seed, the parsed games and the manual files into `src/data/dataset.json`. **The build fails** if the seed and PDFs disagree on any record or standing, if a seed champion has no title-game win, if a parsed title-game win isn't a champion or flagged for review, or if the Fall 2026 games differ from the seed's `current_known_games`.
3. `npm run build:sql` — writes `supabase/seed.sql` from the same dataset.

`npm run dev` and `npm run build` run step 2 automatically.

### Data rules the code enforces

- Unknown = `null` = "—" on the page. Nothing unknown is ever shown as 0. Run totals only appear for seasons where every game has a score.
- Every season carries confidence for the season record, the regular season and the postseason (`verified`, `confirmed`, `partial`, `unknown`, `verified_regular_season_only`, `mixed_verified_and_confirmed`) plus links to its sources.
- Regular season and postseason are stored separately; overall records are either confirmed (seed) or derived from the full game log, and labelled as such.
- Records, streaks, head-to-head and batting stats are computed from games and plate appearances — never typed in.

### Findings from the PDFs (not in the original seed)

| Season | Finding | How it's handled |
|---|---|---|
| Spring 2025 | Won the Playoff Round 3 – Championship Round game (G7) 13-12 over Cheers. Three division teams weren't in the bracket. | **Not counted.** Shown as "Won title game · under review". Count stays at 5 until leadership decides. |
| Summer 2023 | Title-game result (14-4 over Six Mile Bridge) is in the PDF. | Title now has TeamSideline evidence in addition to leadership confirmation. |
| Spring 2026 | Playoff wins 11-4 and 10-2 are in the PDF, so 14-0 is corroborated. | Season confidence kept as *verified + confirmed* per the handoff; note added. |
| Fall 2022, Spring 2024, Summer 2025 | Lost in the championship-round game. | Shown as Runner-up. |
| Summer 2021 | Lost 13-11 to Jack City in Round 2. Two Aug 26 games vs Jack City have no posted result. | Postseason added; the two games show "No result posted". |
| Summer/Fall 2026 | Two July 1 wins vs Minimal Effort have no score (result only). | Count as wins; excluded from score-based records. |
| Fall 2026 | Playoffs Oct 7, 2026: Round 1 at Cheers, 6:30 PM, F11. | Shown as the next game. No results invented. |

**To count Spring 2025 as a sixth title:** in `archive/data/seed-data.json` set `champion: true` and `playoff_finish: "Champion"` on `2025-spring`, add it to `championships`, set `championship_count_currently_supported` to 6, then remove `title_under_review` from `data/manual/season-annotations.json`. The hero, banners, vault and records update from the data.

## Adding things

- **A new season / updated standings:** save the TeamSideline print view as PDF into `archive/sources/`, add the season to `seed-data.json`, run `npm run ingest && npm run build:data`.
- **Batting data:** use **Admin → Scorekeeper** (choose game → lineup → tap results → finalize → export), then append the rows to `data/manual/plate-appearances.json`. Season, career, split (regular/playoffs/last 5/last 10/by year), game box score, records and comparisons all update. Imported per-game aggregates go in `player-game-stats.json`; leave a field out if it wasn't captured.
- **Players & rosters:** `data/manual/players.json` (one identity per player; seasons link through `season_rosters`).
- **Missing seasons:** the archive, history timeline and season chart already show empty slots for Spring–Fall 2020, Spring and Summer 2022, and Summer and Fall 2024.

## Admin

`/admin` is protected with HTTP Basic auth (`ADMIN_USER` / `ADMIN_PASSWORD`), and stays locked if no password is set. It includes:
- **Overview** — decisions needed, review log (unreported games, merged name variants, gaps), confidence breakdown, the Spring 2026 source note.
- **Scorekeeper** — the live-game flow from the spec, built for a phone at the field; saves to the device as you go and tracks the team's home-run count against the league's 3-per-game limit.
- **Data & sources** — every season's full metadata and every evidence file.

## Moving to Supabase

1. Create a project and run `supabase/migrations/0001_init.sql` (tables, enums, a `batting_game_lines` view, row-level security: public read, admin write via `app_metadata.role = 'admin'`).
2. Load `supabase/seed.sql` (`npm run build:sql` regenerates it). Both were tested against Postgres 16.
3. Replace the JSON reads in `src/lib/data.ts` with Supabase queries — every page goes through that file, so nothing else changes.
4. Swap the Basic-auth middleware for Supabase Auth and point the Scorekeeper's export at `plate_appearances`.

## URL map

`/` · `/schedule` · `/schedule/[season]` · `/seasons` · `/seasons/2026-spring` · `/championships` · `/championships/2026-spring` · `/history` · `/records` · `/games/2026-fall-cheers-1` · `/players` · `/players/troy` · `/players/compare` · `/opponents` · `/opponents/minimal-effort` · `/admin`

## Brand assets

`scripts/prepare_brand_assets.py` makes web copies of the official logos in `public/brand/`. The only change is removing the flat background around the artwork so the marks sit on dark surfaces; nothing is redrawn, recolored or stretched. Favicons/app icons use the SB badge. The light (white-script) wordmark is used on dark surfaces; the red wordmark is kept for light surfaces and print.
