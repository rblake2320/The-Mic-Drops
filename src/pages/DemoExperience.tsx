import { useEffect, useRef, useState } from "react";
import CreatorStudio from "../components/CreatorStudio";
import MobileSimulator from "../components/MobileSimulator";
import InvestorSandbox from "../components/InvestorSandbox";
import { DEFAULT_DROPS } from "../data";
import { Drop } from "../types";
import {
  Radio, Cpu, Users, Building, AlertCircle, FileText,
  HelpCircle, Sparkles, TrendingUp, Presentation, HeartPulse
} from "lucide-react";

// Fixed design canvas for the side-by-side showcase. The canvas is scaled
// uniformly (slide-deck style) so BOTH panels always fit the browser window.
const CANVAS_W = 1280;
const CANVAS_H = 766;

function useFitScale(remeasureKey: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ scale: 1, fitMode: true });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      // Below ~900px wide, fall back to the stacked responsive layout
      if (r.width < 900) {
        setState({ scale: 1, fitMode: false });
        return;
      }
      setState({
        scale: Math.min(r.width / CANVAS_W, r.height / CANVAS_H, 1),
        fitMode: true,
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [remeasureKey]);

  return { ref, ...state };
}

export default function DemoExperience() {
  const [activeTab, setActiveTab] = useState<"showcase" | "pitch">("showcase");
  const [dropsFeed, setDropsFeed] = useState<Drop[]>(DEFAULT_DROPS);
  const [lastPublishedDrop, setLastPublishedDrop] = useState<Drop | null>(null);
  const { ref: fitRef, scale, fitMode } = useFitScale(activeTab);

  // Callback: when creator publishes a new drop from Left Pane
  const handlePublishDrop = (newDrop: Drop) => {
    setDropsFeed(prev => [newDrop, ...prev]);
    setLastPublishedDrop(newDrop);
    // Auto-clear last drop state to allow repeated notifications triggers
    setTimeout(() => {
      setLastPublishedDrop(null);
    }, 150);
  };

  const fitToWindow = activeTab === "showcase" && fitMode;

  return (
    <div
      className={`bg-[#0A0A0A] font-sans text-[#E5E5E5] antialiased flex flex-col ${
        fitToWindow ? "h-dvh overflow-hidden" : "min-h-screen"
      }`}
    >
      
      {/* Premium Navigation Header Bar */}
      <header className="bg-[#0F0F0F] border-b border-white/10 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-3">
          
          {/* Logo Branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 border-2 border-[#C19A6B] flex items-center justify-center font-serif italic text-xl text-[#C19A6B] bg-[#C19A6B]/5 shrink-0 transition-transform hover:scale-105">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif italic text-base tracking-tight text-[#E5E5E5]">the mic drops</span>
                <span className="text-[9px] uppercase font-mono tracking-widest bg-[#C19A6B]/10 text-[#C19A6B] border border-[#C19A6B]/20 px-2 py-0.5 rounded-sm">
                  micro ingestion channels
                </span>
              </div>
              <p className="text-[10px] text-[#C19A6B]/80 font-mono tracking-tight">Evolutionary Milestone 04 — Sophisticated Completion State</p>
            </div>
          </div>

          {/* Tab Selection Switches */}
          <div className="flex bg-[#0A0A0A] p-1 rounded-sm border border-white/10">
            <button
              onClick={() => setActiveTab("showcase")}
              className={`px-4 py-2 text-xs uppercase tracking-widest font-mono transition-all cursor-pointer ${
                activeTab === "showcase"
                  ? "bg-[#C19A6B] text-black font-bold"
                  : "text-slate-400 hover:text-[#E5E5E5]"
              }`}
            >
              Interactive Loop
            </button>
            <button
              onClick={() => setActiveTab("pitch")}
              className={`px-4 py-2 text-xs uppercase tracking-widest font-mono transition-all cursor-pointer ${
                activeTab === "pitch"
                  ? "bg-[#C19A6B] text-black font-bold"
                  : "text-slate-400 hover:text-[#E5E5E5]"
              }`}
            >
              Investor Sandbox
            </button>
          </div>

        </div>
      </header>

      {/* Main Boardroom Workspace */}
      <main
        className={`flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col justify-stretch ${
          fitToWindow ? "min-h-0 overflow-hidden" : ""
        }`}
      >
        {/* Showcase tab: side-by-side Creator publishing & Mobile simulator.
            Desktop: fixed design canvas scaled uniformly to fit the window
            (slide-deck style) so both panels are always fully visible.
            Narrow windows: original stacked responsive layout. */}
        {activeTab === "showcase" && (
          <div
            ref={fitRef}
            className={
              fitMode
                ? "flex-1 min-h-0 flex items-center justify-center overflow-hidden animate-fade-in"
                : "animate-fade-in"
            }
          >
            {fitMode ? (
              <div
                style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})` }}
                className="shrink-0 grid grid-cols-12 gap-6 items-stretch [&_#phone-frame]:w-[370px]! [&_#phone-frame]:h-[720px]! [&_#phone-frame]:aspect-auto!"
              >
                <div className="col-span-7 flex flex-col h-[750px]">
                  <CreatorStudio onPublishDrop={handlePublishDrop} activeFeed={dropsFeed} />
                </div>
                <div className="col-span-5 flex flex-col h-[750px] justify-center">
                  <MobileSimulator
                    activeFeed={dropsFeed}
                    onAddNewDrop={handlePublishDrop}
                    lastPublishedDrop={lastPublishedDrop}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-stretch">
                <div className="lg:col-span-7 flex flex-col h-[750px]">
                  <CreatorStudio onPublishDrop={handlePublishDrop} activeFeed={dropsFeed} />
                </div>
                <div className="lg:col-span-5 flex flex-col h-[750px] justify-center">
                  <MobileSimulator
                    activeFeed={dropsFeed}
                    onAddNewDrop={handlePublishDrop}
                    lastPublishedDrop={lastPublishedDrop}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pitch tab: Interactive Financial Speculative Opex Sandbox */}
        {activeTab === "pitch" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-stretch animate-fade-in">
            
            {/* Detailed Explanatory Column / Investor Slide (Takes 4/12 cols) */}
            <div className="lg:col-span-4 bg-[#0F0F0F] border border-white/10 p-6 flex flex-col text-slate-300 overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <Presentation className="text-[#C19A6B] w-5 h-5" />
                <h3 className="font-serif italic text-lg text-[#E5E5E5]">The Business Opportunity</h3>
              </div>

              <div className="space-y-4 text-xs leading-relaxed">
                <div>
                  <h4 className="font-serif italic text-sm text-[#C19A6B] mb-1.5">What makes this ownable?</h4>
                  <p>
                    Today's creators (MrBeast, Gary V, EYL, James) communicate through algorithms that decide who receives their message. If you have 490M subscribers, you still pay YouTube and TikTok to deliver your insights. 
                  </p>
                  <p className="mt-1.5">
                    <strong>The MIC Drops</strong> (Micro Ingestion Channels) implements a direct pipeline back to the atomic source. Standard quotes expand into stories, optionally voiced with synthesized vocals, and anchored straight to the original timestamp of the YouTube, Podcast or Netflix source.
                  </p>
                </div>

                <div className="border-t border-white/10 pt-3">
                  <h4 className="font-serif italic text-sm text-[#C19A6B] mb-1">Interactive Sliders Engine</h4>
                  <p>
                    Use our model to toggle parameters. Notice how our CPM pricing is based on <strong>deterministic, customer-declared interest</strong>, rather than standard tracking surveillance cookies. It is estimated to draw 2x to 3x higher CPM because of high intent.
                  </p>
                </div>

                <div className="border-t border-white/10 pt-3 space-y-2">
                  <div className="flex items-start gap-2.5 bg-[#0A0A0A] p-3 border border-white/5 text-[11px] text-slate-400">
                    <HeartPulse className="w-4 h-4 text-[#C19A6B] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-200 block">Family & Seasonal SaaS</span>
                      Character accounts like Santa Claus, the Easter Bunny, or the Tooth Fairy have <strong>near-zero royalty expense</strong>. Families pay $4.99–$19.99/mo direct. This drives predictive high-margin ARR.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-[#0A0A0A] p-3 border border-white/5 text-[11px] text-slate-400">
                    <Users className="w-4 h-4 text-[#C19A6B] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-200 block">Investor Pitfalls Flagged</span>
                      App Store guidelines ban explicit user content. Hence, our <strong>Parody Naughty Switch</strong> lives as a web application bypass, while mobile remains family-safe.
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto bg-black p-3 border border-white/10 text-[10px] text-slate-500 font-mono text-center">
                Medians sourced via SaaS Platform Benchmarks 2026.
              </div>
            </div>

            {/* Speculative Interactive Sandbox Widget (Takes 8/12 cols) */}
            <div className="lg:col-span-8 flex flex-col">
              <InvestorSandbox />
            </div>

          </div>
        )}

      </main>

      {/* Global Bottom Status Bar */}
      <footer className="bg-[#0D0D0D] border-t border-white/10 py-3.5 text-center text-[#94A3B8] text-xs mt-auto font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span className="tracking-wide">Sovereign Intake System • Bypassing Algorithmic Gates v1.4 • Build: 2026.Alpha_to_Omega</span>
          <div className="flex items-center gap-3">
            <span className="text-[#C19A6B] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C19A6B] animate-pulse"></span>
              Secure Sandbox Ingress Port 3000
            </span>
            <span className="text-slate-400">Evolutionary Development Protocol All Rights Reserved</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
