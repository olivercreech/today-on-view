import { resolveGallery } from "@/lib/gallery";
import { getSiteDate } from "@/lib/date";
import { getArtistBios } from "@/lib/wikipedia";

// Regenerate at most every 15 minutes, so the feed flips shortly after midnight Eastern
// (feed readers fetch from their own servers, so there is no reader timezone). Route handlers need
// `dynamic = "force-static"` to opt into caching at all; `revalidate` alone isn't enough.
export const dynamic = "force-static";
export const revalidate = 900;

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getSiteUrl(request: Request): string {
  // This route is statically prerendered, so `request.url` reflects Next's internal
  // build-time stand-in (localhost), not the real deployed domain. Vercel automatically
  // sets VERCEL_PROJECT_PRODUCTION_URL on every deploy — no manual config needed.
  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return productionUrl ? `https://${productionUrl}` : new URL(request.url).origin;
}

export async function GET(request: Request) {
  const siteUrl = getSiteUrl(request);
  const now = new Date();
  const { label: dateLabel, iso: isoDate } = getSiteDate(now);

  const { theme, artworks } = await resolveGallery(now, 6);
  const bios = await getArtistBios(artworks.map((a) => a.artistDisplayName));

  const artworkListHtml = artworks
    .map(
      (a) =>
        `<p><strong>${escapeXml(a.title)}</strong> — ${escapeXml(a.artistDisplayName)}${a.objectDate ? `, ${escapeXml(a.objectDate)}` : ""}<br/>` +
        `<img src="${escapeXml(a.primaryImageSmall)}" alt="${escapeXml(a.title)}" style="max-width:100%;height:auto;"/></p>`,
    )
    .join("\n");

  const biosHtml = bios
    .map((b) => `<p><strong>About ${escapeXml(b.name)}:</strong> ${escapeXml(b.extract)}</p>`)
    .join("\n");

  const description = `<![CDATA[<p>${escapeXml(theme.blurb)}</p>\n${artworkListHtml}\n${biosHtml}]]>`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Today on View</title>
    <link>${siteUrl}</link>
    <description>A themed art gallery curated for today's date, drawn from the Met Museum's Open Access collection.</description>
    <language>en-us</language>
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
    <item>
      <title>${escapeXml(theme.title)} — ${escapeXml(dateLabel)}</title>
      <link>${siteUrl}</link>
      <guid isPermaLink="false">today-on-view-${isoDate}</guid>
      <pubDate>${now.toUTCString()}</pubDate>
      <description>${description}</description>
    </item>
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
