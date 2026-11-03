'use client';
import type { Interval } from '@/lib/plans';

// Monthly / yearly switch for the website pricing and billing pages.
export function IntervalToggle({ value, onChange }: { value: Interval; onChange: (v: Interval) => void }) {
  const btn = (v: Interval, label: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={value === v}
      data-interval={v}
      onClick={() => onChange(v)}
      className={`px-4 py-1.5 rounded-[7px] text-[13px] font-semibold transition ${value === v ? 'bg-white text-[var(--blue-deep)] shadow-sm' : 'text-[var(--ink-3)] hover:text-[var(--ink)]'}`}
    >
      {label}
    </button>
  );
  return (
    <div role="radiogroup" aria-label="Billing period" className="inline-flex p-1 bg-[var(--bg-3)] rounded-[10px]">
      {btn('month', 'Monthly')}
      {btn('year', 'Yearly, 2 months free')}
    </div>
  );
}
