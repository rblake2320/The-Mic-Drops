import { useState, useRef, useEffect } from "react";
import { Creator, Drop } from "../types";
import { DEFAULT_CREATORS } from "../data";
import { API_BASE } from "../api";
import { Cpu, Send, Volume2, Mic, Play, Square, Sparkles, Check, ListRestart, ExternalLink } from "lucide-react";

interface CreatorStudioProps {
  onPublishDrop: (newDrop: Drop) => void;
  activeFeed: Drop[];
}

export default function CreatorStudio({ onPublishDrop, activeFeed }: CreatorStudioProps) {
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>("mrbeast");
  
  // Custom draft details
  const [rawInput, setRawInput] = useState<string>(
    "I want to warn everyone that if you ignore direct messaging links or text notification lists, you will get destroyed. We are building our own direct membership tools. Tell them about assets over liabilities."
  );
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorLog, setErrorLog] = useState<string | null>(null);

  // Synthesized drop preview holder
  const [generatedDrop, setGeneratedDrop] = useState<Partial<Drop> | null>(null);

  // Audio Playback states for synthesis
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [playingAudioNode, setPlayingAudioNode] = useState<AudioBufferSourceNode | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  // Age gating parameters for mature creators (e.g. naughty_santa)
  const [showAgeGate, setShowAgeGate] = useState<boolean>(false);
  const [ageGatedAccepted, setAgeGatedAccepted] = useState<boolean>(false);
  const [pendingCreatorId, setPendingCreatorId] = useState<string | null>(null);

  // Scroll ref to focus outputs above "fold"
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (generatedDrop && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [generatedDrop]);

  const selectedCreator = DEFAULT_CREATORS.find(c => c.id === selectedCreatorId) || DEFAULT_CREATORS[0];

  // Local fallback generator matching creator voice personas
  const getLocalFallbackDrop = (raw: string, creatorId: string) => {
    const inputStr = raw || "";
    const nameLower = creatorId.toLowerCase();

    let title = "The Distribution Moat";
    let content = "We must urge major caution: relying on third-party streams leaves you vulnerable. You need high-impact direct delivery.";
    let category = "Financial / Entrepreneurship";
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
    } else if (nameLower.includes("school") || nameLower.includes("knocks") || nameLower.includes("james") || nameLower.includes("sohk")) {
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
  };

  // AI Editor Refine function
  const handleGeminiRefine = async () => {
    setIsGenerating(true);
    setErrorLog(null);
    try {
      const response = await fetch(`${API_BASE}/api/drops/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawInput: rawInput,
          creatorName: selectedCreator.name,
          contextType: selectedCreator.category
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to edit drop statement with Gemini.");
      }

      setGeneratedDrop(data.drop);
    } catch (e: any) {
      console.warn("Client fetch error, using local cloner fallback:", e);
      // Run robust client-side fallback generation so the user is never blocked!
      setErrorLog("Notice: Gemini API key not found in secrets. Applying local creator high-fidelity voice fallback.");
      
      const localDrop = getLocalFallbackDrop(rawInput, selectedCreator.id);
      setGeneratedDrop(localDrop);
    } finally {
      setIsGenerating(false);
    }
  };

  // Raw 24kHz 16-bit little-endian PCM playback processor
  const playRawPcm = async (base64Str: string) => {
    try {
      // 1. Get or create AudioContext at correct sampleRate (24000Hz for text-to-speech)
      const ctx = audioContext || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (!audioContext) setAudioContext(ctx);

      // Stop any current playing voice node safely
      if (playingAudioNode) {
        try { playingAudioNode.stop(); } catch (err) {}
      }

      // 2. Decode base64 to binary string
      const binary = window.atob(base64Str);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // 3. Extract Int16 samples (16-bit Little-Endian)
      const int16Samples = new Int16Array(bytes.buffer);
      
      // 4. Create an AudioBuffer (Mono channel, 24kHz rate)
      const audioBuffer = ctx.createBuffer(1, int16Samples.length, 24000);
      const channelData = audioBuffer.getChannelData(0);

      // 5. Convert 16-bit PCM integer samples [-32768, 32767] to standard float samples [-1.0, 1.0]
      for (let i = 0; i < int16Samples.length; i++) {
        channelData[i] = int16Samples[i] / 32768.0;
      }

      // 6. Hook source and start audio
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start(0);

      setPlayingAudioNode(source);

      source.onended = () => {
        setPlayingAudioNode(null);
      };
    } catch (err: any) {
      console.error("PCM Audio playback failed:", err);
      setErrorLog("Audio Node Error: Web Audio API was blocked or corrupted.");
    }
  };

  // Perform TTS speech synthesis
  const handleTTS = async (textToSpeak: string) => {
    setIsSynthesizing(true);
    setErrorLog(null);
    try {
      const response = await fetch(`${API_BASE}/api/drops/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSpeak,
          voiceName: selectedCreator.voiceName
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to synthesize speech.");
      }

      await playRawPcm(data.audioBase64);
    } catch (e: any) {
      console.error(e);
      setErrorLog(e.message || "Failed to synthesize voice. Setup an active secret key first.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleStopAudio = () => {
    if (playingAudioNode) {
      try {
        playingAudioNode.stop();
      } catch (e) {}
      setPlayingAudioNode(null);
    }
  };

  // Publish to simulated subscriber devices
  const handlePublish = () => {
    const finalTitle = generatedDrop?.title || `${selectedCreator.name} Bulletin`;
    const finalContent = generatedDrop?.content || rawInput;
    const finalCategory = generatedDrop?.category || selectedCreator.category;
    const finalTone = generatedDrop?.tone || "Inspirational";
    const finalAdult = generatedDrop?.isAdult || false;

    const newDrop: Drop = {
      id: `drop-${Date.now()}`,
      creatorId: selectedCreator.id,
      title: finalTitle,
      content: finalContent,
      voiceName: selectedCreator.voiceName,
      category: finalCategory,
      dateSent: new Date().toISOString().split("T")[0],
      tone: finalTone,
      isAdult: finalAdult,
      anchorTitle: "Direct Live Cast Moment",
      anchorSource: selectedCreator.id === "charlemagne" ? "Radio" : "YouTube",
      anchorLink: "https://themicdrops.com/source/" + selectedCreator.id,
      anchorTimeCode: "03:15",
      transcriptContext: "Direct transcript verification of this newly authored creator drop."
    };

    onPublishDrop(newDrop);
    
    // Reset draft block
    setGeneratedDrop(null);
    setRawInput("");
  };

  const prefillDraft = (txt: string) => {
    setRawInput(txt);
    setGeneratedDrop(null);
  };

  return (
    <div id="creator-studio-container" className="bg-[#0F0F0F] border border-white/10 rounded-sm p-6 shadow-2xl flex flex-col h-full text-white overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
        <div className="w-6 h-6 border border-[#C19A6B] flex items-center justify-center font-serif italic text-xs text-[#C19A6B]">S</div>
        <div>
          <h2 id="creator-studio-title" className="text-base font-serif italic text-[#E5E5E5] tracking-tight">creator studio suite</h2>
          <p id="creator-studio-sub" className="text-[10px] uppercase font-mono tracking-wider text-[#C19A6B]/80">author atomic content drops & clones</p>
        </div>
      </div>

      {/* Select Creator Profile */}
      <div className="mb-5">
        <label className="text-[10px] text-slate-500 font-mono tracking-widest uppercase block mb-2">
          select creator persona
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DEFAULT_CREATORS.map(c => (
            <button
              key={c.id}
              onClick={() => {
                if (c.id === "naughtysanta" && !ageGatedAccepted) {
                  setPendingCreatorId(c.id);
                  setShowAgeGate(true);
                } else {
                  setSelectedCreatorId(c.id);
                  setGeneratedDrop(null);
                }
              }}
              className={`p-2 rounded-sm text-left border transition-all flex flex-col justify-between items-start h-18 text-xs cursor-pointer ${
                selectedCreatorId === c.id
                  ? "bg-[#C19A6B]/10 border-[#C19A6B] text-white"
                  : "bg-black hover:bg-[#111111] border-white/5 text-slate-400"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold truncate w-full text-[10px]">
                <img src={c.avatarUrl} alt={c.name} className="w-4 h-4 rounded-full object-cover border border-white/10" />
                <span className="truncate">{c.name.split(" ")[0]}</span>
              </div>
              <span className="text-[9px] text-[#C19A6B] font-mono truncate w-full">{c.followersCount}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Creator Info Box */}
      <div className="bg-black rounded-sm p-4 border border-white/5 mb-5 flex gap-3 text-xs">
        <img src={selectedCreator.avatarUrl} alt={selectedCreator.name} className="w-10 h-10 rounded-full object-cover border border-[#C19A6B]/30 self-center" />
        <div>
          <div className="font-serif italic text-sm text-[#E5E5E5]">{selectedCreator.name} <span className="text-[10px] text-slate-500 font-mono not-italic">{selectedCreator.handle}</span></div>
          <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">{selectedCreator.description}</p>
          <div className="mt-2 flex gap-2 text-[9px] font-mono">
            <span className="text-[#C19A6B] bg-[#C19A6B]/5 px-2 py-0.5 border border-[#C19A6B]/20">Voice Tag: {selectedCreator.voiceName}</span>
            <span className="text-emerald-400 bg-emerald-950/10 px-2 py-0.5 border border-emerald-900/30">Channel: {selectedCreator.category}</span>
          </div>
        </div>
      </div>

      {/* Raw Inputs & Assistant editing */}
      <div className="space-y-4 mb-5">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase block">raw ideas & transcript draft</span>
            <div className="flex gap-1.5">
              <button 
                onClick={() => prefillDraft("So I bought a team and we're giving student loans to college kids directly. We're launching MrBeast Financial. Direct member lines only.")}
                className="text-[9px] bg-black hover:bg-white/5 border border-white/10 px-2 py-0.5 font-mono text-slate-400 cursor-pointer"
              >
                MrBeast Idea
              </button>
              <button 
                onClick={() => prefillDraft("Florida turnpike incident today, some driver told the cop that moving back or forward has no vector meaning. Donkey of the Day time.")}
                className="text-[9px] bg-black hover:bg-white/5 border border-white/10 px-2 py-0.5 font-mono text-slate-400 cursor-pointer"
              >
                Charlemagne Idea
              </button>
            </div>
          </div>
          <textarea
            value={rawInput}
            onChange={(e) => {
              setRawInput(e.target.value);
              setGeneratedDrop(null);
            }}
            placeholder="Type your notes, quotes, transcript segments or raw statements here..."
            className="w-full h-24 bg-black border border-white/10 rounded-sm p-3 text-xs text-slate-100 focus:outline-none focus:border-[#C19A6B] font-sans resize-none"
          />
        </div>

        {/* Action Button: Edit with Gemini */}
        <div className="flex gap-2">
          <button
            onClick={handleGeminiRefine}
            disabled={isGenerating || !rawInput.trim()}
            className="flex-1 border border-[#C19A6B] text-[#C19A6B] hover:bg-[#C19A6B] hover:text-black disabled:bg-slate-900 disabled:text-slate-600 disabled:border-white/10 disabled:cursor-not-allowed transition-all py-3 px-4 rounded-sm text-xs uppercase tracking-widest font-mono font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin text-[#C19A6B]" : "text-[#C19A6B]"}`} />
            {isGenerating ? "Gemini Editor is refining..." : "Refine with Gemini AI"}
          </button>
        </div>
      </div>

      {/* Editor Output Preview block */}
      {generatedDrop ? (
        <div ref={previewRef} className="bg-black border border-[#C19A6B]/30 rounded-sm p-4 mb-5 flex flex-col relative animate-fade-in scroll-mt-4">
          {/* Tone identifier */}
          <div className="absolute top-3 right-3 flex gap-1.5 text-[9px] font-mono">
            <span className="text-[#C19A6B] bg-[#C19A6B]/10 border border-[#C19A6B]/30 px-1.5 py-0.5">
              {generatedDrop.tone}
            </span>
            {generatedDrop.isAdult && (
              <span className="text-rose-400 bg-rose-950/20 border border-rose-900/30 px-1.5 py-0.5 rounded font-bold">
                Mature Parody
              </span>
            )}
          </div>

          <span className="text-[9px] text-[#C19A6B] font-mono tracking-wider font-bold block mb-1">REFINED ATOMIC DROP PREVIEW</span>
          <h4 className="text-sm font-serif italic text-white pr-20">{generatedDrop.title}</h4>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-[#0F0F0F]/80 p-3 rounded-sm border border-white/5">
            {generatedDrop.content}
          </p>

          <div className="flex justify-between items-center mt-3 border-t border-white/5 pt-3">
            <span className="text-[10px] text-slate-500 font-mono">Category: <span className="text-slate-300 font-semibold">{generatedDrop.category}</span></span>
            <div className="flex gap-2">
              <button
                onClick={() => handleTTS(generatedDrop.content || "")}
                disabled={isSynthesizing}
                className="bg-[#0F0F0F] hover:bg-[#151515] border border-white/10 px-3 py-1.5 rounded-sm text-xs font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#C19A6B]" />
                {isSynthesizing ? "Synthesizing..." : "Voice Synth"}
              </button>
              <button
                onClick={handlePublish}
                className="bg-[#C19A6B] text-black px-4 py-1.5 rounded-sm text-xs font-mono uppercase tracking-widest font-bold flex items-center gap-1 shadow-sm hover:opacity-90 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Publish
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-black/30 border border-dashed border-white/10 rounded-sm p-5 text-center text-xs text-slate-500 mb-5 py-8">
          <div className="w-8 h-8 border border-white/20 flex items-center justify-center font-serif italic mx-auto mb-2 text-slate-400">G</div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Wait state is optimal</p>
          <p className="text-[11px] text-slate-400 mt-1">Refine with Gemini AI to generate automated drops</p>
        </div>
      )}

      {/* Manual Voice Preview Sandbox */}
      <div id="ai-voice-lab-block" className="mt-auto border-t border-white/5 pt-4">
        <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
          <Mic className="w-4 h-4 text-[#C19A6B]" /> AI Voice Lab (TTS Profile Cloner)
        </h4>
        <div className="bg-black border border-white/5 rounded-sm p-3 text-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] text-slate-400 font-mono">Speaker Profile: <span className="text-[#C19A6B] font-bold">{selectedCreator.name} ({selectedCreator.voiceName})</span></span>
            {playingAudioNode && (
              <button
                onClick={handleStopAudio}
                className="text-rose-400 hover:text-rose-350 font-bold text-[10px] flex items-center gap-0.5 cursor-pointer"
              >
                <Square className="w-3 h-3 fill-rose-400" /> Stop Speech
              </button>
            )}
          </div>
          
          <p className="text-[10px] text-slate-500 italic leading-relaxed mb-3">
            Clone selected vocal frequencies directly using Gemini's native high-fidelity audio engine.
          </p>

          <button
            onClick={() => handleTTS(generatedDrop?.content || rawInput)}
            disabled={isSynthesizing || (!generatedDrop?.content && !rawInput.trim())}
            className="w-full bg-[#0F0F0F] border border-white/10 hover:bg-[#151515] py-2 rounded-sm font-mono text-[10px] uppercase tracking-widest text-[#C19A6B] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isSynthesizing ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#C19A6B] animate-spin" />
                <span>Synthesizing voice wave...</span>
              </>
            ) : playingAudioNode ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#C19A6B] animate-bounce" />
                <span>Voice Playback active</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-[#C19A6B] fill-[#C19A6B]" />
                <span>Synthesize & Play Voice Profile</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Logger */}
      {errorLog && (
        <div className="bg-rose-950/20 border border-rose-900/30 p-3 rounded-sm text-[10px] text-rose-300 font-mono mt-4">
          <span className="font-bold block mb-0.5">Voice Lab API / Network Status:</span>
          {errorLog}
          <div className="mt-1 text-[9px] text-slate-500">Ensure the active key resides in **Settings &gt; Secrets** to unlock TTS engine calls.</div>
        </div>
      )}

      {/* Mature Parody Compliance Age Gate */}
      {showAgeGate && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0A0A] border border-rose-500 max-w-sm w-full p-6 text-center shadow-2xl relative rounded-sm">
            <div className="w-12 h-12 border border-rose-500 rounded-full flex items-center justify-center text-rose-500 font-serif italic text-lg mx-auto mb-4">18+</div>
            <h3 className="font-serif italic text-base text-rose-500 mb-2">Age Verification Gating</h3>
            <p className="text-[11px] text-slate-350 leading-relaxed mb-6 font-mono uppercase tracking-wide">
              The Selected persona "Naughty Santa" represents a satirical late-night parody series intended strictly for mature audiences (18+).
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setAgeGatedAccepted(true);
                  setSelectedCreatorId(pendingCreatorId || "naughtysanta");
                  setGeneratedDrop(null);
                  setShowAgeGate(false);
                  setPendingCreatorId(null);
                }}
                className="bg-rose-700 hover:bg-rose-650 text-white font-mono text-[10px] uppercase tracking-widest font-bold py-2 px-4 cursor-pointer transition-all border border-rose-650 rounded-sm"
              >
                Accept 18+ & Proceed
              </button>
              <button
                onClick={() => {
                  setShowAgeGate(false);
                  setPendingCreatorId(null);
                }}
                className="bg-black hover:bg-white/5 border border-white/10 text-slate-400 font-mono text-[10px] uppercase tracking-widest py-2 px-4 cursor-pointer transition-all rounded-sm"
              >
                Decline & Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
