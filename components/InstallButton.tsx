'use client';

import { useEffect, useRef, useState } from 'react';

type Platform = 'ios' | 'android' | null;

export function InstallButton() {
  const [prompt, setPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<Platform>(null);
  const [showTip, setShowTip] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream;
    const android = /android/i.test(ua);
    if (!ios && !android) return;
    setPlatform(ios ? 'ios' : 'android');

    const handler = (e: Event) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (!showTip) return;
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowTip(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [showTip]);

  if (!platform) return null;

  async function handleClick() {
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') setPrompt(null);
    } else {
      setShowTip(t => !t);
    }
  }

  const tip = platform === 'ios'
    ? 'Tap Share then "Add to Home Screen"'
    : 'Tap ⋮ then "Add to Home Screen"';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[var(--blue)] hover:text-[var(--blue-deep)] rounded-lg hover:bg-[var(--blue-soft)] transition"
        aria-label="Install app"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M10 2v10m0-10L7 5m3-3l3 3M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" />
        </svg>
        Install
      </button>
      {showTip && (
        <div className="absolute left-0 top-full mt-2 z-50 bg-[var(--ink)] text-white text-xs rounded-xl px-3 py-2.5 shadow-xl whitespace-nowrap">
          {tip}
          <div className="absolute -top-1 left-5 w-2 h-2 bg-[var(--ink)] rotate-45" />
        </div>
      )}
    </div>
  );
}
