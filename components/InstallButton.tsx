'use client';

import { useEffect, useState } from 'react';

type Platform = 'ios' | 'android' | 'desktop' | null;

export function InstallButton() {
  const [prompt, setPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<Platform>(null);
  const [showHint, setShowHint] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream;
    const android = /android/i.test(ua);
    setPlatform(ios ? 'ios' : android ? 'android' : 'desktop');

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (installed || platform === null) return null;

  // Chrome / Edge on Android or desktop -- show native prompt when available,
  // otherwise fall back to the hint tooltip.
  if (platform === 'android' || platform === 'desktop') {
    if (prompt) {
      return (
        <button
          onClick={async () => {
            prompt.prompt();
            const { outcome } = await prompt.userChoice;
            if (outcome === 'accepted') setPrompt(null);
          }}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[var(--ink-3)] hover:text-[var(--ink)] rounded-lg hover:bg-[var(--bg-3)] transition"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0">
            <path d="M10 2v10m0-10L7 5m3-3l3 3M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" />
          </svg>
          Install app
        </button>
      );
    }
    // Prompt not ready yet -- show instructions tooltip
    return (
      <div className="relative">
        <button
          onClick={() => setShowHint(h => !h)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[var(--ink-3)] hover:text-[var(--ink)] rounded-lg hover:bg-[var(--bg-3)] transition"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0">
            <path d="M10 2v10m0-10L7 5m3-3l3 3M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" />
          </svg>
          Install app
        </button>
        {showHint && (
          <div className="absolute top-12 right-0 z-50 bg-[var(--ink)] text-white text-xs rounded-xl px-4 py-3 shadow-xl w-64 leading-relaxed">
            <p className="font-semibold mb-1">Install on {platform === 'desktop' ? 'desktop' : 'Android'}</p>
            <p className="text-white/70">In Chrome or Edge, open the browser menu and tap <strong className="text-white">Install app</strong> or <strong className="text-white">Add to Home screen</strong>.</p>
            <div className="absolute -top-1.5 right-6 w-3 h-3 bg-[var(--ink)] rotate-45" />
          </div>
        )}
      </div>
    );
  }

  // iOS Safari
  return (
    <div className="relative">
      <button
        onClick={() => setShowHint(h => !h)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[var(--ink-3)] hover:text-[var(--ink)] rounded-lg hover:bg-[var(--bg-3)] transition"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0">
          <path d="M10 2v10m0-10L7 5m3-3l3 3M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" />
        </svg>
        Install app
      </button>
      {showHint && (
        <div className="absolute top-12 right-0 z-50 bg-[var(--ink)] text-white text-xs rounded-xl px-4 py-3 shadow-xl w-64 leading-relaxed">
          <p className="font-semibold mb-1">Add to Home Screen</p>
          <p className="text-white/70">Tap the <strong className="text-white">Share</strong> button at the bottom of Safari, then tap <strong className="text-white">Add to Home Screen</strong>.</p>
          <div className="absolute -top-1.5 right-6 w-3 h-3 bg-[var(--ink)] rotate-45" />
        </div>
      )}
    </div>
  );
}
