import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy policy · Manuscript Studio' };

export default function PrivacyPolicy() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 leading-relaxed">
      <h1 className="font-display text-3xl font-bold mb-2">Privacy policy</h1>
      <p className="text-sm text-[var(--ink-3)] mb-8">Last updated October 29, 2026</p>

      <p className="mb-4">
        Manuscript Studio (the website and the Android and iOS apps) is operated by Sovereign Shield Technologies LLC.
        This policy explains what we collect and why.
      </p>

      <h2 className="font-semibold text-xl mt-8 mb-3">What we collect</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li><b>Account data:</b> email address and a user id, used to sign you in.</li>
        <li><b>Your content:</b> manuscripts, voice samples, project data, and files you import. Stored so you can work on your book.</li>
        <li><b>Subscription data:</b> your plan and billing period. Payments are processed by Stripe on our website. We never see or store your full card number.</li>
        <li><b>Usage data:</b> anonymous page views through Vercel Web Analytics, and counts of AI generations for plan limits.</li>
      </ul>
      <p className="mt-4">We do not collect location, contacts, camera, microphone, or photo library data. We do not track you across other apps or websites and we do not sell your data.</p>

      <h2 className="font-semibold text-xl mt-8 mb-3">How we use it</h2>
      <p className="mb-4">
        To provide the service, enforce plan limits, process payments, and keep the service secure.
        When you ask the app to generate or edit text, the relevant content is sent to Anthropic to produce the result.
        Anthropic does not use API data to train its models by default.
      </p>

      <h2 className="font-semibold text-xl mt-8 mb-3">Service providers</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>Supabase (database and authentication)</li>
        <li>Vercel (hosting and analytics)</li>
        <li>Anthropic (AI text generation)</li>
        <li>Stripe (web payments)</li>
        <li>Inngest (background jobs)</li>
      </ul>

      <h2 className="font-semibold text-xl mt-8 mb-3">Security and retention</h2>
      <p className="mb-4">
        All traffic uses HTTPS. Data is kept while your account exists. When you delete your account, your data is deleted
        immediately, except payment records Stripe must keep by law.
      </p>

      <h2 className="font-semibold text-xl mt-8 mb-3">Your choices</h2>
      <p className="mb-4">
        You can export your work at any time and delete your account from the Account page.
        See <Link href="/delete-account" className="text-[var(--blue)] underline">how to delete your account</Link>.
      </p>

      <h2 className="font-semibold text-xl mt-8 mb-3">Children</h2>
      <p className="mb-4">Manuscript Studio is not directed at children under 13.</p>

      <h2 className="font-semibold text-xl mt-8 mb-3">Contact</h2>
      <p>Email <a href="mailto:matpcul@gmail.com" className="text-[var(--blue)] underline">matpcul@gmail.com</a>.</p>
    </main>
  );
}
