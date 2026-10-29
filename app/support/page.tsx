import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Support · Manuscript Studio' };

export default function Support() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 leading-relaxed">
      <h1 className="font-display text-3xl font-bold mb-6">Support</h1>
      <p className="mb-4">
        Questions, bugs, or account help: email{' '}
        <a href="mailto:matpcul@gmail.com" className="text-[var(--blue)] underline">matpcul@gmail.com</a>.
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li><Link href="/privacy" className="text-[var(--blue)] underline">Privacy policy</Link></li>
        <li><Link href="/delete-account" className="text-[var(--blue)] underline">Delete your account</Link></li>
      </ul>
    </main>
  );
}
