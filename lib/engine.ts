// Client-side engine helper. Calls our /api/engine proxy.
// The Anthropic key never leaves the server.

export type EngineOpts = {
  task: string;
  userPrompt: string;
  voiceSample?: string;
  voiceProfile?: string;
  voiceNotes?: string;
  systemOverride?: string;
  maxTokens?: number;
};

export async function callEngine(opts: EngineOpts): Promise<string> {
  const r = await fetch('/api/engine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Engine call failed');
  }
  const data = await r.json();
  return data.text;
}

export function autoScrub(text: string): string {
  return text
    .replace(/—/g, ', ')
    .replace(/ – /g, ', ')
    .replace(/–/g, '-');
}

export const TELL_PATTERNS: { p: RegExp; r: string; label: string }[] = [
  { p: /—/g, r: ', ', label: 'em dash' },
  { p: / – /g, r: ', ', label: 'en dash' },
  { p: /\bIt(?:'s| is) (?:important|worth noting|crucial|essential) (?:to note )?that\b/gi, r: '', label: '"important to note"' },
  { p: /\bIn conclusion,?\s*/gi, r: '', label: '"in conclusion"' },
  { p: /\bUltimately,\s*/gi, r: '', label: '"ultimately,"' },
  { p: /\bIndeed,\s*/gi, r: '', label: '"indeed,"' },
  { p: /\bMoreover,\s*/gi, r: '', label: '"moreover,"' },
  { p: /\bFurthermore,\s*/gi, r: '', label: '"furthermore,"' },
  { p: /\bAdditionally,\s*/gi, r: '', label: '"additionally,"' },
  { p: /\bAt its core,?\s*/gi, r: '', label: '"at its core"' },
  { p: /\bIn a world where\b/gi, r: 'Where', label: '"in a world where"' },
  { p: /\btapestry\b/gi, r: 'mix', label: '"tapestry"' },
  { p: /\bdelve into\b/gi, r: 'look at', label: '"delve into"' },
  { p: /\bnavigate the\b/gi, r: 'work through the', label: '"navigate the"' },
  { p: /\bever-evolving\b/gi, r: 'changing', label: '"ever-evolving"' },
  { p: /\bstands as a testament\b/gi, r: 'shows', label: '"testament"' },
  { p: /\bthe realm of\b/gi, r: '', label: '"the realm of"' },
  { p: /\bunlock\b/gi, r: 'open', label: '"unlock"' },
  { p: /\bunleash\b/gi, r: 'release', label: '"unleash"' },
  { p: /\brobust\b/gi, r: 'solid', label: '"robust"' },
  { p: /\bseamless\b/gi, r: 'smooth', label: '"seamless"' },
  { p: /\belevate\b/gi, r: 'raise', label: '"elevate"' },
  { p: /\bnot just ([^,.;!?]+?),? but\b/gi, r: 'not only $1 but', label: '"not just X but Y"' },
  { p: /\bthis isn't just\b/gi, r: 'this is', label: '"this isn\'t just"' },
  { p: /\bmore than ever before\b/gi, r: '', label: '"more than ever before"' },
];

export function scrubText(text: string): string {
  let t = text;
  TELL_PATTERNS.forEach(tp => { t = t.replace(tp.p, tp.r); });
  return t.replace(/  +/g, ' ').replace(/^\s*,\s*/gm, '').replace(/\.\s*,/g, '.');
}

export function countWords(s: string): number {
  if (!s) return 0;
  return (s.trim().match(/\S+/g) || []).length;
}
