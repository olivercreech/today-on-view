# Today on View

A single-page app that curates a small themed art gallery based on today's date —
holidays, seasons, or artist birth/death anniversaries — pulling artworks from the
[Met Museum's Open Access API](https://www.metmuseum.org/about-the-met/policies-and-documents/open-access)
and generating a short piece of didactic wall text for each one with Claude.

## Stack

- **Next.js (App Router) + TypeScript** — the whole app is one server-rendered page.
- **Tailwind CSS** — styling.
- **Met Museum Open Access API** — no key required (`src/lib/met.ts`).
- **Anthropic SDK (Claude Opus 5)** — generates the per-artwork context paragraph (`src/lib/anthropic.ts`).
- **Hand-curated calendar** — `src/lib/calendar.ts`, ~30 entries (holidays + artist anniversaries).
- **Wikidata fallback** — for any day not in the calendar, a live Wikidata lookup (`src/lib/wikidata.ts`)
  finds painters born/died that day and cross-checks them against the Met, before finally falling back
  to a seasonal theme. See "Gallery resolution order" below.

No database, no user accounts, no archive browsing — the whole app is one page that reflects "today."

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
cp .env.local.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without an `ANTHROPIC_API_KEY` set, the page still
renders using a plain fallback sentence in place of the generated paragraph.

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

## Caching / cost control

The page is revalidated at most every 6 hours (`export const revalidate` in `src/app/page.tsx`), so a
burst of visitors doesn't multiply Claude API calls — the gallery for the day is generated once and
served from cache until the next revalidation window.

## Deploy on Vercel

```bash
vercel
```

Set `ANTHROPIC_API_KEY` in the project's environment variables.
