'use client';

import { useEffect, useRef, useState } from 'react';

const CHECK_INTERVAL = 60_000;

export function VersionChecker() {
  const [stale, setStale] = useState(false);
  const initialVersion = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkVersion() {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;
        if (initialVersion.current === null) {
          initialVersion.current = data.version;
        } else if (data.version !== initialVersion.current) {
          setStale(true);
        }
      } catch {}
    }

    checkVersion();
    const interval = setInterval(checkVersion, CHECK_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!stale) return null;

  return (
    <button
      onClick={() => window.location.reload()}
      className="fixed top-0 inset-x-0 z-[100] bg-[var(--ink)] text-[var(--amber)] text-sm font-semibold py-2.5 px-4 text-center hover:opacity-90 transition"
    >
      Manuscript Studio has been updated. Tap to refresh.
    </button>
  );
}
