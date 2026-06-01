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

export async function callEngine(opts: EngineOpts & { timeoutMs?: number }): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 120000);
  try {
    const r = await fetch('/api/engine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts),
      signal: controller.signal,
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Engine call failed');
    }
    const data = await r.json();
    return data.text;
  } catch (e: any) {
    if (e.name === 'AbortError') {
      throw new Error('This call took too long. Try again.');
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
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

export type AIScore = {
  density: number;
  totalTells: number;
  totalWords: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  risk: string;
  color: string;
  byPattern: { label: string; count: number }[];
};

export function computeAIScore(text: string): AIScore {
  const totalWords = countWords(text);
  const byPattern: { label: string; count: number }[] = [];
  let totalTells = 0;
  TELL_PATTERNS.forEach(tp => {
    const m = text.match(tp.p);
    if (m && m.length) {
      byPattern.push({ label: tp.label, count: m.length });
      totalTells += m.length;
    }
  });
  const density = totalWords === 0 ? 0 : (totalTells / totalWords) * 1000;
  let grade: AIScore['grade'];
  let risk: string;
  let color: string;
  if (density < 0.5) {
    grade = 'A';
    risk = 'No discernible AI fingerprint';
    color = '#10b981';
  } else if (density < 1.5) {
    grade = 'B';
    risk = 'Clean. Occasional pattern.';
    color = '#10b981';
  } else if (density < 3.0) {
    grade = 'C';
    risk = 'Noticeable. Recommend scrub before publish.';
    color = '#f59e0b';
  } else if (density < 5.0) {
    grade = 'D';
    risk = 'Heavy. Likely to flag on KDP review.';
    color = '#f59e0b';
  } else {
    grade = 'F';
    risk = 'Will read as AI-generated. Scrub required.';
    color = '#ef4444';
  }
  return { density, totalTells, totalWords, grade, risk, color, byPattern };
}

export type SomaticScore = {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  label: string;
  color: string;
  issues: SomaticIssue[];
};

export type SomaticIssue = {
  id: string;
  passage: string;
  rewrite: string;
  reason: string;
  applied: boolean;
};

// Cheap browser-side estimate for live feedback while typing. The real
// validation pass goes through callEngine and Claude; this exists so the UI
// can hint at grounding density without paying for an API round trip on
// every keystroke. Picks up sensory and bodily vocabulary plus common
// abstract telling phrases.
export function estimateSomaticScore(text: string): { score: number; grade: string; color: string } {
  if (!text || text.trim().length < 100) {
    return { score: 0, grade: 'F', color: '#9ca3af' };
  }

  const SENSORY_WORDS = [
    'cold', 'warm', 'hot', 'rough', 'smooth', 'sharp', 'soft', 'damp', 'dry',
    'wet', 'heavy', 'light', 'sticky', 'slick', 'grit', 'fabric',
    'smell', 'scent', 'odor', 'aroma', 'stink', 'reek', 'fragrance',
    'taste', 'bitter', 'sweet', 'sour', 'salt', 'metallic', 'copper', 'iron',
    'sound', 'noise', 'silence', 'hum', 'creak', 'click', 'thud', 'crackle',
    'whisper', 'shout', 'rasp', 'gasp', 'breath',
    'shadow', 'glint', 'gleam', 'flicker', 'dim', 'bright', 'glow', 'flash',
    'hand', 'hands', 'fingers', 'palm', 'wrist', 'chest', 'throat', 'mouth',
    'jaw', 'shoulder', 'shoulders', 'neck', 'spine', 'gut', 'stomach',
    'forehead', 'temple', 'skin', 'pulse', 'heart', 'lungs', 'knees',
    'flinch', 'shiver', 'shudder', 'lean', 'crouch', 'twitch', 'tense',
    'grip', 'clench', 'tighten', 'press', 'pull', 'push', 'reach', 'breathe',
    'inhale', 'exhale', 'swallow', 'cough', 'tremble',
  ];

  const ABSTRACT_TELLS = [
    'felt that', 'thought about', 'realized', 'remembered that',
    'experienced', 'reflected', 'considered', 'pondered',
    'essence', 'nature of', 'sense of', 'feeling of',
    'in some way', 'somehow', 'somewhat', 'seemed to',
  ];

  const lower = text.toLowerCase();
  const words = lower.match(/\b\w+\b/g) || [];
  const wordCount = words.length;

  let sensoryHits = 0;
  SENSORY_WORDS.forEach(w => {
    const re = new RegExp(`\\b${w}\\b`, 'gi');
    const matches = lower.match(re);
    if (matches) sensoryHits += matches.length;
  });

  let abstractHits = 0;
  ABSTRACT_TELLS.forEach(phrase => {
    const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = lower.match(re);
    if (matches) abstractHits += matches.length;
  });

  const sensoryDensity = (sensoryHits / wordCount) * 1000;
  const abstractDensity = (abstractHits / wordCount) * 1000;

  const rawScore = Math.min(1, sensoryDensity / 25);
  const penalty = Math.min(0.3, abstractDensity / 30);
  const score = Math.max(0, rawScore - penalty);

  let grade: string;
  let color: string;
  if (score >= 0.85) { grade = 'A'; color = '#10b981'; }
  else if (score >= 0.7) { grade = 'B'; color = '#10b981'; }
  else if (score >= 0.5) { grade = 'C'; color = '#f59e0b'; }
  else if (score >= 0.3) { grade = 'D'; color = '#f59e0b'; }
  else { grade = 'F'; color = '#ef4444'; }

  return { score, grade, color };
}
