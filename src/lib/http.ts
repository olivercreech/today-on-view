/** Shared by every external API client (met.ts, wikidata.ts, wikipedia.ts). */
export const DAY_SECONDS = 60 * 60 * 24;

// Wikimedia (Wikidata + Wikipedia) asks every client to send a descriptive User-Agent
// with contact info: https://meta.wikimedia.org/wiki/User-Agent_policy. The Met's API
// has no such requirement, but there's no harm sending it there too.
export const USER_AGENT = "today-on-view/1.0 (contact: oliverbcreech@gmail.com)";
