# SACRIFICE BLUNT WEBSITE — OPUS BUILD HANDOFF

## Mission

Build the first production-quality version of a permanent website and statistical archive for the men's slow-pitch softball franchise currently named **Sacrifice Blunt**, originally named **COTC**.

This is not a one-season brochure site. It must be a durable franchise history, stats database, record book, championship vault, schedule/results archive, player database, and the foundation for future scorekeeping/stat-entry tools.

The finished product should feel like **ESPN + Baseball-Reference + a franchise Hall of Fame**, with a custom Sacrifice Blunt identity.

The immediate goal is a strong public v1 using the historical material in this package. Do not wait for every missing historical detail before building. Clearly distinguish verified, confirmed, partial, and unknown data.

---

## Critical franchise fact

**COTC and Sacrifice Blunt are the same franchise.**

Do NOT create COTC as a separate franchise or exclude COTC records from all-time totals. Treat the rename as an era change within one continuous franchise.

Use these eras:

- **COTC Era** — original team name; verified records currently go back to Fall 2019.
- **Sacrifice Blunt Era** — current name; current supplied records begin by Fall 2022.

The exact rebrand session/date has not yet been verified. Do not invent one.

---

## Major newly recovered historical fact

The uploaded Fall 2021 TeamSideline record shows COTC finished 6-2 in the regular season, then won the postseason:
- COTC advanced over Goon Squad.
- COTC defeated The Flying Dutchman **19-9** in the championship.

Therefore, because COTC is the same franchise, the currently supported franchise championship count is **5**, not 4.

Currently supported titles:
1. Fall 2021 — COTC — verified from TeamSideline playoff results.
2. Spring 2023 — Sacrifice Blunt — verified from TeamSideline playoff results.
3. Summer 2023 — Sacrifice Blunt — confirmed by team leadership; regular season verified.
4. Fall 2025 — Sacrifice Blunt — verified by championship plaque; regular season verified.
5. Spring 2026 — Sacrifice Blunt — undefeated champion, confirmed by team leadership; 12-0 regular season verified by TeamSideline and 14-0 overall confirmed by team leadership.

Public-facing branding should therefore say **5-Time Champions**, unless the owner later explicitly decides not to count COTC-era titles.

---

## Historical data supplied

Use `data/seed-data.json` as the canonical starter dataset.

Use `data/season-summary.csv` as a human-readable season index.

Use PDFs in `/sources` as source evidence. Do not overwrite a structured value with a guess if a PDF is ambiguous.

### Verified season summaries

- Fall 2019 — COTC — Thursday Men's D3 — 1-7 — 5th.
- Spring 2021 — COTC — Thursday Men's D3 "B" — 3-9 — 4th — won first playoff game, then lost to Missouri Mayhem.
- Summer 2021 — COTC — Thursday Men's D3 "B" — 7-3 — 3rd.
- Fall 2021 — COTC — Thursday Men's D3 "C" — 6-2 — 2nd — **Champion**.
- Fall 2022 — Sacrifice Blunt — Thursday Men's D3B — 6-2 — 2nd.
- Spring 2023 — Sacrifice Blunt — Thursday Men's D3 "B" — 9-3 — 2nd — **Champion**.
- Summer 2023 — Sacrifice Blunt — Thursday Men's D3B — 9-3 — 1st — **Champion confirmed**.
- Fall 2023 — Sacrifice Blunt — Thursday Men's D3A — 4-4 — 3rd.
- Spring 2024 — Sacrifice Blunt — Tuesday Men's D3 — 6-4 — 3rd.
- Spring 2025 — Sacrifice Blunt — Wednesday Men's D3 — 6-4 — 2nd.
- Summer 2025 — Sacrifice Blunt — Wednesday Men's D3A — 1-11 — 6th.
- Fall 2025 — Sacrifice Blunt — Wednesday Men's Division 3B — 5-3 — 3rd — **Champion**.
- Spring 2026 — Sacrifice Blunt — Wednesday Men's D3 — **12-0 regular season**, 1st — **Champion**, **14-0 overall confirmed**.
- Summer/Fall 2026 — Sacrifice Blunt — Wednesday Men's D3 — 6-6 — 4th.
- Fall 2026 — Sacrifice Blunt — Wednesday Men's D3 — 1-7 — 5th — postseason bracket supplied.

There are likely missing seasons (for example 2020 and possibly other Spring/Summer/Fall sessions). The interface must gracefully support gaps.

---

## Source confidence rules

Every historical object should support:

- `verified` — official TeamSideline, plaque/trophy, or equivalent documentary evidence.
- `confirmed` — directly confirmed by team leadership.
- `partial` — season/event known but incomplete.
- `unknown` — placeholder / not established.

Never invent:
- records,
- scores,
- roster membership,
- batting statistics,
- playoff finishes,
- championship results,
- dates,
- awards.

If regular season is verified but playoffs are not, keep them separate.

---

## Product vision

The site should eventually answer:

- What is the current schedule?
- What is the current record?
- How did every historical season finish?
- How many championships has the franchise won?
- What happened in every recorded game?
- What is the all-time record vs each opponent?
- Which players played in each era?
- What are each player's season and career batting stats?
- Who owns every team and individual record?
- What were the best seasons in franchise history?
- How do two players compare?
- Which milestones were reached and when?

Build v1 so later features do not require a rewrite.

---

## Recommended architecture

Preferred:
- **Next.js** with App Router
- **TypeScript**
- **Tailwind CSS**
- **Supabase / Postgres** for durable structured data and auth
- **Vercel** or equivalent for deployment
- Server-side data queries where appropriate
- Responsive data tables + cards
- Image optimization

If the current environment requires a different equivalent stack, preserve the same relational data model and URL structure.

Do not build the long-term product as a giant hardcoded JSON-only site. Seed from JSON initially if needed, but create a migration path to the database.

---

## Data model

At minimum create tables/entities for:

### franchise
- id
- current_name
- original_name
- founded/earliest_verified
- notes

### eras
- id
- name
- display_name
- start/end if known
- primary logo treatment
- notes

### seasons
- id
- year
- session
- team_name_at_time
- league
- division
- regular_wins/losses/ties
- regular_place
- overall_wins/losses/ties when known
- playoff_finish
- champion
- undefeated
- confidence
- source_notes

### opponents
- id
- canonical_name
- aliases

### games
- id
- season_id
- date
- opponent_id
- home_away if known
- field
- time
- team_score
- opponent_score
- result
- regular_or_postseason
- playoff_round
- confidence
- source

### players
- id
- slug
- name
- number
- positions
- active status
- photo
- bio

### season_rosters
- season_id
- player_id
- number
- positions

### plate_appearances
- game_id
- player_id
- inning
- result
- RBI
- run_scored
- notes

### player_game_stats
Use for imported aggregate game stats when plate appearances are not available.

### championships
- season_id
- title
- verification type
- evidence image
- notes

### awards
### milestones
### records
### media
### source_evidence

Do not duplicate player identity per season.

---

## Stats calculations

Long term, calculate career and season stats from game/plate-appearance data rather than manually storing totals.

Support:
- G
- PA
- AB
- R
- H
- 1B
- 2B
- 3B
- HR
- RBI
- BB
- AVG
- OBP
- SLG
- OPS
- TB
- XBH
- K
- SAC
- ROE where captured

Filters:
- Career
- Season
- Year
- Regular season
- Playoffs
- Last 5
- Last 10

Do not show fake zeroes for historical categories that are simply unknown. Use `—` / unavailable.

---

## Required v1 pages

### Home
Sports-network front page.

Hero:
- Sacrifice Blunt
- **5-Time Champions**
- Featured line: **Home of the 14-0 Spring 2026 Undefeated Champions**

Homepage modules:
- championship count
- undefeated seasons
- best confirmed season
- latest championship
- current tracked season
- recent/latest result
- next game if available
- current record
- championship feature
- history snapshot
- stats/records teaser

### Seasons
Master season archive with era, record, finish, championship indicator, confidence.

Filters:
- all
- COTC Era
- Sacrifice Blunt Era
- champions

### Individual Season Page
Route: `/seasons/[slug]`

Show:
- year/session
- name used
- league/division
- regular record
- overall record if known
- standing
- postseason finish
- championship status
- schedule/results when available
- roster when available
- season notes
- evidence/source status

### History
Chronological franchise timeline.
Make the COTC-to-Sacrifice-Blunt identity transition visually explicit without pretending the exact rename date is known.

### Championship Vault
Premium dark/gold trophy-room treatment.

Current titles:
- Fall 2021 — COTC
- Spring 2023
- Summer 2023
- Fall 2025
- Spring 2026

Fall 2025 must use the supplied plaque image.
Spring 2026 should receive the strongest visual treatment because of the undefeated 14-0 overall run.

### Schedule / Results
Current + historical season selector.
Completed games should ultimately link to individual game pages.

### Game Page
Route: `/games/[slug]`
Support:
- score
- opponent
- date/time/field
- regular/postseason
- lineup
- box score
- batting stats
- notes
- milestones
- sources

### Players
Build the shell now even if historical rosters are incomplete.

### Player Page
Route: `/players/[slug]`
Future-ready for:
- career stats
- season splits
- championships
- timeline
- records
- recent games

### Records
Separate Team Records and Individual Records.
Only show records supported by data.

Known:
- Spring 2026 — best confirmed overall season: 14-0
- 5 franchise championships currently supported

### Opponents
Future-ready opponent database and head-to-head page.

---

## Current Fall 2026 game seed

Use the eight supplied regular-season results from `seed-data.json`.

The current Fall 2026 standings:
- The Hard Hats 8-0
- Minimal Effort 5-3
- The Down Bad Boys 5-3
- Cheers 4-4
- Sacrifice Blunt 1-7
- Chester City 1-7

Do not fabricate playoff results after the supplied PDF cutoff.

---

## Brand assets

All official assets are in `/assets/logos`.

### `sacrifice-blunt-wordmark-red.png`
Two red cardinals, yellow bat, red Sac Blunt script.
Use on light backgrounds and as the primary full wordmark.

### `sacrifice-blunt-wordmark-light.jpeg`
Two red cardinals, yellow bat, white script.
Use on dark backgrounds.

### `sacrifice-blunt-mascot.jpeg`
Full-body red bird mascot with green eye mask.
Use as standalone mascot/character artwork.

### `sacrifice-blunt-sb-badge.jpeg`
Monochrome triangular SB bird badge.
Use for favicon/app icon, compact navigation, watermarks, stat cards, and restrained alternate branding.

Do not redraw, stretch, recolor, or randomly mix these logos.

### Championship evidence
`/assets/evidence/fall-2025-championship-plaque.jpeg`

This image verifies:
- 2025 Bridgeton Fall Softball
- Wednesday Men's Division 3B
- Champions
- Sacrifice Blunt

---

## Visual system

Direction:
- black / near-black foundation
- cardinal red primary accent
- white text
- deep navy structural accent
- yellow/gold for championships and premium highlights
- green only sparingly from mascot identity

Feel:
**ESPN information density + Apple polish + baseball historical archive**

Do not make it look like:
- a generic TeamSnap/rec-league template,
- a weed shop,
- a novelty page,
- a casino site.

The name and mascot can be fun; the information design should be legitimate and premium.

Animations:
- subtle
- fast
- purposeful
- no excessive parallax or gimmicks

---

## Mobile-first requirements

Most usage will happen on phones at the field.

Prioritize:
- quick record lookup
- schedule visibility
- readable standings
- player stat lookup
- championship/history access

Tables should have mobile alternatives or controlled horizontal scroll.
Use stat cards for top-level values.

---

## Admin foundation

Protect admin routes.

Eventually support:
- add/edit season
- add/edit game
- add/edit player
- roster management
- championship/evidence upload
- score entry
- batting entry
- game finalization

Future live game workflow:
1. choose game
2. set lineup
3. tap batter
4. record 1B / 2B / 3B / HR / BB / OUT / ROE
5. calculate stats
6. finalize
7. update season/career totals
8. detect milestones/records

Architect for this now even if v1 admin is basic.

---

## URL conventions

Use stable slugs:
- `/seasons/2026-spring`
- `/championships/2026-spring`
- `/players/troy`
- `/opponents/minimal-effort`
- `/games/2026-fall-cheers-1`

---

## Copy tone

Confident, sports-forward, concise.

Avoid fake hype and invented claims.

Example hero:
**SACRIFICE BLUNT**
**5-TIME CHAMPIONS**
*Home of the 14-0 Spring 2026 Undefeated Champions.*

History should acknowledge:
*Originally COTC.*

---

## Build priorities

### Phase 1 — complete now
- data layer/schema
- branding
- homepage
- seasons archive
- season detail template
- history timeline
- Championship Vault
- Fall 2026 schedule/results
- players shell
- records shell
- responsive navigation
- metadata/SEO
- polished mobile UX

### Phase 2
- full game ingestion from historical PDFs
- player rosters
- batting stats
- player pages
- opponent head-to-head
- individual game pages
- milestones
- records engine
- player comparison

### Phase 3
- admin scorekeeping
- plate-appearance entry
- live game mode
- lineup builder
- printable score sheets
- automated record/milestone detection

---

## Data cleanup / ingestion instruction

The TeamSideline PDFs have line-wrapped text and occasionally ambiguous ordering. Do not parse an ambiguous line into production data unless it can be confidently mapped.

Start with the structured seed.
Then ingest additional game-level records from PDFs carefully.
Preserve source references so questionable entries can be reviewed.

---

## Acceptance criteria for v1

A successful v1 must:
- look custom and premium on desktop and mobile
- accurately represent COTC + Sacrifice Blunt as one franchise
- show **5-Time Champions**
- prominently feature the undefeated Spring 2026 championship
- show the historical season archive from supplied data
- have a polished Championship Vault
- have a usable Fall 2026 results page
- never present missing data as zero
- make it easy to add more seasons/games later
- use the supplied official logos
- preserve source/confidence metadata
- avoid hardcoding the site in a way that blocks future stats/admin features

---

## Important unresolved items

Do not block v1 on these:
- exact COTC → Sacrifice Blunt rebrand date
- missing 2020 records
- missing seasons not supplied
- complete historical rosters
- complete historical batting statistics
- playoff details for several sessions
- exact historical all-time totals beyond the supplied season set

Represent these honestly as incomplete and allow future backfill.

---

## Deliverable expectation

Do not just produce mockups.

Build the working site and data foundation. Use the supplied assets and seed data. Preserve source files in the repo under a clearly labeled archival/data-source directory or document how they were transformed.

Before considering v1 complete:
- test navigation,
- verify mobile layouts,
- verify season/championship counts against seed data,
- verify no missing value is rendered as a real zero,
- verify COTC records roll into franchise totals,
- verify Fall 2021 is included as a championship,
- verify Spring 2026 displays 12-0 regular season and 14-0 overall only with its mixed-source confidence note in admin/source metadata.
