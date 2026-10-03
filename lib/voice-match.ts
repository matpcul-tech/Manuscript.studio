// ============================================================================
// Voice match: a measured, local comparison between the writer's voice
// sample and generated prose. No API call, no embeddings, no magic: it
// builds a stylometric profile of each text (sentence rhythm, punctuation
// habits, dialogue share, word shape, function-word usage, contractions)
// and scores how closely the two profiles agree.
//
// This exists because "match the voice sample" was previously a prompt
// instruction with no verification. The score makes the claim testable:
// run it on the sample vs. the draft and you get a number, not a vibe.
// It measures style agreement, not authorship, and it says so.
// ============================================================================

export type VoiceProfile = {
  words: number;
  sentences: number;
  // sentence-length distribution (fractions)
  sentVeryShort: number; // < 6 words
  sentShort: number;     // 6-11
  sentMid: number;       // 12-19
  sentLong: number;      // 20-29
  sentVeryLong: number;  // 30+
  sentMean: number;
  sentStddev: number;
  // per-1k-word rates
  commas: number;
  semicolons: number;
  colons: number;
  questions: number;
  exclaims: number;
  contractions: number;
  adverbsLy: number;
  // shares
  dialogueShare: number; // fraction of sentences containing quoted speech
  meanWordLen: number;
  functionWords: Record<string, number>; // per 1k words
};

const FUNCTION_WORDS = [
  'the', 'a', 'an', 'and', 'but', 'or', 'so', 'then', 'that', 'this',
  'of', 'in', 'on', 'at', 'to', 'for', 'with', 'from', 'by', 'as',
  'he', 'she', 'it', 'they', 'i', 'you', 'we',
  'was', 'were', 'is', 'had', 'has', 'did', 'would', 'could',
  'not', 'no', 'never', 'just', 'like', 'back', 'up', 'out', 'down',
];

function splitSentences(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]+["')”’]?/g) || [])
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

export function buildVoiceProfile(text: string): VoiceProfile | null {
  const clean = (text || '').trim();
  const wordsArr: string[] = clean.toLowerCase().match(/[a-z']+/g) || [];
  const words = wordsArr.length;
  if (words < 150) return null;

  const sentences = splitSentences(clean);
  const sCount = sentences.length || 1;
  const lengths = sentences.map(s => (s.match(/\S+/g) || []).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / sCount;
  const stddev = Math.sqrt(lengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / sCount);

  const frac = (pred: (l: number) => boolean) => lengths.filter(pred).length / sCount;
  const per1k = (n: number) => (n / words) * 1000;
  const count = (re: RegExp) => (clean.match(re) || []).length;

  const fw: Record<string, number> = {};
  const freq: Record<string, number> = {};
  wordsArr.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  FUNCTION_WORDS.forEach(w => { fw[w] = per1k(freq[w] || 0); });

  const dialogueSentences = sentences.filter(s => /["“”]/.test(s)).length;

  return {
    words,
    sentences: sCount,
    sentVeryShort: frac(l => l < 6),
    sentShort: frac(l => l >= 6 && l < 12),
    sentMid: frac(l => l >= 12 && l < 20),
    sentLong: frac(l => l >= 20 && l < 30),
    sentVeryLong: frac(l => l >= 30),
    sentMean: mean,
    sentStddev: stddev,
    commas: per1k(count(/,/g)),
    semicolons: per1k(count(/;/g)),
    colons: per1k(count(/:/g)),
    questions: per1k(count(/\?/g)),
    exclaims: per1k(count(/!/g)),
    contractions: per1k(count(/\b\w+'(?:s|t|re|ve|ll|d|m)\b/gi)),
    adverbsLy: per1k((wordsArr.filter(w => w.length > 4 && w.endsWith('ly'))).length),
    dialogueShare: dialogueSentences / sCount,
    meanWordLen: wordsArr.reduce((a: number, w) => a + w.length, 0) / words,
    functionWords: fw,
  };
}

// Similarity of two non-negative scalars in [0, 1]: 1 when equal, falling
// toward 0 as they diverge relative to their magnitude.
function sim(a: number, b: number): number {
  if (a === 0 && b === 0) return 1;
  return 1 - Math.abs(a - b) / (Math.abs(a) + Math.abs(b));
}

export type VoiceMatch = {
  score: number; // 0-100
  verdict: 'strong' | 'close' | 'drifting' | 'off-voice';
  sampleWords: number;
  textWords: number;
  components: { label: string; score: number }[];
};

export function voiceMatchScore(voiceSample: string, text: string): VoiceMatch | null {
  const a = buildVoiceProfile(voiceSample);
  const b = buildVoiceProfile(text);
  if (!a || !b) return null;

  // Sentence rhythm: cosine over the length-distribution vector plus
  // agreement on mean and spread. This is the strongest stylistic signal
  // a reader actually feels, so it carries the most weight.
  const distA = [a.sentVeryShort, a.sentShort, a.sentMid, a.sentLong, a.sentVeryLong];
  const distB = [b.sentVeryShort, b.sentShort, b.sentMid, b.sentLong, b.sentVeryLong];
  const dot = distA.reduce((s, v, i) => s + v * distB[i], 0);
  const magA = Math.sqrt(distA.reduce((s, v) => s + v * v, 0)) || 1;
  const magB = Math.sqrt(distB.reduce((s, v) => s + v * v, 0)) || 1;
  const rhythm = (dot / (magA * magB)) * 0.6 + sim(a.sentMean, b.sentMean) * 0.2 + sim(a.sentStddev, b.sentStddev) * 0.2;

  const punctuation = (
    sim(a.commas, b.commas) +
    sim(a.semicolons, b.semicolons) +
    sim(a.colons, b.colons) +
    sim(a.questions, b.questions) +
    sim(a.exclaims, b.exclaims)
  ) / 5;

  const diction = (
    sim(a.meanWordLen, b.meanWordLen) +
    sim(a.contractions, b.contractions) +
    sim(a.adverbsLy, b.adverbsLy)
  ) / 3;

  const dialogue = sim(a.dialogueShare, b.dialogueShare);

  const fwScores = FUNCTION_WORDS.map(w => sim(a.functionWords[w], b.functionWords[w]));
  const functionUsage = fwScores.reduce((s, v) => s + v, 0) / fwScores.length;

  const components = [
    { label: 'Sentence rhythm', score: rhythm },
    { label: 'Punctuation habits', score: punctuation },
    { label: 'Diction', score: diction },
    { label: 'Dialogue share', score: dialogue },
    { label: 'Function words', score: functionUsage },
  ];

  const weighted =
    rhythm * 0.35 +
    punctuation * 0.15 +
    diction * 0.15 +
    dialogue * 0.1 +
    functionUsage * 0.25;

  const score = Math.round(Math.max(0, Math.min(1, weighted)) * 100);
  const verdict: VoiceMatch['verdict'] =
    score >= 85 ? 'strong' : score >= 70 ? 'close' : score >= 50 ? 'drifting' : 'off-voice';

  return {
    score,
    verdict,
    sampleWords: a.words,
    textWords: b.words,
    components: components.map(c => ({ label: c.label, score: Math.round(c.score * 100) })),
  };
}
