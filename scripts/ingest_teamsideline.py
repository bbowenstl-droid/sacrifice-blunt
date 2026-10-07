#!/usr/bin/env python3
"""
Ingest TeamSideline "Standings & Results" print-view PDFs into structured JSON.

Usage:
    python3 scripts/ingest_teamsideline.py archive/sources data/generated/teamsideline.json

What it does
  * runs `pdftotext -layout` on every PDF in the sources directory
  * reads the season header, standings table, regular-season schedule and playoff schedule
  * re-joins team names that TeamSideline wraps onto a second line (uses column position)
  * respects the column order printed in each file (2019 prints Home before Away)
  * attaches rain-out / maintenance notes to the game they follow
  * resolves every name against the standings list; anything it cannot resolve
    with certainty is written to `review` instead of production data
  * recomputes every team's W-L from the parsed games and compares it with the
    printed standings, so a parsing mistake shows up as a validation failure

Nothing here guesses. Unscored games are kept as "scheduled" / "postponed".
"""
import json
import re
import subprocess
import sys
from pathlib import Path

DAY = r"(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)"
GAME_RE = re.compile(rf"^(\s*)({DAY}) (\d{{1,2}})/(\d{{1,2}})\s+(\d{{1,2}}:\d{{2}} [AP]M)(\s+)(.*)$")
HEADER_RE = re.compile(r"(\d{4}) (Spring|Summer/Fall|Summer|Fall|Winter) Softball \| (.+?) \| All Teams")
STAND_RE = re.compile(
    r"^\s*(\d+)\s+(.+?)\s{2,}(\d+)\s+(\d+)\s+(\d+)\s+(--|[\d.]+)\s+(\d+)\s+([\d.]+)\s+((?:Won|Lost|Tied) \d+)\s+(.+?)\s*$"
)
COLHDR_RE = re.compile(r"^\s*Date\s+Time\s+(Game\s+)?(Away|Home)\s+(Away|Home)\s+Location")
TOKEN_RE = re.compile(r"\S+(?: \S+)*")
SCORE_RE = re.compile(r"^(\d+|W|L|F)$")
NOTE_RE = re.compile(r"(Rained Out|rain Out|Maintenance|Cancel|Forfeit|Postponed)", re.I)


def tokens(s, offset=0):
    return [(m.start() + offset, m.group(0)) for m in TOKEN_RE.finditer(s)]


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def parse_pdf(path: Path):
    txt = subprocess.run(["pdftotext", "-layout", str(path), "-"], capture_output=True, text=True, check=True).stdout
    lines = txt.splitlines()
    season = {"source_file": path.name}
    standings, games, review = [], [], []
    section = None  # standings | schedule | playoffs
    order = ("away", "home")
    week = None
    rnd = None
    last = None  # last game or bye dict, for continuation lines
    for raw in lines:
        if not raw.strip() or "teamsideline.com/common" in raw or re.match(r"^\d+/\d+/\d+, \d", raw.strip()):
            continue
        m = HEADER_RE.search(raw)
        if m:
            season.update(year=int(m.group(1)), session=m.group(2), division=m.group(3).strip())
            continue
        s = re.sub(r"^[^\x00-\x7f\u2019]+\s*", "", raw.strip())  # drop icon glyphs
        if s == "Standings":
            section = "standings"; continue
        if s == "Schedule":
            section = "schedule"; last = None; continue
        if s == "Playoff Schedule":
            section = "playoffs"; last = None; continue
        if s.startswith("GB = "):
            section = None; continue
        if s.startswith("Schedule Revision Date") or s.startswith("Playoff Schedule Revision Date"):
            key = "playoff_revision" if s.startswith("Playoff") else "schedule_revision"
            season[key] = s.split(":", 1)[1].strip()
            continue
        m = COLHDR_RE.match(raw)
        if m:
            order = (m.group(2).lower(), m.group(3).lower())
            continue
        if section == "standings":
            m = STAND_RE.match(raw)
            if m:
                standings.append({
                    "place": int(m.group(1)), "team": m.group(2).strip(), "w": int(m.group(3)), "l": int(m.group(4)),
                    "t": int(m.group(5)), "gb": m.group(6), "gp": int(m.group(7)), "pct": m.group(8),
                    "streak": m.group(9), "coach": m.group(10).strip(),
                })
            elif s.startswith("Place"):
                pass
            else:
                review.append({"type": "unparsed_standings_line", "line": s})
            continue
        if section in ("schedule", "playoffs"):
            wm = re.match(r"^Week (\d+)", s)
            if wm:
                week = int(wm.group(1)); last = None; continue
            pm = re.match(r"^Playoff Round (\d+)(.*)$", s)
            if pm:
                rnd = {"round": int(pm.group(1)), "label": ("Playoff Round " + pm.group(1) + pm.group(2)).strip()}
                last = None; continue
            gm = GAME_RE.match(raw)
            if gm:
                rest_offset = len(raw) - len(gm.group(7))
                toks = tokens(gm.group(7), rest_offset)
                g = {
                    "month": int(gm.group(3)), "day": int(gm.group(4)), "time": gm.group(5),
                    "stage": "regular" if section == "schedule" else "postseason",
                    "week": week if section == "schedule" else None,
                    "round": rnd["round"] if (section == "playoffs" and rnd) else None,
                    "round_label": rnd["label"] if (section == "playoffs" and rnd) else None,
                    "raw": s,
                }
                if toks and re.match(r"^G\d+$", toks[0][1]):
                    g["bracket_game"] = toks[0][1]; toks = toks[1:]
                loc = None
                if toks and re.match(r"^(F\d+|Field.*|BMAC.*)$", toks[-1][1]):
                    loc = toks[-1][1]; toks = toks[:-1]
                # expect name [score] name [score]
                parts = []
                for pos, t in toks:
                    if SCORE_RE.match(t) and parts and parts[-1]["score"] is None and parts[-1]["name"] is not None:
                        parts[-1]["score"] = t
                    else:
                        parts.append({"pos": pos, "name": t, "score": None})
                if len(parts) != 2:
                    review.append({"type": "unparsed_game_line", "line": s, "section": section})
                    last = None
                    continue
                g["location"] = loc
                g["_cols"] = parts
                games.append(g)
                last = g
                continue
            bm = re.match(r"^Bye\s{2,}(.+)$", s)
            if bm:
                last = {"bye": True}
                continue
            if NOTE_RE.search(s) or s.startswith("Tournament"):
                if last is not None and "bye" not in last and NOTE_RE.search(s):
                    last.setdefault("notes", []).append(s)
                continue
            # continuation of wrapped team names
            if last is not None and "bye" not in last:
                for pos, frag in tokens(raw):
                    cols = last["_cols"]
                    target = min(cols, key=lambda c: abs(c["pos"] - pos))
                    target["name"] += " " + frag
                continue
            if last is not None and "bye" in last:
                continue  # wrapped bye-team name
            review.append({"type": "unclassified_line", "line": s, "section": section})
    # ---- resolve names ---------------------------------------------------
    teams = [r["team"] for r in standings]

    def resolve(name):
        if name in teams:
            return name
        if re.match(r"^G\d+ (Winner|Loser)$", name):
            return name
        cands = [t for t in teams if t.lower().startswith(name.lower())]
        if len(cands) == 1:
            return cands[0]
        cands = [t for t in teams if t.lower() == name.lower()]
        return cands[0] if len(cands) == 1 else None

    out_games = []
    year = season.get("year")
    for g in games:
        cols = g.pop("_cols")
        sides = {}
        ok = True
        for side, c in zip(order, cols):
            nm = resolve(c["name"].strip())
            if nm is None:
                ok = False
                review.append({"type": "unresolved_team", "name": c["name"], "line": g["raw"]})
            sides[side] = {"team": nm, "score": c["score"]}
        if not ok:
            continue
        a, h = sides["away"], sides["home"]
        g.update(date=f"{year:04d}-{g.pop('month'):02d}-{g.pop('day'):02d}", away=a["team"], home=h["team"])
        if a["score"] is not None and h["score"] is not None:
            if a["score"].isdigit() and h["score"].isdigit():
                g.update(away_score=int(a["score"]), home_score=int(h["score"]), status="final")
            else:
                g.update(away_result=a["score"], home_result=h["score"], status="final_result_only")
        elif g.get("notes"):
            g["status"] = "postponed"
        else:
            g["status"] = "scheduled_or_unreported"
        out_games.append(g)
    # ---- validate regular season against printed standings ---------------
    calc = {t: [0, 0, 0] for t in teams}
    for g in out_games:
        if g["stage"] != "regular" or not g["status"].startswith("final"):
            continue
        if g["status"] == "final":
            aw = g["away_score"] > g["home_score"]; tie = g["away_score"] == g["home_score"]
        else:
            aw = g["away_result"] == "W"; tie = False
        if tie:
            calc[g["away"]][2] += 1; calc[g["home"]][2] += 1
        else:
            calc[g["away" if aw else "home"]][0] += 1
            calc[g["home" if aw else "away"]][1] += 1
    validation = []
    for r in standings:
        c = calc[r["team"]]
        validation.append({"team": r["team"], "printed": [r["w"], r["l"], r["t"]], "parsed": c,
                           "match": c == [r["w"], r["l"], r["t"]]})
    season.update(standings=standings, games=out_games, review=review, validation=validation)
    return season


def main():
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    seasons = [parse_pdf(p) for p in sorted(src.glob("*.pdf"))]
    seasons.sort(key=lambda s: (s["year"], ["Winter", "Spring", "Summer", "Summer/Fall", "Fall"].index(s["session"]), s["source_file"]))
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(json.dumps({"generated_by": "scripts/ingest_teamsideline.py", "seasons": seasons}, indent=2))
    for s in seasons:
        bad = [v for v in s["validation"] if not v["match"]]
        print(f"{s['year']} {s['session']:7} {s['division']:32} games={len(s['games']):3} "
              f"review={len(s['review'])} validation={'OK' if not bad else 'MISMATCH ' + json.dumps(bad)}")


if __name__ == "__main__":
    main()
