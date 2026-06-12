@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
  --font-display: "Space Grotesk", sans-serif;
  --font-serif: "Cormorant Garamond", Georgia, serif;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Custom scrollbar adjustments for Sophisticated Dark design */
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
::-webkit-scrollbar-track {
  background: #0A0A0A;
}
::-webkit-scrollbar-thumb {
  background: #1F1F1F;
  border-radius: 99px;
  border: 1px solid #141414;
}
::-webkit-scrollbar-thumb:hover {
  background: #C19A6B;
}
