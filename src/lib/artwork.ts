/** A single painting shown in the gallery, from whichever source supplied it. */
export type Artwork = {
  /** Unique across sources, e.g. "met-437397" or "wd-Q12418". */
  id: string;
  source: "met" | "commons";
  title: string;
  artistDisplayName: string;
  objectDate: string;
  medium: string;
  /** Where the work lives — Met department, or the owning museum for Commons works. */
  location: string;
  /** Page for the work at its source (Met object page or Wikidata/Commons). */
  objectURL: string;
  imageUrl: string;
};

/** Minimum usable paintings an artist needs before they're worth a day of their own. */
export const MINIMUM_ARTWORKS = 4;
