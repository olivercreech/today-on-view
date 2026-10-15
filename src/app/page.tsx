import Image from "next/image";
import { resolveGallery } from "@/lib/gallery";
import { getArtistBios } from "@/lib/wikipedia";

// Regenerate at most every 6 hours instead of on every request, so a burst of
// traffic doesn't hammer the Met/Wikidata/Wikipedia APIs for a page that only needs to change daily.
export const revalidate = 21600;

export default async function Home() {
  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const { theme, artworks } = await resolveGallery(now, 6);
  const bios = await getArtistBios(artworks.map((a) => a.artistDisplayName));

  return (
    <div className="flex flex-col flex-1 items-center bg-background font-sans">
      <main className="w-full max-w-5xl px-6 py-20 sm:px-10">
        <header className="mb-16 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">{dateLabel}</p>
          <h1 className="mt-4 font-display text-5xl italic tracking-tight text-foreground sm:text-6xl">
            {theme.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl font-display text-lg italic leading-relaxed text-muted">
            {theme.blurb}
          </p>
        </header>

        {artworks.length === 0 ? (
          <p className="text-center text-muted">
            No artworks could be loaded for today&apos;s theme. Please try again shortly.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2">
            {artworks.map((artwork) => (
              <article
                key={artwork.objectID}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-background-elevated transition-shadow duration-300 hover:shadow-[0_0_50px_-12px_rgba(201,162,75,0.25)]"
              >
                <div className="relative aspect-4/3 w-full bg-black p-6">
                  <div className="relative h-full w-full">
                    <Image
                      src={artwork.primaryImageSmall}
                      alt={artwork.title}
                      fill
                      className="object-contain drop-shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
                      sizes="(min-width: 640px) 50vw, 100vw"
                    />
                  </div>
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.65) 100%)",
                    }}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-4 p-7">
                  <div>
                    <h2 className="font-display text-2xl text-foreground">{artwork.title}</h2>
                    <p className="mt-1 text-xs uppercase tracking-widest text-accent">
                      {artwork.artistDisplayName}
                      {artwork.objectDate ? ` · ${artwork.objectDate}` : ""}
                    </p>
                  </div>
                  {artwork.medium || artwork.department ? (
                    <p className="flex-1 text-sm leading-relaxed text-muted">
                      {[artwork.medium, artwork.department].filter(Boolean).join(" — ")}
                    </p>
                  ) : null}
                  <a
                    href={artwork.objectURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-accent underline underline-offset-4 decoration-accent/40 transition-colors hover:text-foreground"
                  >
                    View at the Met &rarr;
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}

        {bios.length > 0 && (
          <section className="mx-auto mt-20 max-w-3xl">
            <h2 className="text-center font-display text-3xl italic text-foreground">
              About {bios.length > 1 ? "the Artists" : "the Artist"}
            </h2>
            <div className="mt-8 space-y-8">
              {bios.map((bio) => (
                <div key={bio.name} className="border-t border-border pt-6">
                  <h3 className="font-display text-xl text-foreground">{bio.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{bio.extract}</p>
                  <a
                    href={bio.wikipediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-accent underline underline-offset-4 decoration-accent/40 transition-colors hover:text-foreground"
                  >
                    Read more on Wikipedia &rarr;
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-20 text-center text-xs text-muted/70">
          Artwork data from the{" "}
          <a
            href="https://www.metmuseum.org/about-the-met/policies-and-documents/open-access"
            className="underline decoration-accent/40 hover:text-accent"
          >
            Met Museum Open Access API
          </a>
          . Artist biographies from{" "}
          <a href="https://en.wikipedia.org" className="underline decoration-accent/40 hover:text-accent">
            Wikipedia
          </a>
          , CC BY-SA 4.0.
        </footer>
      </main>
    </div>
  );
}
