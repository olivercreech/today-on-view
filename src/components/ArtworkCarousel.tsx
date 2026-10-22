"use client";

import { useEffect, useRef, useState } from "react";
import type { MetArtwork } from "@/lib/met";
import { ArtworkMedia } from "./ArtworkMedia";
import { ArtworkInfo } from "./ArtworkInfo";

const SWIPE_THRESHOLD_PX = 40;

export function ArtworkCarousel({ artworks }: { artworks: MetArtwork[] }) {
  const [index, setIndex] = useState(0);
  const artwork = artworks[index];
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function go(delta: number) {
    setIndex((i) => (i + delta + artworks.length) % artworks.length);
  }

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current || artworks.length <= 1) return;
    const t = e.changedTouches[0];
    const deltaX = t.clientX - touchStart.current.x;
    const deltaY = t.clientY - touchStart.current.y;
    touchStart.current = null;

    // Only treat it as a swipe if the motion is mostly horizontal and past the
    // threshold — otherwise leave it alone so normal vertical page scroll still works.
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD_PX) {
      go(deltaX < 0 ? 1 : -1);
    }
  }

  useEffect(() => {
    const count = artworks.length;
    if (count <= 1) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return; // don't steal browser/OS shortcuts
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + count) % count);
      else if (e.key === "ArrowRight") setIndex((i) => (i + 1) % count);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [artworks.length]);

  return (
    <div>
      <div
        className="relative touch-pan-y overflow-hidden rounded-xl border border-border bg-background-elevated"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <ArtworkMedia artwork={artwork} priority />

        {artworks.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous artwork"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-xl text-foreground backdrop-blur transition-colors hover:bg-black/70"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next artwork"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-xl text-foreground backdrop-blur transition-colors hover:bg-black/70"
            >
              <span aria-hidden="true">›</span>
            </button>
          </>
        )}

        <ArtworkInfo artwork={artwork} />
      </div>

      {artworks.length > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2" role="tablist" aria-label="Choose an artwork">
          {artworks.map((a, i) => (
            <button
              key={a.objectID}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show artwork ${i + 1} of ${artworks.length}: ${a.title}`}
              onClick={() => setIndex(i)}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                i === index ? "bg-accent" : "bg-border hover:bg-muted"
              }`}
            />
          ))}
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        Showing artwork {index + 1} of {artworks.length}: {artwork.title}
      </p>
    </div>
  );
}
