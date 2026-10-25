import { findCalendarEntry, getSeasonForDate } from "./calendar";
import { findStashEntry } from "./stash";
import { getArtistsBornOrDiedOn, type WikidataCandidate } from "./wikidata";
import { getGalleryArtworks, searchMetArtworks, backfillWithSeason, MINIMUM_ARTWORKS, type MetArtwork } from "./met";
import type { Theme } from "./theme";

export type GalleryResolution = {
  theme: Theme;
  artworks: MetArtwork[];
};

// Bounds how many Wikidata candidates a live page request will evaluate before giving up and
// falling back to the season — each attempt is a full Met search, so this caps worst-case
// page latency. The offline backfill script has no such constraint and evaluates every candidate.
const MAX_LIVE_CANDIDATE_ATTEMPTS = 10;

function themeFromCandidate(candidate: WikidataCandidate): Theme {
  // No name here — the page title already is candidate.name, shown directly above this blurb.
  const blurb =
    candidate.event === "birth"
      ? `Born on this day in ${candidate.year}.`
      : `Died on this day in ${candidate.year}.`;
  return { title: candidate.name, blurb, metQuery: candidate.name, artistOrCulture: true };
}

/**
 * Evaluate Wikidata candidates (most notable first) and return whichever one has the
 * richest Met holdings — not just the first to clear the minimum bar. Wikidata notability
 * (sitelinks) and Met representation don't reliably correlate: a famous actress can easily
 * outrank a well-collected painter, so stopping at the first pass can hand back a thin,
 * barely-qualifying match while a much richer one sits a few ranks lower. Returns the
 * winning candidate plus its primary (non-season-backfilled) artworks, so the caller
 * doesn't have to re-fetch them.
 */
export async function findBestWikidataMatch(
  month: number,
  day: number,
  count: number,
  maxAttempts: number,
): Promise<{ candidate: WikidataCandidate; artworks: MetArtwork[] } | undefined> {
  const candidates = await getArtistsBornOrDiedOn(month, day);

  // searchMetArtworks caps its results at the requested count, so fetching only `count`
  // per candidate would make a 100-work painter and a 1000-work painter look identical —
  // over-fetch for a fair richness comparison, then trim the winner down to `count`.
  const evalCount = Math.max(count, 8);

  let best: { candidate: WikidataCandidate; artworks: MetArtwork[] } | undefined;
  for (const candidate of candidates.slice(0, maxAttempts)) {
    const artworks = await searchMetArtworks(candidate.name, evalCount, true);
    if (artworks.length >= MINIMUM_ARTWORKS && (!best || artworks.length > best.artworks.length)) {
      best = { candidate, artworks: artworks.slice(0, count) };
    }
  }
  return best;
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
    const { artworks, matchedTheme } = await getGalleryArtworks(curated, season, count);
    if (matchedTheme) return { theme: curated, artworks };
  }

  const stashed = findStashEntry(month, day);
  if (stashed) {
    const { artworks, matchedTheme } = await getGalleryArtworks(stashed, season, count);
    if (matchedTheme) return { theme: stashed, artworks };
  }

  const wikidataMatch = await findBestWikidataMatch(month, day, count, MAX_LIVE_CANDIDATE_ATTEMPTS);
  if (wikidataMatch) {
    const theme = themeFromCandidate(wikidataMatch.candidate);
    const artworks = await backfillWithSeason(wikidataMatch.artworks, season, count);
    return { theme, artworks };
  }

  const artworks = await searchMetArtworks(season.metQuery, count, season.artistOrCulture);
  return { theme: season, artworks };
}
