# Today on View

A single-page app that curates a small gallery of paintings for today's date — ideally one
artist born or died on this day, otherwise a holiday or seasonal theme — pulling public-domain
paintings from the
[Met Museum's Open Access API](https://www.metmuseum.org/about-the-met/policies-and-documents/open-access)
and [Wikimedia Commons](https://commons.wikimedia.org), plus a short Wikipedia biography of the
day's artist. "Today" is the visitor's own local date.

## Features

- A single artwork at a time in a carousel — prev/next buttons, dot navigation, left/right arrow
  keys, and touch swipe on mobile (`src/components/ArtworkCarousel.tsx`).
- A free, no-account "Listen" button on each artist bio, read aloud via the browser's built-in
  Web Speech API (`src/components/ReadAloudButton.tsx`).
- An RSS feed at `/feed.xml` (`src/app/feed.xml/route.ts`), auto-discoverable from the page `<head>`
  and linked in the footer. Deliberately a single, daily-changing item — consistent with the rest of
  the app, there's no archive of past days.
- Mobile-first responsive layout: substantially tighter spacing/type scale and a clamped bio excerpt
  on small screens, full layout on desktop/tablet.

## Stack

- **Next.js (App Router) + TypeScript** — the whole app is one server-rendered page.
- **Tailwind CSS** — styling.
- **Met Museum Open Access API** — no key required (`src/lib/met.ts`). Paintings only.
- **Wikidata + Wikimedia Commons** — no key required (`src/lib/commons.ts`). Public-domain paintings
  from hundreds of museums, used when the Met holds too few by the day's artist.
- **Wikipedia REST API** — no key required (`src/lib/wikipedia.ts`), one short bio of the day's
  featured artist (none on holiday/season days).
- **Hand-curated calendar** — `src/lib/calendar.ts`, ~30 entries (holidays + artist anniversaries).
- **Wikidata fallback** — for any day not in the calendar, a live Wikidata lookup (`src/lib/wikidata.ts`)
  finds painters born/died that day with enough paintings to show, before finally falling back to a
  seasonal theme. See "Gallery resolution order" below.

No database, no user accounts, no archive browsing, and no paid API dependency — the whole app is one
page that reflects "today," built entirely on free data sources.

## Gallery resolution order

For any given date, `src/lib/gallery.ts` resolves today's theme in this order:

1. **Calendar** — an exact hand-curated match in `src/lib/calendar.ts`.
2. **Stash** — a previously-found Wikidata match saved in `src/lib/calendar-stash.json` (see below).
3. **Live Wikidata** — looks up painters born/died today and takes the most notable one (by Wikidata
   sitelinks) with at least 4 public-domain paintings available.
4. **Season** — a handful of seasonal paintings with no artist bio, the final fallback.

An artist's day shows only that artist's paintings: the Met's when it has at least 4, otherwise
Wikimedia Commons'. Other artists' work is never mixed in.

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

- `metQuery` is passed to the Met's `/search` endpoint (paintings only). Set `artistOrCulture: true`
  to restrict the search to the artist field and make it a single-artist day with a bio; add
  `wikidataId` (e.g. `"Q5582"`) so the day can fall back to Wikimedia Commons paintings.
- If an entry yields fewer than 4 usable (public-domain, has-image) paintings, the day falls through
  to the next step in the resolution order.

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

The homepage renders per request so each visitor gets their own local date (from Vercel's
`x-vercel-ip-timezone` header, defaulting to US Eastern). Every upstream Met/Wikidata/Commons/Wikipedia
fetch is cached for a day, so a burst of visitors doesn't hammer those APIs. The RSS feed uses Eastern
time and revalidates every 15 minutes.

## Deploy on Vercel

```bash
vercel
```

No environment variables required.
