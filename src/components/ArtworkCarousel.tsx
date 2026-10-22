"use client";

import { useState } from "react";
import type { MetArtwork } from "@/lib/met";
import { ArtworkMedia } from "./ArtworkMedia";
import { ArtworkInfo } from "./ArtworkInfo";

export function ArtworkCarousel({ artworks }: { artworks: MetArtwork[] }) {
  const [index, setIndex] = useState(0);
  const artwork = artworks[index];

  function go(delta: number) {
    setIndex((i) => (i + delta + artworks.length) % artworks.length);
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl border border-border bg-background-elevated">
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
