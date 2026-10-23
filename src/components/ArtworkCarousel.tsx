"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { MetArtwork } from "@/lib/met";

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
        <div className="relative aspect-16/9 w-full bg-black p-3 sm:aspect-4/3 sm:p-6">
          <div className="relative h-full w-full">
            <Image
              src={artwork.primaryImageSmall}
              alt={`${artwork.title}, by ${artwork.artistDisplayName}`}
              fill
              priority
              className="object-contain drop-shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
              sizes="(min-width: 640px) 80vw, 100vw"
            />
          </div>
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.65) 100%)" }}
          />
        </div>

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

        <div className="flex flex-1 flex-col gap-2 p-4 sm:gap-4 sm:p-7">
          <div>
            <h2 className="font-display text-lg text-foreground sm:text-2xl">{artwork.title}</h2>
            <p className="mt-1 text-xs uppercase tracking-widest text-accent">
              {artwork.artistDisplayName}
              {artwork.objectDate ? ` · ${artwork.objectDate}` : ""}
            </p>
          </div>
          {artwork.medium || artwork.department ? (
            <p className="hidden text-sm leading-relaxed text-muted sm:block">
              {[artwork.medium, artwork.department].filter(Boolean).join(" — ")}
            </p>
          ) : null}
          <a
            href={artwork.objectURL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View "${artwork.title}" at the Met (opens in a new tab)`}
            className="text-sm font-medium text-accent underline underline-offset-4 decoration-accent/40 transition-colors hover:text-foreground"
          >
            View at the Met &rarr;
          </a>
        </div>
      </div>

      {artworks.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-2 sm:mt-5" role="tablist" aria-label="Choose an artwork">
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
