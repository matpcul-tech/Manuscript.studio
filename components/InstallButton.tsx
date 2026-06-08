'use client';

import { useEffect, useState } from 'react';

type Platform = 'ios' | 'other' | null;

export function InstallButton() {
  const [prompt, setPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<Platform>(null);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setPlatform(ios ? 'ios' : 'other');

    const handler = (e: Event) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (platform === 'ios') {
    return (
      <span className="hidden sm:block text-xs text-[var(--ink-4)] px-2">
        Tap <strong className="text-[var(--ink-3)]">Share</strong> then <strong className="text-[var(--ink-3)]">Add to Home Screen</strong>
      </span>
    );
  }

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
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M10 2v10m0-10L7 5m3-3l3 3M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" />
        </svg>
        Install app
      </button>
    );
  }

  return null;
}
