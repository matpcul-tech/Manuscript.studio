import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Delete your account · Manuscript Studio' };

export default function DeleteAccountInfo({ searchParams }: { searchParams: { done?: string } }) {
  const done = searchParams?.done === '1';
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 leading-relaxed">
      <h1 className="font-display text-3xl font-bold mb-6">Delete your Manuscript Studio account</h1>
      {done && (
        <p className="bg-[var(--bg-3)] rounded-lg p-4 mb-6 font-semibold">Your account and data have been deleted.</p>
      )}
      <p className="mb-4">
        Manuscript Studio is published by Sovereign Shield Technologies LLC. You can delete your account and all associated data at any time,
        from the website or from the Android and iOS apps.
      </p>
      <h2 className="font-semibold text-xl mt-8 mb-3">How to delete</h2>
      <ol className="list-decimal pl-6 space-y-2 mb-4">
        <li>Sign in at <Link href="/login?next=/account" className="text-[var(--blue)] underline">manuscript-studio-os.vercel.app/login</Link> or in the app.</li>
        <li>Open <Link href="/account" className="text-[var(--blue)] underline">Account</Link>.</li>
        <li>Type DELETE and tap Delete my account.</li>
      </ol>
      <p className="mb-4">
        If you cannot sign in, email <a href="mailto:support@manuscript-studio-os.com" className="text-[var(--blue)] underline">support@manuscript-studio-os.com</a> from
        the address on your account and we will delete it within 30 days.
      </p>
      <h2 className="font-semibold text-xl mt-8 mb-3">What is deleted</h2>
      <ul className="list-disc pl-6 space-y-2 mb-4">
        <li>Your account, email address, and sign-in credentials</li>
        <li>All projects, manuscripts, voice samples, and voice profiles</li>
        <li>Generation history and usage records</li>
        <li>Your subscription record. Any active web subscription is canceled.</li>
      </ul>
      <h2 className="font-semibold text-xl mt-8 mb-3">What is kept</h2>
      <p className="mb-4">
        Deletion is immediate. Payment records held by Stripe are kept as required for tax and accounting law.
        Server logs may keep request metadata for up to 30 days.
      </p>
    </main>
  );
}
