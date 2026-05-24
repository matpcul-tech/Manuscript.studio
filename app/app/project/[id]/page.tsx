'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { callEngine, scrubText, countWords, computeAIScore, type AIScore } from '@/lib/engine';
import { exportDocx, exportEpub, exportPdf, exportBundle } from '@/lib/exports';
import { defaultProjectData, cid, type ProjectData, type Chapter, type Scene } from '@/lib/types';

const STAGES = [
  { id: 'setup', label: 'Setup' },
  { id: 'voice', label: 'Voice' },
  { id: 'write', label: 'Write' },
  { id: 'edit', label: 'Edit' },
  { id: 'cover', label: 'Cover' },
  { id: 'publish', label: 'Publish' },
];

const COVER_PRESETS: Record<string, { bg: string[]; text: string; overlay: number }> = {
  midnight: { bg: ['#1a1f3a', '#2d1b4e'], text: '#ffffff', overlay: 35 },
  terracotta: { bg: ['#8b3a1f', '#4a1f12'], text: '#f4ead4', overlay: 30 },
  forest: { bg: ['#1f3a2d', '#0e1f17'], text: '#e8e0c8', overlay: 30 },
  parchment: { bg: ['#d4c4a0', '#8a7a55'], text: '#1a1714', overlay: 15 },
  bone: { bg: ['#ede8dd', '#b8aa90'], text: '#1a1714', overlay: 10 },
  indigo: { bg: ['#2d3a8a', '#1a1f5e'], text: '#ffffff', overlay: 35 },
  rust: { bg: ['#c46a3f', '#6b2f15'], text: '#f4ead4', overlay: 30 },
  onyx: { bg: ['#0a0a0a', '#2a2a2a'], text: '#f4ead4', overlay: 40 },
};

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [projectName, setProjectName] = useState('Untitled Project');
  const [data, setData] = useState<ProjectData>(defaultProjectData());
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved');
  const [toastMsg, setToastMsg] = useState<{ text: string; kind?: string } | null>(null);
  const saveTimerRef = useRef<any>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => { loadProject(); }, [id]);

  async function loadProject() {
    try {
      const r = await fetch(`/api/projects/${id}`);
      const json = await r.json();
      if (json.project) {
        setProjectName(json.project.name);
        if (json.project.data && Object.keys(json.project.data).length) {
          setData({ ...defaultProjectData(), ...json.project.data });
        }
      }
    } catch (e) {}
    setLoaded(true);
  }

  const persist = useCallback(async (next: ProjectData, name?: string) => {
    setSaveState('saving');
    try {
      await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name ?? projectName,
          data: next,
          word_count: totalWords(next),
        }),
      });
    } catch (e) {}
    setSaveState('saved');
  }, [id, projectName]);

  const markDirty = useCallback((nextData?: ProjectData, nextName?: string) => {
    if (nextData) setData(nextData);
    setSaveState('saving');
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      persist(nextData || dataRef.current, nextName);
    }, 700);
  }, [persist]);

  function toast(text: string, kind?: string) {
    setToastMsg({ text, kind });
    setTimeout(() => setToastMsg(null), 3000);
  }

  function totalWords(d: ProjectData = data): number {
    let n = 0;
    d.chapters.forEach(ch => ch.scenes.forEach(sc => n += countWords(sc.body)));
    return n;
  }

  function findScene(d: ProjectData, sceneId: string) {
    for (const ch of d.chapters) for (const sc of ch.scenes) if (sc.id === sceneId) return { chapter: ch, scene: sc };
    return null;
  }

  function activeScene() {
    return findScene(data, data.activeSceneId) || { chapter: data.chapters[0], scene: data.chapters[0].scenes[0] };
  }

  function setStage(name: string) {
    const next = { ...data, currentStage: name };
    setData(next);
    markDirty(next);
  }

  function updateData(updater: (d: ProjectData) => ProjectData) {
    const next = updater({ ...data });
    setData(next);
    markDirty(next);
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-2)]">
        <div className="text-[var(--ink-3)]">Loading<span className="dots"><span></span><span></span><span></span></span></div>
      </div>
    );
  }

  return (
    <main className="h-screen flex flex-col bg-[var(--bg-2)] overflow-hidden">
      {/* TOP BAR */}
      <header className="h-[60px] bg-white border-b border-[var(--line)] flex items-center px-5 gap-3 z-30 flex-shrink-0">
        <Link href="/app" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--blue)] to-[var(--blue-deep)] grid place-items-center text-white font-display font-bold text-[16px]">M</div>
        </Link>
        <div className="w-px h-7 bg-[var(--line)]" />
        <input
          value={projectName}
          onChange={e => { setProjectName(e.target.value); markDirty(undefined, e.target.value); }}
          className="text-sm font-medium text-[var(--ink-2)] bg-transparent border border-transparent hover:bg-[var(--bg-3)] focus:bg-white focus:border-[var(--blue)] px-2.5 py-1.5 rounded-md outline-none min-w-[220px] transition"
        />

        <div className="flex-1" />

        <div className="flex gap-1 bg-[var(--bg-3)] p-1 rounded-[10px]">
          {STAGES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStage(s.id)}
              className={`px-3.5 py-1.5 rounded-[7px] text-[13px] font-medium transition flex items-center gap-1.5 ${
                data.currentStage === s.id
                  ? 'bg-white text-[var(--blue-deep)] shadow-sm'
                  : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
              }`}
            >
              <span className={`w-[18px] h-[18px] rounded-full text-[10px] font-bold grid place-items-center ${
                data.currentStage === s.id ? 'bg-[var(--blue)] text-white' : 'bg-[var(--ink-5)] text-white'
              }`}>{i + 1}</span>
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3 text-xs text-[var(--ink-3)]">
          <span><b className="text-[var(--ink-2)]">{totalWords().toLocaleString()}</b> words</span>
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${saveState === 'saving' ? 'bg-[var(--amber)]' : 'bg-[var(--green)]'}`} />
            {saveState}
          </span>
        </div>
      </header>

      {/* STAGES */}
      <div className="flex-1 overflow-hidden">
        {data.currentStage === 'setup' && <SetupStage data={data} updateData={updateData} onNext={() => setStage('voice')} />}
        {data.currentStage === 'voice' && <VoiceStage data={data} updateData={updateData} toast={toast} />}
        {data.currentStage === 'write' && <WriteStage data={data} updateData={updateData} toast={toast} />}
        {data.currentStage === 'edit' && <EditStage data={data} updateData={updateData} toast={toast} activeScene={activeScene} />}
        {data.currentStage === 'cover' && <CoverStage data={data} updateData={updateData} toast={toast} />}
        {data.currentStage === 'publish' && <PublishStage data={data} toast={toast} />}
      </div>

      {/* TOAST */}
      {toastMsg && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-white text-sm font-medium shadow-lg z-[200] ${
          toastMsg.kind === 'error' ? 'bg-[var(--red)]' : toastMsg.kind === 'success' ? 'bg-[var(--green)]' : 'bg-[var(--ink)]'
        }`} style={{ animation: 'fadeIn 0.2s' }}>
          {toastMsg.text}
        </div>
      )}
    </main>
  );
}

/* ==================== SETUP STAGE ==================== */
function SetupStage({ data, updateData, onNext }: any) {
  function f<K extends keyof ProjectData>(key: K, val: ProjectData[K]) {
    updateData((d: ProjectData) => ({ ...d, [key]: val }));
  }
  return (
    <div className="h-full overflow-y-auto p-10">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-display text-3xl font-semibold mb-1.5">Set up your book</h2>
        <p className="text-[var(--ink-3)] mb-8">Details that flow into the cover, front matter, and KDP listing.</p>

        <div className="space-y-5">
          <Section title="The book">
            <Field label="Title">
              <input value={data.title} onChange={e => f('title', e.target.value)} className={inputCls} placeholder="A Spirit Reborn" />
            </Field>
            <Field label="Subtitle (optional)">
              <input value={data.subtitle} onChange={e => f('subtitle', e.target.value)} className={inputCls} placeholder="The Unconquered and Unconquerable Chickasaw Nation" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Author name">
                <input value={data.author} onChange={e => f('author', e.target.value)} className={inputCls} placeholder="Your name on the cover" />
              </Field>
              <Field label="Genre">
                <select value={data.genre} onChange={e => f('genre', e.target.value)} className={inputCls}>
                  <option value="literary">Literary Fiction</option>
                  <option value="historical">Historical / Memoir</option>
                  <option value="thriller">Thriller / Mystery</option>
                  <option value="romance">Romance</option>
                  <option value="scifi">Sci-Fi / Fantasy</option>
                  <option value="nonfiction">Nonfiction / Self-Help</option>
                  <option value="business">Business</option>
                  <option value="poetry">Poetry / Essays</option>
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Print specifications">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Trim size">
                <select value={data.trim} onChange={e => f('trim', e.target.value)} className={inputCls}>
                  <option value="5x8">5 × 8 in</option>
                  <option value="5.25x8">5.25 × 8 in</option>
                  <option value="5.5x8.5">5.5 × 8.5 in</option>
                  <option value="6x9">6 × 9 in</option>
                  <option value="7x10">7 × 10 in</option>
                </select>
              </Field>
              <Field label="Interior">
                <select value={data.interior} onChange={e => f('interior', e.target.value)} className={inputCls}>
                  <option value="bw">Black &amp; White</option>
                  <option value="color">Color</option>
                </select>
              </Field>
              <Field label="Paper">
                <select value={data.paper} onChange={e => f('paper', e.target.value)} className={inputCls}>
                  <option value="cream">Cream</option>
                  <option value="white">White</option>
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Copyright &amp; front matter">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Publisher (optional)">
                <input value={data.publisher} onChange={e => f('publisher', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Publication year">
                <input type="number" value={data.pubYear} onChange={e => f('pubYear', parseInt(e.target.value) || new Date().getFullYear())} className={inputCls} />
              </Field>
            </div>
            <Field label="ISBN (optional)" hint="Leave blank if using KDP's free ISBN.">
              <input value={data.isbn} onChange={e => f('isbn', e.target.value)} className={inputCls} placeholder="978-..." />
            </Field>
            <Field label="Dedication (optional)">
              <textarea value={data.dedication} onChange={e => f('dedication', e.target.value)} className={textareaCls + ' min-h-[60px]'} placeholder="For my grandmother, who first told me these stories." />
            </Field>
            <Field label="Author bio (back matter)">
              <textarea value={data.bio} onChange={e => f('bio', e.target.value)} className={textareaCls} placeholder="Short third-person bio. Appears on the About the Author page." />
            </Field>
          </Section>

          <button onClick={onNext} className="mt-2 px-5 py-3 rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-deep)] text-white font-semibold transition">
            Save and continue to Voice →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==================== VOICE STAGE ==================== */
function VoiceStage({ data, updateData, toast }: any) {
  const [studying, setStudying] = useState(false);

  async function study() {
    if (countWords(data.voiceSample) < 100) { toast('Add at least 100 words.', 'error'); return; }
    setStudying(true);
    try {
      const profile = await callEngine({
        task: '',
        userPrompt: `Sample:\n\n${data.voiceSample.slice(0, 8000)}${data.voiceNotes ? '\n\nWriter\'s own notes:\n' + data.voiceNotes : ''}`,
        systemOverride: `Analyze writing voice. Produce 8 to 12 short, specific observations about: typical sentence length and rhythm, opening patterns, vocabulary register, use of dialogue, signature words or constructions the writer favors, things avoided, paragraph length, point of view habits, regional markers. Be concrete. Return only a bulleted list, one observation per line, each starting with "- ". No preamble.`,
        maxTokens: 700,
      });
      updateData((d: ProjectData) => ({ ...d, voiceProfile: profile }));
      toast('Voice profile saved.', 'success');
    } catch (e: any) {
      toast(e.message || 'Could not study voice.', 'error');
    } finally {
      setStudying(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto p-10">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-display text-3xl font-semibold mb-1.5">Train your voice</h2>
        <p className="text-[var(--ink-3)] mb-7 max-w-2xl">Paste a sample of your own writing. The longer and more honest, the better the match.</p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-5">
          <div className="bg-white border border-[var(--line)] rounded-xl p-6 shadow-sm">
            <Field label="Voice sample" hint="500 words is enough. 2,000 to 3,000 ideal. Past writing, blog posts, journal entries.">
              <textarea
                value={data.voiceSample}
                onChange={e => updateData((d: ProjectData) => ({ ...d, voiceSample: e.target.value }))}
                className={textareaCls + ' min-h-[280px]'}
                placeholder="Paste your writing here..."
              />
              <div className="mt-2 text-xs text-[var(--ink-3)]"><b>{countWords(data.voiceSample).toLocaleString()}</b> words</div>
            </Field>
            <Field label="Extra voice notes (optional)" hint="Anything the sample might not show. Words you avoid, sentence moves you favor.">
              <textarea
                value={data.voiceNotes}
                onChange={e => updateData((d: ProjectData) => ({ ...d, voiceNotes: e.target.value }))}
                className={textareaCls}
                placeholder="Example: Never use em dashes. Short paragraphs. Concrete nouns."
              />
            </Field>
            <button onClick={study} disabled={studying} className={btnPrimary}>
              {studying ? <>Studying<span className="dots"><span></span><span></span><span></span></span></> : 'Study this sample'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-[var(--line)] rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`inline-block w-3 h-3 rounded-full ${data.voiceSample ? 'bg-[var(--green)] shadow-[0_0_0_4px_rgba(16,185,129,0.18)]' : 'bg-[var(--ink-4)]'}`} />
                <strong className="text-sm">Voice profile</strong>
              </div>
              <div className="text-xs text-[var(--ink-3)] leading-relaxed">
                {data.voiceSample
                  ? `${countWords(data.voiceSample).toLocaleString()} words trained${data.voiceProfile ? '. Profile active.' : '. Awaiting analysis.'}`
                  : 'No sample studied yet.'}
              </div>
            </div>
            <div className="bg-white border border-[var(--line)] rounded-xl p-4 shadow-sm">
              <strong className="text-xs block mb-2">Distilled style observations</strong>
              <div className="bg-[var(--bg-2)] rounded-lg p-3.5 text-[13px] leading-[1.7] text-[var(--ink-2)] max-h-[280px] overflow-y-auto whitespace-pre-wrap font-serif">
                {data.voiceProfile || 'Will appear after voice study completes.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== WRITE STAGE ==================== */
function WriteStage({ data, updateData, toast }: any) {
  const [fabOpen, setFabOpen] = useState(false);
  const [activeScenePos, setActiveScenePos] = useState({ start: 0, end: 0 });
  const [draftModal, setDraftModal] = useState(false);
  const [rewriteModal, setRewriteModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const ctx = findScene(data, data.activeSceneId) || { chapter: data.chapters[0], scene: data.chapters[0].scenes[0] };

  function findScene(d: ProjectData, sceneId: string) {
    for (const ch of d.chapters) for (const sc of ch.scenes) if (sc.id === sceneId) return { chapter: ch, scene: sc };
    return null;
  }

  function updateScene(newBody?: string, newTitle?: string) {
    updateData((d: ProjectData) => {
      const c = { ...d, chapters: d.chapters.map(ch => ({
        ...ch,
        scenes: ch.scenes.map(sc =>
          sc.id === d.activeSceneId
            ? { ...sc, body: newBody !== undefined ? newBody : sc.body, title: newTitle !== undefined ? newTitle : sc.title }
            : sc
        ),
      })) };
      return c;
    });
  }

  function switchScene(id: string) {
    updateData((d: ProjectData) => ({ ...d, activeSceneId: id }));
  }

  function addChapter() {
    updateData((d: ProjectData) => {
      const n = d.chapters.length + 1;
      const sc = { id: cid(), title: 'New scene', body: '' };
      return { ...d, chapters: [...d.chapters, { id: cid(), title: `Chapter ${n}`, open: true, scenes: [sc] }], activeSceneId: sc.id };
    });
  }

  function addScene(chId: string) {
    updateData((d: ProjectData) => {
      const newSc = { id: cid(), title: '', body: '' };
      const next = { ...d, chapters: d.chapters.map(ch => {
        if (ch.id !== chId) return ch;
        const t = `Scene ${ch.scenes.length + 1}`;
        return { ...ch, open: true, scenes: [...ch.scenes, { ...newSc, title: t }] };
      }) };
      next.activeSceneId = newSc.id;
      return next;
    });
  }

  function deleteChapter(chId: string) {
    if (data.chapters.length === 1) { toast('Need at least one chapter.', 'error'); return; }
    if (!confirm('Delete this chapter?')) return;
    updateData((d: ProjectData) => {
      const next = { ...d, chapters: d.chapters.filter(c => c.id !== chId) };
      next.activeSceneId = next.chapters[0].scenes[0].id;
      return next;
    });
  }

  function deleteScene(chId: string, scId: string) {
    const ch = data.chapters.find((c: Chapter) => c.id === chId);
    if (!ch || ch.scenes.length === 1) { toast('Each chapter needs at least one scene.', 'error'); return; }
    if (!confirm('Delete this scene?')) return;
    updateData((d: ProjectData) => {
      const next = { ...d, chapters: d.chapters.map(c => c.id !== chId ? c : { ...c, scenes: c.scenes.filter(s => s.id !== scId) }) };
      if (next.activeSceneId === scId) {
        const c = next.chapters.find(c => c.id === chId)!;
        next.activeSceneId = c.scenes[0].id;
      }
      return next;
    });
  }

  function toggleChapter(chId: string) {
    updateData((d: ProjectData) => ({ ...d, chapters: d.chapters.map(c => c.id === chId ? { ...c, open: !c.open } : c) }));
  }

  function renameChapter(chId: string, title: string) {
    updateData((d: ProjectData) => ({ ...d, chapters: d.chapters.map(c => c.id === chId ? { ...c, title } : c) }));
  }

  function renameScene(chId: string, scId: string, title: string) {
    updateData((d: ProjectData) => ({ ...d, chapters: d.chapters.map(c => c.id !== chId ? c : { ...c, scenes: c.scenes.map(s => s.id === scId ? { ...s, title } : s) }) }));
  }

  function insertAtCursor(text: string) {
    const e = editorRef.current;
    if (!e) return;
    const s = e.selectionStart, en = e.selectionEnd;
    const newVal = e.value.slice(0, s) + text + e.value.slice(en);
    updateScene(newVal);
    requestAnimationFrame(() => {
      e.setSelectionRange(s + text.length, s + text.length);
      e.focus();
    });
  }

  async function draftScene(direction: string, length: string, tone: string) {
    if (!direction.trim()) { toast('Tell the writer what happens.', 'error'); return; }
    const lenMap: any = { short: 'about 250 words', medium: 'about 500 words', long: 'about 900 words' };
    const toneMap: any = {
      match: 'Match the tone of the voice sample.',
      tense: 'Tone: tense and quiet. Restraint. Pressure underneath.',
      warm: 'Tone: warm, reflective.',
      sharp: 'Tone: sharp, observational.',
      lyrical: 'Tone: lyrical but disciplined.',
      plainspoken: 'Tone: plainspoken. Direct. Nothing showy.',
    };
    const prev = ctx.scene.body.trim();
    const prevCtx = prev ? `Existing text (continue from this):\n---\n${prev.slice(-1500)}\n---\n\n` : '';
    setBusy(true);
    try {
      const result = await callEngine({
        task: `TASK: Write a scene of ${lenMap[length]}. ${toneMap[tone]} ${prev ? 'Continue from existing text so the join is invisible.' : 'Open the scene however feels right.'}`,
        userPrompt: prevCtx + 'Scene direction:\n' + direction,
        voiceSample: data.voiceSample,
        voiceProfile: data.voiceProfile,
        voiceNotes: data.voiceNotes,
        maxTokens: 2200,
      });
      const sep = prev && !prev.endsWith('\n') ? '\n\n' : '';
      updateScene(ctx.scene.body + sep + result);
      setDraftModal(false);
      toast('Scene drafted.', 'success');
    } catch (e: any) {
      toast(e.message || 'Draft failed.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function continueWriting() {
    setFabOpen(false);
    const body = ctx.scene.body.trim();
    if (body.length < 40) { toast('Write a sentence or two first.', 'error'); return; }
    try {
      const result = await callEngine({
        task: 'TASK: Continue this passage. About 350 words. Pick up naturally from the last sentence. Do not summarize.',
        userPrompt: `Passage:\n---\n${body.slice(-3000)}\n---\n\nContinue.`,
        voiceSample: data.voiceSample,
        voiceProfile: data.voiceProfile,
        voiceNotes: data.voiceNotes,
        maxTokens: 1500,
      });
      const sep = body.endsWith('\n') ? '' : '\n\n';
      updateScene(ctx.scene.body + sep + result);
      toast('Continued.', 'success');
    } catch (e: any) {
      toast(e.message || 'Could not continue.', 'error');
    }
  }

  async function rewriteSelection(move: string, custom: string) {
    const e = editorRef.current;
    if (!e) return;
    const s = e.selectionStart, en = e.selectionEnd;
    const sel = e.value.slice(s, en);
    if (!sel.trim()) { toast('Highlight text first.', 'error'); return; }
    const moves: any = {
      tighten: 'Cut every word that does not earn its place. Shorter. Keep meaning, lose fat.',
      expand: 'Add a concrete detail, beat of action, or interior moment. No padding adjectives.',
      vivid: 'Push for sensory specifics. Replace abstract words with concrete ones.',
      quieter: 'Strip drama. Make it understated. Trust the reader.',
      dialogue: 'Add or extend dialogue. Simple speech tags. Let dialogue do work.',
      voice: 'Match the loaded voice sample harder. Cadence, length, word choice.',
    };
    const instr = move === 'custom' ? `Rewrite move: ${custom}` : moves[move];
    setBusy(true);
    try {
      const result = await callEngine({
        task: `TASK: Rewrite the passage. ${instr}\nReturn ONLY the rewritten passage.`,
        userPrompt: `Passage:\n---\n${sel}\n---`,
        voiceSample: data.voiceSample,
        voiceProfile: data.voiceProfile,
        voiceNotes: data.voiceNotes,
        maxTokens: 1800,
      });
      const newVal = e.value.slice(0, s) + result + e.value.slice(en);
      updateScene(newVal);
      setRewriteModal(false);
      toast('Rewritten.', 'success');
    } catch (er: any) {
      toast(er.message || 'Rewrite failed.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="h-full grid grid-cols-[260px,1fr] overflow-hidden">
      {/* TREE */}
      <aside className="bg-white border-r border-[var(--line)] flex flex-col overflow-hidden">
        <div className="px-4 pt-4.5 pb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--ink-4)]">Manuscript</span>
          <button onClick={addChapter} className="w-7 h-7 rounded-md text-[var(--ink-3)] hover:bg-[var(--bg-3)] hover:text-[var(--blue)] grid place-items-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {data.chapters.map((ch: Chapter) => (
            <div key={ch.id} className="mb-0.5">
              <div className="flex items-center px-2 py-1.5 rounded-md hover:bg-[var(--bg-3)] cursor-pointer group">
                <button onClick={(e) => { e.stopPropagation(); toggleChapter(ch.id); }} className={`w-3.5 h-3.5 grid place-items-center text-[var(--ink-4)] transition ${ch.open ? 'rotate-90' : ''}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-2.5 h-2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
                <input
                  value={ch.title}
                  onChange={e => renameChapter(ch.id, e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className="flex-1 ml-1.5 text-[13.5px] font-medium text-[var(--ink-2)] bg-transparent outline-none truncate"
                />
                <div className="hidden group-hover:flex gap-0.5">
                  <button onClick={(e) => { e.stopPropagation(); addScene(ch.id); }} className="w-5 h-5 rounded text-[var(--ink-4)] hover:bg-white hover:text-[var(--blue)] grid place-items-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3"><path d="M12 5v14M5 12h14"/></svg>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteChapter(ch.id); }} className="w-5 h-5 rounded text-[var(--ink-4)] hover:bg-white hover:text-[var(--red)] grid place-items-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                  </button>
                </div>
              </div>
              {ch.open && (
                <div className="ml-[22px] pl-2 border-l border-[var(--line-2)]">
                  {ch.scenes.map((sc: Scene) => (
                    <div
                      key={sc.id}
                      onClick={() => switchScene(sc.id)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-[12.5px] cursor-pointer group ${
                        sc.id === data.activeSceneId ? 'bg-[var(--blue-soft)]' : 'hover:bg-[var(--bg-3)]'
                      }`}
                    >
                      <span className={`w-1 h-1 rounded-full ${sc.id === data.activeSceneId ? 'bg-[var(--blue)]' : 'bg-[var(--ink-4)]'}`} />
                      <input
                        value={sc.title}
                        onChange={e => renameScene(ch.id, sc.id, e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className={`flex-1 bg-transparent outline-none truncate ${sc.id === data.activeSceneId ? 'text-[var(--blue-deep)] font-semibold' : 'text-[var(--ink-2)]'}`}
                      />
                      <span className="text-[10.5px] text-[var(--ink-4)] font-mono group-hover:hidden tabular-nums">{countWords(sc.body) || ''}</span>
                      <button onClick={(e) => { e.stopPropagation(); deleteScene(ch.id, sc.id); }} className="hidden group-hover:grid w-4 h-4 rounded place-items-center text-[var(--ink-4)] hover:text-[var(--red)]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addScene(ch.id)} className="mt-0.5 mb-2 ml-1 px-2 py-1 text-xs text-[var(--ink-3)] hover:text-[var(--blue)] flex items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-2.5 h-2.5"><path d="M12 5v14M5 12h14"/></svg>
                    Add scene
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* EDITOR */}
      <main className="flex flex-col overflow-hidden bg-[var(--bg-2)]">
        <div className="h-11 bg-white border-b border-[var(--line)] flex items-center px-6 gap-1">
          <div className="ml-auto px-3 py-1 bg-[var(--bg-3)] rounded-full text-xs text-[var(--ink-3)] tabular-nums">
            <b className="text-[var(--blue-deep)]">{countWords(ctx.scene.body)}</b> words in scene
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-9 pb-48 flex justify-center">
          <div className="bg-white w-full max-w-[760px] rounded-xl shadow-sm border border-[var(--line)] p-14">
            <input
              value={ctx.scene.title}
              onChange={e => updateScene(undefined, e.target.value)}
              placeholder="Scene title"
              className="w-full bg-transparent border-none outline-none font-display text-3xl font-semibold tracking-tight leading-tight mb-1.5 placeholder:text-[var(--ink-4)] placeholder:italic"
            />
            <div className="text-[11px] tracking-[0.08em] uppercase text-[var(--ink-4)] mb-8 font-semibold">{ctx.chapter.title}</div>
            <textarea
              ref={editorRef}
              value={ctx.scene.body}
              onChange={e => updateScene(e.target.value)}
              placeholder="Start writing, or tap the blue button to draft in your voice."
              spellCheck
              className="w-full bg-transparent border-none outline-none resize-none font-serif text-[18px] leading-[1.78] text-[var(--ink)] min-h-[60vh] placeholder:text-[var(--ink-4)] placeholder:italic"
            />
          </div>
        </div>
      </main>

      {/* FAB */}
      <div className="fixed right-8 bottom-8 flex flex-col items-end gap-3 z-50">
        {fabOpen && (
          <div className="flex flex-col gap-2 items-end">
            <button onClick={() => { setFabOpen(false); setDraftModal(true); }} className={fabItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
              Draft this scene
            </button>
            <button onClick={continueWriting} className={fabItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
              Continue from here
            </button>
            <button onClick={() => { setFabOpen(false); setRewriteModal(true); }} className={fabItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M3 12a9 9 0 0 1 15-6.7"/><path d="M21 12a9 9 0 0 1-15 6.7"/></svg>
              Rewrite selection
            </button>
          </div>
        )}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--blue)] to-[var(--blue-deep)] text-white grid place-items-center shadow-[0_8px_24px_rgba(79,109,245,0.45)] hover:scale-105 transition"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`w-6 h-6 transition ${fabOpen ? 'rotate-45' : ''}`}><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>

      {draftModal && <DraftModal data={data} onClose={() => setDraftModal(false)} onSubmit={draftScene} busy={busy} />}
      {rewriteModal && <RewriteModal editorRef={editorRef} onClose={() => setRewriteModal(false)} onSubmit={rewriteSelection} busy={busy} />}
    </div>
  );
}

/* ==================== EDIT STAGE ==================== */
function EditStage({ data, updateData, toast, activeScene }: any) {
  const [scope, setScope] = useState('scene');
  const [scopeCh, setScopeCh] = useState(data.chapters[0]?.id || '');
  const [busy, setBusy] = useState('');
  const [consistencyResult, setConsistencyResult] = useState('');
  const [pacingResult, setPacingResult] = useState('');

  function getTarget() {
    if (scope === 'scene') {
      const ctx = activeScene();
      return { text: ctx.scene.body, label: `${ctx.chapter.title} · ${ctx.scene.title}` };
    }
    if (scope === 'chapter') {
      const ch = data.chapters.find((c: Chapter) => c.id === scopeCh) || data.chapters[0];
      return { text: ch.scenes.map((s: Scene) => s.body).join('\n\n'), label: ch.title };
    }
    return { text: data.chapters.map((ch: Chapter) => `${ch.title}\n\n${ch.scenes.map((s: Scene) => s.body).join('\n\n')}`).join('\n\n'), label: 'Whole manuscript' };
  }

  const target = getTarget();
  const aiScore: AIScore = computeAIScore(target.text);

  function applyScrub() {
    updateData((d: ProjectData) => {
      const next = { ...d };
      if (scope === 'scene') {
        next.chapters = next.chapters.map(ch => ({ ...ch, scenes: ch.scenes.map(s => s.id === d.activeSceneId ? { ...s, body: scrubText(s.body) } : s) }));
      } else if (scope === 'chapter') {
        next.chapters = next.chapters.map(ch => ch.id !== scopeCh ? ch : { ...ch, scenes: ch.scenes.map(s => ({ ...s, body: scrubText(s.body) })) });
      } else {
        next.chapters = next.chapters.map(ch => ({ ...ch, scenes: ch.scenes.map(s => ({ ...s, body: scrubText(s.body) })) }));
      }
      return next;
    });
    toast('Tells removed.', 'success');
  }

  async function lineEdit() {
    if (!target.text.trim()) { toast('Nothing to edit.', 'error'); return; }
    if (countWords(target.text) > 2500 && !confirm(`This will edit ${countWords(target.text)} words. Continue?`)) return;
    setBusy('line');
    try {
      const result = await callEngine({
        task: 'TASK: Line edit this passage. Tighten sentences, sharpen verbs, remove redundancy, kill stiff phrasing, PRESERVE the voice and meaning. Do not rewrite for content. Return the edited passage only.',
        userPrompt: `Passage:\n---\n${target.text.slice(0, 12000)}\n---`,
        voiceSample: data.voiceSample,
        voiceProfile: data.voiceProfile,
        voiceNotes: data.voiceNotes,
        maxTokens: 3500,
      });
      updateData((d: ProjectData) => {
        const next = { ...d };
        if (scope === 'scene') {
          next.chapters = next.chapters.map(ch => ({ ...ch, scenes: ch.scenes.map(s => s.id === d.activeSceneId ? { ...s, body: result } : s) }));
        } else if (scope === 'chapter') {
          next.chapters = next.chapters.map(ch => ch.id !== scopeCh ? ch : { ...ch, scenes: [{ ...ch.scenes[0], body: result }] });
        }
        return next;
      });
      toast('Line edit complete.', 'success');
    } catch (e: any) {
      toast(e.message || 'Edit failed.', 'error');
    } finally {
      setBusy('');
    }
  }

  async function checkConsistency() {
    if (!data.voiceSample) { toast('Train a voice first.', 'error'); return; }
    if (!target.text.trim()) { toast('Nothing to check.', 'error'); return; }
    setBusy('cons');
    try {
      const result = await callEngine({
        task: '',
        userPrompt: `VOICE SAMPLE:\n---\n${data.voiceSample.slice(0, 4000)}\n---\n\nPASSAGE TO CHECK:\n---\n${target.text.slice(0, 6000)}\n---\n\nReport voice drift and suggest fixes.`,
        systemOverride: `You are a voice-consistency editor. Compare the passage to the voice sample and report drift. Be specific: cite phrases that don't match, differences in sentence length, register, or vocabulary. Suggest concrete fixes. Short prose paragraph followed by 3 to 6 bullet points.`,
        maxTokens: 1200,
      });
      setConsistencyResult(result);
    } catch (e: any) {
      toast(e.message || 'Check failed.', 'error');
    } finally {
      setBusy('');
    }
  }

  async function reviewPacing() {
    if (!target.text.trim()) { toast('Nothing to review.', 'error'); return; }
    setBusy('pace');
    try {
      const result = await callEngine({
        task: '',
        userPrompt: `Passage:\n---\n${target.text.slice(0, 8000)}\n---`,
        systemOverride: `You are a developmental editor. Report on pacing and structure. Where does pace drag? Where does it rush? What needs a beat? Short prose intro then 4 to 6 specific bullet points with concrete suggestions. Be direct.`,
        maxTokens: 1200,
      });
      setPacingResult(result);
    } catch (e: any) {
      toast(e.message || 'Review failed.', 'error');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="h-full overflow-y-auto p-9">
      <div className="max-w-[1320px] mx-auto">
        <h2 className="font-display text-3xl font-semibold mb-1.5">Edit and polish</h2>
        <p className="text-[var(--ink-3)] mb-6">Watch your AI Detection Score, strip the patterns Amazon flags, run a line edit, check voice consistency.</p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-5">
          <div className="bg-white rounded-xl border border-[var(--line)] p-10 shadow-sm max-h-[calc(100vh-180px)] overflow-y-auto font-serif text-[16px] leading-[1.78] text-[var(--ink)] whitespace-pre-wrap">
            {target.text || <em className="text-[var(--ink-3)] italic">Pick a scope on the right and the text loads here.</em>}
          </div>

          <div className="space-y-4">
            <div className={editCard}>
              <h4 className="font-display text-[17px] font-semibold mb-1">Scope</h4>
              <p className="text-xs text-[var(--ink-3)] mb-3">What does this pass run on?</p>
              <div className="flex gap-1 p-1 bg-[var(--bg-3)] rounded-lg mb-3">
                {[['scene', 'Current scene'], ['chapter', 'Current chapter'], ['all', 'Whole manuscript']].map(([v, l]) => (
                  <button key={v} onClick={() => setScope(v)} className={`flex-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${scope === v ? 'bg-white text-[var(--blue-deep)] shadow-sm' : 'text-[var(--ink-3)]'}`}>{l}</button>
                ))}
              </div>
              {scope === 'chapter' && (
                <select value={scopeCh} onChange={e => setScopeCh(e.target.value)} className={inputCls}>
                  {data.chapters.map((c: Chapter) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              )}
            </div>

            <div className={editCard}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-display text-[17px] font-semibold">AI Detection Score</h4>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--green-soft)] text-[var(--green)] text-[10px] font-bold tracking-wider uppercase flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-xs text-[var(--ink-3)] mb-3">How likely this reads as AI-generated. Tuned against the patterns KDP review flags.</p>
              {aiScore.totalWords === 0 ? (
                <div className="text-center py-6 text-[var(--ink-4)] italic text-sm">Write something to see your score.</div>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: aiScore.color + '14', border: `1px solid ${aiScore.color}30` }}>
                    <div className="w-[68px] h-[68px] rounded-lg grid place-items-center flex-shrink-0 font-display font-bold text-[42px] text-white" style={{ background: aiScore.color }}>
                      {aiScore.grade}
                    </div>
                    <div className="min-w-0">
                      <div className="font-display font-bold text-[15px]" style={{ color: aiScore.color }}>
                        {aiScore.density.toFixed(2)} tells per 1k words
                      </div>
                      <div className="text-xs text-[var(--ink-2)] mt-1 leading-snug">{aiScore.risk}</div>
                    </div>
                  </div>
                  {aiScore.byPattern.length > 0 ? (
                    <div className="mt-3">
                      <div className="mb-3 flex flex-wrap gap-1">
                        {aiScore.byPattern.map(p => (
                          <span key={p.label} className="inline-flex items-center gap-1 bg-[var(--amber-soft)] text-[#92400e] px-2 py-1 rounded-full text-[11.5px] font-medium">
                            {p.label} · <b>{p.count}</b>
                          </span>
                        ))}
                      </div>
                      <button onClick={applyScrub} className={btnPrimaryFull}>Fix all tells</button>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 text-xs text-[var(--green)] font-semibold">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Clean. No AI tells detected.
                    </div>
                  )}
                </>
              )}
            </div>

            <div className={editCard}>
              <h4 className="font-display text-[17px] font-semibold mb-1">Line edit</h4>
              <p className="text-xs text-[var(--ink-3)] mb-3">Tighten sentences. Preserves voice.</p>
              <button onClick={lineEdit} disabled={busy === 'line'} className={btnPrimaryFull}>
                {busy === 'line' ? <>Editing<span className="dots"><span></span><span></span><span></span></span></> : 'Run line edit'}
              </button>
            </div>

            <div className={editCard}>
              <h4 className="font-display text-[17px] font-semibold mb-1">Voice consistency</h4>
              <p className="text-xs text-[var(--ink-3)] mb-3">Check against your trained voice.</p>
              <button onClick={checkConsistency} disabled={busy === 'cons'} className={btnGhostFull}>
                {busy === 'cons' ? <>Checking<span className="dots"><span></span><span></span><span></span></span></> : 'Check consistency'}
              </button>
              {consistencyResult && (
                <div className="mt-3 text-[12.5px] leading-[1.55] text-[var(--ink-2)] whitespace-pre-wrap">{consistencyResult}</div>
              )}
            </div>

            <div className={editCard}>
              <h4 className="font-display text-[17px] font-semibold mb-1">Pacing &amp; structure</h4>
              <p className="text-xs text-[var(--ink-3)] mb-3">Where it drags, where it rushes.</p>
              <button onClick={reviewPacing} disabled={busy === 'pace'} className={btnGhostFull}>
                {busy === 'pace' ? <>Reviewing<span className="dots"><span></span><span></span><span></span></span></> : 'Review pacing'}
              </button>
              {pacingResult && (
                <div className="mt-3 text-[12.5px] leading-[1.55] text-[var(--ink-2)] whitespace-pre-wrap">{pacingResult}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== COVER STAGE ==================== */
function CoverStage({ data, updateData, toast }: any) {
  function f<K extends keyof ProjectData>(key: K, val: ProjectData[K]) {
    updateData((d: ProjectData) => ({ ...d, [key]: val }));
  }
  const preset = COVER_PRESETS[data.coverPreset];

  function downloadCover() {
    const canvas = document.createElement('canvas');
    canvas.width = 1600; canvas.height = 2560;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, preset.bg[0]);
    grad.addColorStop(1, preset.bg[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const og = ctx.createLinearGradient(0, 0, 0, canvas.height);
    og.addColorStop(0, 'rgba(0,0,0,0)');
    og.addColorStop(1, `rgba(0,0,0,${data.overlayAmt / 100})`);
    ctx.fillStyle = og;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = data.titleColor;
    ctx.font = '500 56px Oswald, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText((data.author || 'AUTHOR NAME').toUpperCase(), 180, 250);
    const ts = data.titleSize * 5;
    ctx.font = `700 ${ts}px ${data.titleFont}, serif`;
    const wrapped = wrap(ctx, data.title || 'Your Title Here', canvas.width - 360);
    let y = canvas.height - 700;
    wrapped.forEach((ln, i) => ctx.fillText(ln, 180, y + i * ts * 1.1));
    if (data.subtitle) {
      ctx.font = 'italic 500 64px "Cormorant Garamond", serif';
      ctx.globalAlpha = 0.85;
      const sy = y + wrapped.length * ts * 1.1 + 60;
      const swrap = wrap(ctx, data.subtitle, canvas.width - 360);
      swrap.forEach((ln, i) => ctx.fillText(ln, 180, sy + i * 80));
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = data.titleColor + '50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(180, canvas.height - 220);
    ctx.lineTo(canvas.width - 180, canvas.height - 220);
    ctx.stroke();
    ctx.font = '500 52px Oswald, sans-serif';
    ctx.fillText((data.author || 'AUTHOR NAME').toUpperCase(), 180, canvas.height - 140);
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(data.title || 'cover').replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}-cover.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Cover downloaded (1600 × 2560).', 'success');
    });
  }

  function wrap(ctx: any, text: string, maxW: number) {
    const words = text.split(' ');
    const lines: string[] = [];
    let line = '';
    words.forEach(w => {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
      else line = t;
    });
    if (line) lines.push(line);
    return lines;
  }

  return (
    <div className="h-full overflow-y-auto p-9">
      <div className="max-w-[1280px] mx-auto">
        <h2 className="font-display text-3xl font-semibold mb-1.5">Design the cover</h2>
        <p className="text-[var(--ink-3)] mb-6">Pick a style, set the typography, download at KDP resolution.</p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-6">
          <div className="bg-white rounded-xl border border-[var(--line)] p-8 shadow-sm flex flex-col items-center min-h-[600px]">
            <div className="relative">
              <div
                className="w-80 rounded-[4px] overflow-hidden shadow-[0_20px_60px_-10px_rgba(0,0,0,0.4)] relative"
                style={{ width: 320, height: 480, background: `linear-gradient(135deg, ${preset.bg[0]} 0%, ${preset.bg[1]} 100%)` }}
              >
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,${data.overlayAmt / 100}) 100%)` }} />
                <div className="absolute inset-0 p-9 flex flex-col" style={{ color: data.titleColor }}>
                  <div className="font-['Oswald'] text-[14px] tracking-[0.18em] uppercase opacity-85 mb-auto" style={{ color: data.titleColor }}>
                    {(data.author || 'AUTHOR NAME').toUpperCase()}
                  </div>
                  <div className="mt-auto">
                    <div className="font-bold leading-[1.05] mb-3.5 tracking-tight" style={{ fontFamily: data.titleFont + ', serif', fontSize: data.titleSize, color: data.titleColor }}>
                      {data.title || 'Your Title Here'}
                    </div>
                    {data.subtitle && (
                      <div className="font-['Cormorant_Garamond'] italic leading-[1.3] opacity-85 mb-4" style={{ fontSize: 16, color: data.titleColor }}>
                        {data.subtitle}
                      </div>
                    )}
                    <div className="font-['Oswald'] text-[13px] tracking-[0.16em] uppercase pt-3.5 border-t" style={{ color: data.titleColor, borderColor: data.titleColor + '50' }}>
                      {(data.author || 'AUTHOR NAME').toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-[11px] text-[var(--ink-4)] tracking-[0.06em] uppercase font-medium">Front cover · 1600 × 2560 on export</div>
          </div>

          <div className="space-y-4">
            <div className={editCard}>
              <h4 className="font-display text-[16px] font-semibold mb-3">Style</h4>
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {Object.entries(COVER_PRESETS).map(([k, p]) => (
                  <button
                    key={k}
                    onClick={() => { updateData((d: ProjectData) => ({ ...d, coverPreset: k, titleColor: p.text, overlayAmt: p.overlay })); }}
                    className={`aspect-[2/3] rounded-md transition ${data.coverPreset === k ? 'border-2 border-[var(--blue)] scale-105' : 'border-2 border-transparent hover:scale-105'}`}
                    style={{ background: `linear-gradient(135deg, ${p.bg[0]} 0%, ${p.bg[1]} 100%)` }}
                  />
                ))}
              </div>
              <div className="text-xs text-[var(--ink-3)]">Pick a palette. Click to apply.</div>
            </div>

            <div className={editCard}>
              <h4 className="font-display text-[16px] font-semibold mb-3">Typography</h4>
              <Field label="Title font">
                <select value={data.titleFont} onChange={e => f('titleFont', e.target.value)} className={inputCls}>
                  <option value="Playfair Display">Playfair Display</option>
                  <option value="Cormorant Garamond">Cormorant Garamond</option>
                  <option value="Bebas Neue">Bebas Neue</option>
                  <option value="Oswald">Oswald</option>
                  <option value="Lora">Lora</option>
                </select>
              </Field>
              <Field label={`Title size · ${data.titleSize}px`}>
                <input type="range" min={22} max={56} value={data.titleSize} onChange={e => f('titleSize', parseInt(e.target.value))} className="w-full" />
              </Field>
              <Field label="Title color">
                <input type="color" value={data.titleColor} onChange={e => f('titleColor', e.target.value)} className="h-9 w-full rounded border border-[var(--line)] p-1" />
              </Field>
            </div>

            <div className={editCard}>
              <h4 className="font-display text-[16px] font-semibold mb-3">Overlay</h4>
              <Field label={`Darkness · ${data.overlayAmt}%`}>
                <input type="range" min={0} max={80} value={data.overlayAmt} onChange={e => f('overlayAmt', parseInt(e.target.value))} className="w-full" />
              </Field>
            </div>

            <button onClick={downloadCover} className={btnPrimaryFull}>Download cover (1600 × 2560)</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== PUBLISH STAGE ==================== */
function PublishStage({ data, toast }: any) {
  const [busy, setBusy] = useState('');

  const totalW = data.chapters.reduce((n: number, ch: Chapter) => n + ch.scenes.reduce((m: number, sc: Scene) => m + countWords(sc.body), 0), 0);
  const fullText = data.chapters.map((ch: Chapter) => ch.scenes.map((s: Scene) => s.body).join('\n\n')).join('\n\n');
  const score = computeAIScore(fullText);
  const scoreOk = score.grade === 'A' || score.grade === 'B';
  const scoreWarn = score.grade === 'C' || score.grade === 'D';
  const scoreBad = score.grade === 'F';

  const items = [
    { label: 'Title set', ok: !!data.title.trim() },
    { label: 'Author set', ok: !!data.author.trim() },
    { label: 'Voice profile trained', ok: !!data.voiceSample, warn: !data.voiceSample },
    { label: `Manuscript: ${totalW.toLocaleString()} words`, ok: totalW >= 5000, warn: totalW < 5000 && totalW > 0, bad: totalW === 0 },
    { label: `${data.chapters.length} chapter${data.chapters.length === 1 ? '' : 's'}`, ok: data.chapters.length > 0 },
    { label: totalW === 0 ? 'AI Detection Score: not yet measured' : `AI Detection Score: ${score.grade} · ${score.density.toFixed(2)} per 1k words`, ok: totalW === 0 ? false : scoreOk, warn: scoreWarn, bad: scoreBad },
    { label: `Trim size: ${data.trim} in`, ok: true },
  ];

  async function doExport(kind: string) {
    setBusy(kind);
    try {
      if (kind === 'docx') exportDocx(data);
      else if (kind === 'epub') await exportEpub(data);
      else if (kind === 'pdf') await exportPdf(data);
      else if (kind === 'bundle') exportBundle(data);
      toast(kind.toUpperCase() + ' exported.', 'success');
    } catch (e: any) {
      toast(e.message || 'Export failed.', 'error');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="h-full overflow-y-auto p-9">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-display text-3xl font-semibold mb-1.5">Publish</h2>
        <p className="text-[var(--ink-3)] mb-6">Generate KDP-ready files.</p>

        <div className="bg-white border border-[var(--line)] rounded-xl p-6 mb-5 shadow-sm">
          <h4 className="font-display text-[17px] font-semibold mb-3">Pre-flight check</h4>
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-2.5 py-2 border-b border-[var(--line-2)] last:border-0 text-[13.5px]">
              <div className={`w-[22px] h-[22px] rounded-full grid place-items-center flex-shrink-0 ${
                it.bad ? 'bg-[var(--red-soft)] text-[var(--red)]' :
                it.warn ? 'bg-[var(--amber-soft)] text-[var(--amber)]' :
                'bg-[var(--green-soft)] text-[var(--green)]'
              }`}>
                {it.ok && !it.warn ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3"><polyline points="20 6 9 17 4 12"/></svg>
                ) : it.bad ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3"><line x1="12" y1="9" x2="12" y2="13"/></svg>
                )}
              </div>
              <span className="text-[var(--ink-2)]">{it.label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: 'docx', title: 'Manuscript (.doc)', meta: 'Editable Word with chapter headings, front matter, page breaks.', body: 'Title page, copyright, dedication, TOC, manuscript body, bio. Mirrored gutters.', icon: 'doc' },
            { id: 'epub', title: 'Kindle EPUB', meta: 'EPUB 3.0 with nav.xhtml. KDP no longer accepts MOBI.', body: 'Built for KDP Kindle. Includes TOC, chapter ordering, metadata.', icon: 'epub' },
            { id: 'pdf', title: 'Print interior PDF', meta: `Trim size ${data.trim} in. Mirrored margins.`, body: 'Upload as interior when creating a paperback on KDP. Pair with cover.', icon: 'pdf' },
            { id: 'bundle', title: 'Plain text + project bundle', meta: 'Backup or third-party formatter.', body: 'Includes voice profile so you can resume on a new device.', icon: 'bundle' },
          ].map(card => (
            <div key={card.id} className="bg-white border border-[var(--line)] rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="w-[46px] h-[46px] bg-[var(--blue-soft)] text-[var(--blue-deep)] rounded-[11px] grid place-items-center mb-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <h4 className="font-display text-[19px] font-semibold mt-3 mb-1">{card.title}</h4>
              <div className="text-[11.5px] text-[var(--ink-4)] mb-3 px-2.5 py-2 bg-[var(--bg-2)] rounded-md font-serif">{card.meta}</div>
              <p className="text-[13px] text-[var(--ink-3)] leading-relaxed mb-4 flex-1">{card.body}</p>
              <button onClick={() => doExport(card.id)} disabled={!!busy} className={card.id === 'bundle' ? btnGhostFull : btnPrimaryFull}>
                {busy === card.id ? <>Building<span className="dots"><span></span><span></span><span></span></span></> : `Export ${card.id === 'bundle' ? 'bundle' : `.${card.id === 'docx' ? 'doc' : card.id}`}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ==================== SHARED UI ==================== */
function Section({ title, children }: any) {
  return (
    <div className="bg-white border border-[var(--line)] rounded-xl p-6 shadow-sm">
      <div className="font-display text-[18px] font-semibold mb-4">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Field({ label, hint, children }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1.5">{label}</label>
      {hint && <div className="text-xs text-[var(--ink-3)] mb-2 leading-relaxed">{hint}</div>}
      {children}
    </div>
  );
}

function DraftModal({ data, onClose, onSubmit, busy }: any) {
  const [dir, setDir] = useState('');
  const [length, setLength] = useState('medium');
  const [tone, setTone] = useState('match');
  return (
    <Modal title="Draft this scene" sub="Tell the writer what happens. It writes in your voice, no em dashes, no chatbot vocabulary." onClose={onClose}>
      <Field label="What happens">
        <textarea value={dir} onChange={e => setDir(e.target.value)} className={textareaCls + ' min-h-[110px]'} placeholder="A morning at the casino before opening. The narrator watches the cleaning crew." />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Length">
          <select value={length} onChange={e => setLength(e.target.value)} className={inputCls}>
            <option value="short">Short — 250 words</option>
            <option value="medium">Medium — 500 words</option>
            <option value="long">Long — 900 words</option>
          </select>
        </Field>
        <Field label="Tone">
          <select value={tone} onChange={e => setTone(e.target.value)} className={inputCls}>
            <option value="match">Match voice sample</option>
            <option value="tense">Tense and quiet</option>
            <option value="warm">Warm and reflective</option>
            <option value="sharp">Sharp and observational</option>
            <option value="lyrical">Lyrical</option>
            <option value="plainspoken">Plainspoken</option>
          </select>
        </Field>
      </div>
      <ModalFoot left={data.voiceSample ? 'Writes in your voice profile' : 'No voice trained yet'} onCancel={onClose} onSubmit={() => onSubmit(dir, length, tone)} submitLabel="Draft scene" busy={busy} />
    </Modal>
  );
}

function RewriteModal({ editorRef, onClose, onSubmit, busy }: any) {
  const [move, setMove] = useState('tighten');
  const [custom, setCustom] = useState('');
  const e = editorRef?.current;
  const sel = e ? e.value.slice(e.selectionStart, e.selectionEnd) : '';
  return (
    <Modal title="Rewrite selection" sub={sel ? `${countWords(sel)} words selected: "${sel.slice(0, 80)}${sel.length > 80 ? '…' : ''}"` : 'Highlight text in the editor first.'} onClose={onClose}>
      <Field label="Move">
        <select value={move} onChange={e => setMove(e.target.value)} className={inputCls}>
          <option value="tighten">Tighten</option>
          <option value="expand">Expand with a concrete detail</option>
          <option value="vivid">More sensory and vivid</option>
          <option value="quieter">Quieter, less explained</option>
          <option value="dialogue">Add or extend dialogue</option>
          <option value="voice">Match the voice sample harder</option>
          <option value="custom">Custom direction…</option>
        </select>
      </Field>
      {move === 'custom' && (
        <Field label="Custom direction">
          <textarea value={custom} onChange={e => setCustom(e.target.value)} className={textareaCls} placeholder="Make this feel like dusk. Shorter sentences." />
        </Field>
      )}
      <ModalFoot left={sel ? `${countWords(sel)} words selected` : 'No selection'} onCancel={onClose} onSubmit={() => onSubmit(move, custom)} submitLabel="Rewrite" busy={busy} />
    </Modal>
  );
}

function Modal({ title, sub, onClose, children }: any) {
  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center p-5 z-[100]" style={{ animation: 'fadeIn 0.2s' }} onClick={onClose}>
      <div className="bg-white w-full max-w-[580px] max-h-[88vh] rounded-2xl shadow-xl flex flex-col overflow-hidden" style={{ animation: 'pop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)' }} onClick={e => e.stopPropagation()}>
        <div className="px-7 pt-6 pb-2">
          <h2 className="font-display text-[22px] font-semibold mb-1 tracking-tight">{title}</h2>
          {sub && <p className="text-[13.5px] text-[var(--ink-3)] leading-relaxed">{sub}</p>}
        </div>
        <div className="px-7 py-4 flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

function ModalFoot({ left, onCancel, onSubmit, submitLabel, busy }: any) {
  return (
    <div className="px-7 py-4 mt-4 border-t border-[var(--line)] bg-[var(--bg-2)] -mx-7 -mb-4 flex items-center justify-between">
      <span className="text-[12.5px] text-[var(--ink-3)]">{left}</span>
      <div className="flex gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-[var(--ink-2)] hover:bg-[var(--bg-3)] font-semibold text-[13.5px]">Cancel</button>
        <button onClick={onSubmit} disabled={busy} className="px-4 py-2 rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-deep)] disabled:bg-[var(--ink-4)] text-white font-semibold text-[13.5px]">
          {busy ? <>Working<span className="dots"><span></span><span></span><span></span></span></> : submitLabel}
        </button>
      </div>
    </div>
  );
}

/* shared class strings */
const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-[var(--line)] focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/12 outline-none text-sm bg-white transition';
const textareaCls = 'w-full px-3.5 py-3 rounded-lg border border-[var(--line)] focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/12 outline-none text-[14.5px] leading-relaxed bg-white transition font-serif resize-y min-h-[88px]';
const btnPrimary = 'px-5 py-2.5 rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-deep)] disabled:bg-[var(--ink-4)] text-white font-semibold text-sm shadow-sm transition';
const btnPrimaryFull = btnPrimary + ' w-full justify-center flex items-center gap-1.5';
const btnGhostFull = 'w-full px-5 py-2.5 rounded-lg bg-white hover:border-[var(--blue)] hover:text-[var(--blue)] border border-[var(--line)] text-[var(--ink-2)] font-semibold text-sm transition flex items-center justify-center gap-1.5';
const editCard = 'bg-white border border-[var(--line)] rounded-xl p-5 shadow-sm';
const fabItem = 'bg-white border border-[var(--line)] hover:border-[var(--blue)] hover:text-[var(--blue-deep)] text-[var(--ink-2)] px-4 py-2.5 rounded-full text-sm font-medium shadow-md transition flex items-center gap-2 whitespace-nowrap';
