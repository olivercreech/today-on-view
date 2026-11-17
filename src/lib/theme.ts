export type Theme = {
  title: string;
  blurb: string;
  metQuery: string;
  /** Search the Met's artist field only — and treat this theme as a single-artist day. */
  artistOrCulture?: boolean;
  /** The artist's Wikidata item, used to find paintings on Wikimedia Commons. */
  wikidataId?: string;
};
