const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const DAY_SECONDS = 60 * 60 * 24;

// Wikidata asks every client to send a descriptive User-Agent with contact info.
// See https://meta.wikimedia.org/wiki/User-Agent_policy
const USER_AGENT = "art-gallery-app/1.0 (https://github.com/; contact: oliverbcreech@gmail.com)";

export type WikidataCandidate = {
  name: string;
  event: "birth" | "death";
  year: number;
  sitelinks: number;
};

type SparqlBinding = {
  personLabel: { value: string };
  dob?: { value: string };
  dod?: { value: string };
  sitelinks: { value: string };
};

/**
 * Painters born or died on this month/day (any year), ranked by Wikidata sitelink
 * count (a rough notability proxy) so the most likely Met matches come first.
 *
 * Known limitation: Wikidata records with only year-or-decade precision birth/death
 * dates are stored as a placeholder date (often Jan 1), so this can over-match people
 * to January 1st specifically. Not a concern for other days of the year.
 */
export async function getArtistsBornOrDiedOn(month: number, day: number, limit = 20): Promise<WikidataCandidate[]> {
  const query = `
    SELECT ?personLabel ?dob ?dod ?sitelinks WHERE {
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
  `;

  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/sparql-results+json" },
      next: { revalidate: DAY_SECONDS },
    });
  } catch {
    return [];
  }
  if (!res.ok) return [];

  const data = (await res.json()) as { results: { bindings: SparqlBinding[] } };

  const seen = new Set<string>();
  const candidates: WikidataCandidate[] = [];
  for (const b of data.results.bindings) {
    const name = b.personLabel.value;
    if (seen.has(name)) continue; // same person can match twice if both P569 and P570 hit (rare)
    seen.add(name);

    const event: "birth" | "death" = b.dob ? "birth" : "death";
    const dateValue = b.dob?.value ?? b.dod?.value ?? "";
    const year = Number(dateValue.slice(0, 4));
    if (!year) continue;

    candidates.push({ name, event, year, sitelinks: Number(b.sitelinks.value) });
  }

  return candidates;
}
