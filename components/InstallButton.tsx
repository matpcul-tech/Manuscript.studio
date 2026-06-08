'use client';

import { useEffect, useState } from 'react';

type Platform = 'ios' | 'android' | 'desktop' | null;

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline w-5 h-5 align-text-bottom mx-0.5">
      <path d="M12 2v13M8 6l4-4 4 4M20 16v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3" />
    </svg>
  );
}

function PlusBoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline w-5 h-5 align-text-bottom mx-0.5">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline w-5 h-5 align-text-bottom mx-0.5">
      <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function InstallButton() {
  const [prompt, setPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<Platform>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;

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

  if (platform === null) return null;

  const handleClick = async () => {
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') setPrompt(null);
    } else {
      setOpen(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[var(--ink-3)] hover:text-[var(--ink)] rounded-lg hover:bg-[var(--bg-3)] transition"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0">
          <path d="M10 2v10m0-10L7 5m3-3l3 3M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" />
        </svg>
        Install app
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-[var(--shadow-xl)] w-full max-w-sm p-7"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-3)] text-[var(--ink-4)] hover:text-[var(--ink)] transition"
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                <line x1="4" y1="4" x2="16" y2="16" /><line x1="16" y1="4" x2="4" y2="16" />
              </svg>
            </button>

            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--blue)] to-[var(--blue-deep)] grid place-items-center mb-5 shadow-[0_4px_12px_rgba(79,109,245,0.4)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M12 2v13M8 6l4-4 4 4M20 16v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3" />
              </svg>
            </div>

            <h2 className="font-display text-xl font-bold mb-1">Install Manuscript Studio</h2>
            <p className="text-sm text-[var(--ink-3)] mb-6">Add to your home screen for quick access. Works like a native app.</p>

            {platform === 'ios' && (
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[var(--blue)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                    Tap the <strong>Share</strong> button <ShareIcon /> at the bottom of Safari
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[var(--blue)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                    Scroll down and tap <strong>Add to Home Screen</strong> <PlusBoxIcon />
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[var(--blue)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                    Tap <strong>Add</strong> in the top right corner
                  </p>
                </li>
              </ol>
            )}

            {platform === 'android' && (
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[var(--blue)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                    Tap the menu <MenuIcon /> in the top right of Chrome
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[var(--blue)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                    Tap <strong>Add to Home screen</strong>
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[var(--blue)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                    Tap <strong>Add</strong> to confirm
                  </p>
                </li>
              </ol>
            )}

            {platform === 'desktop' && (
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[var(--blue)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                    In Chrome or Edge, look for the <strong>install icon</strong> in the address bar (a monitor with a down arrow)
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[var(--blue)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                    Click it, then click <strong>Install</strong>
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[var(--blue)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                    The app opens in its own window and appears in your taskbar or dock
                  </p>
                </li>
              </ol>
            )}

            <p className="text-xs text-[var(--ink-4)] mt-6">
              {platform === 'ios' ? 'Requires Safari on iPhone or iPad.' : platform === 'android' ? 'Requires Chrome on Android.' : 'Requires Chrome or Edge.'}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
