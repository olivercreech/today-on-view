import Anthropic from "@anthropic-ai/sdk";
import type { MetArtwork } from "./met";
import type { Theme } from "./theme";

const client = new Anthropic();

const SYSTEM_PROMPT =
  "You are a museum curator writing rich didactic wall text for a themed online exhibit. " +
  "Write with the texture of a knowledgeable guide giving a short gallery talk: name specific formal " +
  "details (composition, color, light, brushwork, material) and at least one concrete historical or " +
  "biographical fact, then connect the piece specifically to today's theme — don't just restate the " +
  "theme in general terms. Be accurate to the details given; never invent facts not implied by them. " +
  "Avoid generic filler and avoid markdown formatting or headings.";

/** Generate a rich didactic paragraph explaining why this artwork fits today's theme. */
export async function generateContext(artwork: MetArtwork, theme: Theme, dateLabel: string): Promise<string> {
  const prompt = `Today is ${dateLabel}. Today's gallery theme is "${theme.title}": ${theme.blurb}

Artwork on display:
- Title: ${artwork.title}
- Artist: ${artwork.artistDisplayName}${artwork.artistDisplayBio ? ` (${artwork.artistDisplayBio})` : ""}
- Date created: ${artwork.objectDate}
- Medium: ${artwork.medium || "unknown"}
- Department: ${artwork.department || "unknown"}
- Credit line: ${artwork.creditLine || "unknown"}

Write two short paragraphs of museum wall text about this piece (roughly 150-220 words total). The first
should ground the reader in what they're looking at and why it matters art-historically. The second should
draw the specific thread to today's theme. Write in a warm, confident curator's voice.`;

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 900,
    output_config: { effort: "medium" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  return block?.text.trim() ?? "";
}
