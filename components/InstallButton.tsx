'use client';

import { useEffect, useState } from 'react';

export function InstallButton() {
  const [prompt, setPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    // Already installed -- hide the button
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSHint(h => !h)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[var(--ink-3)] hover:text-[var(--ink)] rounded-lg hover:bg-[var(--bg-3)] transition"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 2v10m0-10l-3 3m3-3l3 3M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" />
          </svg>
          Install
        </button>
        {showIOSHint && (
          <div className="absolute top-16 right-4 z-50 bg-[var(--ink)] text-white text-xs rounded-xl px-4 py-3 shadow-xl max-w-[220px] leading-relaxed">
            Tap the <strong>Share</strong> button in Safari, then <strong>Add to Home Screen</strong>.
            <div className="absolute -top-1.5 right-8 w-3 h-3 bg-[var(--ink)] rotate-45" />
          </div>
        )}
      </>
    );
  }

  if (!prompt) return null;

  return (
    <button
      onClick={async () => {
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') setPrompt(null);
      }}
      className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[var(--ink-3)] hover:text-[var(--ink)] rounded-lg hover:bg-[var(--bg-3)] transition"
    >
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 2v10m0-10l-3 3m3-3l3 3M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" />
      </svg>
      Install app
    </button>
  );
}
