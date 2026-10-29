'use client';
import { useEffect, useState } from 'react';
import { STORE_UA_MARKER, STORE_COOKIE } from './storeBuildShared';

// Store build mode. True inside the native Capacitor shell (Google Play and
// App Store builds). In store mode the UI shows no purchase, upgrade, pricing,
// or Stripe links. Sign-in stays, so plans bought on the web still apply.
// NEXT_PUBLIC_STORE_BUILD=1 forces store mode for local testing.
export function detectStoreBuild(): boolean {
  if (typeof window === 'undefined') return false;
  if (process.env.NEXT_PUBLIC_STORE_BUILD === '1') return true;
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  if (w.Capacitor?.isNativePlatform?.()) return true;
  if (navigator.userAgent.includes(STORE_UA_MARKER)) return true;
  return document.cookie.split('; ').some((c) => c === `${STORE_COOKIE}=1`);
}

export function useStoreBuild(): boolean {
  const [store, setStore] = useState(false);
  useEffect(() => {
    setStore(detectStoreBuild());
  }, []);
  return store;
}
