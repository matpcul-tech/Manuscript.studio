import Link from 'next/link';

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
            <a href="#features" className="px-3 py-2 text-sm font-medium text-[var(--ink-2)] hover:text-[var(--ink)] rounded-lg hover:bg-[var(--bg-3)]">Features</a>
            <a href="#pipeline" className="px-3 py-2 text-sm font-medium text-[var(--ink-2)] hover:text-[var(--ink)] rounded-lg hover:bg-[var(--bg-3)]">How it works</a>
            <a href="#pricing" className="px-3 py-2 text-sm font-medium text-[var(--ink-2)] hover:text-[var(--ink)] rounded-lg hover:bg-[var(--bg-3)]">Pricing</a>
            <Link href="/login" className="ml-2 px-4 py-2 text-sm font-semibold text-[var(--ink-2)] hover:text-[var(--ink)]">Sign in</Link>
            <Link href="/login" className="ml-1 px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-deep)] text-white shadow-sm transition">Start free</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--blue-tint)] via-white to-white pointer-events-none" />
        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-radial from-[var(--blue-soft)] to-transparent rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 pt-24 pb-20 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--blue-soft)] text-[var(--blue-deep)] text-xs font-semibold mb-6 border border-[var(--blue)]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] animate-pulse" />
              Now in early access
            </div>
            <h1 className="font-display text-[clamp(40px,7vw,72px)] leading-[1.02] font-bold tracking-tight mb-6 text-[var(--ink)]">
              Write your book in your voice.
              <span className="block text-[var(--blue-deep)]">Publish to Amazon in one click.</span>
            </h1>
            <p className="text-lg md:text-xl text-[var(--ink-3)] leading-relaxed mb-10 max-w-2xl mx-auto">
              The first writing studio that learns your voice, drafts in it, edits in it, designs the cover, and walks you through Amazon KDP publishing. No more juggling Sudowrite, Atticus, Canva, and Word.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/login" className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-deep)] text-white font-semibold shadow-[0_4px_14px_rgba(79,109,245,0.4)] transition">
                Start writing free
              </Link>
              <a href="#pipeline" className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-white hover:bg-[var(--bg-3)] text-[var(--ink)] font-semibold border border-[var(--line)] transition">
                See the pipeline
              </a>
            </div>
            <div className="mt-8 text-sm text-[var(--ink-4)]">No credit card. One project free, forever.</div>
          </div>

          {/* product preview */}
          <div className="mt-20 rounded-2xl border border-[var(--line)] shadow-[var(--shadow-xl)] bg-white overflow-hidden">
            <div className="h-10 bg-[var(--bg-2)] border-b border-[var(--line)] flex items-center px-4 gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28ca42]" />
              <div className="ml-4 text-xs text-[var(--ink-4)] font-mono">manuscript-studio.app</div>
            </div>
            <div className="grid grid-cols-12 min-h-[420px]">
              <div className="col-span-3 bg-[var(--bg-2)] border-r border-[var(--line)] p-4">
                <div className="text-[10px] font-semibold tracking-wider text-[var(--ink-4)] mb-3">MANUSCRIPT</div>
                <div className="space-y-1">
                  <div className="px-2 py-1.5 rounded-md text-xs font-semibold bg-[var(--blue-soft)] text-[var(--blue-deep)]">▸ Chapter 1: Opening</div>
                  <div className="pl-6 py-1 text-xs text-[var(--ink-3)]">Scene 1</div>
                  <div className="pl-6 py-1 text-xs text-[var(--ink-3)]">Scene 2</div>
                  <div className="px-2 py-1.5 rounded-md text-xs font-medium text-[var(--ink-2)]">▸ Chapter 2</div>
                  <div className="px-2 py-1.5 rounded-md text-xs font-medium text-[var(--ink-2)]">▸ Chapter 3</div>
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

      {/* SOCIAL PROOF / PROBLEM */}
      <section className="py-20 bg-[var(--bg-2)]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="text-xs font-bold tracking-[0.15em] text-[var(--ink-4)] uppercase mb-3">The problem with AI writing</div>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 leading-tight">
            Most AI writes like a chatbot. We don't.
          </h2>
          <p className="text-lg text-[var(--ink-3)] leading-relaxed">
            Every other tool gives you em dashes, "delve into," "tapestry," and the same six chatbot openers. Editors and readers spot it immediately. We engineered our writer to sound like <em>you</em> instead, by studying a sample of your real prose and matching its cadence, sentence length, and word choice.
          </p>
        </div>
      </section>

      {/* PIPELINE */}
      <section id="pipeline" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-xs font-bold tracking-[0.15em] text-[var(--blue-deep)] uppercase mb-3">The pipeline</div>
            <h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight max-w-3xl mx-auto">
              Blank page to Amazon, in one place.
            </h2>
            <p className="text-lg text-[var(--ink-3)] mt-4 max-w-2xl mx-auto">
              Six stages, one project. Every stage knows about the others.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { n: '01', title: 'Setup', body: 'Title, subtitle, author, trim size, ISBN, dedication, bio. Everything that lands on the cover and in the front matter.' },
              { n: '02', title: 'Voice', body: 'Upload past writing (.docx, .pdf, .txt) or paste a sample. The studio learns your cadence, sentence length, vocabulary, and the small habits that make your prose sound like you.' },
              { n: '03', title: 'Write', body: 'Quick Draft mode generates a full chapter outline and opening from a paragraph description. Manual mode for plotters. Continue, rewrite, or draft new scenes in your voice anytime.' },
              { n: '04', title: 'Edit', body: 'AI Detection Score grades A through F. Voice consistency, pacing, and structure checks find specific issues AND apply rewrites with one click. Nobody else does this.' },
              { n: '05', title: 'Cover', body: 'Eight palette presets, five title fonts, real typography control. Download a 1600×2560 cover ready for KDP.' },
              { n: '06', title: 'Publish', body: 'Export .docx, KDP-ready EPUB 3.0 with nav, print interior PDF with mirrored margins and trim-correct page setup. Upload to KDP and ship.' },
              { n: '07', title: 'Launch', body: 'Walk through Amazon KDP step by step. Description, keywords, categories, and pricing all generated for your book. Copy and paste your way to published.' },
            ].map(item => (
              <div key={item.n} className="p-7 rounded-2xl border border-[var(--line)] hover:border-[var(--blue)]/30 hover:shadow-[var(--shadow-md)] bg-white transition group">
                <div className="font-display text-3xl font-bold text-[var(--blue)]/30 group-hover:text-[var(--blue)] mb-3 transition">{item.n}</div>
                <div className="font-display text-xl font-semibold mb-2">{item.title}</div>
                <div className="text-sm text-[var(--ink-3)] leading-relaxed">{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES vs COMPETITION */}
      <section id="features" className="py-24 bg-[var(--bg-2)]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="text-xs font-bold tracking-[0.15em] text-[var(--blue-deep)] uppercase mb-3">Why authors switch</div>
            <h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight">
              The other tools each do one thing.<br />We do the whole job.
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden shadow-[var(--shadow-md)]">
            <div className="grid grid-cols-5 text-sm font-semibold border-b border-[var(--line)] bg-[var(--bg-2)]">
              <div className="p-4 text-[var(--ink-3)]">Feature</div>
              <div className="p-4 text-center text-[var(--blue-deep)]">Manuscript Studio</div>
              <div className="p-4 text-center text-[var(--ink-3)]">Sudowrite</div>
              <div className="p-4 text-center text-[var(--ink-3)]">Atticus</div>
              <div className="p-4 text-center text-[var(--ink-3)]">Vellum</div>
            </div>
            {[
              ['Voice-trained AI writing', '✓', '~', '✗', '✗'],
              ['AI Detection Score (KDP-aware)', '✓', '✗', '✗', '✗'],
              ['Voice consistency check', '✓', '~', '✗', '✗'],
              ['Cover designer', '✓', '✗', '✗', '✗'],
              ['KDP-ready EPUB 3.0', '✓', '✗', '✓', '✓'],
              ['Print PDF with mirrored margins', '✓', '✗', '✓', '✓'],
              ['Cross-platform', '✓', '✓', '✓', 'Mac only'],
              ['One project, one pipeline', '✓', '✗', '✗', '✗'],
            ].map(([feat, us, sudo, att, vel], i) => (
              <div key={i} className={`grid grid-cols-5 text-sm border-b border-[var(--line)] ${i % 2 === 0 ? 'bg-white' : 'bg-[var(--bg-2)]/40'}`}>
                <div className="p-4 text-[var(--ink-2)] font-medium">{feat}</div>
                <div className="p-4 text-center text-[var(--green)] font-bold">{us}</div>
                <div className="p-4 text-center text-[var(--ink-4)]">{sudo}</div>
                <div className="p-4 text-center text-[var(--ink-4)]">{att}</div>
                <div className="p-4 text-center text-[var(--ink-4)]">{vel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="text-xs font-bold tracking-[0.15em] text-[var(--blue-deep)] uppercase mb-3">Pricing</div>
            <h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight">
              Simple. Honest. Lower than the alternatives.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: 'Free', price: '$0', sub: 'forever', items: ['1 project', '1 voice profile', '30 engine calls per day', 'Export .docx and .txt', 'No credit card'], cta: 'Start free', primary: false },
              { name: 'Pro', price: '$19', sub: 'per month', items: ['Unlimited projects', 'Unlimited voice profiles', '500 engine calls per day', 'All exports (EPUB, PDF, .docx)', 'Cover designer', 'Voice consistency checks', 'Priority engine'], cta: 'Go Pro', primary: true, badge: 'Most popular' },
              { name: 'Studio', price: '$39', sub: 'per month', items: ['Everything in Pro', '2,000 engine calls per day', 'Whole-manuscript line edit', 'AI cover backgrounds (coming)', 'Spine + back cover for paperback', 'Priority support'], cta: 'Go Studio', primary: false },
            ].map(plan => (
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
                      <span className="text-[var(--green)] font-bold mt-0.5 flex-shrink-0">✓</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/login" className={`block w-full text-center py-3 rounded-lg font-semibold transition ${plan.primary ? 'bg-[var(--blue)] hover:bg-[var(--blue-deep)] text-white shadow-[0_4px_14px_rgba(79,109,245,0.4)]' : 'bg-white border border-[var(--line)] text-[var(--ink-2)] hover:border-[var(--blue)] hover:text-[var(--blue-deep)]'}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-10 text-sm text-[var(--ink-3)]">
            Atticus is $147 one-time. Sudowrite Pro is $22/mo. Vellum is $200 and Mac-only. We do everything they do, plus the writing.
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-[var(--blue-deep)] to-[var(--blue)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="max-w-3xl mx-auto px-6 text-center relative">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
            Stop wrestling four apps.<br />Start writing your book.
          </h2>
          <p className="text-lg text-white/85 mb-9 leading-relaxed">
            Free forever for your first project. No credit card. Magic link sign-in.
          </p>
          <Link href="/login" className="inline-block px-9 py-4 rounded-lg bg-white hover:bg-white/95 text-[var(--blue-deep)] font-bold text-base shadow-xl transition">
            Start writing free →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[var(--ink)] text-white/70 py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--blue)] to-[var(--blue-deep)] grid place-items-center text-white font-display font-bold text-[16px]">M</div>
              <span className="font-bold text-white">Manuscript Studio</span>
            </div>
            <div className="text-sm">
              Built by{' '}
              <a href="https://sovereignshieldtechnologies.com" className="underline hover:text-white">
                Sovereign Shield Technologies
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-xs text-white/40">
            © {new Date().getFullYear()} Sovereign Shield Technologies LLC. Your manuscripts remain yours. We never train on your work.
          </div>
        </div>
      </footer>
    </main>
  );
}
