// Shared between middleware, API routes, and client code.
// The native shell appends this token to the WebView user agent
// (see capacitor.config.ts appendUserAgent).
export const STORE_UA_MARKER = 'ManuscriptStudioApp';
export const STORE_COOKIE = 'ms_store_build';

export function isStoreRequest(userAgent: string | null, cookieValue?: string): boolean {
  if (process.env.STORE_BUILD === '1' || process.env.NEXT_PUBLIC_STORE_BUILD === '1') return true;
  if (userAgent && userAgent.includes(STORE_UA_MARKER)) return true;
  return cookieValue === '1';
}
