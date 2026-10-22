import { resolveGallery } from "@/lib/gallery";
import { getArtistBios } from "@/lib/wikipedia";

// Same cadence as the homepage — regenerate at most every 6 hours. Route handlers need
// `dynamic = "force-static"` to opt into caching at all; `revalidate` alone isn't enough.
export const dynamic = "force-static";
export const revalidate = 21600;

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(request: Request) {
  const siteUrl = new URL(request.url).origin;
  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const isoDate = now.toISOString().slice(0, 10);

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
