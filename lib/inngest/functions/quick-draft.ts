import Anthropic from '@anthropic-ai/sdk';
import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/admin';

// ============================================================================
// Quick Draft as a background job.
//
// Maps to the previous client-driven for-loop in page.tsx, but every chapter
// is now its own Inngest step. Steps are idempotent and resumable: if the
// worker crashes after writing chapter 3, the retry re-uses the cached
// outline + chapters 1-3 from Inngest state and only re-runs chapter 4.
//
// Progress flows to the client via Supabase Realtime broadcast on
// `job:{jobId}`. Each step opens the channel, subscribes (required for
// server-side broadcasts to actually deliver), sends one or more events,
// then unsubscribes. The browser stays subscribed for the full job.
// ============================================================================

type OutlineChapter = { title: string; synopsis: string };
type Outline = { title: string; chapters: OutlineChapter[] };

const HARD_RULES = `RULES - never violate:
- NEVER use em dashes ( — ) or en dashes ( – ). Use period, comma, or semicolon.
- Forbidden: "it's worth noting", "in conclusion", "ultimately,", "indeed,", "moreover,", "furthermore,", "additionally,", "at its core", "in a world where", "stands as a testament", "the realm of", "tapestry", "delve into", "navigate the", "ever-evolving", "unlock", "unleash", "robust", "seamless", "elevate".
- No "not just X but Y". No "this isn't just A, it's B". No "more than ever before".
- No tricolons climbing to abstract nouns.
- No throat-clearing. Start at the first real sentence.
- Concrete over abstract. Vary sentence length. Trust the reader.
- Never frame output. No "Here is the scene." Return only the prose.`;

function buildVoiceBlock(voiceSample?: string, voiceProfile?: string, voiceNotes?: string) {
  if (!voiceSample) {
    return `Write clean, direct prose. Short sentences carry weight. Concrete over abstract. Never sound like a chatbot.`;
  }
  let voice = `VOICE SAMPLE - match cadence, sentence length, word choice, rhythm:\n---\n${voiceSample.slice(0, 8000)}\n---`;
  if (voiceProfile) voice += `\nVOICE PROFILE:\n${voiceProfile}`;
  if (voiceNotes) voice += `\nWRITER'S OWN STYLE NOTES (honor these):\n${voiceNotes}`;
  return voice;
}

function autoScrub(text: string): string {
  return text
    .replace(/—/g, ', ')
    .replace(/ – /g, ', ')
    .replace(/–/g, '-')
    .replace(/^\s*Here(?:\s+is|'s)[^.\n]*\.\s*/i, '')
    .replace(/\n\s*Here(?:\s+is|'s)[^.\n]*\.\s*/i, '\n');
}

// Open a Realtime channel, send one event, close. Server-side broadcasts only
// deliver when the sender has subscribed, so we do a full subscribe -> send ->
// unsubscribe cycle each time. The overhead is ~200ms per call, which is fine
// when we only broadcast a handful of progress events per chapter (not per
// token). If we add mid-chapter token streaming later, we'll keep a single
// channel open across the whole step body instead.
async function broadcastEvent(jobId: string, event: string, payload: any) {
  const supabase = createAdminClient();
  const channel = supabase.channel(`job:${jobId}`, {
    config: { broadcast: { self: false, ack: false } },
  });
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Realtime subscribe timeout')), 5000);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timer);
        resolve();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        clearTimeout(timer);
        reject(new Error(`Realtime subscribe failed: ${status}`));
      }
    });
  });
  await channel.send({ type: 'broadcast', event, payload });
  await channel.unsubscribe();
}

export const generateQuickDraft = inngest.createFunction(
  {
    id: 'generate-quick-draft',
    name: 'Generate quick draft',
    retries: 1,
    concurrency: { limit: 3, key: 'event.data.userId' },
    triggers: [{ event: 'manuscript/generate.quick-draft' }],
  },
  async ({ event, step, logger }) => {
    const data = event.data as {
      jobId: string;
      userId: string;
      projectId: string;
      quickPrompt: string;
      voiceSample?: string;
      voiceProfile?: string;
      voiceNotes?: string;
      targetWords: number;
      chapterCount: number;
      mode: 'opening' | 'all';
      title?: string;
      genre?: string;
    };
    const {
      jobId,
      userId,
      projectId,
      quickPrompt,
      voiceSample,
      voiceProfile,
      voiceNotes,
      targetWords,
      chapterCount,
      mode,
      title,
      genre,
    } = data;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const supabase = createAdminClient();

    // Step 1: mark job as running.
    await step.run('mark-running', async () => {
      await supabase
        .from('generation_jobs')
        .update({ status: 'running', started_at: new Date().toISOString(), total_chapters: chapterCount, chapters_written: 0 })
        .eq('id', jobId);
      await broadcastEvent(jobId, 'status', {
        phase: 'outline',
        message: `Planning ${chapterCount} chapters...`,
      });
    });

    // Step 2: outline. One Anthropic call, returns strict JSON.
    const outline = await step.run('outline', async () => {
      const systemPrompt = `You are a book outlining engine. Given a description, target length, and chapter count, produce a chapter-by-chapter outline as STRICT JSON.

Return ONLY a JSON object with this exact shape:
{
  "title": "suggested working title",
  "chapters": [
    { "title": "Chapter 1 title", "synopsis": "one sentence describing what happens in this chapter" },
    { "title": "Chapter 2 title", "synopsis": "..." }
  ]
}

Rules:
- Produce exactly ${chapterCount} chapters
- Chapter titles should be evocative, not generic (not "Chapter 1" / "Chapter 2")
- Synopses are ONE sentence each, concrete and specific
- Arc: setup, complication, escalation, climax, resolution proportional to chapter count
- No em dashes anywhere
- Return ONLY the JSON object. No markdown fences. No preamble. No explanation.`;

      const userPrompt = `BOOK DESCRIPTION:\n${quickPrompt}\n\nTARGET LENGTH: ${targetWords.toLocaleString()} words\nCHAPTERS: ${chapterCount}\n${title ? `WORKING TITLE: ${title}\n` : ''}${genre ? `GENRE: ${genre}\n` : ''}`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const text = response.content
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('\n')
        .trim();
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

      let parsed: Outline;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        throw new Error('Could not parse outline. Try a more specific description.');
      }
      if (!parsed.chapters || parsed.chapters.length === 0) {
        throw new Error('Outline came back empty. Try again.');
      }

      await supabase.from('engine_usage').insert({
        user_id: userId,
        task: 'quick-draft:outline',
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      });

      await broadcastEvent(jobId, 'outline', parsed);
      return parsed;
    });

    // Step 3..N+2: each chapter is its own step so retries only re-run the
    // failing one.
    const chaptersToWrite = mode === 'opening' ? 1 : outline.chapters.length;
    const wordsPerChapter = Math.round(targetWords / outline.chapters.length);
    const perChapterTarget = Math.min(wordsPerChapter, 2500);
    const chapterTexts: string[] = [];

    for (let i = 0; i < chaptersToWrite; i++) {
      const previousTail = i === 0 ? '' : chapterTexts[i - 1].split(/\s+/).slice(-400).join(' ');
      const ch = outline.chapters[i];

      const chapterText = await step.run(`chapter-${i}`, async () => {
        await supabase
          .from('generation_jobs')
          .update({ status: 'streaming', chapters_written: i, total_chapters: chaptersToWrite })
          .eq('id', jobId);
        await broadcastEvent(jobId, 'status', {
          phase: 'chapter',
          chapterIndex: i,
          chaptersComplete: i,
          totalChapters: chaptersToWrite,
          message: chaptersToWrite === 1
            ? 'Writing the opening chapter...'
            : `Writing chapter ${i + 1} of ${chaptersToWrite}: ${ch.title}`,
        });

        const contextBlock = i === 0
          ? `Open the book. Establish the world, the voice, and the first conflict or question. Make the reader want to keep going. Open at the first real sentence, no throat-clearing.`
          : `Continue the book. The previous chapter ended like this:\n---\n${previousTail}\n---\nPick up the narrative naturally. Maintain voice, character names, and tone established earlier.`;

        const systemPrompt = `You are a manuscript writer producing prose for a long-form book. Nothing should reveal that it came from a language model.

${buildVoiceBlock(voiceSample, voiceProfile, voiceNotes)}

${HARD_RULES}

TASK: Write Chapter ${i + 1} of this book. About ${perChapterTarget} words. ${contextBlock}

Output ONLY the prose. No headings, no preamble, no closing remarks, no markdown.`;

        const userPrompt = `BOOK DESCRIPTION:\n${quickPrompt}\n\nCHAPTER ${i + 1}: ${ch.title}\nSYNOPSIS: ${ch.synopsis}\n\nFULL OUTLINE FOR CONTEXT:\n${outline.chapters.map((c, idx) => `${idx + 1}. ${c.title}: ${c.synopsis}`).join('\n')}\n\nWrite Chapter ${i + 1}.`;

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        });

        const text = response.content
          .filter((b: any) => b.type === 'text')
          .map((b: any) => b.text)
          .join('\n')
          .trim();
        const cleaned = autoScrub(text);

        await supabase.from('engine_usage').insert({
          user_id: userId,
          task: `quick-draft:chapter-${i + 1}`,
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
        });

        await broadcastEvent(jobId, 'chapter', {
          index: i,
          title: ch.title,
          text: cleaned,
          chaptersComplete: i + 1,
          totalChapters: chaptersToWrite,
        });

        logger.info(`chapter-${i} complete`, { jobId, chars: cleaned.length });
        return cleaned;
      });

      chapterTexts.push(chapterText);
    }

    // Step N+3: persist final result and signal done.
    await step.run('save-result', async () => {
      const result = JSON.stringify({ outline, chapterTexts });
      await supabase
        .from('generation_jobs')
        .update({
          status: 'complete',
          result_text: result,
          model_used: 'claude-sonnet-4-6',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);
      await broadcastEvent(jobId, 'done', {
        outline,
        chapterTexts,
      });
    });

    return { jobId, chaptersWritten: chapterTexts.length, success: true };
  }
);
