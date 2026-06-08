import Link from 'next/link';
import { InstallButton } from '@/components/InstallButton';

// SVG icon primitives -- all 24x24 viewBox, stroke-based
function IconPencil() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M15.232 5.232l3.536 3.536M9 13l6.364-6.364a2.5 2.5 0 113.536 3.536L12.536 16.5a2 2 0 01-.878.523l-3.158.79.79-3.158A2 2 0 019 13z" />
    </svg>
  );
}
function IconMic() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0014 0M12 19v3M9 22h6" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function IconList() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconSparkle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 2l2.4 7.6H22l-6.4 4.6 2.4 7.8L12 17.4 6 22l2.4-7.8L2 9.6h7.6L12 2z" />
    </svg>
  );
}
function IconRocket() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M4.5 16.5c-1.5 1.5-2 4-2 4s2.5-.5 4-2l6-6-2-2-6 6z" />
      <path d="M21 3l-9 9m0 0l-2-2m2 2l2 2" />
      <path d="M9 15l-2.5 2.5M14.5 4.5l5 5a10 10 0 01-2.5 9L12 14" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: <IconPencil />,
    title: 'Quick Draft',
    body: 'Describe your book in a paragraph. Get a full chapter outline and an opening chapter written in your voice, ready to continue.',
  },
  {
    icon: <IconMic />,
    title: 'Voice Training',
    body: 'Upload past writing or paste a sample. The studio profiles your cadence, sentence length, word choice, and the small habits that make your prose yours.',
  },
  {
    icon: <IconShield />,
    title: 'Sovereign Prose Validator',
    body: 'Four-layer check: AI detection score, somatic interiority depth, voice consistency, and pacing. Each finding links to a one-click rewrite.',
  },
  {
    icon: <IconList />,
    title: 'Structure Check',
    body: 'Scene and chapter-level structure analysis. Spot pacing gaps, missing beats, and chapter hooks before your editor does.',
  },
  {
    icon: <IconSparkle />,
    title: 'Title Generator',
    body: 'Generate title and subtitle options matched to your genre, description, and Amazon keyword strategy. Ranked by marketability.',
  },
  {
    icon: <IconRocket />,
    title: 'KDP Launch Walkthrough',
    body: 'Step-by-step Amazon publishing guide with generated description, backend keywords, categories, and pricing suggestions. Copy and paste your way to live.',
  },
];

const STEPS = [
  {
    n: '1',
    title: 'Upload your voice sample',
    body: 'Paste or upload a few pages of your past writing. The studio builds a voice profile that captures how you actually write.',
  },
  {
    n: '2',
    title: 'Generate your draft',
    body: 'Describe your book. Quick Draft writes a chapter outline and opens the manuscript in your voice. Keep going scene by scene or chapter by chapter.',
  },
  {
    n: '3',
    title: 'Polish and publish',
    body: 'Run the Prose Validator, fix what it finds, design your cover, export KDP-ready files, and walk through the Amazon listing step by step.',
  },
];

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    sub: 'forever',
    items: ['1 project', '1 voice profile', '30 engine calls per day', 'Export .docx and .txt', 'No credit card required'],
    cta: 'Start free',
    primary: false,
  },
  {
    name: 'Pro',
    price: '$19',
    sub: 'per month',
    items: ['Unlimited projects', 'Unlimited voice profiles', '500 engine calls per day', 'All exports (EPUB, PDF, .docx)', 'Cover designer', 'Voice consistency checks', 'Priority engine'],
    cta: 'Go Pro',
    primary: true,
    badge: 'Most popular',
  },
  {
    name: 'Studio',
    price: '$39',
    sub: 'per month',
    items: ['Everything in Pro', '2,000 engine calls per day', 'Whole-manuscript line edit', 'AI cover backgrounds (coming)', 'Spine + back cover for paperback', 'Priority support'],
    cta: 'Go Studio',
    primary: false,
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[var(--blue)] to-[var(--blue-deep)] grid place-items-center text-white font-display font-bold text-[19px] shadow-[0_2px_8px_rgba(79,109,245,0.4)]">M</div>
            <span className="font-bold text-[16px] tracking-tight">Manuscript Studio</span>
          </Link>
          <div className="flex items-center gap-1">
            <a href="#features" className="hidden md:block px-3 py-2 text-sm font-medium text-[var(--ink-3)] hover:text-[var(--ink)] rounded-lg hover:bg-[var(--bg-3)] transition">Features</a>
            <a href="#how-it-works" className="hidden md:block px-3 py-2 text-sm font-medium text-[var(--ink-3)] hover:text-[var(--ink)] rounded-lg hover:bg-[var(--bg-3)] transition">How it works</a>
            <a href="#pricing" className="hidden md:block px-3 py-2 text-sm font-medium text-[var(--ink-3)] hover:text-[var(--ink)] rounded-lg hover:bg-[var(--bg-3)] transition">Pricing</a>
            <InstallButton />
            <Link href="/login" className="ml-3 px-4 py-2 text-sm font-semibold text-[var(--ink-2)] hover:text-[var(--ink)] transition">Sign In</Link>
            <Link href="/login" className="ml-1 px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-deep)] text-white shadow-sm transition">Start Free</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--blue-tint)] via-white to-white pointer-events-none" />
        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[radial-gradient(ellipse_at_center,var(--blue-soft),transparent_70%)] opacity-50 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 pt-24 pb-20 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--blue-soft)] text-[var(--blue-deep)] text-xs font-semibold mb-6 border border-[var(--blue)]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] animate-pulse" />
              Now in early access
            </div>
            <h1 className="font-display text-[clamp(38px,6.5vw,68px)] leading-[1.04] font-bold tracking-tight mb-6 text-[var(--ink)]">
              Write your book<br />
              <span className="text-[var(--blue-deep)]">in your voice.</span>
            </h1>
            <p className="text-lg md:text-xl text-[var(--ink-3)] leading-relaxed mb-10 max-w-2xl mx-auto">
              The first writing studio that learns your voice, drafts chapters in it, edits for human depth, designs your cover, and walks you through Amazon KDP publishing.
            </p>
            <Link
              href="/login"
              className="inline-block px-8 py-4 rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-deep)] text-white font-semibold text-base shadow-[0_4px_20px_rgba(79,109,245,0.45)] transition"
            >
              Start Writing Free
            </Link>
          </div>

          {/* product preview */}
          <div className="mt-20 rounded-2xl border border-[var(--line)] shadow-[var(--shadow-xl)] bg-white overflow-hidden">
            <div className="h-10 bg-[var(--bg-2)] border-b border-[var(--line)] flex items-center px-4 gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28ca42]" />
              <div className="ml-4 text-xs text-[var(--ink-4)] font-mono">manuscript-studio-os.vercel.app</div>
            </div>
            <div className="grid grid-cols-12 min-h-[380px]">
              <div className="col-span-3 bg-[var(--bg-2)] border-r border-[var(--line)] p-4">
                <div className="text-[10px] font-semibold tracking-wider text-[var(--ink-4)] mb-3">MANUSCRIPT</div>
                <div className="space-y-1">
                  <div className="px-2 py-1.5 rounded-md text-xs font-semibold bg-[var(--blue-soft)] text-[var(--blue-deep)]">Chapter 1: Opening</div>
                  <div className="pl-4 py-1 text-xs text-[var(--ink-3)]">Scene 1</div>
                  <div className="pl-4 py-1 text-xs text-[var(--ink-3)]">Scene 2</div>
                  <div className="px-2 py-1.5 rounded-md text-xs font-medium text-[var(--ink-2)]">Chapter 2</div>
                  <div className="px-2 py-1.5 rounded-md text-xs font-medium text-[var(--ink-2)]">Chapter 3</div>
                </div>
              </div>
              <div className="col-span-9 p-10">
                <div className="font-display text-2xl font-semibold mb-1">The Morning Before</div>
                <div className="text-[10px] font-semibold tracking-wider text-[var(--ink-4)] mb-6">CHAPTER 1</div>
                <div className="font-serif text-[15px] leading-[1.8] text-[var(--ink-2)] space-y-3">
                  <p>The cleaning crew moved through the floor like water. Slow at first, near the wall, then faster as they reached the open space between the slot machines and the cage.</p>
                  <p>Marcus watched from the second-floor balcony. He had been the supervisor here for nine years. He knew the way the building breathed before it filled with people.</p>
                  <p className="text-[var(--ink-4)] italic">[Continuing in your voice...]</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 bg-[var(--bg-2)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="text-xs font-bold tracking-[0.15em] text-[var(--blue-deep)] uppercase mb-3">Core tools</div>
            <h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight">
              Everything the writing needs.<br className="hidden sm:block" /> Nothing it doesn't.
            </h2>
            <p className="text-lg text-[var(--ink-3)] mt-4 max-w-2xl mx-auto">
              Six tools, one pipeline. Every stage knows about your voice, your book, and the stage before it.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="p-7 rounded-2xl border border-[var(--line)] hover:border-[var(--blue)]/30 hover:shadow-[var(--shadow-md)] bg-white transition group">
                <div className="w-11 h-11 rounded-xl bg-[var(--blue-soft)] text-[var(--blue)] flex items-center justify-center mb-5 group-hover:bg-[var(--blue)] group-hover:text-white transition">
                  {f.icon}
                </div>
                <div className="font-display text-xl font-semibold mb-2">{f.title}</div>
                <div className="text-sm text-[var(--ink-3)] leading-relaxed">{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-xs font-bold tracking-[0.15em] text-[var(--blue-deep)] uppercase mb-3">How it works</div>
            <h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight">
              Blank page to published in three stages.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* connector line on desktop */}
            <div className="hidden md:block absolute top-9 left-[calc(33%+1rem)] right-[calc(33%+1rem)] h-px bg-[var(--line)]" />

            {STEPS.map((step) => (
              <div key={step.n} className="flex flex-col items-center text-center">
                <div className="w-[72px] h-[72px] rounded-2xl bg-[var(--blue-soft)] border-2 border-[var(--blue)]/20 flex items-center justify-center mb-6 relative z-10">
                  <span className="font-display text-2xl font-bold text-[var(--blue-deep)]">{step.n}</span>
                </div>
                <div className="font-display text-xl font-semibold mb-2">{step.title}</div>
                <div className="text-sm text-[var(--ink-3)] leading-relaxed max-w-xs">{step.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 bg-[var(--bg-2)]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="text-xs font-bold tracking-[0.15em] text-[var(--blue-deep)] uppercase mb-3">Pricing</div>
            <h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight">
              Simple. Honest. Lower than the alternatives.
            </h2>
            <p className="text-base text-[var(--ink-3)] mt-3">Start free. Upgrade when you're ready.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map(plan => (
              <div key={plan.name} className={`relative p-7 rounded-2xl border-2 bg-white ${plan.primary ? 'border-[var(--blue)] shadow-[var(--shadow-lg)]' : 'border-[var(--line)]'}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[var(--blue)] text-white text-[11px] font-bold tracking-wider uppercase">{plan.badge}</div>
                )}
                <div className="font-display text-2xl font-bold mb-1">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="font-display text-5xl font-bold">{plan.price}</span>
                  <span className="text-sm text-[var(--ink-3)]">/ {plan.sub}</span>
                </div>
                <ul className="space-y-2.5 mb-7">
                  {plan.items.map(it => (
                    <li key={it} className="text-sm text-[var(--ink-2)] flex items-start gap-2">
                      <span className="text-[var(--green)] font-bold mt-0.5 flex-shrink-0">&#10003;</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`block w-full text-center py-3 rounded-lg font-semibold transition ${plan.primary ? 'bg-[var(--blue)] hover:bg-[var(--blue-deep)] text-white shadow-[0_4px_14px_rgba(79,109,245,0.4)]' : 'bg-white border border-[var(--line)] text-[var(--ink-2)] hover:border-[var(--blue)] hover:text-[var(--blue-deep)]'}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-8 text-sm text-[var(--ink-4)]">
            Atticus is $147 one-time. Sudowrite Pro is $22/mo. Vellum is $200 and Mac-only. We do everything they do, plus voice-trained writing.
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="text-xs font-bold tracking-[0.15em] text-[var(--blue-deep)] uppercase mb-3">Authors</div>
            <h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight">
              Written by real people, in their actual voices.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { initials: 'S.M.', label: 'Romance author, 14 titles on Amazon' },
              { initials: 'D.R.', label: 'Thriller writer, first-time KDP publisher' },
              { initials: 'P.K.', label: 'Nonfiction author, business books' },
            ].map(t => (
              <div key={t.initials} className="p-7 rounded-2xl border border-[var(--line)] bg-white">
                <div className="flex gap-1 mb-5">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} viewBox="0 0 16 16" className="w-4 h-4 fill-[var(--amber)]">
                      <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L2.2 5.2l4-.6z" />
                    </svg>
                  ))}
                </div>
                {/* Quote placeholder -- swap in real testimonial text */}
                <p className="text-sm text-[var(--ink-3)] leading-relaxed italic mb-5">
                  "Testimonial coming soon."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--bg-3)] border border-[var(--line)] flex items-center justify-center text-xs font-bold text-[var(--ink-3)]">{t.initials}</div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--ink-2)]">{t.initials}</div>
                    <div className="text-xs text-[var(--ink-4)]">{t.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 bg-gradient-to-br from-[var(--blue-deep)] to-[var(--blue)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="max-w-3xl mx-auto px-6 text-center relative">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
            Stop juggling four apps.<br />Start writing your book.
          </h2>
          <p className="text-lg text-white/80 mb-9 leading-relaxed">
            Free forever for your first project. One pipeline from blank page to Amazon.
          </p>
          <Link
            href="/login"
            className="inline-block px-9 py-4 rounded-lg bg-white hover:bg-white/95 text-[var(--blue-deep)] font-bold text-base shadow-xl transition"
          >
            Start Writing Free
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[var(--ink)] text-white/70 py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--blue)] to-[var(--blue-deep)] grid place-items-center text-white font-display font-bold text-[16px]">M</div>
                <span className="font-bold text-white">Manuscript Studio</span>
              </div>
              <p className="text-xs text-white/40 max-w-xs leading-relaxed">
                The complete writing and publishing studio for self-publishing authors. KDP-compliant exports, voice-trained drafts.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div>
                <div className="text-xs font-bold tracking-wider text-white/40 uppercase mb-3">Product</div>
                <ul className="space-y-2 text-sm">
                  <li><a href="#features" className="hover:text-white transition">Features</a></li>
                  <li><a href="#how-it-works" className="hover:text-white transition">How it works</a></li>
                  <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                </ul>
              </div>
              <div>
                <div className="text-xs font-bold tracking-wider text-white/40 uppercase mb-3">Account</div>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/login" className="hover:text-white transition">Sign In</Link></li>
                  <li><Link href="/login" className="hover:text-white transition">Create account</Link></li>
                </ul>
              </div>
              <div>
                <div className="text-xs font-bold tracking-wider text-white/40 uppercase mb-3">Company</div>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="https://sovereignshieldtechnologies.com" className="hover:text-white transition">
                      Sovereign Shield Technologies
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-white/30">
            <span>© {new Date().getFullYear()} Sovereign Shield Technologies LLC. Your manuscripts remain yours. We never train on your work.</span>
            <span className="sm:text-right max-w-sm">
              Exports meet Amazon KDP formatting requirements for EPUB, print interior PDF, and cover files. All trademarks belong to their respective owners.
            </span>
          </div>
        </div>
      </footer>

    </main>
  );
}
