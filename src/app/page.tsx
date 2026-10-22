import { resolveGallery } from "@/lib/gallery";
import { getArtistBios } from "@/lib/wikipedia";
import { ReadAloudButton } from "@/components/ReadAloudButton";
import { ArtworkCarousel } from "@/components/ArtworkCarousel";

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
      <main className="w-full max-w-3xl px-6 py-6 sm:px-10 sm:py-20">
        <header className="mb-5 text-center sm:mb-10">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">{dateLabel}</p>
          <h1 className="mt-1.5 font-display text-3xl italic tracking-tight text-foreground sm:mt-4 sm:text-5xl md:text-6xl">
            {theme.title}
          </h1>
          <p className="mx-auto mt-1.5 max-w-2xl font-display text-base italic leading-snug text-muted sm:mt-5 sm:text-lg sm:leading-relaxed">
            {theme.blurb}
          </p>
        </header>

        {bios.length > 0 && (
          <section className="mb-5 space-y-4 sm:mb-10">
            {bios.map((bio) => {
              // When the page title already is this artist's name (single-artist theme days),
              // repeating it as a label right below is redundant — hide it visually but keep
              // it for screen readers, which still benefit from an explicit heading here.
              const redundantWithTitle = bios.length === 1 && bio.name.toLowerCase() === theme.title.toLowerCase();
              return (
                <div key={bio.name}>
                  <h2
                    className={
                      redundantWithTitle
                        ? "sr-only"
                        : "text-xs font-semibold uppercase tracking-widest text-accent"
                    }
                  >
                    {bio.name}
                  </h2>
                  <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted sm:line-clamp-none">
                    {bio.extract}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-5">
                    <a
                      href={bio.wikipediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Read more about ${bio.name} on Wikipedia (opens in a new tab)`}
                      className="text-sm font-medium text-accent underline underline-offset-4 decoration-accent/40 transition-colors hover:text-foreground"
                    >
                      Read more on Wikipedia &rarr;
                    </a>
                    <ReadAloudButton text={bio.extract} label={`the biography of ${bio.name}`} />
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {artworks.length === 0 ? (
          <p className="text-center text-muted">
            No artworks could be loaded for today&apos;s theme. Please try again shortly.
          </p>
        ) : (
          <ArtworkCarousel artworks={artworks} />
        )}

        <footer className="mt-6 text-center text-xs text-muted/70 sm:mt-20">
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
          <br />
          <a href="/feed.xml" className="mt-2 inline-block underline decoration-accent/40 hover:text-accent">
            Subscribe via RSS
          </a>
        </footer>
      </main>
    </div>
  );
}
