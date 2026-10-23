import { DAY_SECONDS, USER_AGENT } from "./http";

const SUMMARY_API = "https://en.wikipedia.org/api/rest_v1/page/summary";
const SEARCH_API = "https://en.wikipedia.org/w/api.php";

export type ArtistBio = {
  name: string; // resolved Wikipedia article title, not necessarily the Met's exact spelling
  extract: string; // plain-text lead-paragraph summary
  wikipediaUrl: string;
};

async function fetchSummary(title: string): Promise<ArtistBio | null> {
  const url = `${SUMMARY_API}/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      next: { revalidate: DAY_SECONDS },
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const data = await res.json();
  if (data.type === "disambiguation" || !data.extract) return null;

  return {
    name: data.title,
    extract: data.extract,
    wikipediaUrl: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
  };
}

/** Resolves a loose name to its most likely Wikipedia article title via full-text search. */
async function searchTitle(query: string): Promise<string | null> {
  const params = new URLSearchParams({ action: "query", list: "search", srsearch: query, format: "json", srlimit: "1" });

  let res: Response;
  try {
    res = await fetch(`${SEARCH_API}?${params}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      next: { revalidate: DAY_SECONDS },
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const data = await res.json();
  return data?.query?.search?.[0]?.title ?? null;
}

/**
 * Look up a short Wikipedia bio for an artist name. The Met's `artistDisplayName` field
 * sometimes carries a parenthetical alias (e.g. "Pietro da Cortona (Pietro Berrettini)")
 * that won't match a Wikipedia title directly — strip it, and if the direct title lookup
 * still misses, fall back to Wikipedia's own search to resolve the closest article.
 */
export async function getArtistBio(artistName: string): Promise<ArtistBio | null> {
  const cleaned = artistName.replace(/\s*\([^)]*\)\s*$/, "").trim();
  if (!cleaned || cleaned.toLowerCase() === "unknown artist") return null;

  const direct = await fetchSummary(cleaned);
  if (direct) return direct;

  const resolvedTitle = await searchTitle(cleaned);
  if (!resolvedTitle) return null;
  return fetchSummary(resolvedTitle);
}

/** Look up bios for several artist names in parallel, de-duplicated, dropping any that fail. */
export async function getArtistBios(artistNames: string[]): Promise<ArtistBio[]> {
  const unique = [...new Set(artistNames.map((n) => n.trim()).filter(Boolean))];
  const results = await Promise.all(unique.map(getArtistBio));
  return results.filter((b): b is ArtistBio => b !== null);
}
