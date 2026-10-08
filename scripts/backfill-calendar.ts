/**
 * Standalone maintenance script — NOT run by the website. Run it yourself whenever
 * you feel like it (`npm run backfill-calendar`) to grow the "stash" of good
 * Wikidata-sourced day matches, independent of what day it actually is today.
 *
 * Loops over days of the year, and for each one not already covered by the
 * hand-curated calendar (or already stashed), looks up painters born/died that
 * day on Wikidata and checks each candidate against the Met until one clears the
 * minimum usable-artwork bar. Good matches are written to src/lib/calendar-stash.json
 * after every find, so an interrupted run loses no progress.
 *
 * Usage:
 *   npm run backfill-calendar                      # all 365 days, skip already-stashed
 *   npm run backfill-calendar -- --start=1 --end=31 # just January
 *   npm run backfill-calendar -- --force            # recheck days already in the stash
 *   npm run backfill-calendar -- --delay=800        # slower, more polite to the APIs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CALENDAR } from "../src/lib/calendar";
import { getArtistsBornOrDiedOn } from "../src/lib/wikidata";
import { searchMetArtworks, MINIMUM_ARTWORKS } from "../src/lib/met";
import type { StashEntry } from "../src/lib/stash";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STASH_PATH = path.join(__dirname, "..", "src", "lib", "calendar-stash.json");
const GALLERY_COUNT = 6;

function parseArgs() {
  const raw = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const [key, value] = arg.replace(/^--/, "").split("=");
      return [key, value ?? "true"];
    }),
  );
  return {
    start: Number(raw.start ?? 1),
    end: Number(raw.end ?? 365),
    force: raw.force === "true",
    delayMs: Number(raw.delay ?? 500),
    candidateLimit: Number(raw.candidates ?? 15),
  };
}

/** Converts a 1-365 day-of-year index to month/day using a fixed non-leap reference year. */
function dayOfYearToMonthDay(dayOfYear: number): { month: number; day: number } {
  const date = new Date(2025, 0, dayOfYear);
  return { month: date.getMonth() + 1, day: date.getDate() };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadStash(): StashEntry[] {
  if (!fs.existsSync(STASH_PATH)) return [];
  return JSON.parse(fs.readFileSync(STASH_PATH, "utf-8"));
}

function saveStash(stash: StashEntry[]): void {
  fs.writeFileSync(STASH_PATH, JSON.stringify(stash, null, 2) + "\n");
}

async function main() {
  const { start, end, force, delayMs, candidateLimit } = parseArgs();
  let stash = loadStash();
  const curatedDays = new Set(CALENDAR.map((e) => `${e.month}-${e.day}`));

  let checked = 0;
  let found = 0;

  for (let doy = start; doy <= end; doy++) {
    const { month, day } = dayOfYearToMonthDay(doy);
    const key = `${month}-${day}`;
    const label = `${month}/${day}`;

    if (curatedDays.has(key)) {
      console.log(`[${label}] already in CALENDAR, skipping`);
      continue;
    }
    const alreadyStashed = stash.some((e) => e.month === month && e.day === day);
    if (alreadyStashed && !force) {
      console.log(`[${label}] already stashed, skipping (--force to recheck)`);
      continue;
    }

    checked++;

    try {
      const candidates = await getArtistsBornOrDiedOn(month, day, candidateLimit);
      let matched = false;

      for (const candidate of candidates) {
        const artworks = await searchMetArtworks(candidate.name, GALLERY_COUNT, true);
        await sleep(delayMs);

        if (artworks.length >= MINIMUM_ARTWORKS) {
          const entry: StashEntry = {
            id: `${slugify(candidate.name)}-${candidate.event}`,
            month,
            day,
            title: candidate.name,
            blurb:
              candidate.event === "birth"
                ? `${candidate.name} was born on this day in ${candidate.year}.`
                : `${candidate.name} died on this day in ${candidate.year}.`,
            metQuery: candidate.name,
            artistOrCulture: true,
            source: "wikidata",
            event: candidate.event,
            year: candidate.year,
            sitelinks: candidate.sitelinks,
            metMatches: artworks.length,
            addedAt: new Date().toISOString().slice(0, 10),
          };

          stash = [...stash.filter((e) => !(e.month === month && e.day === day)), entry];
          saveStash(stash);

          console.log(`[${label}] matched ${candidate.name} (${artworks.length} Met works)`);
          found++;
          matched = true;
          break;
        }
      }

      if (!matched) {
        console.log(`[${label}] no match found among ${candidates.length} candidate(s)`);
      }
    } catch (err) {
      console.error(`[${label}] error, skipping:`, err instanceof Error ? err.message : err);
    }

    await sleep(delayMs);
  }

  console.log(`\nDone. Checked ${checked} day(s), found ${found} new match(es). Stash now has ${stash.length} entries.`);
  console.log(`Review ${STASH_PATH} and promote good entries into src/lib/calendar.ts whenever you're ready.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
