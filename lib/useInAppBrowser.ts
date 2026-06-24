'use client';
import { useEffect, useState } from 'react';

// Detects Facebook, Instagram, TikTok, and WeChat in-app browsers where
// Google OAuth redirect flows are commonly blocked.
export function useInAppBrowser(): boolean {
  const [detected, setDetected] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent;
    if (/FBAN|FBAV|Instagram|musical_ly|TikTok|BytedanceWebview|MicroMessenger/i.test(ua)) {
      setDetected(true);
    }
  }, []);
  return detected;
}
