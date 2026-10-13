import type { Theme } from "./theme";

const BASE = "https://collectionapi.metmuseum.org/public/collection/v1";
// The Met retired unpaginated /v1/search on 2026-10-01 in favor of this paginated endpoint.
const SEARCH_URL = "https://collectionapi.metmuseum.org/public/collection/v1.1/search";
const DAY_SECONDS = 60 * 60 * 24;

export type MetArtwork = {
  objectID: number;
  title: string;
  artistDisplayName: string;
  artistDisplayBio: string;
  objectDate: string;
  medium: string;
  department: string;
  creditLine: string;
  objectURL: string;
  primaryImageSmall: string;
  tags: string[];
};

async function searchObjectIds(query: string, limit: number, artistOrCulture?: boolean): Promise<number[]> {
  const params = new URLSearchParams({ q: query, hasImages: "true", limit: String(limit) });
  if (artistOrCulture) params.set("artistOrCulture", "true");

  const res = await fetch(`${SEARCH_URL}?${params}`, {
    next: { revalidate: DAY_SECONDS },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { total: number; objectIDs: number[] | null };
  return data.objectIDs ?? [];
}

async function getObject(id: number): Promise<MetArtwork | null> {
  const res = await fetch(`${BASE}/objects/${id}`, {
    next: { revalidate: DAY_SECONDS },
  });
  if (!res.ok) return null;

  const data = await res.json();
  if (!data.primaryImageSmall || !data.isPublicDomain) return null;

  return {
    objectID: data.objectID,
    title: data.title || "Untitled",
    artistDisplayName: data.artistDisplayName || "Unknown artist",
    artistDisplayBio: data.artistDisplayBio || "",
    objectDate: data.objectDate || "Date unknown",
    medium: data.medium || "",
    department: data.department || "",
    creditLine: data.creditLine || "",
    objectURL: data.objectURL || `https://www.metmuseum.org/art/collection/search/${data.objectID}`,
    primaryImageSmall: data.primaryImageSmall,
    tags: Array.isArray(data.tags) ? data.tags.map((t: { term: string }) => t.term).filter(Boolean) : [],
  };
}

function normalizedTitle(title: string): string {
  return title.trim().toLowerCase();
}

/**
 * Drop artworks whose title repeats one already kept. The Met often catalogs a print's
 * individual plates, states, or companion pieces as separate objects with the same or
 * near-identical title (e.g. a set of "Autumn (Wine Harvest)" plates) — without this, a
 * themed search can return what looks to a visitor like the same picture several times.
 */
function dedupeByTitle(artworks: MetArtwork[], seen: Set<string> = new Set()): MetArtwork[] {
  const result: MetArtwork[] = [];
  for (const artwork of artworks) {
    const key = normalizedTitle(artwork.title);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(artwork);
  }
  return result;
}

/** Minimum usable (public-domain, has-image) artworks a theme needs before it's considered a real match. */
export const MINIMUM_ARTWORKS = 4;

/** Search the Met's Open Access API and resolve up to `count` viewable, public-domain artworks. */
export async function searchMetArtworks(query: string, count: number, artistOrCulture?: boolean): Promise<MetArtwork[]> {
  // The search endpoint doesn't tell us which results have public-domain images,
  // so over-fetch candidates and filter client-side.
  const ids = await searchObjectIds(query, count * 5, artistOrCulture);
  if (ids.length === 0) return [];

  const objects = await Promise.all(ids.map(getObject));
  const unique = dedupeByTitle(objects.filter((o): o is MetArtwork => o !== null));
  return unique.slice(0, count);
}

/** Top up a thin primary result list with non-duplicate artworks from the season's query. */
export async function backfillWithSeason(primary: MetArtwork[], season: Theme, count: number): Promise<MetArtwork[]> {
  if (primary.length >= count) return primary.slice(0, count);

  const seenIds = new Set(primary.map((a) => a.objectID));
  const seenTitles = new Set(primary.map((a) => normalizedTitle(a.title)));
  const backfill = dedupeByTitle(await searchMetArtworks(season.metQuery, count, season.artistOrCulture), seenTitles);

  const merged = [...primary];
  for (const artwork of backfill) {
    if (merged.length >= count) break;
    if (!seenIds.has(artwork.objectID)) {
      merged.push(artwork);
      seenIds.add(artwork.objectID);
    }
  }
  return merged.slice(0, count);
}

/**
 * Get the gallery for a theme, falling back to the current season's query
 * to top up the count if the themed search comes back thin.
 */
export async function getGalleryArtworks(
  theme: Theme,
  season: Theme,
  count = 6,
): Promise<{ artworks: MetArtwork[]; usedFallback: boolean }> {
  const primary = await searchMetArtworks(theme.metQuery, count, theme.artistOrCulture);

  if (primary.length >= MINIMUM_ARTWORKS || theme.metQuery === season.metQuery) {
    return { artworks: primary.slice(0, count), usedFallback: false };
  }

  const merged = await backfillWithSeason(primary, season, count);
  return { artworks: merged, usedFallback: true };
}
