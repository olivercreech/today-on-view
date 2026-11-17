import { findCalendarEntry, getSeasonForDate } from "./calendar";
import { getSiteDate } from "./date";
import { findStashEntry } from "./stash";
import { countPaintingsWithImages, getArtistsBornOrDiedOn, type WikidataCandidate } from "./wikidata";
import { searchMetArtworks } from "./met";
import { getCommonsPaintings } from "./commons";
import { MINIMUM_ARTWORKS, type Artwork } from "./artwork";
import type { Theme } from "./theme";

export type GalleryResolution = {
  theme: Theme;
  artworks: Artwork[];
  /** The day's one featured artist, whose bio is shown. Absent for holiday/season themes. */
  artist?: string;
};

// How many of the most notable same-day painters a live page request will try before
// giving up — each try is a Met search plus possibly a Commons lookup, so this caps
// worst-case latency. The offline backfill script has no such constraint.
const MAX_LIVE_CANDIDATE_ATTEMPTS = 5;

function themeFromCandidate(candidate: WikidataCandidate): Theme {
  // No name here — the page title already is candidate.name, shown directly above this blurb.
  const blurb =
    candidate.event === "birth"
      ? `Born on this day in ${candidate.year}.`
      : `Died on this day in ${candidate.year}.`;
  return { title: candidate.name, blurb, metQuery: candidate.name, artistOrCulture: true, wikidataId: candidate.qid };
}

/**
 * One artist's paintings: the Met first (richer records, links to its own pages), then
 * Wikimedia Commons — which gathers public-domain paintings from hundreds of museums —
 * when the Met holds too few. Never mixes in other artists' work.
 */
async function paintingsForArtist(theme: Theme, count: number): Promise<Artwork[]> {
  const met = await searchMetArtworks(theme.metQuery, count, true);
  if (met.length >= MINIMUM_ARTWORKS || !theme.wikidataId) return met;
  const commons = await getCommonsPaintings(theme.wikidataId, count);
  return commons.length > met.length ? commons : met;
}

/** Resolve a calendar/stash theme, or undefined if it doesn't yield enough paintings. */
async function tryTheme(theme: Theme, count: number): Promise<GalleryResolution | undefined> {
  if (theme.artistOrCulture) {
    const artworks = await paintingsForArtist(theme, count);
    if (artworks.length < MINIMUM_ARTWORKS) return undefined;
    // Calendar titles can be phrases ("Van Gogh's Birthday") and search terms can be
    // partial ("Van Gogh"); the paintings' own credit line carries the full name.
    return { theme, artworks, artist: artworks[0].artistDisplayName };
  }
  const artworks = await searchMetArtworks(theme.metQuery, count, false);
  return artworks.length >= MINIMUM_ARTWORKS ? { theme, artworks } : undefined;
}

/**
 * The most notable painter born or died on this day who has enough paintings to show.
 * Candidates are screened with one batched Wikidata count first, so only artists with
 * real holdings cost a per-artist lookup.
 */
async function findLiveArtist(month: number, day: number, count: number): Promise<GalleryResolution | undefined> {
  const candidates = await getArtistsBornOrDiedOn(month, day);
  const counts = await countPaintingsWithImages(candidates.map((c) => c.qid));
  const viable = candidates.filter((c) => (counts.get(c.qid) ?? 0) >= MINIMUM_ARTWORKS);

  for (const candidate of viable.slice(0, MAX_LIVE_CANDIDATE_ATTEMPTS)) {
    const resolution = await tryTheme(themeFromCandidate(candidate), count);
    if (resolution) return resolution;
  }
  return undefined;
}

/**
 * Resolve today's gallery: hand-curated calendar first, then the backfilled stash of
 * previously-found matches, then a live Wikidata lookup, then a season fallback.
 */
export async function resolveGallery(date: Date, count = 6, timeZone?: string): Promise<GalleryResolution> {
  const { month, day } = getSiteDate(date, timeZone);

  const curated = findCalendarEntry(month, day);
  const curatedResolution = curated && (await tryTheme(curated, count));
  if (curatedResolution) return curatedResolution;

  const stashed = findStashEntry(month, day);
  const stashedResolution = stashed && (await tryTheme(stashed, count));
  if (stashedResolution) return stashedResolution;

  const live = await findLiveArtist(month, day, count);
  if (live) return live;

  // Last resort: a handful of seasonal paintings, deliberately with no artist bios.
  const season = getSeasonForDate(month, day);
  const artworks = await searchMetArtworks(season.metQuery, count, season.artistOrCulture);
  return { theme: season, artworks };
}
