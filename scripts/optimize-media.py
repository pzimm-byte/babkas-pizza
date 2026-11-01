#!/usr/bin/env python3
"""Compress page photos, make posters, favicon, and OG image. Originals stay out of the page."""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path("/workspace")
SRC = ROOT / "handoff" / "assets"
FALLBACK = ROOT / "assets"
OUT_PHOTOS = ROOT / "assets" / "photos"
OUT_BRAND = ROOT / "assets" / "brand"

CREAM = (253, 246, 236)


def source(rel: str) -> Path:
    for base in (SRC, FALLBACK / "photos", FALLBACK):
        candidate = base / rel
        if candidate.exists():
            return candidate
    return FALLBACK / rel


def to_rgb(im: Image.Image, bg: tuple[int, int, int] = CREAM) -> Image.Image:
    im = ImageOps.exif_transpose(im)
    if im.mode in ("RGBA", "LA"):
        background = Image.new("RGB", im.size, bg)
        background.paste(im, mask=im.split()[-1])
        return background
    if im.mode == "P":
        im = im.convert("RGBA")
        background = Image.new("RGB", im.size, bg)
        background.paste(im, mask=im.split()[-1])
        return background
    if im.mode != "RGB":
        return im.convert("RGB")
    return im


def save_jpeg(im: Image.Image, dest: Path, quality: int = 80) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "JPEG", quality=quality, optimize=True, progressive=True)


def compress(rel: str, dest: Path, max_side: int, quality: int = 80, bg: tuple[int, int, int] = CREAM) -> None:
    im = to_rgb(Image.open(source(rel)), bg)
    w, h = im.size
    scale = min(1.0, max_side / max(w, h))
    if scale < 1:
        im = im.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.Resampling.LANCZOS)
    save_jpeg(im, dest, quality)
    print(f"{dest.relative_to(ROOT)}  {im.size[0]}x{im.size[1]}  {dest.stat().st_size // 1024}KB")


def cover_crop(rel: str, dest: Path, size: tuple[int, int], quality: int = 82) -> None:
    im = to_rgb(Image.open(source(rel)))
    tw, th = size
    scale = max(tw / im.width, th / im.height)
    nw, nh = max(tw, int(im.width * scale)), max(th, int(im.height * scale))
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    im = im.crop((left, top, left + tw, top + th))
    save_jpeg(im, dest, quality)
    print(f"{dest.relative_to(ROOT)}  {im.size[0]}x{im.size[1]}  {dest.stat().st_size // 1024}KB")


def make_png(rel: str, dest: Path, size: int) -> None:
    im = Image.open(source(rel))
    im = ImageOps.exif_transpose(im).convert("RGBA")
    im.thumbnail((size, size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(im, ((size - im.width) // 2, (size - im.height) // 2), im)
    dest.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(dest, "PNG", optimize=True)
    print(f"{dest.relative_to(ROOT)}  {size}x{size}  {dest.stat().st_size // 1024}KB")


def poster(video: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(video), "-frames:v", "1", "-q:v", "4", str(dest)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    im = to_rgb(Image.open(dest), (0, 0, 0))
    save_jpeg(im, dest, 78)
    print(f"{dest.relative_to(ROOT)}  {im.size[0]}x{im.size[1]}  {dest.stat().st_size // 1024}KB")


def main() -> None:
    OUT_PHOTOS.mkdir(parents=True, exist_ok=True)
    OUT_BRAND.mkdir(parents=True, exist_ok=True)

    photos = [
        "assembly-toppings.jpg",
        "checkerboard-spread.jpg",
        "gozney-peel-cut.jpg",
        "margherita-overhead.jpg",
        "picnic-slice-pull.jpg",
        "sicilian-pepperoni-ranch.jpg",
    ]
    for name in photos:
        compress(name, OUT_PHOTOS / name.replace(".jpg", ".jpg"), max_side=1100, quality=78)

    compress("team-tent.jpg", OUT_PHOTOS / "team-tent.jpg", max_side=1600, quality=78)

    # Logos sit on black and use mix-blend-mode: screen — keep a dark background.
    compress("brand/wordmark-babkas.jpg", OUT_BRAND / "wordmark-babkas.jpg", max_side=720, quality=82, bg=(0, 0, 0))
    compress("brand/full-lockup.jpg", OUT_BRAND / "full-lockup.jpg", max_side=560, quality=82, bg=(0, 0, 0))
    compress("brand/arch-flame-icon.jpg", OUT_BRAND / "arch-flame-icon.jpg", max_side=256, quality=82, bg=(0, 0, 0))

    make_png("brand/arch-flame-icon.jpg", ROOT / "assets" / "favicon.png", 32)
    make_png("brand/arch-flame-icon.jpg", ROOT / "assets" / "apple-touch-icon.png", 180)
    ico = Image.open(ROOT / "assets" / "apple-touch-icon.png").convert("RGBA")
    ico.save(ROOT / "assets" / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

    cover_crop("picnic-slice-pull.jpg", ROOT / "assets" / "og-image.jpg", (1200, 630), quality=80)

    flame = source("brand/flame-loop.mp4")
    loading = source("brand/loading-animation.mp4")
    if not (OUT_BRAND / "flame-loop.mp4").exists() or (OUT_BRAND / "flame-loop.mp4").resolve() != flame.resolve():
        shutil.copy2(flame, OUT_BRAND / "flame-loop.mp4")
    if not (OUT_BRAND / "loading-animation.mp4").exists() or (OUT_BRAND / "loading-animation.mp4").resolve() != loading.resolve():
        shutil.copy2(loading, OUT_BRAND / "loading-animation.mp4")

    poster(OUT_BRAND / "flame-loop.mp4", OUT_BRAND / "flame-loop-poster.jpg")
    poster(OUT_BRAND / "loading-animation.mp4", OUT_BRAND / "loading-poster.jpg")


if __name__ == "__main__":
    main()
