import Image from "next/image";
import type { MetArtwork } from "@/lib/met";

/** The matted, vignetted image treatment shared by the mobile card list and the carousel. */
export function ArtworkMedia({ artwork, priority = false }: { artwork: MetArtwork; priority?: boolean }) {
  return (
    <div className="relative aspect-4/3 w-full bg-black p-6 sm:aspect-16/9">
      <div className="relative h-full w-full">
        <Image
          src={artwork.primaryImageSmall}
          alt={`${artwork.title}, by ${artwork.artistDisplayName}`}
          fill
          priority={priority}
          className="object-contain drop-shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
          sizes="(min-width: 640px) 80vw, 100vw"
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.65) 100%)" }}
      />
    </div>
  );
}
