'use client';

// Lets users flag offensive or harmful AI-generated text (Google Play AI content policy).
// Opens the user's mail app with the project and page context filled in.
export function ReportAIOutput({ projectId, projectTitle, stage, className }: {
  projectId: string;
  projectTitle?: string;
  stage?: string;
  className?: string;
}) {
  const page = typeof window !== 'undefined' ? window.location.href : '';
  const body = [
    'Describe the AI output you want to report and why:',
    '',
    '',
    '',
    '---',
    `Project: ${projectTitle || 'Untitled'} (${projectId})`,
    `Stage: ${stage || 'unknown'}`,
    `Page: ${page}`,
  ].join('\n');
  const href = `mailto:matpcul@gmail.com?subject=${encodeURIComponent('Report AI output')}&body=${encodeURIComponent(body)}`;
  return (
    <a
      href={href}
      title="Report offensive or harmful AI-generated text"
      className={className ?? 'flex items-center gap-1 text-xs font-semibold text-[var(--ink-3)] hover:text-red-600 px-2 py-1 rounded-md hover:bg-[var(--bg-3)] whitespace-nowrap'}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
      Report AI output
    </a>
  );
}
