#!/usr/bin/env node
/**
 * Builds src/data/dataset.json — the normalized, relational dataset the site reads.
 *
 * Inputs (in priority order):
 *   archive/data/seed-data.json          canonical seasons + championships (handoff)
 *   data/generated/teamsideline.json     game-level data parsed from the TeamSideline PDFs
 *   data/manual/*.json                   hand-maintained eras, players, annotations, PAs
 *
 * The output mirrors the Postgres schema in supabase/migrations so that moving
 * to Supabase is a load, not a rewrite (see scripts/export-sql-seed.mjs).
 *
 * Rules enforced here:
 *   - the seed's regular-season numbers win; parsed games must agree or the build fails
 *   - nothing unknown is written as 0 — unknown values are null
 *   - COTC seasons are part of the same franchise (team_name_at_time differs, franchise does not)
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));

const seed = read("archive/data/seed-data.json");
const ingest = read("data/generated/teamsideline.json");
const manual = read("data/manual/franchise.json");
const annotations = read("data/manual/season-annotations.json").seasons;
const people = read("data/manual/players.json");
const pas = read("data/manual/plate-appearances.json").plate_appearances;
const pgs = read("data/manual/player-game-stats.json").player_game_stats;
const extras = read("data/manual/extras.json");

const FRANCHISE_NAMES = new Set(["COTC", "Sacrifice Blunt"]);
const slugify = (s) => s.toLowerCase().replace(/[’']/g, "").replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const errors = [];
const reviewQueue = [];

// ---------- source evidence ----------
const sourceIndex = fs.readFileSync(path.join(root, "archive/data/source-index.csv"), "utf8").trim().split("\n").slice(1)
  .map((line) => { const [file, type, ...rest] = line.split(","); return { file, type, coverage: rest.join(",") }; });
const evidence = sourceIndex.map((s) => ({
  id: slugify(s.file.replace(/\.(pdf|jpe?g)$/i, "")),
  kind: s.type.includes("plaque") ? "physical_plaque" : "teamsideline_export",
  title: s.file,
  file: s.file.endsWith(".pdf") ? `archive/sources/${s.file}` : `archive/assets/evidence/${s.file}`,
  public_url: s.file.endsWith(".pdf") ? null : "/evidence/fall-2025-championship-plaque.jpg",
  coverage: s.coverage,
  confidence: "verified",
}));
evidence.push({
  id: "team-leadership",
  kind: "leadership_confirmation",
  title: "Team leadership confirmation",
  file: null, public_url: null,
  coverage: "Summer 2023 title; Spring 2026 undefeated title and 14-0 overall record; player names",
  confidence: "confirmed",
});
const evidenceIdForFile = (f) => slugify(f.replace(/\.pdf$/i, ""));

// ---------- seasons ----------
const ingestBySession = new Map(ingest.seasons.map((s) => [`${s.year}|${s.session}`, s]));
const sessionKey = (s) => `${s.year}|${s.session}`;
const SESSION_ORDER = { Winter: 0, Spring: 1, Summer: 2, "Summer/Fall": 3, Fall: 4 };

const opponents = new Map(); // canonical slug -> {id, canonical_name, aliases:Set}
function opponentFor(name) {
  const key = slugify(name);
  if (!opponents.has(key)) opponents.set(key, { id: key, slug: key, canonical_name: name, aliases: new Set() });
  const o = opponents.get(key);
  if (o.canonical_name !== name) {
    // prefer the capitalised variant as canonical; keep the other as alias
    const cap = (s) => (s.match(/[A-Z]/g) || []).length;
    if (cap(name) > cap(o.canonical_name)) { o.aliases.add(o.canonical_name); o.canonical_name = name; }
    else o.aliases.add(name);
  }
  return o;
}

const seasons = [];
const games = [];
const leagueGames = [];
const standings = [];

const confidenceNorm = (c) => ({
  verified: "verified",
  confirmed: "confirmed",
  confirmed_by_team_leadership: "confirmed",
  verified_regular_season_only: "verified_regular_season_only",
  mixed_verified_and_confirmed: "mixed_verified_and_confirmed",
  partial: "partial",
  unknown: "unknown",
}[c] ?? "unknown");

for (const s of seed.seasons) {
  const src = ingestBySession.get(sessionKey(s));
  if (!src) errors.push(`No TeamSideline ingest for seed season ${s.id}`);
  const us = src?.standings.find((r) => FRANCHISE_NAMES.has(r.team));
  if (src && !us) errors.push(`${s.id}: franchise not found in standings`);
  if (us && us.team !== s.team_name) errors.push(`${s.id}: name mismatch seed=${s.team_name} pdf=${us.team}`);
  if (us && (us.w !== s.regular_wins || us.l !== s.regular_losses || us.t !== s.regular_ties))
    errors.push(`${s.id}: record mismatch seed=${s.regular_wins}-${s.regular_losses} pdf=${us.w}-${us.l}`);
  if (us && us.place !== s.regular_place) errors.push(`${s.id}: place mismatch seed=${s.regular_place} pdf=${us.place}`);
  const bad = src?.validation.filter((v) => !v.match) ?? [];
  if (bad.length) errors.push(`${s.id}: parsed games disagree with printed standings ${JSON.stringify(bad)}`);

  const ann = annotations[s.id] ?? {};
  const eraId = s.team_name === "COTC" ? "cotc" : "sacrifice-blunt";
  const srcId = src ? evidenceIdForFile(src.source_file) : null;

  // league standings (verified, from PDF)
  for (const r of src?.standings ?? []) {
    standings.push({
      season_id: s.id, place: r.place, team: r.team, is_franchise: FRANCHISE_NAMES.has(r.team),
      opponent_id: FRANCHISE_NAMES.has(r.team) ? null : opponentFor(r.team).id,
      w: r.w, l: r.l, t: r.t, gb: r.gb, gp: r.gp, pct: Number(r.pct), streak: r.streak, coach: r.coach,
    });
  }

  // games
  const nth = new Map();
  const seasonGames = [];
  const sorted = [...(src?.games ?? [])].sort((a, b) => (a.date + toMinutes(a.time)).localeCompare(b.date + toMinutes(b.time)));
  for (const g of sorted) {
    const status = g.status === "postponed" ? "postponed"
      : g.status === "scheduled_or_unreported" ? "unreported" : g.status;
    // league-wide slate (for standings context and brackets)
    leagueGames.push({
      season_id: s.id, date: g.date, time: g.time, field: g.location, stage: g.stage, week: g.week,
      round: g.round, round_label: g.round_label, bracket_game: g.bracket_game ?? null,
      away: g.away, home: g.home,
      away_score: g.away_score ?? null, home_score: g.home_score ?? null,
      away_result: g.away_result ?? null, home_result: g.home_result ?? null,
      status, notes: g.notes ?? [],
    });
    const isHome = FRANCHISE_NAMES.has(g.home);
    const isAway = FRANCHISE_NAMES.has(g.away);
    if (!isHome && !isAway) continue;
    if (status === "postponed") continue; // the make-up game is listed separately
    const oppName = isHome ? g.away : g.home;
    const placeholder = /^G\d+ (Winner|Loser)$/.test(oppName);
    if (placeholder) continue;
    const opp = opponentFor(oppName);
    const n = (nth.get(opp.id) ?? 0) + 1; nth.set(opp.id, n);
    const teamScore = isHome ? g.home_score : g.away_score;
    const oppScore = isHome ? g.away_score : g.home_score;
    let result = null;
    if (status === "final") result = teamScore > oppScore ? "W" : teamScore < oppScore ? "L" : "T";
    if (status === "final_result_only") result = isHome ? g.home_result : g.away_result;
    const id = `${s.id}-${opp.slug}-${n}`;
    const isChampRound = /Championship/i.test(g.round_label ?? "");
    const game = {
      id, slug: id, season_id: s.id, date: g.date, time: g.time, field: g.location ?? null,
      opponent_id: opp.id, home_away: isHome ? "home" : "away",
      team_score: status === "final" ? teamScore : null,
      opponent_score: status === "final" ? oppScore : null,
      result, status,
      stage: g.stage, week: g.week ?? null, playoff_round: g.round ?? null, playoff_round_label: g.round_label ?? null,
      bracket_game: g.bracket_game ?? null, is_title_game: g.stage === "postseason" && isChampRound,
      team_name_at_time: isHome ? g.home : g.away,
      confidence: status === "unreported" ? "unknown" : "verified",
      source_evidence_id: srcId,
      notes: [
        ...(g.notes ?? []),
        ...(status === "final_result_only" ? ["TeamSideline records the result without a score."] : []),
        ...(status === "unreported" ? ["Listed on the TeamSideline schedule with no result posted."] : []),
      ],
    };
    seasonGames.push(game);
  }
  games.push(...seasonGames);

  // derived postseason record + finish (from games), cross-checked with seed
  const post = seasonGames.filter((g) => g.stage === "postseason");
  const postFinal = post.filter((g) => g.result);
  const postW = postFinal.filter((g) => g.result === "W").length;
  const postL = postFinal.filter((g) => g.result === "L").length;
  const postUnreported = post.some((g) => !g.result);
  let finish = null;
  if (postFinal.length) {
    const last = postFinal[postFinal.length - 1];
    if (last.is_title_game) finish = last.result === "W" ? "won_title_game" : "runner_up";
    else if (last.result === "L") finish = `lost_round_${last.playoff_round}`;
    else finish = "advanced";
  }
  const opp = (g) => [...opponents.values()].find((o) => o.id === g.opponent_id)?.canonical_name;
  const lastPost = postFinal[postFinal.length - 1];
  let finishLabel = null;
  if (s.champion) finishLabel = "Champion";
  else if (finish === "won_title_game") finishLabel = "Won title game · under review";
  else if (finish === "runner_up") finishLabel = "Runner-up";
  else if (finish?.startsWith("lost_round_")) finishLabel = `Lost in Round ${lastPost.playoff_round}`;
  else if (post.length && postUnreported && !postFinal.length) finishLabel = null;
  if (s.champion && finish !== "won_title_game") errors.push(`${s.id}: seed says champion but parsed games do not show a title-game win`);
  if (!s.champion && finish === "won_title_game" && !ann.title_under_review)
    errors.push(`${s.id}: parsed title-game win but not champion in seed and not flagged for review`);

  const overallKnown = !postUnreported && !(s.id === "2026-fall");
  const overallW = s.overall_wins ?? (overallKnown ? s.regular_wins + postW : null);
  const overallL = s.overall_losses ?? (overallKnown ? s.regular_losses + postL : null);
  if (s.overall_wins != null && overallKnown && s.overall_wins !== s.regular_wins + postW)
    errors.push(`${s.id}: seed overall ${s.overall_wins} != regular+postseason ${s.regular_wins + postW}`);

  const ourStanding = src?.standings.find((r) => FRANCHISE_NAMES.has(r.team));
  seasons.push({
    id: s.id, slug: s.id, year: s.year, session: s.session,
    sort_key: s.year * 10 + (SESSION_ORDER[s.session] ?? 5),
    era_id: eraId, team_name_at_time: s.team_name,
    league: s.league, division: s.division,
    league_size: src?.standings.length ?? null,
    regular_wins: s.regular_wins, regular_losses: s.regular_losses, regular_ties: s.regular_ties,
    regular_place: s.regular_place,
    regular_streak_end: ourStanding?.streak ?? null,
    postseason_wins: postFinal.length ? postW : null,
    postseason_losses: postFinal.length ? postL : null,
    overall_wins: overallW, overall_losses: overallL, overall_ties: overallW == null ? null : s.regular_ties,
    overall_source: s.overall_wins != null ? "seed" : overallW != null ? "derived_from_games" : null,
    runs_for: null, runs_against: null, // filled below from scored games
    playoff_finish: s.playoff_finish && !/scheduled/i.test(s.playoff_finish) ? (s.champion ? "Champion" : finishLabel ?? s.playoff_finish) : finishLabel,
    playoff_finish_code: s.champion ? "champion" : finish,
    playoff_status_note: /scheduled/i.test(s.playoff_finish ?? "") ? "Playoffs scheduled Oct 7, 2026" : null,
    champion: !!s.champion,
    title_under_review: !!ann.title_under_review,
    undefeated: !!s.undefeated,
    confidence: confidenceNorm(s.confidence),
    // every supplied season's printed standings were re-derived game-by-game from its PDF
    regular_confidence: us ? "verified" : confidenceNorm(s.confidence),
    postseason_confidence: ann.postseason_confidence ?? (post.length ? "verified" : "unknown"),
    championship_note: s.championship_note ?? null,
    postseason_note: ann.postseason_note ?? null,
    regular_season_note: ann.regular_season_note ?? null,
    source_notes: s.source,
    source_evidence_ids: [srcId, ...(s.source.includes("plaque") ? ["fall-2025-championship-plaque"] : []), ...(s.source.includes("user confirmation") ? ["team-leadership"] : [])].filter(Boolean),
    schedule_revision: src?.schedule_revision ?? null,
    playoff_revision: src?.playoff_revision ?? null,
  });
  if (ann.review) reviewQueue.push({ id: `season-${s.id}`, entity: "season", entity_id: s.id, severity: ann.title_under_review ? "decision" : "info", message: ann.review });
}

// runs for/against from fully scored seasons only (otherwise null — never a partial sum shown as a total)
for (const s of seasons) {
  const reg = games.filter((g) => g.season_id === s.id && g.stage === "regular");
  const allScored = reg.length > 0 && reg.every((g) => g.status === "final");
  s.regular_games_listed = reg.length;
  s.runs_for = allScored ? reg.reduce((a, g) => a + g.team_score, 0) : null;
  s.runs_against = allScored ? reg.reduce((a, g) => a + g.opponent_score, 0) : null;
  s.run_totals_note = allScored ? null : "Not every regular-season game has a posted score.";
}

// ---------- championships ----------
const championships = seed.championships.map((c) => {
  const s = seasons.find((x) => x.id === c.season_id);
  const titleGame = games.find((g) => g.season_id === c.season_id && g.is_title_game && g.result === "W");
  const route = games.filter((g) => g.season_id === c.season_id && g.stage === "postseason");
  const verif = [];
  if (titleGame) verif.push("teamsideline_playoff_results");
  if (c.season_id === "2025-fall") verif.push("championship_plaque");
  if (s.source_evidence_ids.includes("team-leadership")) verif.push("team_leadership");
  return {
    id: c.season_id, slug: c.season_id, season_id: c.season_id,
    title: c.title, team_name_at_time: c.team_name,
    confidence: confidenceNorm(c.confidence),
    verification: verif,
    undefeated: !!c.undefeated,
    title_game_id: titleGame?.id ?? null,
    postseason_game_ids: route.map((g) => g.id),
    evidence_image: c.season_id === "2025-fall" ? "/evidence/fall-2025-championship-plaque.jpg" : null,
    notes: s.championship_note ?? s.postseason_note ?? null,
  };
});
if (championships.length !== seed.franchise.championship_count_currently_supported)
  errors.push(`Championship count ${championships.length} != seed ${seed.franchise.championship_count_currently_supported}`);

// ---------- known-games cross check (seed current_known_games) ----------
for (const [sid, list] of Object.entries(seed.current_known_games ?? {})) {
  const ours = games.filter((g) => g.season_id === sid && g.stage === "regular");
  list.forEach((k, i) => {
    const g = ours[i];
    if (!g || g.date !== k.date || g.team_score !== k.team_score || g.opponent_score !== k.opponent_score || g.result !== k.result)
      errors.push(`${sid} game ${i + 1} does not match seed current_known_games: ${JSON.stringify(k)} vs ${JSON.stringify(g && { d: g.date, ts: g.team_score, os: g.opponent_score })}`);
  });
}

// ---------- missing sessions (gaps) ----------
const sessionsSeen = new Set(seasons.map((s) => `${s.year}|${s.session === "Summer/Fall" ? "Summer" : s.session}`));
const gaps = [];
for (let y = 2019; y <= 2026; y++) for (const sess of ["Spring", "Summer", "Fall"]) {
  const k = y * 10 + SESSION_ORDER[sess];
  if (k < 2019 * 10 + 4 || k > 2026 * 10 + 4) continue;
  if (!sessionsSeen.has(`${y}|${sess}`)) gaps.push({ year: y, session: sess, sort_key: k, note: "No record supplied for this session. The team may or may not have played." });
}

// ---------- players ----------
const playerSlugs = new Set(people.players.map((p) => p.slug));
for (const r of people.season_rosters) {
  if (!playerSlugs.has(r.player_slug)) errors.push(`Roster references unknown player ${r.player_slug}`);
  if (!seasons.find((s) => s.id === r.season_id)) errors.push(`Roster references unknown season ${r.season_id}`);
}
for (const p of pas) if (!games.find((g) => g.id === p.game_id)) errors.push(`PA references unknown game ${p.game_id}`);
for (const p of pgs) if (!games.find((g) => g.id === p.game_id)) errors.push(`player_game_stats references unknown game ${p.game_id}`);

// ---------- review queue: anything a human should look at ----------
for (const g of games) if (g.status === "unreported" && g.date < "2026-10-07")
  reviewQueue.push({ id: `game-${g.id}`, entity: "game", entity_id: g.id, severity: "info", message: `No result posted for ${g.date} vs ${opponents.get(g.opponent_id).canonical_name}.` });
for (const g of games) if (g.status === "final_result_only")
  reviewQueue.push({ id: `game-${g.id}`, entity: "game", entity_id: g.id, severity: "info", message: `Result (${g.result}) recorded without a score.` });
for (const o of opponents.values()) if (o.aliases.size)
  reviewQueue.push({ id: `opp-${o.id}`, entity: "opponent", entity_id: o.id, severity: "info", message: `Name variants merged: ${[o.canonical_name, ...o.aliases].join(" / ")}` });
reviewQueue.push({ id: "franchise-rename", entity: "era", entity_id: "cotc", severity: "decision", message: "Exact COTC → Sacrifice Blunt rename session not verified (between Fall 2021 and Fall 2022)." });
for (const gp of gaps) reviewQueue.push({ id: `gap-${gp.year}-${gp.session}`, entity: "season", entity_id: null, severity: "info", message: `${gp.session} ${gp.year}: no record supplied.` });

if (errors.length) {
  console.error("Dataset build FAILED:\n - " + errors.join("\n - "));
  process.exit(1);
}

const out = {
  meta: {
    built_at: new Date().toISOString(),
    data_as_of: "2026-10-07",
    sources: ["archive/data/seed-data.json", "data/generated/teamsideline.json", "data/manual/*"],
  },
  franchise: { ...manual.franchise, championship_count: championships.length },
  eras: manual.eras,
  seasons: seasons.sort((a, b) => a.sort_key - b.sort_key),
  gaps,
  standings,
  opponents: [...opponents.values()].map((o) => ({ ...o, aliases: [...o.aliases] })).sort((a, b) => a.canonical_name.localeCompare(b.canonical_name)),
  games,
  league_games: leagueGames,
  championships,
  players: people.players,
  season_rosters: people.season_rosters,
  roster_notes: people.roster_notes,
  plate_appearances: pas,
  player_game_stats: pgs,
  awards: extras.awards, milestones: extras.milestones, media: extras.media,
  source_evidence: evidence,
  review_queue: reviewQueue,
};
fs.mkdirSync(path.join(root, "src/data"), { recursive: true });
fs.writeFileSync(path.join(root, "src/data/dataset.json"), JSON.stringify(out, null, 1));
console.log(`dataset: ${seasons.length} seasons, ${games.length} franchise games, ${leagueGames.length} league games, ${opponents.size} opponents, ${championships.length} championships, ${reviewQueue.length} review items`);

function toMinutes(t) {
  const m = t.match(/(\d+):(\d+) ([AP]M)/); let h = +m[1] % 12; if (m[3] === "PM") h += 12;
  return String(h * 60 + +m[2]).padStart(4, "0");
}
