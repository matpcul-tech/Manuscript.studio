'use client';

import { useEffect, useRef } from 'react';
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

// Subscribes to a job's Realtime channel for low-latency progress updates AND
// polls the generation_jobs row every 4 seconds as a durable fallback. Polling
// is the source of truth: broadcasts get lost on backgrounded tabs, network
// blips, idle Realtime timeouts, or 20-minute job durations that exceed any
// reasonable WebSocket lifetime. The DB row always reflects the worker's
// final state, so polling catches every completion regardless of what
// Realtime did or did not deliver.
export function GenerationStream({
  jobId,
  onStatus,
  onOutline,
  onChapter,
  onComplete,
  onError,
}: Props) {
  // Guards the completion handlers so a slow Realtime 'done' event arriving
  // after the poll has already fired onComplete does not double-apply the
  // chapters into the project.
  const completedRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const finishWithResult = (parsed: QuickDraftResult) => {
      if (completedRef.current) return;
      completedRef.current = true;
      onComplete(parsed);
      if (pollTimer) clearInterval(pollTimer);
    };

    const finishWithError = (message: string) => {
      if (completedRef.current) return;
      completedRef.current = true;
      onError?.(message);
      if (pollTimer) clearInterval(pollTimer);
    };

    const checkJobRow = async () => {
      if (cancelled || completedRef.current) return;
      const { data } = await supabase
        .from('generation_jobs')
        .select('status, result_text, error_message, chapters_written, total_chapters')
        .eq('id', jobId)
        .single();
      if (cancelled || !data) return;
      if (data.status === 'complete' && data.result_text) {
        try {
          const parsed = JSON.parse(data.result_text);
          finishWithResult({ outline: parsed.outline, chapterTexts: parsed.chapterTexts });
        } catch {
          finishWithError('Could not parse completed job result.');
        }
      } else if (data.status === 'failed') {
        finishWithError(data.error_message || 'Generation failed.');
      } else if (data.status === 'running' || data.status === 'streaming') {
        const done = data.chapters_written ?? 0;
        const total = data.total_chapters ?? 0;
        onStatus?.({
          phase: 'chapter',
          chaptersComplete: done,
          totalChapters: total,
          message: total > 0
            ? `Writing chapter ${done + 1} of ${total}...`
            : 'Generating...',
        });
      } else if (data.status === 'queued') {
        onStatus?.({
          phase: 'connecting',
          chaptersComplete: 0,
          totalChapters: 0,
          message: 'Waiting to start...',
        });
      }
    };

    // Low-latency path: subscribe to broadcasts. When they work, the user
    // sees per-chapter progress as it happens.
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
        finishWithResult({
          outline: payload.outline,
          chapterTexts: payload.chapterTexts,
        });
      })
      .on('broadcast', { event: 'error' }, ({ payload }) => {
        finishWithError(payload.message || 'Generation failed.');
      })
      .subscribe();

    // Durable path: immediate check + 4s poll. Catches completions whenever
    // they happen, regardless of broadcast reliability. Stops itself once
    // finishWithResult or finishWithError fires.
    checkJobRow();
    pollTimer = setInterval(checkJobRow, 4000);

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  return null;
}
