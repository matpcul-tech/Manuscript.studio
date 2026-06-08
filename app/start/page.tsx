import Link from 'next/link';

const VIDEO_URL = 'https://www.youtube.com/embed/GoVor54Yiqg';

const TRUST_POINTS = [
  'Other tools write generic. This one writes like you.',
  'From first draft to KDP publish in one place.',
  'Free to start. No credit card needed.',
];

function CTAButton() {
  return (
    <Link
      href="/signup"
      className="block w-full text-center py-4 px-6 rounded-xl bg-[var(--blue)] hover:bg-[var(--blue-deep)] text-white font-bold text-[17px] shadow-[0_4px_20px_rgba(79,109,245,0.4)] transition"
    >
      Start Writing Free
    </Link>
  );
}

export default function StartPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">

      {/* Logo-only nav */}
      <nav className="h-16 border-b border-[var(--line)] flex items-center px-5 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[var(--blue)] to-[var(--blue-deep)] grid place-items-center text-white font-display font-bold text-[19px] shadow-[0_2px_8px_rgba(79,109,245,0.4)]">M</div>
          <span className="font-bold text-[16px] tracking-tight">Manuscript Studio</span>
        </Link>
      </nav>

      {/* Content */}
      <div className="flex-1 w-full max-w-md mx-auto px-5 py-10 flex flex-col">

        {/* Headline */}
        <h1 className="font-display text-[clamp(30px,9vw,48px)] font-bold leading-[1.05] text-[var(--ink)] mb-4 text-center">
          Every Writing Tool Misses One Thing.
        </h1>

        {/* Subheadline */}
        <p className="text-[16px] text-[var(--ink-3)] leading-relaxed text-center mb-8">
          Your voice. Manuscript Studio learns how you write, generates in your style, checks your structure, and sends your book straight to Amazon KDP.
        </p>

        {/* CTA 1 */}
        <div className="mb-10">
          <CTAButton />
        </div>

        {/* Video embed -- 9x16 vertical Short */}
        <div className="w-full mb-10">
          <div className="relative w-full overflow-hidden rounded-2xl shadow-[var(--shadow-xl)] bg-black" style={{ paddingTop: '177.78%' }}>
            <iframe
              src={VIDEO_URL}
              title="Manuscript Studio"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>

        {/* Trust points */}
        <div className="space-y-3 mb-10">
          {TRUST_POINTS.map(point => (
            <div key={point} className="flex items-start gap-3 bg-[var(--bg-3)] rounded-xl px-4 py-3.5">
              <span className="text-[var(--green)] font-bold text-lg leading-none mt-0.5 flex-shrink-0">&#10003;</span>
              <span className="text-[15px] text-[var(--ink-2)] leading-snug">{point}</span>
            </div>
          ))}
        </div>

        {/* CTA 2 */}
        <CTAButton />

      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-[var(--ink-4)] flex-shrink-0">
        &copy; 2026 Manuscript Studio
      </footer>

    </main>
  );
}
