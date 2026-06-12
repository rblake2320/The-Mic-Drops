import { useState, useEffect, useRef } from "react";
import { Drop, Creator } from "../types";
import { DEFAULT_CREATORS } from "../data";
import { 
  Wifi, Battery, Bell, Settings2, Sparkles, Check, 
  Volume2, Play, Square, ExternalLink, ArrowLeft, RefreshCw,
  TrendingUp, Compass, UserCheck, ShieldCheck, HeartPulse,
  Smartphone, BookOpen, ShieldAlert, Award, Coffee, Flame, 
  Moon, Music, HelpCircle, Briefcase, Zap, Home, Skull, Star, 
  Info, Sparkle, PlusCircle, Coins, Hammer
} from "lucide-react";

interface MobileSimulatorProps {
  activeFeed: Drop[];
  onAddNewDrop: (newDrop: Drop) => void;
  lastPublishedDrop: Drop | null;
}

const SOHK_WISDOMS = [
  { quote: "Pick up the phone and call fifty clients today. Stop spending all day reading about morning routines instead of doing the actual labor.", speaker: "82-year-old self-made Billionaire, Park Avenue" },
  { quote: "Spend three days launching, watch it fail, and adapt. Static 50-page plans are just comfort mechanisms to avoid real competition.", speaker: "44-year-old Logistics Founder, SoHo" },
  { quote: "Every single rejection you survive makes your asset foundation more sturdy. True talent loves rejection because it is the ultimate filter.", speaker: "Real Estate Tycoon, Tribeca" },
  { quote: "Never rent your attention channels. If you don't control the direct access to your community, you don't own your equity.", speaker: "James, founder of School of Hard Knocks" },
  { quote: "Invest your active cash flow into assets that pay for your lifestyle before you accumulate depreciating liabilities.", speaker: "Invest Fest Advisor, Atlanta" },
  { quote: "The real world does not have semesters or midterms. Real authority yields to consistent execution, not credentials.", speaker: "60-year-old Self-Made Retail Chain CEO" }
];

export default function MobileSimulator({ activeFeed, onAddNewDrop, lastPublishedDrop }: MobileSimulatorProps) {
  // Mobile app navigation state: 'feed' | 'preferences' | 'player' | 'app_drawer' | 'creator_app'
  const [navState, setNavState] = useState<"feed" | "preferences" | "player" | "app_drawer" | "creator_app">("app_drawer");
  const [selectedDrop, setSelectedDrop] = useState<Drop | null>(null);

  // Search filter
  const [topicSearch, setTopicSearch] = useState<string>("");

  // Target declared interests of consumer
  const [declaredInterests, setDeclaredInterests] = useState<Record<string, boolean>>({
    "Financial / Entrepreneurship": true,
    "Business & Productivity": true,
    "Comedy & Commentary": true,
    "Financial Literacy / Invest Fest": true,
    "Inspirational / Wisdom": true,
    "Family & Kids (Seasonal)": true,
    "Spiritual & Lifestyle": true,
    "Humor & Comedy (Adult)": false
  });

  // Explicit mature parody switch
  const [allowAdultParody, setAllowAdultParody] = useState<boolean>(false);

  // Active push notification state
  const [notification, setNotification] = useState<Drop | null>(null);

  // Real-time voice TTS simulation or player trigger states
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [playingAudio, setPlayingAudio] = useState<AudioBufferSourceNode | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  // Virtual source clip seek playback state
  const [sourceProgress, setSourceProgress] = useState<number>(35); // initial progress %
  const [isSourcePlaying, setIsSourcePlaying] = useState<boolean>(false);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Creator App Boutique Sovereign State Channels ---
  const [appCreatorId, setAppCreatorId] = useState<string>("sohk");

  // State for James (SOHK) Words of Wisdom App
  const [wisdomCard, setWisdomCard] = useState<{ quote: string, speaker: string } | null>({
    quote: "Spend less time reviewing blueprints and more time in the arena. Action cuts through comfort.",
    speaker: "James, founder of School of Hard Knocks"
  });
  const [wisdomHistory, setWisdomHistory] = useState<Array<{ quote: string, speaker: string }>>([]);
  const [isDrawingWisdom, setIsDrawingWisdom] = useState(false);
  const [userHurdle, setUserHurdle] = useState("");
  const [wisdomFeedback, setWisdomFeedback] = useState<string | null>(null);

  // State for MrBeast
  const [beastGameScore, setBeastGameScore] = useState(0);
  const [beastNotifyVelocity, setBeastNotifyVelocity] = useState(5000000);
  const [beastTaps, setBeastTaps] = useState(0);

  // State for Gary V
  const [garySoundClipName, setGarySoundClipName] = useState<string | null>(null);
  const [garyDeterministicValue, setGaryDeterministicValue] = useState(48);

  // State for Earn Your Leisure
  const [eylTrustAllocation, setEylTrustAllocation] = useState(15000);
  const [eylHoldingsList, setEylHoldingsList] = useState<string[]>([
    "Atlanta multi-family real estate development",
    "Direct Member Audio Feed Pipeline"
  ]);
  const [newEylHolding, setNewEylHolding] = useState("");

  // State for Cosmic Horoscope
  const [selectedZodiac, setSelectedZodiac] = useState("Scorpio");
  const [zodiacReading, setZodiacReading] = useState<{ text: string, romance: number, career: number, luckyHours: string }>({
    text: "Pluto retrogrades into your solar house of communication today Scorpio. Establish strong sovereign nodes and safeguard your network elements.",
    romance: 92,
    career: 88,
    luckyHours: "9 PM - Midnight"
  });
  const [isSpinningZodiac, setIsSpinningZodiac] = useState(false);

  // State for Santa Claus
  const [santaMarshmallows, setSantaMarshmallows] = useState(120);
  const [santaNegotiationStatus, setSantaNegotiationStatus] = useState("Settled peacefully with Cocoa ratios");
  const [isSantaNegotiating, setIsSantaNegotiating] = useState(false);

  // State for Naughty Santa Parody
  const [matureNegotiationOffer, setMatureNegotiationOffer] = useState(15);
  const [matureNegotiationOutcome, setMatureNegotiationOutcome] = useState("Demanding fully heated reindeer barn!");

  // State for Charlemagne tha God
  const [auditInputIdea, setAuditInputIdea] = useState("");
  const [auditResult, setAuditResult] = useState<{ title: string, score: string, verdict: string } | null>(null);

  // Dynamic seed injector to enrich the feed on demand
  const handleRefreshFeed = () => {
    const extraDrops: Drop[] = [
      {
        id: `extra-1-${Date.now()}`,
        creatorId: "mrbeast",
        title: "The Retention Multiplier",
        content: "Everyone says length and retention are the only things that count. Completely false! If you have short duration but ultra-high intent, premium brands will pay ten times more to reach your audience directly than some random list. Build real cash-flowing sovereign channels!",
        voiceName: "Fenrir",
        category: "Financial / Entrepreneurship",
        dateSent: new Date().toISOString().split("T")[0],
        tone: "Inspirational",
        isAdult: false,
        anchorTitle: "High-Intent Creator Monetization Analysis",
        anchorSource: "YouTube",
        anchorLink: "https://themicdrops.com",
        anchorTimeCode: "02:15",
        transcriptContext: "Direct member relationships vs generic static viewer pools."
      },
      {
        id: `extra-2-${Date.now()}`,
        creatorId: "garyv",
        title: "Stop Overthinking Your Hustle",
        content: "If you want to pivot, do it today! Stop asking fifteen different people what they think of your layout. Most founders are scared of action so they keep planning. Just post, check the telemetry, see how the audience behaves, and refine in real time. Reclaim your momentum now!",
        voiceName: "Zephyr",
        category: "Business & Productivity",
        dateSent: new Date().toISOString().split("T")[0],
        tone: "Educational",
        isAdult: false,
        anchorTitle: "Hustle Dynamics & Execution Auditions",
        anchorSource: "Podcast",
        anchorLink: "https://themicdrops.com",
        anchorTimeCode: "40:20",
        transcriptContext: "Audience feedback is the only telemetry that matters."
      },
      {
        id: `extra-3-${Date.now()}`,
        creatorId: "charlemagne",
        title: "Wake Up and Claim Your Channel",
        content: "If you do not own your connection, you do not own your business. Centralized private platforms can block you tomorrow, and everything you built is gone. This is a real wake-up call for creators who refuse to construct direct pipelines. Secure your assets, my brothers!",
        voiceName: "Charon",
        category: "Comedy & Commentary",
        dateSent: new Date().toISOString().split("T")[0],
        tone: "Humor/Opinion",
        isAdult: false,
        anchorTitle: "Breakfast Club: Autonomous Media Pipelines",
        anchorSource: "Radio",
        anchorLink: "https://themicdrops.com",
        anchorTimeCode: "10:45",
        transcriptContext: "The ultimate power is reaching every single device directly."
      }
    ];

    extraDrops.forEach(drop => onAddNewDrop(drop));
    playVibrateBeep();
  };

  const cleanFeed = activeFeed.filter(drop => {
    // 1. Enforce interest declared categories
    const isCategorySelected = declaredInterests[drop.category] ?? false;
    
    // 2. Enforce adult parity filter
    if (drop.isAdult && !allowAdultParody) return false;
    
    // 3. Search word matches
    const matchesSearch = drop.title.toLowerCase().includes(topicSearch.toLowerCase()) || 
                          drop.content.toLowerCase().includes(topicSearch.toLowerCase());

    return isCategorySelected && matchesSearch;
  });

  // Listen to external drop arrivals (simulated from our left pane Creator Suite!)
  useEffect(() => {
    if (lastPublishedDrop) {
      // Direct vibration/sound beep trigger
      playVibrateBeep();
      setNotification(lastPublishedDrop);
      // Fade notification out after 5.5 seconds
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, [lastPublishedDrop]);

  // Audio synthesizer beep for incoming notifications
  const playVibrateBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 pitch
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5 pitch
      
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  };

  // Perform TTS speech synthesis inside mobile device
  const handleMobileTTS = async (textToSpeak: string, voiceSelected: string) => {
    setIsSynthesizing(true);
    try {
      const response = await fetch("/api/drops/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSpeak, voiceName: voiceSelected })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "No audio returned");
      }

      const ctx = audioContext || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (!audioContext) setAudioContext(ctx);

      if (playingAudio) {
        try { playingAudio.stop(); } catch (e) {}
      }

      const binary = window.atob(data.audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const int16Samples = new Int16Array(bytes.buffer);
      const audioBuffer = ctx.createBuffer(1, int16Samples.length, 24000);
      const channelData = audioBuffer.getChannelData(0);

      for (let i = 0; i < int16Samples.length; i++) {
        channelData[i] = int16Samples[i] / 32768.0;
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start(0);

      setPlayingAudio(source);
      source.onended = () => setPlayingAudio(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const stopMobileAudio = () => {
    if (playingAudio) {
      try { playingAudio.stop(); } catch (e) {}
      setPlayingAudio(null);
    }
  };

  // Simulated virtual video source timeline seeking timer
  useEffect(() => {
    if (isSourcePlaying) {
      progressTimerRef.current = setInterval(() => {
        setSourceProgress(prev => {
          if (prev >= 100) return 0;
          return prev + 1;
        });
      }, 1000);
    } else {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    }
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isSourcePlaying]);

  const handleSeek = (percentage: number) => {
    setSourceProgress(percentage);
  };

  const getSponsorAdCard = () => {
    // Computes matching advertisement based entirely on user-declared choices
    const activeInterests = Object.keys(declaredInterests).filter(k => declaredInterests[k]);
    
    if (activeInterests.length === 0) return null;

    // Pick first matching interest theme to target contextually
    const keyInterest = activeInterests[0];
    
    switch (keyInterest) {
      case "Financial / Entrepreneurship":
        return {
          sponsor: "Y-Combinator Seed Auditions",
          message: "Looking for direct, sovereign micro-networks? Apply to our next Seed startup program.",
          cta: "Apply directly",
          bg: "from-amber-950/40 to-amber-900/10 border-amber-500/30",
          accentColor: "bg-amber-500"
        };
      case "Business & Productivity":
        return {
          sponsor: "Slack Enterprise Pipelines",
          message: "Secure channels for full-team direct declarations. Bypassing email noise with speed.",
          cta: "Try Slack Pro",
          bg: "from-purple-950/40 to-purple-900/10 border-purple-500/30",
          accentColor: "bg-purple-500"
        };
      case "Comedy & Commentary":
        return {
          sponsor: "Netflix Comedy Vault Specials",
          message: "Unlock deeper standup transcripts. Streaming Charlemagne and guests raw in UHD.",
          cta: "Watch on Netflix",
          bg: "from-rose-950/40 to-rose-900/10 border-rose-500/30",
          accentColor: "bg-rose-500"
        };
      case "Financial Literacy / Invest Fest":
        return {
          sponsor: "Beast Financial Cards",
          message: "Direct members only campaign. Set boundaries on deposits and claim 5% APY bonuses.",
          cta: "Pre-order Cash Card",
          bg: "from-emerald-950/40 to-emerald-900/10 border-emerald-500/30",
          accentColor: "bg-emerald-500"
        };
      case "Family & Kids (Seasonal)":
        return {
          sponsor: "North Pole Magical Mailbox",
          message: "Claim custom letter delivery pipelines and seasonal greeting calendars.",
          cta: "Schedule Christmas Call",
          bg: "from-cyan-950/40 to-cyan-900/10 border-cyan-500/30",
          accentColor: "bg-cyan-500"
        };
      case "Spiritual & Lifestyle":
        return {
          sponsor: "Calm Mindfulness Protocols",
          message: "Enjoy quiet times and stressless breathing loops with zero tracking parameters.",
          cta: "Activate Free trial",
          bg: "from-indigo-950/50 to-indigo-900/10 border-indigo-500/30",
          accentColor: "bg-indigo-500"
        };
      default:
        return {
          sponsor: "The MIC Drops Network",
          message: "Support direct, noise-free micro-ingestion without algorithmic interference.",
          cta: "Back our pre-seed round",
          bg: "from-slate-950/50 to-slate-900/30 border-slate-800",
          accentColor: "bg-indigo-500"
        };
    }
  };

  const activeAd = getSponsorAdCard();

  return (
    <div id="mobile-viewport-wrapper" className="flex items-center justify-center h-full p-4 select-none relative">
      {/* Dynamic Incoming Notification Overlay */}
      {notification && (
        <div 
          onClick={() => {
            setSelectedDrop(notification);
            setNavState("player");
            setNotification(null);
          }}
          className="absolute top-8 left-1/2 -translate-x-1/2 w-[340px] bg-[#0A0A0A]/95 border border-[#C19A6B] p-3 rounded-none shadow-2xl flex items-start gap-2.5 cursor-pointer z-50 animate-bounce duration-300 backdrop-blur-md"
        >
          <img 
            src={DEFAULT_CREATORS.find(c => c.id === notification.creatorId)?.avatarUrl} 
            alt="avatar" 
            className="w-8 h-8 rounded-full border border-white/10 self-center" 
          />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-[#C19A6B] font-mono tracking-widest block uppercase font-bold">mic drop incoming!</span>
              <span className="text-[9px] text-slate-500 font-mono">now</span>
            </div>
            <h5 className="text-[11px] font-serif italic text-white truncate">{notification.title}</h5>
            <p className="text-[10px] text-slate-450 truncate mt-0.5">{notification.content}</p>
          </div>
        </div>
      )}

      {/* Realistic Titanium Phone Chassis */}
      <div id="phone-frame" className="w-[370px] h-[720px] bg-[#0A0A0A] rounded-[48px] border-[10px] border-white/10 p-3 shadow-2xl flex flex-col relative overflow-hidden">
        {/* Dynamic Island / Camera Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-45 flex items-center justify-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A]"></div>
          {playingAudio && (
            <div className="flex gap-0.5 items-center justify-center h-3">
              <span className="w-0.5 bg-[#C19A6B] h-2 animate-pulse"></span>
              <span className="w-0.5 bg-[#C19A6B] h-3 animate-pulse delay-75"></span>
              <span className="w-0.5 bg-[#C19A6B] h-1 animate-pulse delay-150"></span>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="flex justify-between items-center px-6 pt-2 pb-3 text-[10px] text-slate-300 font-bold font-mono">
          <span>{new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}</span>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[9px] text-slate-500">5G</span>
            <Battery className="w-4 h-4 text-[#C19A6B]" />
          </div>
        </div>

        {/* Content Portal Viewports */}
        <div className="flex-1 flex flex-col bg-[#0F0F0F] rounded-[38px] overflow-hidden border border-white/5 p-4 pt-2 relative">
          
          {/* VIEW: preferences subscription parameters */}
          {navState === "preferences" && (
            <div className="flex flex-col h-full animate-fade-in text-white overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setNavState("feed")} className="p-1 px-2.5 bg-black border border-white/10 hover:bg-white/5 font-mono text-[9px] uppercase tracking-wider flex items-center gap-0.5 cursor-pointer">
                  <ArrowLeft className="w-3 h-3" /> back
                </button>
                <h4 className="text-xs font-serif italic text-white">my intake choices</h4>
              </div>

              <div className="bg-[#C19A6B]/5 border border-[#C19A6B]/10 p-3 text-[10px] text-slate-350 leading-relaxed mb-4">
                <span className="font-mono text-[#C19A6B] block mb-1">SOVEREIGN INTAKE MANDATE</span>
                You define what reaches your phone. We have zero background algorithms matching feeds or forcing trends. Only checked boxes will appear in your timeline.
              </div>

              <h5 className="text-[9px] text-[#C19A6B] font-mono tracking-widest uppercase mb-2.5">Declare Category Preferences</h5>
              <div className="space-y-2 mb-5">
                {Object.keys(declaredInterests).map(cat => (
                  <label 
                    key={cat} 
                    className="flex justify-between items-center p-2.5 bg-black border border-white/5 hover:bg-white/5 transition-colors cursor-pointer text-xs"
                  >
                    <span className="font-mono text-slate-300">{cat}</span>
                    <input 
                      type="checkbox" 
                      checked={declaredInterests[cat]}
                      onChange={(e) => setDeclaredInterests(prev => ({ ...prev, [cat]: e.target.checked }))}
                      className="w-4 h-4 accent-[#C19A6B] cursor-pointer"
                    />
                  </label>
                ))}
              </div>

              <h5 className="text-[9px] text-slate-500 font-mono tracking-widest uppercase mb-1.5">Age Validation Gating</h5>
              <div className="bg-black p-2.5 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-serif italic text-slate-200">Include Mature Parody</span>
                  <span className="text-[9px] text-slate-500 block">Unlocks adult comedic, parody releases</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={allowAdultParody}
                  onChange={(e) => setAllowAdultParody(e.target.checked)}
                  className="w-4 h-4 accent-[#C19A6B] cursor-pointer"
                />
              </div>

              <div className="mt-auto bg-black p-2 text-center text-[10px] text-slate-500 border border-white/5">
                Your parameters are encrypted locally.
              </div>
            </div>
          )}

          {/* VIEW: default lists feed (the Inbox) */}
          {navState === "feed" && (
            <div className="flex flex-col h-full animate-fade-in text-white relative">
              
              {/* Header Feed Controller */}
              <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 border border-[#C19A6B] flex items-center justify-center bg-[#C19A6B]/5">
                    <span className="text-[10px] font-serif italic text-[#C19A6B] font-bold">m</span>
                  </div>
                  <h3 className="font-serif italic text-sm tracking-tight text-white uppercase font-bold">MIC FEED</h3>
                </div>

                <div className="flex gap-1">
                  <button 
                    onClick={() => setNavState("app_drawer")}
                    className="p-1 px-2 bg-[#C19A6B]/15 hover:bg-[#C19A6B]/25 border border-[#C19A6B]/50 text-[9px] font-mono text-[#C19A6B] flex items-center gap-1 cursor-pointer rounded-sm"
                    title="Open Creator Personal Apps Home Screen"
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>Apps</span>
                  </button>
                  <button 
                    onClick={handleRefreshFeed}
                    title="Simulate Push / Pull and receive fresh drops"
                    className="p-1 px-1.5 bg-black hover:bg-white/5 border border-white/10 text-[9px] font-mono text-slate-400 flex items-center gap-1 cursor-pointer rounded-sm"
                  >
                    <RefreshCw className="w-3 h-3 text-[#C19A6B] animate-pulse" />
                  </button>
                  <button 
                    onClick={() => setNavState("preferences")}
                    className="p-1 px-1.5 bg-black hover:bg-white/5 border border-white/10 text-[9px] font-mono text-slate-400 cursor-pointer flex items-center gap-1 rounded-sm"
                  >
                    <Settings2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Keyword Search Ticker */}
              <input
                type="text"
                placeholder="Search topics / creators..."
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                className="w-full bg-black border border-white/10 text-xs text-white p-2 mb-3 focus:outline-none focus:border-[#C19A6B]"
              />

              {/* Feed elements listing */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 scrollbar-thin">
                {cleanFeed.length > 0 ? (
                  cleanFeed.map(drop => {
                    const creator = DEFAULT_CREATORS.find(c => c.id === drop.creatorId);
                    return (
                      <div 
                        key={drop.id}
                        onClick={() => {
                          setSelectedDrop(drop);
                          setNavState("player");
                          // pre-set progress virtual clip seek to a random spot
                          setSourceProgress(Math.floor(Math.random() * 60) + 10);
                          setIsSourcePlaying(false);
                        }}
                        className="bg-black border hover:border-[#C19A6B]/30 border-white/5 p-3 cursor-pointer transition-all hover:scale-[1.01] flex flex-col relative rounded-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2 mb-1.5">
                            <img src={creator?.avatarUrl} alt="av" className="w-5 h-5 rounded-full object-cover border border-white/10" />
                            <span className="text-[10px] font-serif italic text-slate-350">{creator?.name}</span>
                          </div>
                          <span className="text-[8px] text-slate-500 font-mono">{drop.dateSent}</span>
                        </div>

                        <h4 className="text-xs font-serif italic text-[#E5E5E5] tracking-tight leading-tight truncate">{drop.title}</h4>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">{drop.content}</p>

                        <div className="flex justify-between items-center mt-2.5 border-t border-white/5 pt-2 text-[8px] font-mono">
                          <span className="text-[9px] text-slate-450">Source: <span className="text-[#C19A6B]">{drop.anchorSource} context</span></span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAppCreatorId(drop.creatorId);
                              setNavState("creator_app");
                            }}
                            className="bg-[#C19A6B]/20 hover:bg-[#C19A6B]/40 text-[#C19A6B] border border-[#C19A6B]/30 text-[8px] font-bold px-1.5 py-0.5 pointer-events-auto rounded-[3px] transition-all flex items-center gap-0.5 cursor-pointer uppercase"
                            title={`Launch ${creator?.name}'s Personal App`}
                          >
                            <Smartphone className="w-2.5 h-2.5" /> App
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    <p className="font-mono text-[9px] tracking-widest uppercase text-[#C19A6B]">filtered to baseline</p>
                    <p className="text-[10px] text-slate-400 mt-1">Adjust your declared intake choices in the filters menu to unlock creators.</p>
                  </div>
                )}
              </div>

              {/* Bottom Zero-Surveillance Ad Slot */}
              {activeAd && (
                <div className={`mt-3 bg-[#0A0A0A] border border-[#C19A6B]/20 p-3 flex flex-col relative overflow-hidden animate-fade-in`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-mono tracking-widest text-[#C19A6B] bg-black px-1.5 py-0.5 border border-white/5">DECLARED INTEREST SPONSOR [CPM AD]</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C19A6B]" />
                  </div>
                  <h5 className="font-serif italic text-[11px] text-[#E5E5E5] mt-1.5 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full inline-block bg-[#C19A6B]`}></span>
                    {activeAd.sponsor}
                  </h5>
                  <p className="text-[9px] text-slate-400 leading-tight mt-0.5">{activeAd.message}</p>
                  <button className="text-[8px] font-mono uppercase tracking-widest font-bold self-start mt-2 px-2.5 py-0.5 bg-black hover:bg-[#111111] border border-white/10 text-slate-300">
                    {activeAd.cta}
                  </button>
                </div>
              )}

            </div>
          )}

          {/* VIEW: detailed immersive Drop Player with backward Source clip seeker */}
          {navState === "player" && selectedDrop && (
            <div className="flex flex-col h-full animate-fade-in text-white overflow-y-auto">
              {/* Backward feed list trigger */}
              <div className="flex justify-between items-center mb-3">
                <button 
                  onClick={() => {
                    stopMobileAudio();
                    setNavState("feed");
                  }} 
                  className="p-1 px-2.5 bg-black border border-white/10 rounded-sm hover:bg-[#111111] font-mono text-[9px] uppercase tracking-widest flex items-center gap-0.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      stopMobileAudio();
                      setAppCreatorId(selectedDrop.creatorId);
                      setNavState("creator_app");
                    }}
                    className="p-1 px-2 bg-[#C19A6B]/20 hover:bg-[#C19A6B]/40 text-[#C19A6B] border border-[#C19A6B]/30 text-[8px] font-bold pointer-events-auto rounded-[3px] transition-all flex items-center gap-0.5 cursor-pointer uppercase"
                    title="Launch Creator's Personal App"
                  >
                    <Smartphone className="w-2.5 h-2.5" /> App
                  </button>
                  <span className="text-[9px] font-mono text-[#C19A6B] px-2 py-0.5 bg-[#C19A6B]/5 border border-[#C19A6B]/20 rounded-sm">
                    {selectedDrop.category}
                  </span>
                </div>
              </div>

              <div className="flex-1">
                {/* Creator Header */}
                <div className="flex items-center gap-2 mb-4">
                  <img 
                    src={DEFAULT_CREATORS.find(c => c.id === selectedDrop.creatorId)?.avatarUrl} 
                    alt="avatar" 
                    className="w-10 h-10 rounded-full object-cover border border-[#C19A6B]/30" 
                  />
                  <div>
                    <h4 className="text-xs font-serif italic text-slate-200">
                      {DEFAULT_CREATORS.find(c => c.id === selectedDrop.creatorId)?.name}
                    </h4>
                    <span className="text-[9px] text-[#C19A6B] font-mono">
                      {DEFAULT_CREATORS.find(c => c.id === selectedDrop.creatorId)?.handle} • {DEFAULT_CREATORS.find(c => c.id === selectedDrop.creatorId)?.followersCount}
                    </span>
                  </div>
                </div>

                {/* Atomic statement display */}
                <div className="bg-black border border-white/5 p-4 mb-4 relative shadow-sm rounded-sm">
                  <h3 className="text-sm font-serif italic text-white tracking-tight leading-snug mb-2.5">
                    "{selectedDrop.title}"
                  </h3>
                  <p className="text-xs text-slate-350 leading-relaxed bg-[#0F0F0F] p-3 rounded-sm border border-white/5">
                    {selectedDrop.content}
                  </p>

                  <div className="flex justify-between items-center mt-3 pt-2 text-[9px] border-t border-white/5 text-slate-500 font-mono">
                    <span>Mood: <span className="text-[#C19A6B] font-bold">{selectedDrop.tone}</span></span>
                    <span>Format: <span className="text-slate-300">Voice-cloned drop</span></span>
                  </div>
                </div>

                {/* Simulated Synthesis Voice node */}
                <div className="bg-black p-3 border border-white/5 mb-4 flex items-center justify-between text-xs transition-colors rounded-sm">
                  <div className="flex items-center gap-2">
                    <Volume2 className={`w-4 h-4 ${playingAudio ? "text-[#C19A6B] animate-bounce" : "text-slate-500"}`} />
                    <div>
                      <span className="font-serif italic text-slate-205 text-[10px] block font-bold">Listen to Cloned Voice</span>
                      <span className="text-[9px] text-[#C19A6B] font-mono">cloned {selectedDrop.voiceName} waves</span>
                    </div>
                  </div>
                  {playingAudio ? (
                    <button 
                      onClick={stopMobileAudio}
                      className="p-1.5 px-3 rounded-none bg-rose-950/20 border border-rose-900/40 font-mono text-[9px] uppercase tracking-widest text-[#E5E5E5] flex items-center gap-1 cursor-pointer"
                    >
                      <Square className="w-3 h-3 fill-rose-300" /> Stop
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleMobileTTS(selectedDrop.content, selectedDrop.voiceName)}
                      disabled={isSynthesizing}
                      className="p-1.5 px-3 rounded-none bg-black border border-white/10 hover:bg-white/5 text-[#C19A6B] font-mono text-[9px] uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 text-[#C19A6B] fill-[#C19A6B]" />
                      {isSynthesizing ? "Synthesizing..." : "Play Voice"}
                    </button>
                  )}
                </div>

                {/* THE ANCHOR - Deeper source segment rewind widget */}
                <div className="bg-gradient-to-b from-[#C19A6B]/5 to-black rounded-none p-3 border border-white/5 shadow-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-mono tracking-wider text-[#C19A6B] uppercase font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#C19A6B]" /> Source Context Anchor
                    </span>
                    <span className="text-[8px] bg-black border border-white/10 px-1 rounded font-mono text-slate-300">
                      Timestamp: {selectedDrop.anchorTimeCode || "03:15"}
                    </span>
                  </div>

                  <h5 className="text-[11px] font-serif italic text-white flex items-center gap-1.5 font-bold">
                    <span className="text-[10px] font-mono text-slate-400 border border-white/5 px-1 rounded font-normal">
                      {selectedDrop.anchorSource}
                    </span>
                    {selectedDrop.anchorTitle}
                  </h5>

                  {/* Seek Bar simulator */}
                  <div className="mt-3 bg-black border border-white/5 p-2.5">
                    <div className="flex justify-between text-[9px] text-[#C19A6B] font-mono mb-1">
                      <span>Seek back context</span>
                      <span className="text-[#C19A6B] font-bold">Segment contextualization</span>
                    </div>

                    <div className="h-1.5 w-full bg-[#111111] relative" id="seek-track">
                      <div 
                        className="absolute h-full left-0 top-0 bg-[#C19A6B]" 
                        style={{ width: `${sourceProgress}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center mt-2.5">
                      <div className="flex gap-1">
                        {[10, 30, 50, 70, 90].map(pt => (
                          <button
                            key={pt}
                            onClick={() => handleSeek(pt)}
                            className={`text-[8px] font-mono border px-1 cursor-pointer transition-colors ${
                              sourceProgress === pt 
                                ? "bg-[#C19A6B]/15 border-[#C19A6B] text-[#C19A6B] font-bold" 
                                : "bg-black border-white/5 text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            {pt}%
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setIsSourcePlaying(!isSourcePlaying)}
                        className="p-1 px-3 bg-[#C19A6B] text-black font-mono text-[9px] uppercase tracking-widest font-bold flex items-center gap-1 cursor-pointer hover:opacity-90"
                      >
                        {isSourcePlaying ? "Pause segment" : "Play Source Context"}
                      </button>
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-400 leading-normal mt-2.5 border-t border-white/5 pt-2 italic">
                    " ... {selectedDrop.transcriptContext || "Direct source transcript verification to ensure total transparency."} ... "
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* VIEW: App Launcher Grid / App Drawer */}
          {navState === "app_drawer" && (
            <div className="flex flex-col h-full animate-fade-in text-white overflow-y-auto">
              
              {/* Launcher Header Clock Info */}
              <div className="text-center my-4">
                <span className="block text-2xl font-serif italic text-white tracking-widest font-bold">
                  {new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
                <span className="text-[9px] uppercase font-mono tracking-widest text-[#C19A6B]">
                  {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                </span>
              </div>

              {/* Sub-header text */}
              <div className="text-[9px] font-mono tracking-wider text-slate-500 uppercase text-center mb-4 border-b border-white/5 pb-2">
                Sovereign Creator Portals
              </div>

              {/* App Icons Grid */}
              <div className="grid grid-cols-4 gap-x-2 gap-y-4 px-1.5 flex-1">
                
                {/* 1. MIC Reader (The Feed) */}
                <div 
                  onClick={() => setNavState("feed")}
                  className="flex flex-col items-center group cursor-pointer transition-transform active:scale-95"
                >
                  <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#C19A6B] to-amber-950 border border-[#C19A6B]/50 flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
                    <Compass className="w-5 h-5 text-black" />
                  </div>
                  <span className="text-[8px] font-mono tracking-tight text-slate-400 mt-1.5 text-center truncate w-full">
                    MIC Feed
                  </span>
                </div>

                {/* 2. All active creators custom apps */}
                {DEFAULT_CREATORS.map(creator => {
                  // Assign distinctive icons and gradients to represent their personal brands
                  let icon = <Smartphone className="w-5 h-5 text-white" />;
                  let gradient = "from-slate-850 to-slate-900 border-white/10";
                  
                  if (creator.id === "sohk") {
                    icon = <BookOpen className="w-5 h-5 text-[#E6C280]" />;
                    gradient = "from-rose-950 to-black border-rose-900/30";
                  } else if (creator.id === "mrbeast") {
                    icon = <Award className="w-5 h-5 text-cyan-400" />;
                    gradient = "from-emerald-950 to-black border-emerald-900/45";
                  } else if (creator.id === "garyv") {
                    icon = <Zap className="w-5 h-5 text-indigo-400" />;
                    gradient = "from-indigo-950 to-black border-indigo-900/30";
                  } else if (creator.id === "eyl") {
                    icon = <Briefcase className="w-5 h-5 text-amber-400" />;
                    gradient = "from-amber-950 to-black border-amber-900/35";
                  } else if (creator.id === "horoscope") {
                    icon = <Moon className="w-5 h-5 text-purple-400 animate-pulse" />;
                    gradient = "from-purple-950 to-black border-purple-900/30";
                  } else if (creator.id === "santa") {
                    icon = <Coffee className="w-5 h-5 text-red-400" />;
                    gradient = "from-red-950 to-black border-red-900/30";
                  } else if (creator.id === "naughtysanta") {
                    icon = <Skull className="w-5 h-5 text-rose-500" />;
                    gradient = "from-slate-900 to-rose-955 border-rose-900/45";
                  } else if (creator.id === "charlemagne") {
                    icon = <ShieldAlert className="w-5 h-5 text-yellow-450" />;
                    gradient = "from-yellow-950 to-black border-yellow-900/30";
                  }

                  return (
                    <div 
                      key={creator.id}
                      onClick={() => {
                        setAppCreatorId(creator.id);
                        setNavState("creator_app");
                      }}
                      className="flex flex-col items-center group cursor-pointer transition-transform active:scale-95"
                    >
                      <div className={`w-10 h-10 rounded-[10px] bg-gradient-to-br ${gradient} border flex items-center justify-center shadow-lg group-hover:scale-105 transition-all`}>
                        {icon}
                      </div>
                      <span className="text-[8px] font-mono tracking-tight text-slate-350 mt-1.5 text-center truncate w-full">
                        {creator.id === "sohk" ? "Wisdom Card" : creator.id === "mrbeast" ? "Beast Moat" : creator.id === "garyv" ? "Attention" : creator.id === "eyl" ? "Capital Vault" : creator.id === "horoscope" ? "Cosmic Ast" : creator.id === "santa" ? "Sleigh Track" : creator.id === "naughtysanta" ? "NS Parody" : "Donkey Audit"}
                      </span>
                    </div>
                  );
                })}

                {/* 3. Settings Preference icon */}
                <div 
                  onClick={() => setNavState("preferences")}
                  className="flex flex-col items-center group cursor-pointer transition-transform active:scale-95"
                >
                  <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-slate-900 to-black border border-white/5 flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
                    <Settings2 className="w-5 h-5 text-slate-400" />
                  </div>
                  <span className="text-[8px] font-mono tracking-tight text-slate-500 mt-1.5 text-center truncate w-full">
                    Filters
                  </span>
                </div>

              </div>

              {/* Bottom Quick Doc / Dock Bar representing premium tray */}
              <div className="mt-auto bg-black/75 border border-white/10 rounded-[14px] p-1.5 flex justify-around items-center z-30 shadow-xl">
                <button 
                  onClick={(e) => { e.stopPropagation(); setNavState("feed"); }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                  title="Feed Reader"
                >
                  <Compass className="w-4.5 h-4.5 text-[#C19A6B] hover:scale-110 transition-transform" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setAppCreatorId("sohk"); setNavState("creator_app"); }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                  title="Words of Wisdom"
                >
                  <BookOpen className="w-4.5 h-4.5 text-rose-450 hover:scale-110 transition-transform" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setAppCreatorId("garyv"); setNavState("creator_app"); }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                  title="Attention soundboard"
                >
                  <Zap className="w-4.5 h-4.5 text-indigo-400 hover:scale-110 transition-transform" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setAppCreatorId("horoscope"); setNavState("creator_app"); }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                  title="Cosmic astrology"
                >
                  <Moon className="w-4.5 h-4.5 text-purple-400 hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* VIEW: Creator Personal App Environment */}
          {navState === "creator_app" && (() => {
            const creator = DEFAULT_CREATORS.find(c => c.id === appCreatorId) || DEFAULT_CREATORS[5];
            
            // Generate color scheme settings dynamically based on creator characteristics
            let bgStyle = "bg-stone-900";
            let borderStyle = "border-stone-750";
            let textColor = "text-stone-300";
            let accentColor = "text-[#C19A6B]";
            let secondaryBg = "bg-stone-955";
            let buttonBg = "bg-[#C19A6B] text-black font-bold h-7";
            let label = "Words of Wisdom";
            
            if (appCreatorId === "sohk") {
              bgStyle = "bg-[#1E1111]";
              borderStyle = "border-[#3B1919]";
              textColor = "text-rose-200";
              accentColor = "text-[#E6C280]";
              secondaryBg = "bg-[#0F0707]";
              buttonBg = "bg-[#E6C280] hover:bg-[#F2D7A5] text-black font-semibold h-7 rounded-[4px]";
              label = "Words of Wisdom";
            } else if (appCreatorId === "mrbeast") {
              bgStyle = "bg-[#062016]";
              borderStyle = "border-[#0C5C39]";
              textColor = "text-emerald-100";
              accentColor = "text-cyan-400";
              secondaryBg = "bg-[#020F0A]";
              buttonBg = "bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-7 rounded-[4px]";
              label = "Beast Moat App";
            } else if (appCreatorId === "garyv") {
              bgStyle = "bg-[#111122]";
              borderStyle = "border-[#222244]";
              textColor = "text-slate-250";
              accentColor = "text-[#A3E635]";
              secondaryBg = "bg-[#080812]";
              buttonBg = "bg-[#A3E635] hover:bg-[#BDFC5E] text-slate-900 font-bold h-7 rounded-[4px]";
              label = "Attention Arbitrage";
            } else if (appCreatorId === "eyl") {
              bgStyle = "bg-[#18140C]";
              borderStyle = "border-[#3A2E16]";
              textColor = "text-amber-100";
              accentColor = "text-[#F5C242]";
              secondaryBg = "bg-[#0C0A06]";
              buttonBg = "bg-[#F5C242] hover:bg-[#FFD966] text-black font-bold h-7 rounded-[4px]";
              label = "EYL Capital Vault";
            } else if (appCreatorId === "horoscope") {
              bgStyle = "bg-[#19112E]";
              borderStyle = "border-[#3E2375]";
              textColor = "text-purple-200";
              accentColor = "text-yellow-400";
              secondaryBg = "bg-[#0B0716]";
              buttonBg = "bg-yellow-455 hover:bg-yellow-450 text-black font-medium h-7 rounded-[4px]";
              label = "Astrology Align";
            } else if (appCreatorId === "santa") {
              bgStyle = "bg-[#2D1212]";
              borderStyle = "border-[#5E1E1E]";
              textColor = "text-red-100";
              accentColor = "text-white";
              secondaryBg = "bg-[#170808]";
              buttonBg = "bg-red-650 hover:bg-red-650 text-white font-bold h-7 rounded-[4px]";
              label = "AeroSleigh Track";
            } else if (appCreatorId === "naughtysanta") {
              bgStyle = "bg-[#1C1616]";
              borderStyle = "border-[#4A2020]";
              textColor = "text-slate-250";
              accentColor = "text-rose-500";
              secondaryBg = "bg-[#0E0B0B]";
              buttonBg = "bg-rose-650 hover:bg-rose-650 text-white font-bold h-7 rounded-[4px]";
              label = "NS Late Night";
            } else if (appCreatorId === "charlemagne") {
              bgStyle = "bg-[#1C1A16]";
              borderStyle = "border-[#3F3926]";
              textColor = "text-slate-300";
              accentColor = "text-yellow-500";
              secondaryBg = "bg-[#0E0D0B]";
              buttonBg = "bg-yellow-555 hover:bg-yellow-500 text-black font-black h-7 rounded-[4px]";
              label = "Donkey Audit Channel";
            }

            return (
              <div className={`flex flex-col h-full animate-fade-in ${bgStyle} ${textColor} p-3 rounded-[20px] overflow-y-auto`}>
                
                {/* Custom Creator Header */}
                <div className={`flex justify-between items-center pb-2 border-b ${borderStyle} mb-3`}>
                  <button 
                    onClick={() => setNavState("app_drawer")} 
                    className={`flex items-center gap-0.5 font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 bg-black/45 border ${borderStyle} text-white cursor-pointer rounded-[4px]`}
                  >
                    <ArrowLeft className="w-3 h-3" /> Grid
                  </button>
                  
                  <div className="flex items-center gap-1.5">
                    <img src={creator.avatarUrl} alt="av" className="w-5 h-5 rounded-full border border-white/20 object-cover" />
                    <span className="font-serif italic text-[11px] text-white font-bold">{label}</span>
                  </div>

                  <button 
                    onClick={() => setNavState("feed")} 
                    className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 bg-black/45 border ${borderStyle} text-[#C19A6B] cursor-pointer rounded-[4px]`}
                    title="Open Unified MIC Reader Feed"
                  >
                    Feed
                  </button>
                </div>

                {/* Main Interactive Space */}
                <div className="flex-1 flex flex-col justify-stretch">
                  
                  {/* APP BRAND SUMMARY */}
                  <div className={`p-2.5 ${secondaryBg} border ${borderStyle} rounded-sm text-[10px] leading-snug mb-3`}>
                    <p className="font-serif italic text-white text-[11px] mb-1">
                      Sovereign Intake Conduit: <span className={accentColor}>{creator.handle}</span>
                    </p>
                    <p className="text-slate-400 leading-normal">{creator.description}</p>
                  </div>

                  {/* RENDER DYNAMIC ACTIVE COMPONENT MODULES MATCHING THEIR REAL VOICES/PERSONAS */}
                  
                  {/* APP: SOHK Words of Wisdom app */}
                  {appCreatorId === "sohk" && (
                    <div className="space-y-3 flex flex-col justify-stretch flex-1">
                      
                      {/* Wisdom Card Drawer */}
                      <div className="bg-[#110101]/60 border-2 border-dashed border-[#E6C280]/20 p-3 rounded-md relative flex flex-col justify-center min-h-[140px] text-center shadow-lg transition-transform hover:scale-[1.01]">
                        <span className="absolute top-1.5 left-1/2 -translate-x-1/2 font-mono text-[7px] uppercase tracking-widest text-[#E6C280]/60">Words of Wisdom Oracle</span>
                        {wisdomCard ? (
                          <div className="py-2">
                            <p className="font-serif italic text-[#E6C280] text-xs leading-relaxed">
                              "{wisdomCard.quote}"
                            </p>
                            <p className="font-mono text-[8px] text-rose-350 mt-2">
                              — {wisdomCard.speaker}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-500 italic">No Card Drawn. Tap 'Draw Wisdom Blueprint' to capture street-smart execution loops.</p>
                        )}
                        <button
                          onClick={() => {
                            setIsDrawingWisdom(true);
                            setTimeout(() => {
                              const rnd = SOHK_WISDOMS[Math.floor(Math.random() * SOHK_WISDOMS.length)];
                              setWisdomCard(rnd);
                              setWisdomHistory(prev => [rnd, ...prev].slice(0, 5));
                              setIsDrawingWisdom(false);
                            }, 400);
                          }}
                          className={`w-full mt-2 self-center py-1 px-3 uppercase tracking-wider text-[8px] font-mono cursor-pointer transition-all ${buttonBg}`}
                        >
                          {isDrawingWisdom ? "Synthesizing Wisdom..." : "Draw Wisdom Card"}
                        </button>
                      </div>

                      {/* Sovereign life-challenger feedback widget */}
                      <div className="bg-black/55 border border-[#3B1919] p-3 rounded-md">
                        <span className="font-serif text-[10px] italic text-[#E6C280] block mb-1">Interactive Action Consultant</span>
                        <p className="text-[9px] text-slate-400 leading-tight mb-2">Input your active life decision standard hurdle for customized execution advice.</p>
                        
                        <div className="flex gap-1.5">
                          <input 
                            type="text" 
                            placeholder="e.g. Should I rent a nice SoHo workspace?" 
                            value={userHurdle}
                            onChange={(e) => setUserHurdle(e.target.value)}
                            className="bg-[#0F0707] border border-[#3B1919] text-[10px] text-white p-1 px-2 flex-1 rounded-[3px] focus:outline-none focus:border-[#E6C280]"
                          />
                          <button
                            onClick={() => {
                              if (!userHurdle) return;
                              const val = userHurdle.toLowerCase();
                              let resp = "Call fifty clients directly. Stop spending money on a premium static workspace before you are swimming in positive cash flow.";
                              if (val.includes("college") || val.includes("university")) {
                                resp = "Launch a raw prototype in three days. The concrete beats the abstract classroom every single time.";
                              } else if (val.includes("logo") || val.includes("website") || val.includes("branding")) {
                                resp = "Frictionless execution beats custom palettes. Do not spend precious capital designing assets before you have verified actual customer attention.";
                              } else if (val.includes("burn") || val.includes("tired")) {
                                resp = "Rejection is blood. If you are feeling tired, sleep inside your vehicle, wake up at 5am, and execute. Active rejection is the filter.";
                              }
                              setWisdomFeedback(resp);
                            }}
                            className="p-1 px-3 bg-[#E6C280] text-black font-semibold text-[8px] rounded-[3px] uppercase cursor-pointer"
                          >
                            Analyze
                          </button>
                        </div>
                        {wisdomFeedback && (
                          <div className="mt-2.5 p-2 bg-[#0F0707] border border-[#E6C280]/20 rounded-sm text-[9px] text-rose-100 animate-fade-in leading-relaxed">
                            <span className="font-bold text-[#E6C280] block text-[8px] uppercase font-mono tracking-wider mb-0.5">SOHK Action Plan:</span>
                            "{wisdomFeedback}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* APP: MrBeast app */}
                  {appCreatorId === "mrbeast" && (
                    <div className="space-y-3 flex flex-col justify-stretch flex-1">
                      {/* Push Blast Panel */}
                      <div className="bg-[#020F0A] border border-[#0C5C39] p-3 rounded-md">
                        <span className="font-serif text-[10px] italic text-cyan-400 block mb-1">Notification Velocity Control</span>
                        <p className="text-[9px] text-slate-400 mb-2 leading-tight">Simulate blasting a push challenge to millions of device locks simultaneously.</p>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-[9px] font-mono text-emerald-400">
                            <span>Target Devices:</span>
                            <span className="font-bold">{(beastNotifyVelocity / 1000000).toFixed(1)}M subscribers</span>
                          </div>
                          <input 
                            type="range" 
                            min="100000" 
                            max="50000000" 
                            value={beastNotifyVelocity} 
                            onChange={(e) => setBeastNotifyVelocity(Number(e.target.value))} 
                            className="w-full accent-cyan-400 cursor-pointer h-1 rounded" 
                          />
                        </div>

                        <div className="flex justify-between items-center text-[8px] text-slate-400 mt-2 bg-black/65 p-2 border border-[#0C5C39]/30 font-mono">
                          <span>Simulated Tap Through: <span className="text-cyan-400">12.5%</span></span>
                          <span>Active Leads: <span className="text-emerald-400 font-bold">{(beastNotifyVelocity * 0.125).toLocaleString()}</span></span>
                        </div>
                      </div>

                      {/* Tap Game Wrapper */}
                      <div className="bg-black/55 border border-[#0C5C39] p-3 rounded-md text-center">
                        <span className="font-serif text-[10px] italic text-cyan-400 block mb-1">Giveaway Tap Challenge!</span>
                        <p className="text-[9px] text-slate-400 mb-2.5">Simulate rapid user declarations. Tap the button to fill active giveaway funds!</p>
                        
                        <div className="flex items-center justify-around gap-2">
                          <div className="text-left font-mono">
                            <span className="text-[8px] text-slate-500 block">Funds Accumulator:</span>
                            <span className="text-xs font-bold text-emerald-400">${(beastTaps * 750).toLocaleString()} AUD</span>
                          </div>
                          
                          <button
                            onClick={() => {
                              setBeastTaps(prev => prev + 1);
                              playVibrateBeep();
                            }}
                            className="p-1 px-4 text-[10px] font-sans font-bold bg-[#10B981] hover:bg-emerald-450 text-black rounded-[4px] shadow-lg flex items-center gap-1 cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" /> Tap Fund
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* APP: Gary V app */}
                  {appCreatorId === "garyv" && (
                    <div className="space-y-3 flex flex-col justify-stretch flex-1">
                      {/* Deterministic Ads Calculator */}
                      <div className="bg-[#080812] border border-[#222244] p-3 rounded-md">
                        <span className="font-serif text-[10px] italic text-[#A3E635] block mb-1">Attention Arbitrage Engine</span>
                        <p className="text-[9px] text-slate-455 leading-tight mb-3">Slide to configure user-declared attention filters to see corresponding publisher yields directly.</p>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center font-mono text-[9px]">
                            <span className="text-slate-400">Target Premium CPM:</span>
                            <span className="text-[#A3E635] font-bold">${garyDeterministicValue} CPM</span>
                          </div>
                          <input 
                            type="range" 
                            min="15" 
                            max="120" 
                            value={garyDeterministicValue} 
                            onChange={(e) => setGaryDeterministicValue(Number(e.target.value))} 
                            className="w-full accent-[#A3E635] h-1"
                          />
                        </div>

                        <div className="mt-3 p-2 bg-[#111122]/50 border border-[#222244] text-[9px] text-slate-400 font-mono">
                          Compared to standard trackers (${(garyDeterministicValue / 3).toFixed(0)} CPM), your direct subscription pipeline extracts <span className="text-[#A3E635] font-bold">3.0x higher ROI</span> due to deterministic declaration.
                        </div>
                      </div>

                      {/* soundboard simulator */}
                      <div className="bg-black/45 border border-[#222244] p-3 rounded-md text-center">
                        <span className="font-serif text-[10px] italic text-[#A3E635] block mb-1.5">Gary V's Hustle Soundboard</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            "Attention is capital!",
                            "Stop planning, act!",
                            "Macro-patience!",
                            "Rented land collapses!"
                          ].map(clip => (
                            <button
                              key={clip}
                              onClick={(e) => {
                                e.stopPropagation();
                                setGarySoundClipName(clip);
                                playVibrateBeep();
                                setTimeout(() => setGarySoundClipName(null), 1500);
                              }}
                              className="bg-[#111122] hover:bg-[#1C1C3A] text-slate-300 font-mono text-[8.5px] py-2 px-1.5 border border-[#333366] rounded-[4px] cursor-pointer active:scale-95 transition-all text-center flex items-center justify-center whitespace-normal break-words min-h-[38px] leading-tight"
                            >
                              🗣️ "{clip}"
                            </button>
                          ))}
                        </div>
                        {garySoundClipName && (
                          <div className="mt-2 p-1.5 bg-black border border-[#A3E635]/20 text-[9px] text-white font-mono animate-pulse flex items-center justify-center gap-1.5 rounded-sm">
                            <Music className="w-3.5 h-3.5 text-[#A3E635]" /> Broadcasting clip: "{garySoundClipName}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* APP: Earn Your Leisure app */}
                  {appCreatorId === "eyl" && (
                    <div className="space-y-3 flex flex-col justify-stretch flex-1">
                      {/* Asset Holdings Panel */}
                      <div className="bg-[#0C0A06] border border-[#3A2E16] p-3 rounded-md">
                        <span className="font-serif text-[10px] italic text-[#F5C242] block mb-1">Sovereign Asset Allocation</span>
                        <p className="text-[9px] text-slate-455 leading-tight mb-2.5">Adding direct membership properties to your active trust portfolio blocks platform slippage.</p>
                        
                        <div className="space-y-1.5">
                          {eylHoldingsList.map((hold, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-black/65 border border-white/5 p-1.5 px-2.5 text-[9px] font-mono">
                              <span className="text-slate-300 truncate tracking-wide">{hold}</span>
                              <Check className="w-3 h-3 text-[#F5C242]" />
                            </div>
                          ))}
                        </div>

                        {/* Input custom asset holding */}
                        <div className="flex gap-1 mt-2.5">
                          <input 
                            type="text" 
                            placeholder="e.g. Trademark licensing royalties" 
                            value={newEylHolding}
                            onChange={(e) => setNewEylHolding(e.target.value)}
                            className="bg-black border border-[#3A2E16] text-[9px] text-white p-1 px-2 flex-1 rounded-[3px]"
                          />
                          <button
                            onClick={() => {
                              if (!newEylHolding) return;
                              setEylHoldingsList(prev => [...prev, newEylHolding].slice(0, 4));
                              setNewEylHolding("");
                              playVibrateBeep();
                            }}
                            className="p-1 px-2.5 bg-[#F5C242] text-black font-bold text-[8px] rounded-[3px] uppercase cursor-pointer"
                          >
                            Add Block
                          </button>
                        </div>
                      </div>

                      {/* Trust compounder slider */}
                      <div className="bg-[#0C0A06] border border-[#3A2E16] p-2.5 rounded-md">
                        <span className="font-serif text-[11px] italic text-[#F5C242] block mb-1">Generational Yield Accumulator</span>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[9px] font-mono text-slate-455">
                            <span>Invested Trust Capital:</span>
                            <span className="text-[#F5C242] font-bold">${eylTrustAllocation.toLocaleString()} / mo</span>
                          </div>
                          <input 
                            type="range" 
                            min="2000" 
                            max="100000" 
                            step="1000"
                            value={eylTrustAllocation} 
                            onChange={(e) => setEylTrustAllocation(Number(e.target.value))} 
                            className="w-full accent-[#F5C242] h-1"
                          />
                          <div className="p-1.5 bg-black border border-[#3A2E16]/40 text-[8px] text-slate-450 leading-relaxed font-mono">
                            Assuming a conservative <span className="text-[#F5C242]">8.5% compounded annuity</span>, your direct audience network provides enough capital density to produce <span className="text-white font-bold">${(eylTrustAllocation * 12 * 7.5).toLocaleString()}</span> in trust equity over 10 years.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* APP: Horoscope astral aligner */}
                  {appCreatorId === "horoscope" && (
                    <div className="space-y-3 flex flex-col justify-stretch flex-1">
                      {/* alignment spinner */}
                      <div className="bg-[#0B0716] border border-[#3E2375] p-3 rounded-md text-center">
                        <span className="font-serif text-[11px] italic text-yellow-400 block mb-1">Celestial Alignment Wheel</span>
                        <div className="flex justify-center my-3 relative">
                          <div 
                            className={`w-16 h-16 border-2 border-dashed border-yellow-400/40 rounded-full flex items-center justify-center relative transition-transform duration-500 ${isSpinningZodiac ? "animate-spin" : ""}`}
                          >
                            <Moon className="w-8 h-8 text-yellow-400 animate-pulse" />
                          </div>
                        </div>

                        <div className="flex justify-center gap-1.5">
                          {["Scorpio", "Leo", "Taurus"].map(sign => (
                            <button
                              key={sign}
                              onClick={() => {
                                setSelectedZodiac(sign);
                                setIsSpinningZodiac(true);
                                playVibrateBeep();
                                setTimeout(() => {
                                  setIsSpinningZodiac(false);
                                  if (sign === "Scorpio") {
                                    setZodiacReading({
                                      text: "Mercury aligns with Pluto tonight, urging Scorpio to refine narrative channels in absolute silent alignment. Ignore third-party feedback filters.",
                                      romance: 92,
                                      career: 88,
                                      luckyHours: "9 PM - Midnight"
                                    });
                                  } else if (sign === "Leo") {
                                    setZodiacReading({
                                      text: "The sun enters your sign tomorrow, Leo. Refuse to fit into generic templates—your solar flare demands direct channels to shine brightly.",
                                      romance: 95,
                                      career: 90,
                                      luckyHours: "8 AM - 11 AM"
                                    });
                                  } else {
                                    setZodiacReading({
                                      text: "Earth configurations favor Taurus establishing robust local roots. Reclaim control of communication gates under this moon alignment.",
                                      romance: 85,
                                      career: 94,
                                      luckyHours: "2 PM - 5 PM"
                                    });
                                  }
                                }, 500);
                              }}
                              className={`text-[9px] font-mono border px-2 py-0.5 rounded-sm cursor-pointer ${selectedZodiac === sign ? "bg-yellow-400/15 border-yellow-400 text-yellow-400 font-bold" : "bg-black border-white/5 text-slate-500 hover:text-slate-350"}`}
                            >
                              {sign}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Display Reading */}
                      <div className="bg-black/55 border border-[#3E2375] p-3 rounded-md text-[10px] leading-relaxed">
                        <div className="flex justify-between items-center text-[9px] font-mono mb-2 text-yellow-400 border-b border-[#3E2375]/40 pb-1.5">
                          <span>Sign: <span className="text-white font-bold">{selectedZodiac}</span></span>
                          <span>Lucky Hours: <span className="text-white font-bold">{zodiacReading.luckyHours}</span></span>
                        </div>
                        
                        <p className="text-slate-300 italic text-center text-[9.5px]">"{zodiacReading.text}"</p>

                        <div className="grid grid-cols-2 gap-2 mt-3 text-[8px] font-mono">
                          <div className="p-1.5 bg-black border border-white/5">
                            <span className="text-slate-500 block">Romance Rating:</span>
                            <span className="text-yellow-400 font-bold text-[10px]">{zodiacReading.romance}% Positive</span>
                          </div>
                          <div className="p-1.5 bg-black border border-white/5">
                            <span className="text-slate-500 block">Career Alignment:</span>
                            <span className="text-yellow-400 font-bold text-[10px]">{zodiacReading.career}% Vector</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* APP: Santa Claus cheeful logistics */}
                  {appCreatorId === "santa" && (
                    <div className="space-y-3 flex flex-col justify-stretch flex-1">
                      {/* Marshmallow Settlement */}
                      <div className="bg-[#170808] border border-[#5E1E1E] p-3 rounded-md text-center">
                        <span className="font-serif text-[11px] italic text-white block mb-1">Elf Cafeteria Settlements</span>
                        <p className="text-[9px] text-slate-455 mb-3 leading-tight">Tune marshmallow rations matching daily toy output conveyor schedules.</p>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[9px] font-mono text-red-300">
                            <span>Marshmallows:</span>
                            <span className="font-bold">{santaMarshmallows} items per cup</span>
                          </div>
                          <input 
                            type="range" 
                            min="20" 
                            max="300" 
                            value={santaMarshmallows} 
                            onChange={(e) => setSantaMarshmallows(Number(e.target.value))} 
                            className="w-full accent-red-500 h-1"
                          />
                        </div>

                        <div className="mt-3 p-2 bg-black border border-red-900/40 text-[9px] text-red-200 text-left font-mono leading-relaxed">
                          <span className="font-bold text-white block mb-0.5">Arctic Output Status:</span>
                          At {santaMarshmallows} marshmallows, elf happiness coefficients hit <span className="text-green-400 font-bold">{(santaMarshmallows * 0.45).toFixed(0)}%</span>. Assembly speed targets 45 units/minute.
                        </div>
                      </div>

                      {/* Strike negotiation */}
                      <div className="bg-[#170808] border border-[#5E1E1E] p-3 rounded-md flex items-center justify-between text-xs">
                        <div>
                          <span className="font-serif text-[10px] italic text-red-300 block">Gingerbread Break Accord</span>
                          <span className="text-[9px] text-slate-455 block truncate max-w-[150px]">{santaNegotiationStatus}</span>
                        </div>
                        <button
                          onClick={() => {
                            setIsSantaNegotiating(true);
                            setTimeout(() => {
                              setSantaNegotiationStatus("Cocoa extended + Christmas bonuses approved!");
                              setIsSantaNegotiating(false);
                              playVibrateBeep();
                            }, 500);
                          }}
                          className="bg-red-700 hover:bg-red-650 text-white font-bold p-1 px-3 text-[8px] rounded-[3px] uppercase cursor-pointer"
                        >
                          {isSantaNegotiating ? "Signing..." : "Ratify Accord"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* APP: Naughty Santa comedic parody */}
                  {appCreatorId === "naughtysanta" && (
                    <div className="space-y-3 flex flex-col justify-stretch flex-1">
                      {/* Reindeer Union Contract */}
                      <div className="bg-[#0E0B0B] border border-[#4A2020] p-3 rounded-md text-center">
                        <span className="font-serif text-[10px] italic text-rose-500 block mb-1">Sarcastic Reindeer Union Contract</span>
                        <p className="text-[9px] text-slate-455 mb-3 leading-tight">Prank Rudolph's demands for fully heated stalls and dental care plans.</p>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[9px] font-mono">
                            <span className="text-rose-300">Dental Deductible Offer:</span>
                            <span className="text-white font-bold">${matureNegotiationOffer} per antler</span>
                          </div>
                          <input 
                            type="range" 
                            min="2" 
                            max="100" 
                            value={matureNegotiationOffer} 
                            onChange={(e) => setMatureNegotiationOffer(Number(e.target.value))} 
                            className="w-full accent-rose-500 h-1"
                          />
                        </div>

                        <div className="mt-3 p-2 bg-black border border-[#4A2020] text-[9px] text-rose-200 text-left leading-normal italic">
                          "Deductible too high! Rudolph started eating wrapping papers in protest. Strike starts December 15th."
                        </div>
                      </div>

                      {/* Action trigger outcome */}
                      <button
                        onClick={() => {
                          const list = [
                            "Diva Rudolph refuses to navigate through fog without dental!",
                            "Fire Rudolph and mount a high-intensity lighthouse lamp!",
                            "Prank reindeer by replacing moss with organic celery sticks!"
                          ];
                          setMatureNegotiationOutcome(list[Math.floor(Math.random() * list.length)]);
                          playVibrateBeep();
                        }}
                        className={`w-full py-1.5 px-3 rounded-[3px] uppercase tracking-widest text-[8px] font-mono cursor-pointer ${buttonBg}`}
                      >
                        Roll Satirical Outcome
                      </button>

                      {matureNegotiationOutcome && (
                        <div className="p-2 bg-black border border-rose-500/30 text-[9px] text-slate-350 rounded-sm animate-fade-in leading-relaxed font-mono">
                          <span className="text-[8px] uppercase text-rose-500 block font-bold mb-0.5">Parody Accord Detail:</span>
                          "{matureNegotiationOutcome}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* APP: Charlemagne tha God Donkey Audit */}
                  {appCreatorId === "charlemagne" && (
                    <div className="space-y-3 flex flex-col justify-stretch flex-1">
                      {/* donkey questionnaire */}
                      <div className="bg-[#0E0D0B] border border-[#3F3926] p-3 rounded-md">
                        <span className="font-serif text-[10px] italic text-yellow-500 block mb-1">Donkey Audit Questionnaire</span>
                        <p className="text-[9px] text-slate-455 leading-tight mb-2">Think of a decision context (e.g. 'Posting fake synthetic AI quotes') and audit its wisdom score.</p>
                        
                        <div className="flex gap-1.5">
                          <input 
                            type="text" 
                            placeholder="e.g. Copying competitors layout without testing" 
                            value={auditInputIdea}
                            onChange={(e) => setAuditInputIdea(e.target.value)}
                            className="bg-black border border-[#3F3926] text-[10px] text-white p-1 px-2 flex-1 rounded-[3px] focus:outline-none focus:border-yellow-500"
                          />
                          <button
                            onClick={() => {
                              if (!auditInputIdea) return;
                              const text = auditInputIdea.toLowerCase();
                              let outcome = {
                                title: "Shortcut-Seeking Delusion",
                                score: "DONKEY OF THE WEEK",
                                verdict: "You are avoiding direct user declaration lines. Refusing the active labor is yesterday's playbook."
                              };

                              if (text.includes("direct") || text.includes("phone") || text.includes("own") || text.includes("wisdom")) {
                                outcome = {
                                  title: "Sovereign Distribution",
                                  score: "SAFE COMPETENCE",
                                  verdict: "Exceptional stance. Owning your access pipeline bypasses central filters successfully."
                                };
                              } else if (text.includes("ai") || text.includes("bot") || text.includes("template")) {
                                outcome = {
                                  title: "Synthetic Spam Delusion",
                                  score: "DONKEY OF THE DAY",
                                  verdict: "Flooding streams with generic templates will destroy your platform trust instantly. Wake up!"
                                };
                              }

                              setAuditResult(outcome);
                              playVibrateBeep();
                            }}
                            className="p-1 px-3 bg-yellow-500 text-black font-extrabold text-[8px] rounded-[3px] uppercase cursor-pointer"
                          >
                            Audit
                          </button>
                        </div>
                      </div>

                      {/* Audit outcome display */}
                      {auditResult && (
                        <div className="bg-[#0E0D0B] border border-[#3F3926] p-3 rounded-md text-[10px] space-y-1 text-slate-350 animate-fade-in font-mono">
                          <div className="flex justify-between items-center text-[8px] border-b border-[#3F3926]/40 pb-1.5 mb-1.5">
                            <span className="text-yellow-500 font-bold block uppercase tracking-wide">Audit Classification:</span>
                            <span className="bg-red-955 text-red-200 border border-red-800 font-bold font-mono text-[9px] px-1 rounded-sm uppercase">
                              {auditResult.score}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-555 block leading-none mb-0.5">Case Context:</span>
                            <span className="text-white font-serif italic text-xs leading-none">"{auditResult.title}"</span>
                          </div>
                          <div className="pt-1.5">
                            <span className="text-slate-555 block leading-none mb-0.5">Breakfast Club Verdict:</span>
                            <p className="text-[10.5px] text-slate-350 italic leading-relaxed">"{auditResult.verdict}"</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* BOTTOM REFRESHER ACCENTS */}
                  <div className="mt-auto pt-3 border-t border-white/5 flex justify-between items-center text-[8px] px-1 text-slate-500 font-mono">
                    <span>Active App Channel: v1.0.4</span>
                    <span>Sandbox Connected</span>
                  </div>

                </div>
              </div>
            );
          })()}

        </div>

        {/* Home Indicator Button Container for enlarged clickable touch target */}
        <div 
          onClick={() => {
            stopMobileAudio();
            setNavState("app_drawer");
          }} 
          className="w-full py-2.5 cursor-pointer z-50 flex justify-center mt-auto hover:opacity-90 active:scale-98 transition-all"
          title="Return to Home Launcher Screen"
        >
          <div className="w-32 h-1 bg-white/20 rounded-full hover:bg-[#C19A6B]/50 transition-colors"></div>
        </div>
      </div>
    </div>
  );
}
