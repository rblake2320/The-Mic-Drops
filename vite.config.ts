import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Lazy initializer for Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured in secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Local high-fidelity fallback generator matching creator voice personas
function getFallbackDrop(rawInput: string, creatorName: string, contextType: string) {
  const inputStr = rawInput || "";
  const nameLower = (creatorName || "").toLowerCase();

  let title = "The Distribution Moat";
  let content = "We must urge major caution: relying on third-party streams leaves you vulnerable. You need high-impact direct delivery.";
  let category = contextType || "Financial / Entrepreneurship";
  let tone = "Inspirational";
  let isAdult = false;

  if (nameLower.includes("beast")) {
    title = "Sovereign Member Moats";
    content = `I am literally warning everyone: if you keep ignoring direct messaging links or text notification lists, you are going to get absolutely destroyed! Having hundreds of millions of followers on other platforms means nothing if their algorithm decides who gets to see your videos. We are building our own direct membership tools. It is assets over liabilities every single day!`;
    category = "Financial / Entrepreneurship";
    tone = "Inspirational";
  } else if (nameLower.includes("gary") || nameLower.includes("vee") || nameLower.includes("vaynerchuk")) {
    title = "Own Your Direct Channel";
    content = `Listen! The digital marketing world is going to have its head absolutely blown off. Privacy is tightening, cookies are dying, and platforms are charging ridiculous CPMs just to guess what a user wants. If a customer declares they want premium fitness advice or finance news, show them that! That is 100% deterministic, zero tracking. Stop guessing!`;
    category = "Business & Productivity";
    tone = "Educational";
  } else if (nameLower.includes("charlemagne") || nameLower.includes("god")) {
    title = "Donkey of the Day: Rented Land";
    content = `Let's keep this completely real. If you're ignoring your direct distribution and not building a text list, you are playing yourself. It is Donkey of the Day time if you think centralized social media algorithms will protect your business forever. Stop searching for micro-shortcuts and build macro-competence, my brother!`;
    category = "Comedy & Commentary";
    tone = "Humor/Opinion";
  } else if (nameLower.includes("leisure") || nameLower.includes("eyl")) {
    title = "Asset Allocation Mastery";
    content = `At Invest Fest, we analyze compound wealth drivers and tell you: redirect your active income into cash-flowing assets that sustain your lifestyle before you accumulate depreciating liabilities. If you ignore direct links and local lists, you're building on rented land. Let your assets pay for your luxury!`;
    category = "Financial Literacy / Invest Fest";
    tone = "Educational";
  } else if (nameLower.includes("school") || nameLower.includes("knocks") || nameLower.includes("james")) {
    title = "Actions Over Routine Playbooks";
    content = `I met an 82-year-old self-made billionaire on Park Avenue and asked for his regrets. He said: 'James, tell them to stop spending all day reading about morning routines instead of picking up the phone and calling fifty clients.' Active rejection in the real arena is the ultimate filter. Wake up and build direct bridges!`;
    category = "Inspirational / Wisdom";
    tone = "Inspirational";
  } else if (nameLower.includes("cosmic") || nameLower.includes("horoscope") || nameLower.includes("insights")) {
    title = "Mercury-Pluto Silent Convergence";
    content = `Mercury aligns with Pluto tonight, urging you to keep your next major career move close to your chest. Refine your narrative in absolute silent alignment, and ignore the noise of outside opinions. Relying on generic centralized feed algorithms is a spiritual hazard—cultivate local direct communication channels immediately.`;
    category = "Spiritual & Lifestyle";
    tone = "Devotional";
  } else if (nameLower.includes("naughty")) {
    title = "Striking Reindeer Confrontation";
    content = `Alright look, I'm about two seconds away from firing Rudolph. This guy has one shiny red nose and now he's demanding premium organic moss and dental insurance. They are threatening to strike on December 15th unless I give them a heated barn. Absolute nonsense! Strict parental filters are required here!`;
    category = "Humor & Comedy (Adult)";
    tone = "Humor/Opinion";
    isAdult = true;
  } else if (nameLower.includes("santa")) {
    title = "Cheerful Arctic Logistics";
    content = `Ho Ho Ho! A very cheerful greetings from the North Pole! The elves are working overtime to make sure we bypass generic delays and deliver direct joy right on schedule. Remember, being helpful and kind is the finest gift you can ever make. Focus on keeping your lists tidy and secure, and have a magical day!`;
    category = "Family & Kids (Seasonal)";
    tone = "Seasonal";
  }

  // Smart injection of the user's custom draft if they modified the default text area
  const defaultRaw = "I want to warn everyone that if you ignore direct messaging links or text notification lists, you will get destroyed. We are building our own direct membership tools. Tell them about assets over liabilities.";
  if (inputStr && inputStr.trim() !== defaultRaw.trim()) {
    const formattedInput = inputStr.trim();
    if (nameLower.includes("charlemagne")) {
      content = `[Donkey Dialogue Channel] Bold take on your idea: "${formattedInput}" Stop sleeping on this! If you keep putting your business on rented channels, you are setting yourself up to receive the legendary Donkey of the Day! Own your media assets directly.`;
    } else if (nameLower.includes("gary") || nameLower.includes("vee")) {
      content = `[Deterministic Vayner Take] Look, let's stop guessing with surveillance! Focus on: "${formattedInput}" This is exactly what commands 3x CPMs because it is 100% user-declared. Direct connection, zero tracking, total control is the primary business moat!`;
    } else if (nameLower.includes("beast")) {
      content = `[Beast Financial Alert] We are testing this: "${formattedInput}" If you don't build immediate direct notification lines, you will get absolutely destroyed in the next era. Build direct sovereign assets, push your physical notifications, and win!`;
    } else if (nameLower.includes("naughty")) {
      content = `[Naughty Santa Parody] Alright, raw holiday gossip: "${formattedInput}" Rudolph is crying, the reindeer are unionizing, and we are delivering pure unfiltered truth. Opt-in filters required!`;
      isAdult = true;
    } else {
      content = `[Refined Creator Ingress] Polished take: "${formattedInput}". High-performance creators must prioritize sovereign, direct communication channels that bypass third-party algorithmic feed suppression. Build cash-flowing direct membership assets, not rented liabilities!`;
    }
  }

  return { title, content, category, tone, isAdult };
}

// Robust retry wrapper for Gemini SDK calls to handle transient 503 / 429 / high demand errors
async function callGeminiWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: any = null;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || "";
      const errStatus = err?.status || err?.code || "";
      const isRetriable = 
        errMsg.includes("503") || 
        errMsg.includes("UNAVAILABLE") || 
        errMsg.includes("high demand") || 
        errMsg.includes("429") || 
        errStatus === 503 || 
        errStatus === 429 || 
        errStatus === "UNAVAILABLE";

      if (isRetriable && i < retries - 1) {
        const backoff = delayMs * Math.pow(2, i);
        console.warn(`Gemini API 503/429 encountered (attempt ${i + 1}/${retries}). Retrying in ${backoff}ms... Error:`, errMsg);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// REST API endpoint: Check configuration
app.get("/api/config", (req, res) => {
  res.json({
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// REST API endpoint: AI Drop Assistant
// Refines transcripts, notes, or prompts into an elegant atomic Statement/Story
app.post("/api/drops/generate", async (req, res) => {
  const { rawInput, creatorName, contextType } = req.body;
  if (!rawInput) {
    return res.status(400).json({ error: "No input text provided" });
  }

  try {
    // Attempt Gemini Generation
    const ai = getGeminiClient();
    const systemPrompt = `You are a world-class editor for "The MIC Drops" content platform. 
Your task is to take a raw draft, quote, idea, or transcript from a creator and refine it into an exceptional atomic "Drop". 

CRITICAL VOICE STYLE RULES:
You MUST write the narrative entirely inside the distinct speech patterns, unique buzzwords, personality traits, and attitudes of the selected creator:
- MrBeast (Jimmy): Hyper-enthusiastic, direct, energetic, counts everything in numbers, gives away prizes, stresses direct communication, very commercial but altruistic.
- Gary V: Deeply passionate, colloquial street terms ("Listen to me!", "hustle", "marketing is attention", "macro-patience"), raw, direct, zero fluff, uses exclamation points.
- Charlemagne tha God: Bold, sharp-witted, culturally direct, opinionated, cites "Donkey of the Day," calls out focus-larping, states raw facts with comedy.
- Earn Your Leisure: Analytical, structured, speaks on assets over liabilities, Invest Fest values, financial literacy, wealth creation, compounding, real estate, and equity.
- School of Hard Knocks (James): Street-interview wisdom, quotes real self-made billionaires, real-world competence over routines, is humble, inspiring, and direct.
- Santa Claus: Warm, comforting, holly-jolly, speaks about toy workshops, elves, seasonal cheer, and lists.
- Cosmic Daily Horoscope: Spiritual, esoteric, stars, planetary alignments, career and romance vector advice.
- Naughty Santa (Adult Parody): Cheeky, satirical holiday humor, complaining about reindeer unions or lazy humans, strictly adult parity.

A "Drop" has three parts:
1. Title: A short, punchy hook (1-5 words).
2. Content: The refined statement written in the creator's first-person voice. It should feel engaging, high-impact, and tell the core message in 50 to 120 words.
3. Meta: Assign category, tone theme ("Inspirational", "Educational", "Devotional", "Seasonal", "Humor/Opinion"), and isAdult status (true only for Naughty Santa).

Return the response strictly inside a JSON object with this shape:
{
  "title": "...",
  "content": "...",
  "category": "...",
  "tone": "...",
  "isAdult": false
}`;

    const promptText = `Creator Selected: ${creatorName || "Unknown Creator"} (Context: ${contextType || "General"})
Raw Draft / Note / Video description:
"${rawInput}"

Synthesize into an elegant MIC Drop in their exact voice style, first-person attitude, and specific category. Make sure it is deeply customized.`;

    const response = await callGeminiWithRetry(() => 
      ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        },
      })
    );

    const parsedData = JSON.parse(response.text || "{}");
    res.json({ success: true, drop: parsedData });
  } catch (apiError: any) {
    console.warn("Gemini API call failed or unavailable (e.g. 503 high demand/missing key). Activating local creator voice fallback generator. Error Detail:", apiError.message || apiError);
    // Invoke Premium Local Creator-Styling Fallback Generator
    const fallbackDrop = getFallbackDrop(rawInput, creatorName, contextType);
    res.json({ success: true, drop: fallbackDrop, isFallback: true });
  }
});

// REST API endpoint: Real-Time TTS Speech Synthesis
// Performs direct text-to-speech for client-side playback using the gemini-3.1-flash-tts-preview model
app.post("/api/drops/tts", async (req, res) => {
  try {
    const { text, voiceName } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text specified for synthesis." });
    }

    const selectedVoice = voiceName || "Zephyr"; // Puck, Charon, Kore, Fenrir, Zephyr
    console.log(`Synthesizing text with voice ${selectedVoice}: "${text.substring(0, 30)}..."`);

    const ai = getGeminiClient();
    const response = await callGeminiWithRetry(() => 
      ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      })
    );

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio payload returned from Google TTS model.");
    }

    res.json({
      success: true,
      audioBase64: base64Audio,
      voiceSelected: selectedVoice,
      sampleRate: 24000,
    });
  } catch (error: any) {
    console.error("TTS Synthesis Error:", error);
    res.status(500).json({
      error: error.message || "Failed to synthesize speech. Ensure GEMINI_API_KEY is configured."
    });
  }
});

// Vite Integration Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[THE MIC DROPS SERVER] Running on port http://localhost:${PORT}`);
  });
}

startServer();
