"use client";

import { useState } from "react";
import Image from "next/image";
import type { MetArtwork } from "@/lib/met";

export function ArtworkCarousel({ artworks }: { artworks: MetArtwork[] }) {
  const [index, setIndex] = useState(0);
  const artwork = artworks[index];

  function go(delta: number) {
    setIndex((i) => (i + delta + artworks.length) % artworks.length);
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl border border-border bg-background-elevated">
        <div className="relative aspect-4/3 w-full bg-black p-6 sm:aspect-16/9">
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
            style={{
              background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.65) 100%)",
            }}
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

        <div className="flex flex-1 flex-col gap-4 p-7">
          <div>
            <h2 className="font-display text-2xl text-foreground">{artwork.title}</h2>
            <p className="mt-1 text-xs uppercase tracking-widest text-accent">
              {artwork.artistDisplayName}
              {artwork.objectDate ? ` · ${artwork.objectDate}` : ""}
            </p>
          </div>
          {artwork.medium || artwork.department ? (
            <p className="text-sm leading-relaxed text-muted">
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
