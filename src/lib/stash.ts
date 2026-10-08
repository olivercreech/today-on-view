import type { CalendarEntry } from "./calendar";
import rawStash from "./calendar-stash.json";

/**
 * A calendar entry discovered automatically by `scripts/backfill-calendar.ts` via
 * Wikidata, with enough Met holdings to be worth showing. Kept separate from the
 * hand-curated CALENDAR so it can be reviewed before being promoted in.
 */
export type StashEntry = CalendarEntry & {
  source: "wikidata";
  event: "birth" | "death";
  year: number;
  sitelinks: number;
  metMatches: number;
  addedAt: string; // ISO date the script found this match
};

export const STASH = rawStash as StashEntry[];

export function findStashEntry(month: number, day: number): StashEntry | undefined {
  return STASH.find((e) => e.month === month && e.day === day);
}
