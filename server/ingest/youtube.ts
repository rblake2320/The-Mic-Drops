import { YoutubeTranscript } from "youtube-transcript";
import { db } from "../db.js";

function extractVideoId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&\s]+)/,
    /[?&]v=([^?&\s]+)/,
    /youtube\.com\/embed\/([^?&\s]+)/,
    /youtube\.com\/shorts\/([^?&\s]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function parseTimeCode(tc: string): number {
  const parts = tc.split(":").map(Number).reverse();
  return parts.reduce((acc, val, i) => acc + val * Math.pow(60, i), 0);
}

export async function ingestYouTubeVideo(
  youtubeUrl: string,
  creatorId: string,
  options: { timeCode?: string; windowSeconds?: number } = {}
): Promise<{ dropId: string } | { error: string }> {
  const videoId = extractVideoId(youtubeUrl);
  if (!videoId) return { error: "Invalid YouTube URL" };

  const creator = await db.creator.findUnique({ where: { id: creatorId } });
  if (!creator) return { error: "Creator not found" };
  if (creator.status !== "AUTHORIZED") {
    return { error: "Creator must be AUTHORIZED to ingest real content" };
  }

  const { timeCode, windowSeconds = 120 } = options;
  let transcriptText = "";

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
    const startSeconds = timeCode ? parseTimeCode(timeCode) : 0;
    const window = transcript.filter(
      (t) => t.offset / 1000 >= startSeconds && t.offset / 1000 <= startSeconds + windowSeconds
    );
    transcriptText = window
      .map((t) => t.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);
  } catch (err: any) {
    console.warn(`[Ingest] Transcript unavailable for ${videoId}:`, err.message);
  }

  const drop = await db.drop.create({
    data: {
      creatorId,
      title: "Ingested Drop — edit before publishing",
      content: transcriptText || "Transcript unavailable — add content manually before publishing",
      voiceName: creator.voiceName,
      category: creator.category,
      tone: "Inspirational",
      isAdult: false,
      anchorTitle: `YouTube ${videoId}`,
      anchorSource: "YouTube",
      anchorLink: youtubeUrl,
      anchorTimeCode: timeCode,
      transcriptContext: transcriptText.slice(0, 500) || null,
      status: "DRAFT",
    },
  });

  return { dropId: drop.id };
}
