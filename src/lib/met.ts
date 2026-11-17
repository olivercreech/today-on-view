import type { Artwork } from "./artwork";
import { DAY_SECONDS, matchesQueryName } from "./http";

const BASE = "https://collectionapi.metmuseum.org/public/collection/v1";
// The Met retired unpaginated /v1/search on 2026-10-01 in favor of this paginated endpoint.
const SEARCH_URL = "https://collectionapi.metmuseum.org/public/collection/v1.1/search";

async function searchObjectIds(query: string, limit: number, artistOrCulture?: boolean): Promise<number[]> {
  // Paintings only — drawings and prints don't hold up visually on this page.
  const params = new URLSearchParams({ q: query, hasImages: "true", medium: "Paintings", limit: String(limit) });
  if (artistOrCulture) params.set("artistOrCulture", "true");

  const res = await fetch(`${SEARCH_URL}?${params}`, {
    next: { revalidate: DAY_SECONDS },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { total: number; objectIDs: number[] | null };
  return data.objectIDs ?? [];
}

async function getObject(id: number): Promise<Artwork | null> {
  const res = await fetch(`${BASE}/objects/${id}`, {
    next: { revalidate: DAY_SECONDS },
  });
  if (!res.ok) return null;

  const data = await res.json();
  if (!data.primaryImageSmall || !data.isPublicDomain) return null;
  // Belt and braces on top of the search's medium filter, which matches loosely.
  if (!/painting/i.test(data.classification ?? "")) return null;

  return {
    id: `met-${data.objectID}`,
    source: "met",
    title: data.title || "Untitled",
    artistDisplayName: data.artistDisplayName || "Unknown artist",
    objectDate: data.objectDate || "",
    medium: data.medium || "",
    location: data.department || "",
    objectURL: data.objectURL || `https://www.metmuseum.org/art/collection/search/${data.objectID}`,
    imageUrl: data.primaryImageSmall,
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
function dedupeByTitle(artworks: Artwork[]): Artwork[] {
  const seen = new Set<string>();
  const result: Artwork[] = [];
  for (const artwork of artworks) {
    const key = normalizedTitle(artwork.title);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(artwork);
  }
  return result;
}

/** Search the Met's Open Access API and resolve up to `count` viewable, public-domain paintings. */
export async function searchMetArtworks(query: string, count: number, artistOrCulture?: boolean): Promise<Artwork[]> {
  // The search endpoint doesn't tell us which results have public-domain images,
  // so over-fetch candidates and filter client-side.
  const ids = await searchObjectIds(query, count * 5, artistOrCulture);
  if (ids.length === 0) return [];

  const objects = await Promise.all(ids.map(getObject));
  let resolved = objects.filter((o): o is Artwork => o !== null);
  if (artistOrCulture) {
    resolved = resolved.filter((o) => matchesQueryName(o.artistDisplayName, query));
  }

  const unique = dedupeByTitle(resolved);
  return unique.slice(0, count);
}
