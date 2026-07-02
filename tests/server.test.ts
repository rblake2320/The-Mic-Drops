import { describe, it, expect } from "vitest";
import { extractVideoId, parseTimeCode } from "../server/ingest/parse";
import {
  consumerRegisterSchema,
  dropCreateSchema,
  analyticsEventSchema,
  ttsSchema,
  ingestYouTubeSchema,
} from "../server/schemas";

describe("youtube ingest helpers", () => {
  it("extracts video ids from all supported URL shapes", () => {
    expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42")).toBe("dQw4w9WgXcQ");
    expect(extractVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractVideoId("https://example.com/not-youtube")).toBeNull();
  });

  it("parses timecodes in ss / mm:ss / hh:mm:ss forms", () => {
    expect(parseTimeCode("90")).toBe(90);
    expect(parseTimeCode("2:15")).toBe(135);
    expect(parseTimeCode("1:02:03")).toBe(3723);
  });
});

describe("request schemas", () => {
  it("normalizes and validates consumer registration", () => {
    const parsed = consumerRegisterSchema.parse({
      email: "  Ron@Example.COM ",
      password: "correct-horse-battery",
    });
    expect(parsed.email).toBe("ron@example.com");
    expect(parsed.interests).toEqual([]);
  });

  it("rejects weak passwords", () => {
    expect(
      consumerRegisterSchema.safeParse({ email: "a@b.com", password: "short" }).success
    ).toBe(false);
  });

  it("rejects oversized drop content", () => {
    expect(
      dropCreateSchema.safeParse({ title: "ok", content: "x".repeat(2001) }).success
    ).toBe(false);
  });

  it("analytics schema strips client-supplied consumerId", () => {
    const parsed = analyticsEventSchema.parse({
      type: "play",
      dropId: "drop-1",
      consumerId: "someone-else", // must be discarded
    });
    expect((parsed as Record<string, unknown>).consumerId).toBeUndefined();
  });

  it("rejects unknown analytics event types", () => {
    expect(analyticsEventSchema.safeParse({ type: "exfiltrate" }).success).toBe(false);
  });

  it("caps TTS text length (cost control)", () => {
    expect(ttsSchema.safeParse({ text: "x".repeat(1201) }).success).toBe(false);
    expect(ttsSchema.safeParse({ text: "hello", voiceName: "Zephyr" }).success).toBe(true);
    expect(ttsSchema.safeParse({ text: "hello", voiceName: "NotAVoice" }).success).toBe(false);
  });

  it("clamps and validates youtube ingest options", () => {
    const parsed = ingestYouTubeSchema.parse({ youtubeUrl: "https://youtu.be/abc" });
    expect(parsed.windowSeconds).toBe(120);
    expect(
      ingestYouTubeSchema.safeParse({ youtubeUrl: "https://youtu.be/abc", windowSeconds: 10000 })
        .success
    ).toBe(false);
    expect(
      ingestYouTubeSchema.safeParse({ youtubeUrl: "notaurl" }).success
    ).toBe(false);
  });
});
