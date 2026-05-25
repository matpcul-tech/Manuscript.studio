'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type OutlineChapter = { title: string; synopsis: string };
type Outline = { title: string; chapters: OutlineChapter[] };

export type QuickDraftStatus = {
  phase: 'connecting' | 'outline' | 'chapter' | 'done' | 'error';
  chaptersComplete: number;
  totalChapters: number;
  message: string;
};

export type QuickDraftResult = {
  outline: Outline;
  chapterTexts: string[];
};

type Props = {
  jobId: string;
  onStatus?: (s: QuickDraftStatus) => void;
  onOutline?: (o: Outline) => void;
  onChapter?: (ch: { index: number; title: string; text: string }) => void;
  onComplete: (result: QuickDraftResult) => void;
  onError?: (message: string) => void;
};

// Subscribes to a job's Realtime channel and surfaces every progress event
// via callbacks. Falls back to a one-shot DB read on mount so a job that
// completed before the component subscribed still resolves cleanly. Cleans
// up the channel on unmount.
export function GenerationStream({
  jobId,
  onStatus,
  onOutline,
  onChapter,
  onComplete,
  onError,
}: Props) {
  // Track whether onComplete has fired so a late DB poll doesn't double-fire
  // if the Realtime channel already delivered the done event.
  const completedRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`job:${jobId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'status' }, ({ payload }) => {
        onStatus?.({
          phase: payload.phase,
          chaptersComplete: payload.chaptersComplete ?? 0,
          totalChapters: payload.totalChapters ?? 0,
          message: payload.message ?? '',
        });
      })
      .on('broadcast', { event: 'outline' }, ({ payload }) => {
        onOutline?.(payload as Outline);
      })
      .on('broadcast', { event: 'chapter' }, ({ payload }) => {
        onChapter?.({
          index: payload.index,
          title: payload.title,
          text: payload.text,
        });
      })
      .on('broadcast', { event: 'done' }, ({ payload }) => {
        if (completedRef.current) return;
        completedRef.current = true;
        onComplete({
          outline: payload.outline,
          chapterTexts: payload.chapterTexts,
        });
      })
      .on('broadcast', { event: 'error' }, ({ payload }) => {
        onError?.(payload.message || 'Generation failed.');
      })
      .subscribe();

    // If the job already finished before we subscribed, the broadcast was
    // lost (Supabase broadcast does not replay). Hit the DB once to recover
    // the saved result_text.
    (async () => {
      const { data } = await supabase
        .from('generation_jobs')
        .select('status, result_text, error_message')
        .eq('id', jobId)
        .single();
      if (!data) return;
      if (data.status === 'complete' && data.result_text && !completedRef.current) {
        try {
          const parsed = JSON.parse(data.result_text);
          completedRef.current = true;
          onComplete({ outline: parsed.outline, chapterTexts: parsed.chapterTexts });
        } catch {
          onError?.('Could not parse completed job result.');
        }
      } else if (data.status === 'failed') {
        onError?.(data.error_message || 'Generation failed.');
      }
    })();

    return () => {
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  // Headless component. The parent owns the UI; this just plumbs events
  // through the callbacks. Returning null keeps it composable.
  return null;
}
