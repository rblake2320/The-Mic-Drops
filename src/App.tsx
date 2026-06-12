import { useEffect, useState } from "react";
import CreatorStudio from "./components/CreatorStudio";
import MobileSimulator from "./components/MobileSimulator";
import InvestorSandbox from "./components/InvestorSandbox";
import DemoExperience from "./pages/DemoExperience";
import { DEFAULT_DROPS } from "./data";
import { Drop } from "./types";

type Route = "consumer" | "creator" | "investor" | "demo";

function routeFromPath(pathname: string): Route {
  if (pathname.startsWith("/creator")) return "creator";
  if (pathname.startsWith("/investor")) return "investor";
  if (pathname.startsWith("/demo")) return "demo";
  return "consumer";
}

function navigate(path: string, setRoute: (r: Route) => void) {
  window.history.pushState({}, "", path);
  setRoute(routeFromPath(path));
}

/** Slim shell for the production surfaces (demo route keeps its own chrome). */
function Shell({
  route,
  setRoute,
  children,
}: {
  route: Route;
  setRoute: (r: Route) => void;
  children: React.ReactNode;
}) {
  const links: Array<{ path: string; label: string; key: Route }> = [
    { path: "/", label: "MIC Feed", key: "consumer" },
    { path: "/creator", label: "Creator Studio", key: "creator" },
    { path: "/investor", label: "Investors", key: "investor" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-sans text-[#E5E5E5] antialiased flex flex-col">
      <header className="bg-[#0F0F0F] border-b border-white/10 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex flex-wrap justify-between items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate("/", setRoute)}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-8 h-8 border-2 border-[#C19A6B] flex items-center justify-center font-serif italic text-lg text-[#C19A6B] bg-[#C19A6B]/5 shrink-0">
              M
            </div>
            <span className="hidden sm:inline font-serif italic text-base tracking-tight text-[#E5E5E5]">
              the mic drops
            </span>
          </button>
          <nav className="flex bg-[#0A0A0A] p-1 rounded-sm border border-white/10">
            {links.map((l) => (
              <button
                key={l.key}
                onClick={() => navigate(l.path, setRoute)}
                className={`px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-[11px] uppercase tracking-wider sm:tracking-widest font-mono transition-all cursor-pointer ${
                  route === l.key
                    ? "bg-[#C19A6B] text-black font-bold"
                    : "text-slate-400 hover:text-[#E5E5E5]"
                }`}
              >
                {l.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main
        className={`flex-1 max-w-7xl w-full mx-auto flex flex-col ${
          route === "consumer" ? "p-0 sm:p-4" : "p-3 sm:p-4"
        }`}
      >
        {children}
      </main>
      <footer
        className={`bg-[#0D0D0D] border-t border-white/10 py-2.5 text-center text-[#94A3B8] text-[11px] font-mono ${
          route === "consumer" ? "hidden sm:block" : ""
        }`}
      >
        Micro Ingestion Channels — direct creator-to-subscriber delivery
        <button
          onClick={() => navigate("/demo", setRoute)}
          className="ml-3 text-[#C19A6B]/70 hover:text-[#C19A6B] underline underline-offset-2 cursor-pointer"
        >
          interactive demo
        </button>
      </footer>
    </div>
  );
}

/** Consumer surface: the MIC Feed.
 *  Phone (<640px): full-bleed app filling the viewport below the header.
 *  Web (≥640px): framed phone presentation, centered. */
function ConsumerView() {
  const [feed, setFeed] = useState<Drop[]>(DEFAULT_DROPS);
  return (
    <div className="flex-1 flex items-start justify-center w-full sm:items-center [&>div]:w-full sm:[&>div]:p-0 [&_#phone-frame]:h-[calc(100dvh-54px)] sm:[&_#phone-frame]:h-[min(720px,calc(100dvh-140px))]">
      <MobileSimulator
        activeFeed={feed}
        onAddNewDrop={(d) => setFeed((prev) => [d, ...prev])}
        lastPublishedDrop={null}
      />
    </div>
  );
}

/** Creator surface: the studio dashboard on its own. */
function CreatorView() {
  const [recentDrops, setRecentDrops] = useState<Drop[]>([]);
  return (
    <div className="flex flex-col gap-4">
      <div className="h-[750px]">
        <CreatorStudio
          onPublishDrop={(d) => setRecentDrops((prev) => [d, ...prev])}
          activeFeed={[...recentDrops, ...DEFAULT_DROPS]}
        />
      </div>
      {recentDrops.length > 0 && (
        <div className="bg-[#0F0F0F] border border-white/10 p-4">
          <h3 className="text-xs uppercase tracking-widest font-mono text-[#C19A6B] mb-2">
            Published this session
          </h3>
          <ul className="space-y-1.5 text-sm text-slate-300">
            {recentDrops.map((d) => (
              <li key={d.id} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#C19A6B] rounded-full shrink-0" />
                <span className="font-semibold">{d.title}</span>
                <span className="text-slate-500 text-xs">· {d.category}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Investor surface: financial sandbox on its own. */
function InvestorView() {
  return (
    <div className="flex flex-col">
      <InvestorSandbox />
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => routeFromPath(window.location.pathname));

  useEffect(() => {
    const onPop = () => setRoute(routeFromPath(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Demo keeps its original full-page chrome (header/tabs/footer)
  if (route === "demo") return <DemoExperience />;

  return (
    <Shell route={route} setRoute={setRoute}>
      {route === "consumer" && <ConsumerView />}
      {route === "creator" && <CreatorView />}
      {route === "investor" && <InvestorView />}
    </Shell>
  );
}
