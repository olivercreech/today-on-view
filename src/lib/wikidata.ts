import { DAY_SECONDS, USER_AGENT } from "./http";

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

export type WikidataCandidate = {
  qid: string;
  name: string;
  event: "birth" | "death";
  year: number;
  sitelinks: number;
};

/** "http://www.wikidata.org/entity/Q5582" -> "Q5582" */
export function qidFromUri(uri: string): string {
  return uri.slice(uri.lastIndexOf("/") + 1);
}

/** Run a SPARQL query against Wikidata; returns [] on any network/HTTP/parse failure. */
export async function sparql<T>(query: string): Promise<T[]> {
  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/sparql-results+json" },
      next: { revalidate: DAY_SECONDS },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { results: { bindings: T[] } };
    return data.results.bindings;
  } catch {
    return [];
  }
}

type CandidateBinding = {
  person: { value: string };
  personLabel: { value: string };
  dob?: { value: string };
  dod?: { value: string };
  sitelinks: { value: string };
};

/**
 * Painters born or died on this month/day (any year), ranked by Wikidata sitelink
 * count (a rough notability proxy) so the best-known come first.
 *
 * Known limitation: Wikidata records with only year-or-decade precision birth/death
 * dates are stored as a placeholder date (often Jan 1), so this can over-match people
 * to January 1st specifically. Not a concern for other days of the year.
 */
export async function getArtistsBornOrDiedOn(month: number, day: number, limit = 40): Promise<WikidataCandidate[]> {
  const bindings = await sparql<CandidateBinding>(`
    SELECT ?person ?personLabel ?dob ?dod ?sitelinks WHERE {
      ?person wdt:P106 wd:Q1028181 .
      ?person wikibase:sitelinks ?sitelinks .
      {
        ?person wdt:P569 ?dob .
        FILTER(MONTH(?dob) = ${month} && DAY(?dob) = ${day})
      }
      UNION
      {
        ?person wdt:P570 ?dod .
        FILTER(MONTH(?dod) = ${month} && DAY(?dod) = ${day})
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    ORDER BY DESC(?sitelinks)
    LIMIT ${limit}
  `);

  const seen = new Set<string>();
  const candidates: WikidataCandidate[] = [];
  for (const b of bindings) {
    const qid = qidFromUri(b.person.value);
    if (seen.has(qid)) continue; // same person can match twice if both P569 and P570 hit (rare)
    seen.add(qid);

    const event: "birth" | "death" = b.dob ? "birth" : "death";
    const dateValue = b.dob?.value ?? b.dod?.value ?? "";
    const year = Number(dateValue.slice(0, 4));
    if (!year) continue;

    candidates.push({ qid, name: b.personLabel.value, event, year, sitelinks: Number(b.sitelinks.value) });
  }

  return candidates;
}

/**
 * For each artist, how many paintings Wikidata lists with a Commons image. One cheap
 * batched query, so candidates can be screened before any per-artist image lookups.
 */
export async function countPaintingsWithImages(qids: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (qids.length === 0) return counts;
  const bindings = await sparql<{ person: { value: string }; n: { value: string } }>(`
    SELECT ?person (COUNT(DISTINCT ?work) AS ?n) WHERE {
      VALUES ?person { ${qids.map((q) => `wd:${q}`).join(" ")} }
      ?work wdt:P170 ?person ; wdt:P31 wd:Q3305213 ; wdt:P18 ?img .
    }
    GROUP BY ?person
  `);
  for (const b of bindings) counts.set(qidFromUri(b.person.value), Number(b.n.value));
  return counts;
}
