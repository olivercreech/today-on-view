import type { Artwork } from "./artwork";
import { DAY_SECONDS, USER_AGENT } from "./http";
import { sparql, qidFromUri } from "./wikidata";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const PAINTING = "wd:Q3305213";
/** Commons serves this as a standard pre-rendered thumbnail size. */
const THUMB_WIDTH = 1280;

type PaintingRow = {
  work: { value: string };
  workLabel: { value: string };
  img: { value: string };
  inception?: { value: string };
  collLabel?: { value: string };
  sitelinks: { value: string };
  artistLabel?: { value: string };
};

type ImageInfo = { thumbUrl: string; license: string };

/** "http://commons.wikimedia.org/wiki/Special:FilePath/Foo%20bar.jpg" -> "Foo bar.jpg" */
function fileNameFromFilePath(url: string): string {
  return decodeURIComponent(url.split("/Special:FilePath/")[1] ?? "");
}

/**
 * Resolve Commons files to real thumbnail URLs and their license. Only public-domain /
 * CC0 files are kept, so nothing shown needs a per-image attribution line.
 */
async function getImageInfo(fileNames: string[]): Promise<Map<string, ImageInfo>> {
  const result = new Map<string, ImageInfo>();
  if (fileNames.length === 0) return result;

  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: String(THUMB_WIDTH),
    iiextmetadatafilter: "License",
    titles: fileNames.slice(0, 50).map((f) => `File:${f}`).join("|"),
  });

  let res: Response;
  try {
    res = await fetch(`${COMMONS_API}?${params}`, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: DAY_SECONDS },
    });
  } catch {
    return result;
  }
  if (!res.ok) return result;

  const data = await res.json();
  // The API normalizes titles (e.g. underscores -> spaces); map back to what we asked for.
  const normalized = new Map<string, string>(
    (data?.query?.normalized ?? []).map((n: { from: string; to: string }) => [n.to, n.from]),
  );
  for (const page of data?.query?.pages ?? []) {
    const info = page.imageinfo?.[0];
    if (!info?.thumburl) continue;
    const license: string = info.extmetadata?.License?.value ?? "";
    const requested = (normalized.get(page.title) ?? page.title).replace(/^File:/, "");
    result.set(requested, { thumbUrl: info.thumburl, license });
  }
  return result;
}

function isFreeWithoutAttribution(license: string): boolean {
  const l = license.toLowerCase();
  return l === "pd" || l.startsWith("pd-") || l === "cc0";
}

/**
 * Paintings by a Wikidata artist that have a Commons image, most notable first (by the
 * painting's own sitelink count, so famous works lead), keeping only public-domain images.
 * Each painting is credited to the artist's English Wikidata label.
 */
export async function getCommonsPaintings(artistQid: string, count: number): Promise<Artwork[]> {
  const rows = await sparql<PaintingRow>(`
    SELECT ?work ?workLabel ?img ?inception ?collLabel ?sitelinks ?artistLabel WHERE {
      ?work wdt:P170 wd:${artistQid} ; wdt:P31 ${PAINTING} ; wdt:P18 ?img ; wikibase:sitelinks ?sitelinks .
      OPTIONAL { wd:${artistQid} rdfs:label ?artistLabel . FILTER(LANG(?artistLabel) = "en") }
      OPTIONAL { ?work wdt:P571 ?inception }
      OPTIONAL { ?work wdt:P195 ?coll }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    ORDER BY DESC(?sitelinks)
    LIMIT 60
  `);

  // One row per painting: a work in several collections, or with several images, repeats.
  const seenWorks = new Set<string>();
  const seenTitles = new Set<string>();
  const paintings: { qid: string; title: string; file: string; year: string; collection: string }[] = [];
  for (const r of rows) {
    const qid = qidFromUri(r.work.value);
    const title = r.workLabel.value;
    // No English label: the label service falls back to the bare QID — not presentable.
    if (seenWorks.has(qid) || /^Q\d+$/.test(title)) continue;
    // Skip near-duplicates (studies/versions catalogued separately under the same title).
    const titleKey = title.trim().toLowerCase();
    if (seenTitles.has(titleKey)) continue;
    seenWorks.add(qid);
    seenTitles.add(titleKey);
    paintings.push({
      qid,
      title,
      file: fileNameFromFilePath(r.img.value),
      year: r.inception?.value.slice(0, 4).replace(/^-?0*/, "") ?? "",
      collection: r.collLabel && !/^Q\d+$/.test(r.collLabel.value) ? r.collLabel.value : "",
    });
  }

  const artistName = rows[0]?.artistLabel?.value ?? "Unknown artist";
  const images = await getImageInfo(paintings.map((p) => p.file));
  const artworks: Artwork[] = [];
  for (const p of paintings) {
    const info = images.get(p.file);
    if (!info || !isFreeWithoutAttribution(info.license)) continue;
    artworks.push({
      id: `wd-${p.qid}`,
      source: "commons",
      title: p.title,
      artistDisplayName: artistName,
      objectDate: p.year,
      medium: "",
      location: p.collection,
      objectURL: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(p.file.replace(/ /g, "_"))}`,
      imageUrl: info.thumbUrl,
    });
    if (artworks.length >= count) break;
  }
  return artworks;
}
