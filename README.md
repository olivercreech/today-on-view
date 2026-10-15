# Today on View

A single-page app that curates a small themed art gallery based on today's date —
holidays, seasons, or artist birth/death anniversaries — pulling artworks from the
[Met Museum's Open Access API](https://www.metmuseum.org/about-the-met/policies-and-documents/open-access)
and a short Wikipedia-sourced biography for each artist shown.

## Stack

- **Next.js (App Router) + TypeScript** — the whole app is one server-rendered page.
- **Tailwind CSS** — styling.
- **Met Museum Open Access API** — no key required (`src/lib/met.ts`).
- **Wikipedia REST API** — no key required (`src/lib/wikipedia.ts`), one short bio per unique artist
  shown that day.
- **Hand-curated calendar** — `src/lib/calendar.ts`, ~30 entries (holidays + artist anniversaries).
- **Wikidata fallback** — for any day not in the calendar, a live Wikidata lookup (`src/lib/wikidata.ts`)
  finds painters born/died that day and cross-checks them against the Met, before finally falling back
  to a seasonal theme. See "Gallery resolution order" below.

No database, no user accounts, no archive browsing, and no paid API dependency — the whole app is one
page that reflects "today," built entirely on free data sources.

## Gallery resolution order

For any given date, `src/lib/gallery.ts` resolves today's theme in this order:

1. **Calendar** — an exact hand-curated match in `src/lib/calendar.ts`.
2. **Stash** — a previously-found Wikidata match saved in `src/lib/calendar-stash.json` (see below).
3. **Live Wikidata** — looks up painters born/died today, tries each (ranked by notability) against the
   Met until one has enough usable artworks.
4. **Season** — a generic seasonal theme, the final fallback.

Any of these that comes up thin on Met results backfills the remainder from the season's query.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No environment variables or API keys needed.

## Extending the calendar

Add entries to the `CALENDAR` array in `src/lib/calendar.ts`:

```ts
{ id: "some-id", month: 3, day: 14, title: "Pi Day", blurb: "...", metQuery: "geometric pattern" }
```

- `metQuery` is passed to the Met's `/search` endpoint. Set `artistOrCulture: true` to restrict the
  search to the artist/culture field (better precision for artist names).
- If a themed search returns fewer than 4 usable (public-domain, has-image) results, the gallery
  automatically backfills with the current season's query.

## Growing the calendar with the backfill script

`scripts/backfill-calendar.ts` is a standalone maintenance script — **not** run by the website — that
you run yourself whenever you feel like it, independent of what day it actually is:

```bash
npm run backfill-calendar                      # all 365 days, skips already-curated/stashed ones
npm run backfill-calendar -- --start=1 --end=31 # just January
npm run backfill-calendar -- --force            # recheck days already in the stash
```

It loops over days of the year, looks each one up on Wikidata, and checks candidates against the Met.
Good matches are written to `src/lib/calendar-stash.json` immediately (so an interrupted run loses no
progress). Periodically review that file and promote the entries you like into the `CALENDAR` array in
`src/lib/calendar.ts` for a permanent, reviewed match.

## Caching

The page is revalidated at most every 6 hours (`export const revalidate` in `src/app/page.tsx`), so a
burst of visitors doesn't hammer the Met/Wikidata/Wikipedia APIs — the gallery for the day is generated
once and served from cache until the next revalidation window.

## Deploy on Vercel

```bash
vercel
```

No environment variables required.
