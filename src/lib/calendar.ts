import type { Theme } from "./theme";

export type CalendarEntry = Theme & {
  id: string;
  month: number; // 1-12
  day: number; // 1-31
};

/**
 * Hand-curated calendar: holidays and artist birth/death anniversaries.
 * `metQuery` is a search term against the Met's Open Access API; `artistOrCulture`
 * restricts that search to the artist/culture field (better precision for names).
 * Add or edit entries here to grow the calendar past this first ~30-day pass.
 */
export const CALENDAR: CalendarEntry[] = [
  { id: "new-year", month: 1, day: 1, title: "New Beginnings", blurb: "The first day of the year, celebrated with images of dawn, renewal, and open horizons.", metQuery: "sunrise landscape" },
  { id: "epiphany", month: 1, day: 6, title: "The Three Kings", blurb: "Epiphany marks the visit of the Magi to the infant Christ, a scene painted for centuries across Europe.", metQuery: "adoration of the magi" },
  { id: "mozart-birthday", month: 1, day: 27, title: "Music in Art", blurb: "On Mozart's birthday, a look at how painters and craftspeople have depicted music and musical instruments.", metQuery: "musician playing instrument" },
  { id: "valentines-day", month: 2, day: 14, title: "Love & Romance", blurb: "Valentine's Day, celebrated through centuries of paintings of lovers, courtship, and devotion.", metQuery: "lovers portrait" },
  { id: "winslow-homer-birthday", month: 2, day: 24, title: "Winslow Homer's Birthday", blurb: "Born February 24, 1836, Homer became one of America's foremost painters of the sea and rural life.", metQuery: "Winslow Homer", artistOrCulture: true },
  { id: "michelangelo-birthday", month: 3, day: 6, title: "Michelangelo's Birthday", blurb: "Born March 6, 1475, Michelangelo's drawings and design work reveal the hand behind the Sistine Chapel and David.", metQuery: "Michelangelo", artistOrCulture: true },
  { id: "womens-day", month: 3, day: 8, title: "Women Artists", blurb: "International Women's Day, honoring the women who shaped the history of art, often against the odds.", metQuery: "Berthe Morisot", artistOrCulture: true },
  { id: "spring-equinox", month: 3, day: 20, title: "Spring Equinox", blurb: "The Northern Hemisphere's first day of spring, marked by blossoms and the return of light.", metQuery: "blossoming trees" },
  { id: "van-gogh-birthday", month: 3, day: 30, title: "Van Gogh's Birthday", blurb: "Born March 30, 1853, Vincent van Gogh packed his short career with some of the most recognizable paintings in the world.", metQuery: "Van Gogh", artistOrCulture: true },
  { id: "raphael-day", month: 4, day: 6, title: "Raphael", blurb: "April 6 marks both the birth (1483) and death (1520) of Raphael, master of High Renaissance harmony.", metQuery: "Raphael", artistOrCulture: true },
  { id: "leonardo-birthday", month: 4, day: 15, title: "Leonardo da Vinci's Birthday", blurb: "Born April 15, 1452, Leonardo's restless curiosity spanned painting, anatomy, and engineering.", metQuery: "Leonardo da Vinci", artistOrCulture: true },
  { id: "cinco-de-mayo", month: 5, day: 5, title: "Mexican Art & Culture", blurb: "Cinco de Mayo, a moment to look at the richness of Mexican art and visual tradition.", metQuery: "Mexico" },
  { id: "cassatt-birthday", month: 5, day: 22, title: "Mary Cassatt's Birthday", blurb: "Born May 22, 1844, Cassatt was the rare American admitted into the inner circle of the French Impressionists.", metQuery: "Mary Cassatt", artistOrCulture: true },
  { id: "summer-solstice", month: 6, day: 21, title: "Summer Solstice", blurb: "The longest day of the year in the Northern Hemisphere, celebrated with images of sunlight and abundance.", metQuery: "sunlight landscape" },
  { id: "bastille-day", month: 7, day: 14, title: "French Art", blurb: "Bastille Day, France's national holiday, marked with a look at French painting.", metQuery: "Eugene Delacroix", artistOrCulture: true },
  { id: "rembrandt-birthday", month: 7, day: 15, title: "Rembrandt's Birthday", blurb: "Born July 15, 1606, Rembrandt's mastery of light and psychological depth shaped Dutch Golden Age painting.", metQuery: "Rembrandt", artistOrCulture: true },
  { id: "assumption", month: 8, day: 15, title: "Devotional Art", blurb: "The Feast of the Assumption, honored through centuries of devotional imagery of the Virgin Mary.", metQuery: "Virgin Mary" },
  { id: "autumn-equinox", month: 9, day: 22, title: "Autumn Equinox", blurb: "The Northern Hemisphere's first day of autumn, marked by harvest scenes and turning leaves.", metQuery: "autumn harvest landscape" },
  { id: "halloween", month: 10, day: 31, title: "The Macabre & Uncanny", blurb: "Halloween, marked by art's long fascination with death, skulls, and the vanitas tradition.", metQuery: "memento mori skull" },
  { id: "day-of-the-dead", month: 11, day: 1, title: "Día de los Muertos", blurb: "The Day of the Dead, Mexico's vivid tradition of honoring the deceased.", metQuery: "calavera" },
  { id: "armistice-day", month: 11, day: 11, title: "Art of War & Remembrance", blurb: "Armistice and Veterans Day, remembered through art made in and about wartime.", metQuery: "soldiers war" },
  { id: "monet-birthday", month: 11, day: 14, title: "Claude Monet's Birthday", blurb: "Born November 14, 1840, Monet's studies of light gave Impressionism its name and its enduring appeal.", metQuery: "Claude Monet", artistOrCulture: true },
  { id: "winter-solstice", month: 12, day: 21, title: "Winter Solstice", blurb: "The shortest day of the year in the Northern Hemisphere, marked by snow and quiet, low winter light.", metQuery: "winter snow landscape" },
  { id: "christmas", month: 12, day: 25, title: "The Nativity", blurb: "Christmas Day, marked by centuries of painted scenes of the Nativity.", metQuery: "nativity" },
  { id: "new-years-eve", month: 12, day: 31, title: "Celebration & Festivity", blurb: "The last night of the year, marked by scenes of festivity, dance, and celebration.", metQuery: "festival celebration dance" },
];

export type Season = Theme & { id: string; startMonth: number; startDay: number; endMonth: number; endDay: number };

const SEASONS: Season[] = [
  { id: "winter", title: "Winter", blurb: "There's no exact match for today on the calendar, so here's a winter-themed selection instead.", metQuery: "winter snow landscape", startMonth: 12, startDay: 21, endMonth: 3, endDay: 19 },
  { id: "spring", title: "Spring", blurb: "There's no exact match for today on the calendar, so here's a spring-themed selection instead.", metQuery: "spring blossom flowers", startMonth: 3, startDay: 20, endMonth: 6, endDay: 20 },
  { id: "summer", title: "Summer", blurb: "There's no exact match for today on the calendar, so here's a summer-themed selection instead.", metQuery: "summer landscape sunlight", startMonth: 6, startDay: 21, endMonth: 9, endDay: 21 },
  { id: "autumn", title: "Autumn", blurb: "There's no exact match for today on the calendar, so here's an autumn-themed selection instead.", metQuery: "autumn harvest landscape", startMonth: 9, startDay: 22, endMonth: 12, endDay: 20 },
];

function inSeasonRange(month: number, day: number, s: Season): boolean {
  const md = month * 100 + day;
  const start = s.startMonth * 100 + s.startDay;
  const end = s.endMonth * 100 + s.endDay;
  if (start <= end) return md >= start && md <= end;
  // wraps around the new year (winter)
  return md >= start || md <= end;
}

export function getSeasonForDate(month: number, day: number): Season {
  return SEASONS.find((s) => inSeasonRange(month, day, s)) ?? SEASONS[0];
}

export function findCalendarEntry(month: number, day: number): CalendarEntry | undefined {
  return CALENDAR.find((e) => e.month === month && e.day === day);
}
