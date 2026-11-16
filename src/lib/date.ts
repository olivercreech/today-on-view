// The server (Vercel) runs in UTC, so plain `getMonth()`/`getDate()` would roll over to
// tomorrow at 7pm Eastern / 4pm Pacific. Every "what day is it" question in the app goes
// through this module instead, resolved in the visitor's timezone when we know it and
// US Eastern otherwise (e.g. the RSS feed, which is fetched by feed-reader servers).
export const SITE_TIME_ZONE = "America/New_York";

/** Return `tz` if it's a valid IANA timezone name, otherwise the site default. */
export function resolveTimeZone(tz: string | null | undefined): string {
  if (!tz) return SITE_TIME_ZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return SITE_TIME_ZONE;
  }
}

export interface SiteDate {
  year: number;
  month: number; // 1-12
  day: number;
  /** YYYY-MM-DD in the requested timezone */
  iso: string;
  /** e.g. "Monday, November 16, 2026" in the requested timezone */
  label: string;
}

export function getSiteDate(now: Date = new Date(), timeZone: string = SITE_TIME_ZONE): SiteDate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const year = get("year");
  const month = get("month");
  const day = get("day");

  const label = now.toLocaleDateString("en-US", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { year, month, day, iso, label };
}
