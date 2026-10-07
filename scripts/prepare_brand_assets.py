#!/usr/bin/env python3
"""Prepare web copies of the official logos WITHOUT redrawing or recoloring them.

Only operation: the flat white (or black) canvas *outside* the artwork is made
transparent so the marks can sit on the site's dark surfaces, then the canvas is
trimmed. Pixels inside the artwork are untouched. Originals stay in archive/assets.
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = Path(sys.argv[1]); OUT = Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)

def knock_out(img, bg="white", thr=232, band=3, extra_ids=(), enclosed_min=None):
    a = np.asarray(img.convert("RGB")).astype(np.int16)
    if bg == "white":
        is_bg = a.min(axis=2) >= thr
        darkness = 255 - a.min(axis=2)
    else:
        is_bg = a.max(axis=2) <= 255 - thr
        darkness = a.max(axis=2)
    lab, _ = ndimage.label(is_bg)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    remove = set(edge) | set(extra_ids)
    if enclosed_min is not None:  # enclosed background pockets (not artwork fills)
        sizes = ndimage.sum(is_bg, lab, range(1, lab.max() + 1))
        remove |= {i + 1 for i, sz in enumerate(sizes) if sz >= enclosed_min}
    outside = np.isin(lab, list(remove))
    alpha = np.where(outside, 0, 255).astype(np.float32)
    ring = ndimage.binary_dilation(outside, iterations=band) & ~outside
    soft = np.clip((darkness.astype(np.float32) - (255 - thr)) / 90.0, 0, 1) * 255
    alpha[ring] = np.maximum(soft[ring], 0)
    rgba = np.dstack([a.astype(np.uint8), alpha.astype(np.uint8)])
    im = Image.fromarray(rgba, "RGBA")
    return im.crop(im.getbbox())

def save(im, name, widths):
    for w in widths:
        h = round(im.height * w / im.width)
        im.resize((w, h), Image.LANCZOS).save(OUT / f"{name}-{w}.png", optimize=True)
        im.resize((w, h), Image.LANCZOS).save(OUT / f"{name}-{w}.webp", quality=90, method=6)

# Light wordmark: the script letters are white, so enclosed pockets must be picked
# explicitly (component ids below were identified visually: gaps between bat, birds
# and letters, and the counters of S, a and B). Letter fills are kept.
save(knock_out(Image.open(SRC / "logos/sacrifice-blunt-wordmark-light.jpeg"),
               extra_ids=(49, 50, 51, 52, 53, 57, 58, 61, 63, 64)), "wordmark-light", [480, 960])
save(knock_out(Image.open(SRC / "logos/sacrifice-blunt-wordmark-red.png"), enclosed_min=400), "wordmark-red", [480, 960])
save(knock_out(Image.open(SRC / "logos/sacrifice-blunt-mascot.jpeg"), enclosed_min=3000), "mascot", [360, 720])
badge = knock_out(Image.open(SRC / "logos/sacrifice-blunt-sb-badge.jpeg"), bg="black", thr=225)
save(badge, "badge", [64, 160, 320])
# square icons from the badge (favicon / app icon) on its own black field
for size in (32, 180, 192, 512):
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    b = badge.copy(); b.thumbnail((int(size * .86), int(size * .86)), Image.LANCZOS)
    canvas.alpha_composite(b, ((size - b.width) // 2, (size - b.height) // 2))
    canvas.convert("RGB").save(OUT / f"icon-{size}.png", optimize=True)
# evidence photo: web copy, unmodified apart from size
Image.open(SRC / "evidence/fall-2025-championship-plaque.jpeg").convert("RGB").save(
    OUT.parent / "evidence/fall-2025-championship-plaque.jpg", quality=86, optimize=True)
print("ok")
