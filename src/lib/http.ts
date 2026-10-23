/** Shared by every external API client (met.ts, wikidata.ts, wikipedia.ts). */
export const DAY_SECONDS = 60 * 60 * 24;

// Wikimedia (Wikidata + Wikipedia) asks every client to send a descriptive User-Agent
// with contact info: https://meta.wikimedia.org/wiki/User-Agent_policy. The Met's API
// has no such requirement, but there's no harm sending it there too.
export const USER_AGENT = "today-on-view/1.0 (https://github.com/olivercreech/today-on-view; contact: oliverbcreech@gmail.com)";

function significantWords(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents so "Cézanne" and "Cezanne" compare equal
    .replace(/[^a-z0-9\s]/g, " ") // punctuation (hyphens, periods, parens) -> space
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Both the Met's `q` search and Wikipedia's full-text search do loose relevance matching,
 * not an exact-identity match — a query can come back with a result that only shares a
 * word or two with the person actually being searched for (e.g. "Jean-Louis Forain" ->
 * an unrelated "Jean Louis"; "Charles Michel Campion" -> "Charles Aznavour filmography").
 * Require every word of the query to actually appear in the candidate result's own name/
 * title before trusting it as a real match.
 */
export function matchesQueryName(candidateName: string, query: string): boolean {
  const candidateWords = new Set(significantWords(candidateName));
  return significantWords(query).every((w) => candidateWords.has(w));
}
