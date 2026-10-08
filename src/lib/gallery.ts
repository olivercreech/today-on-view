import { findCalendarEntry, getSeasonForDate } from "./calendar";
import { findStashEntry } from "./stash";
import { getArtistsBornOrDiedOn, type WikidataCandidate } from "./wikidata";
import { getGalleryArtworks, searchMetArtworks, backfillWithSeason, MINIMUM_ARTWORKS, type MetArtwork } from "./met";
import type { Theme } from "./theme";

export type GallerySource = "calendar" | "stash" | "wikidata" | "season";

export type GalleryResolution = {
  theme: Theme;
  artworks: MetArtwork[];
  source: GallerySource;
};

// Bounds how many Wikidata candidates a live page request will try before giving up and
// falling back to the season — each attempt is a full Met search, so this caps worst-case
// page latency. The offline backfill script can afford to try more (see MAX_SCRIPT_ATTEMPTS).
const MAX_LIVE_CANDIDATE_ATTEMPTS = 5;

function themeFromCandidate(candidate: WikidataCandidate): Theme {
  const blurb =
    candidate.event === "birth"
      ? `${candidate.name} was born on this day in ${candidate.year}.`
      : `${candidate.name} died on this day in ${candidate.year}.`;
  return { title: candidate.name, blurb, metQuery: candidate.name, artistOrCulture: true };
}

/**
 * Try Wikidata candidates in notability order until one has enough Met holdings to
 * stand on its own. Returns the winning candidate plus its primary (non-season-backfilled)
 * artworks, so the caller doesn't have to re-fetch them.
 */
export async function findBestWikidataMatch(
  month: number,
  day: number,
  count: number,
  maxAttempts: number,
): Promise<{ candidate: WikidataCandidate; artworks: MetArtwork[] } | undefined> {
  const candidates = await getArtistsBornOrDiedOn(month, day);

  for (const candidate of candidates.slice(0, maxAttempts)) {
    const artworks = await searchMetArtworks(candidate.name, count, true);
    if (artworks.length >= MINIMUM_ARTWORKS) {
      return { candidate, artworks };
    }
  }
  return undefined;
}

/**
 * Resolve today's gallery: hand-curated calendar first, then the backfilled stash of
 * previously-found Wikidata matches, then a live Wikidata lookup, then season fallback.
 */
export async function resolveGallery(date: Date, count = 6): Promise<GalleryResolution> {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const season = getSeasonForDate(month, day);

  const curated = findCalendarEntry(month, day);
  if (curated) {
    const { artworks } = await getGalleryArtworks(curated, season, count);
    return { theme: curated, artworks, source: "calendar" };
  }

  const stashed = findStashEntry(month, day);
  if (stashed) {
    const { artworks } = await getGalleryArtworks(stashed, season, count);
    return { theme: stashed, artworks, source: "stash" };
  }

  const wikidataMatch = await findBestWikidataMatch(month, day, count, MAX_LIVE_CANDIDATE_ATTEMPTS);
  if (wikidataMatch) {
    const theme = themeFromCandidate(wikidataMatch.candidate);
    const artworks = await backfillWithSeason(wikidataMatch.artworks, season, count);
    return { theme, artworks, source: "wikidata" };
  }

  const artworks = await searchMetArtworks(season.metQuery, count, season.artistOrCulture);
  return { theme: season, artworks, source: "season" };
}
