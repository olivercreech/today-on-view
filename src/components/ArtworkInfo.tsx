import type { MetArtwork } from "@/lib/met";

/** The title/artist/medium/link text block shared by the mobile card list and the carousel. */
export function ArtworkInfo({ artwork }: { artwork: MetArtwork }) {
  return (
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
  );
}
