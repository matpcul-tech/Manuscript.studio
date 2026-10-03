import type { ProjectData, Chapter } from './types';
import { getTheme, type InteriorTheme } from './interior-themes';
import JSZip from 'jszip';
import {
  AlignmentType,
  Document,
  Footer,
  HeadingLevel,
  PageBreak,
  PageNumber,
  Packer,
  Paragraph,
  TableOfContents,
  TextRun,
} from 'docx';

// ============================================================================
// Export builders.
//
// Each format has a pure builder (buildDocxDocument, buildEpubZip,
// buildPdfDoc) that takes ProjectData and returns a document object with no
// DOM access, so the same code runs in the browser and in Node for
// scripts/check-exports.ts. The export* wrappers are the browser entry
// points: they call the builder, serialize, and trigger a download.
//
// DOCX is a real OOXML package built with the `docx` library: Word TOC
// field, heading styles, page breaks, gutter margin, footer page numbers.
// EPUB is EPUB 3 with an embedded cover when one is supplied, literal
// scene-break glyphs in markup (no CSS ::after dependency), and metadata
// that passes epubcheck. PDF embeds DejaVu Serif (fetched from
// /public/fonts) so KDP's font-embedding requirement is met, starts every
// chapter on a recto page, and carries running heads.
// ============================================================================

function escapeHtml(s: string): string {
  return (s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[m]);
}

function slugify(s: string): string {
  return (s || 'manuscript').replace(/[^a-z0-9-]+/gi, '-').toLowerCase().replace(/^-+|-+$/g, '');
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const SCENE_BREAK = '*  *  *';

function trimSize(p: ProjectData): { w: number; h: number } {
  const [w, h] = (p.trim || '5.25x8').split('x').map(parseFloat);
  return { w: isFinite(w) ? w : 5.25, h: isFinite(h) ? h : 8 };
}

function splitParas(body: string): string[] {
  return (body || '').split(/\n\n+/).map(s => s.trim()).filter(Boolean);
}

function contributorsLines(p: ProjectData): string[] {
  const list = p.frontMatter?.contributors || [];
  return list
    .filter(c => (c.first || c.last) && c.role)
    .map(c => `${c.role}: ${[c.first, c.last].filter(Boolean).join(' ')}`);
}

const FICTION_DISCLAIMER =
  'This is a work of fiction. Names, characters, places, and incidents either are the product of the author’s imagination or are used fictitiously. Any resemblance to actual persons, living or dead, events, or locales is entirely coincidental.';

// ============================================================================
// DOCX
// ============================================================================

const TWIPS = 1440; // twips per inch
const HALF_POINTS = 2; // half-points per point

export function buildDocxDocument(p: ProjectData): Document {
  const theme = getTheme(p.interiorTheme);
  const BREAK = theme.sceneBreak;
  const { w, h } = trimSize(p);
  const year = String(p.frontMatter?.copyrightYear || p.pubYear || new Date().getFullYear());
  const publisher = p.publisher || p.frontMatter?.publisher || '';

  const serif = 'Georgia';

  const body = (text: string, opts: { first?: boolean; center?: boolean; italic?: boolean; size?: number; before?: number; after?: number } = {}) =>
    new Paragraph({
      alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
      indent: opts.center || opts.first ? undefined : { firstLine: Math.round(0.25 * TWIPS) },
      spacing: { before: opts.before ?? 0, after: opts.after ?? 0, line: 300 },
      children: [new TextRun({ text, font: serif, size: (opts.size ?? 11) * HALF_POINTS, italics: opts.italic })],
    });

  const displayTitle = (text: string, size = 24) =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: Math.round(1 * TWIPS), after: Math.round(0.5 * TWIPS) },
      children: [new TextRun({ text, font: serif, size: size * HALF_POINTS, bold: true })],
    });

  const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

  // ---- front matter ----
  const front: (Paragraph | TableOfContents)[] = [];

  // Title page
  front.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: Math.round(2.2 * TWIPS) },
    children: [new TextRun({ text: p.title || 'Untitled', font: serif, size: 36 * HALF_POINTS, bold: true })],
  }));
  if (p.subtitle) {
    front.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: Math.round(0.3 * TWIPS) },
      children: [new TextRun({ text: p.subtitle, font: serif, size: 16 * HALF_POINTS, italics: true })],
    }));
  }
  front.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: Math.round(1.4 * TWIPS) },
    children: [new TextRun({ text: (p.author || '').toUpperCase(), font: serif, size: 14 * HALF_POINTS })],
  }));
  front.push(pageBreak());

  // Copyright page
  front.push(body(`Copyright © ${year} ${p.author || ''}.`, { first: true, size: 10, after: 160 }));
  front.push(body('All rights reserved. No part of this book may be reproduced or transmitted in any form or by any means, electronic or mechanical, including photocopying, recording, or by any information storage and retrieval system, without permission in writing from the author.', { first: true, size: 10, after: 160 }));
  if (p.frontMatter?.fictionDisclaimer) {
    front.push(body(FICTION_DISCLAIMER, { first: true, size: 10, after: 160 }));
  }
  if (p.isbn) front.push(body(`ISBN: ${p.isbn}`, { first: true, size: 10, after: 160 }));
  if (publisher) front.push(body(`Published by ${publisher}`, { first: true, size: 10, after: 160 }));
  contributorsLines(p).forEach(line => front.push(body(line, { first: true, size: 10, after: 160 })));
  front.push(body(`First edition, ${year}.`, { first: true, size: 10 }));
  front.push(pageBreak());

  // Dedication
  if (p.dedication) {
    front.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: Math.round(2.5 * TWIPS) },
      children: [new TextRun({ text: p.dedication, font: serif, size: 12 * HALF_POINTS, italics: true })],
    }));
    front.push(pageBreak());
  }

  // Epigraph
  const epi = p.frontMatter?.epigraph;
  if (epi?.text) {
    front.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: Math.round(2.5 * TWIPS) },
      children: [new TextRun({ text: epi.text, font: serif, size: 12 * HALF_POINTS, italics: true })],
    }));
    if (epi.attribution) {
      front.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [new TextRun({ text: epi.attribution, font: serif, size: 11 * HALF_POINTS })],
      }));
    }
    front.push(pageBreak());
  }

  // Foreword
  if (p.frontMatter?.foreword) {
    front.push(displayTitle('Foreword'));
    splitParas(p.frontMatter.foreword).forEach((pa, i) => front.push(body(pa, { first: i === 0, after: 120 })));
    front.push(pageBreak());
  }

  // Table of contents: a real Word TOC field over Heading 1.
  front.push(displayTitle('Contents'));
  front.push(new TableOfContents('Contents', { hyperlink: true, headingStyleRange: '1-1' }));
  front.push(new Paragraph({
    spacing: { before: 240 },
    children: [new TextRun({ text: 'In Word: right-click the table above and choose Update Field to fill in page numbers.', font: serif, size: 9 * HALF_POINTS, italics: true, color: '666666' })],
  }));

  // ---- body ----
  const bodyChildren: (Paragraph | TableOfContents)[] = [];
  p.chapters.forEach((ch) => {
    bodyChildren.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: true,
      alignment: AlignmentType.CENTER,
      spacing: { before: Math.round(1 * TWIPS), after: Math.round(0.5 * TWIPS) },
      children: [new TextRun({ text: theme.titleTransform === 'uppercase' ? ch.title.toUpperCase() : ch.title, font: serif, size: Math.round(theme.titleSizePt + 2) * HALF_POINTS, bold: true, color: '000000' })],
    }));
    ch.scenes.forEach((sc, si) => {
      const paras = splitParas(sc.body);
      if (paras.length === 0) return;
      if (si > 0) {
        bodyChildren.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 240 },
          children: [new TextRun({ text: BREAK, font: serif, size: 11 * HALF_POINTS })],
        }));
      }
      paras.forEach((pa, pi) => {
        bodyChildren.push(body(pa, { first: si === 0 ? pi === 0 : pi === 0 }));
      });
    });
  });

  if (p.bio) {
    bodyChildren.push(pageBreak());
    bodyChildren.push(displayTitle('About the Author'));
    splitParas(p.bio).forEach((pa, i) => bodyChildren.push(body(pa, { first: i === 0, after: 120 })));
  }

  const backText = p.launchOutputs?.backMatterText || '';
  if (backText.trim()) {
    bodyChildren.push(pageBreak());
    splitParas(backText).forEach((pa, i) => bodyChildren.push(body(pa, { first: true, after: 160 })));
  }

  const pageSize = { width: Math.round(w * TWIPS), height: Math.round(h * TWIPS) };
  const margins = {
    top: Math.round(0.75 * TWIPS),
    bottom: Math.round(0.75 * TWIPS),
    left: Math.round(0.625 * TWIPS),
    right: Math.round(0.625 * TWIPS),
    gutter: Math.round(0.25 * TWIPS),
  };

  return new Document({
    creator: p.author || 'Manuscript Studio',
    title: p.title || 'Untitled',
    description: p.subtitle || '',
    features: { updateFields: true },
    styles: {
      default: {
        heading1: {
          run: { font: serif, size: 24 * HALF_POINTS, bold: true, color: '000000' },
          paragraph: { alignment: AlignmentType.CENTER },
        },
      },
    },
    sections: [
      {
        properties: { page: { size: pageSize, margin: margins } },
        children: front,
      },
      {
        properties: { page: { size: pageSize, margin: margins } },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ children: [PageNumber.CURRENT], font: serif, size: 10 * HALF_POINTS })],
            })],
          }),
        },
        children: bodyChildren,
      },
    ],
  });
}

export async function exportDocx(p: ProjectData) {
  const doc = buildDocxDocument(p);
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${slugify(p.title || 'manuscript')}.docx`);
}

// ============================================================================
// EPUB
// ============================================================================

export type EpubCover = { data: Uint8Array | ArrayBuffer; mediaType: 'image/jpeg' | 'image/png' };

export function buildEpubZip(p: ProjectData, cover?: EpubCover): JSZip {
  const theme = getTheme(p.interiorTheme);
  const BREAK = theme.sceneBreak;
  const zip = new JSZip();
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.folder('META-INF')!.file('container.xml',
    `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

  const oebps = zip.folder('OEBPS')!;
  const uuid = 'urn:uuid:' + (globalThis.crypto as any).randomUUID();
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const year = String(p.frontMatter?.copyrightYear || p.pubYear || new Date().getFullYear());
  const publisher = p.publisher || p.frontMatter?.publisher || '';

  const xdoc = (title: string, bodyAttrs: string, inner: string) => `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${escapeHtml(title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body ${bodyAttrs}>${inner}</body>
</html>`;

  type Item = { id: string; href: string; mediaType: string; properties?: string; linear?: boolean; inSpine: boolean; navTitle?: string };
  const items: Item[] = [];

  // Cover
  if (cover) {
    const ext = cover.mediaType === 'image/png' ? 'png' : 'jpg';
    oebps.file(`cover.${ext}`, cover.data);
    items.push({ id: 'cover-image', href: `cover.${ext}`, mediaType: cover.mediaType, properties: 'cover-image', inSpine: false });
    oebps.file('cover.xhtml', xdoc('Cover', 'epub:type="cover"',
      `<section epub:type="cover" style="text-align:center;margin:0;padding:0;"><img src="cover.${ext}" alt="${escapeHtml(p.title || 'Cover')}" style="max-width:100%;height:auto;"/></section>`));
    items.push({ id: 'cover-page', href: 'cover.xhtml', mediaType: 'application/xhtml+xml', inSpine: true, linear: false });
  }

  // Title page
  oebps.file('title.xhtml', xdoc('Title Page', 'class="title-page" epub:type="frontmatter titlepage"',
    `<h1 class="title">${escapeHtml(p.title || 'Untitled')}</h1>
${p.subtitle ? `<p class="subtitle">${escapeHtml(p.subtitle)}</p>` : ''}
<p class="author">${escapeHtml(p.author || '')}</p>`));
  items.push({ id: 'title', href: 'title.xhtml', mediaType: 'application/xhtml+xml', inSpine: true, navTitle: 'Title Page' });

  // Copyright page
  const contribHtml = contributorsLines(p).map(l => `<p>${escapeHtml(l)}</p>`).join('\n');
  oebps.file('copyright.xhtml', xdoc('Copyright', 'class="copyright" epub:type="frontmatter copyright-page"',
    `<p>Copyright © ${escapeHtml(year)} ${escapeHtml(p.author || '')}.</p>
<p>All rights reserved. No part of this book may be reproduced or transmitted in any form or by any means without permission in writing from the author.</p>
${p.frontMatter?.fictionDisclaimer ? `<p>${escapeHtml(FICTION_DISCLAIMER)}</p>` : ''}
${p.isbn ? `<p>ISBN: ${escapeHtml(p.isbn)}</p>` : ''}
${publisher ? `<p>Published by ${escapeHtml(publisher)}</p>` : ''}
${contribHtml}`));
  items.push({ id: 'copyright', href: 'copyright.xhtml', mediaType: 'application/xhtml+xml', inSpine: true, navTitle: 'Copyright' });

  // Dedication
  if (p.dedication) {
    oebps.file('dedication.xhtml', xdoc('Dedication', 'class="dedication-page" epub:type="frontmatter dedication"',
      `<p class="dedication">${escapeHtml(p.dedication)}</p>`));
    items.push({ id: 'dedication', href: 'dedication.xhtml', mediaType: 'application/xhtml+xml', inSpine: true, navTitle: 'Dedication' });
  }

  // Epigraph
  const epi = p.frontMatter?.epigraph;
  if (epi?.text) {
    oebps.file('epigraph.xhtml', xdoc('Epigraph', 'class="epigraph-page" epub:type="frontmatter epigraph"',
      `<p class="epigraph">${escapeHtml(epi.text)}</p>${epi.attribution ? `<p class="epigraph-attr">${escapeHtml(epi.attribution)}</p>` : ''}`));
    items.push({ id: 'epigraph', href: 'epigraph.xhtml', mediaType: 'application/xhtml+xml', inSpine: true, navTitle: 'Epigraph' });
  }

  // Foreword
  if (p.frontMatter?.foreword) {
    const fw = splitParas(p.frontMatter.foreword).map(pa => `<p>${escapeHtml(pa)}</p>`).join('\n');
    oebps.file('foreword.xhtml', xdoc('Foreword', 'epub:type="frontmatter foreword"', `<h1>Foreword</h1>${fw}`));
    items.push({ id: 'foreword', href: 'foreword.xhtml', mediaType: 'application/xhtml+xml', inSpine: true, navTitle: 'Foreword' });
  }

  // Chapters; scene breaks are literal glyphs in markup, not CSS ::after.
  p.chapters.forEach((ch, idx) => {
    const fname = `chapter_${String(idx + 1).padStart(3, '0')}.xhtml`;
    const bodyHtml = ch.scenes.map(sc =>
      splitParas(sc.body).map(pa => `<p>${escapeHtml(pa)}</p>`).join('\n')
    ).filter(Boolean).join(`\n<p class="scene-break">${escapeHtml(BREAK).replace(/ /g, '&#8194;')}</p>\n`);
    oebps.file(fname, xdoc(ch.title, 'epub:type="bodymatter chapter"', `<h1>${escapeHtml(ch.title)}</h1>${bodyHtml}`));
    items.push({ id: `ch${idx + 1}`, href: fname, mediaType: 'application/xhtml+xml', inSpine: true, navTitle: ch.title });
  });

  // About the author
  if (p.bio) {
    oebps.file('bio.xhtml', xdoc('About the Author', 'epub:type="backmatter"',
      `<h1>About the Author</h1>${splitParas(p.bio).map(pa => `<p>${escapeHtml(pa)}</p>`).join('\n')}`));
    items.push({ id: 'bio', href: 'bio.xhtml', mediaType: 'application/xhtml+xml', inSpine: true, navTitle: 'About the Author' });
  }

  // Back matter composed in the Launch stage
  const backText = p.launchOutputs?.backMatterText || '';
  if (backText.trim()) {
    oebps.file('backmatter.xhtml', xdoc('From the Author', 'epub:type="backmatter"',
      splitParas(backText).map(pa => `<p class="bm">${escapeHtml(pa)}</p>`).join('\n')));
    items.push({ id: 'backmatter', href: 'backmatter.xhtml', mediaType: 'application/xhtml+xml', inSpine: true, navTitle: 'From the Author' });
  }

  const h1Css = [
    `font-family: ${theme.titleFace === 'sans' ? 'sans-serif' : 'serif'};`,
    'font-weight: 600; text-align: center; margin: 2em 0 1em;',
    `font-size: ${theme.titleFace === 'sans' ? '1.5em' : theme.titleTransform === 'uppercase' ? '1.25em' : '1.6em'};`,
    theme.titleTransform === 'uppercase' ? 'text-transform: uppercase;' : '',
    theme.titleLetterSpace ? 'letter-spacing: 0.18em;' : '',
    theme.titleRule ? 'border-bottom: 1px solid #999; padding-bottom: 0.5em; width: 60%; margin-left: auto; margin-right: auto;' : '',
  ].filter(Boolean).join(' ');
  const dropCapCss = theme.dropCap
    ? `\nh1 + p::first-letter { float: left; font-size: 3.1em; line-height: 0.82; padding: 0.02em 0.08em 0 0; font-weight: 600; }`
    : '';
  oebps.file('style.css', `body { font-family: serif; line-height: 1.6; margin: 1em; }
h1 { ${h1Css} }
p { text-indent: 1.2em; margin: 0 0 0.3em; text-align: justify; }
h1 + p, .scene-break + p { text-indent: 0; }
.title-page { text-align: center; }
.title-page .title { font-size: 2.4em; margin-top: 3em; }
.title-page .subtitle { font-style: italic; font-size: 1.1em; }
.title-page .author { margin-top: 2em; text-transform: uppercase; letter-spacing: 0.1em; }
.dedication { text-align: center; font-style: italic; margin-top: 4em; text-indent: 0; }
.epigraph { text-align: center; font-style: italic; margin-top: 4em; text-indent: 0; }
.epigraph-attr { text-align: center; text-indent: 0; margin-top: 0.6em; }
.copyright p, .bm { text-indent: 0; margin-bottom: 0.6em; }
.scene-break { text-align: center; text-indent: 0; margin: 1em 0; letter-spacing: ${BREAK.length > 1 ? '0.4em' : '0'}; color: #555; font-size: ${BREAK.length === 1 ? '1.2em' : '1em'}; }${dropCapCss}`);

  // Navigation document
  const navItems = items
    .filter(i => i.inSpine && i.navTitle)
    .map(i => `<li><a href="${i.href}">${escapeHtml(i.navTitle!)}</a></li>`)
    .join('');
  const firstChapterHref = `chapter_001.xhtml`;
  const landmarks = [
    cover ? `<li><a epub:type="cover" href="cover.xhtml">Cover</a></li>` : '',
    `<li><a epub:type="titlepage" href="title.xhtml">Title Page</a></li>`,
    p.chapters.length > 0 ? `<li><a epub:type="bodymatter" href="${firstChapterHref}">Start Reading</a></li>` : '',
  ].filter(Boolean).join('');
  oebps.file('nav.xhtml', `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Table of Contents</title></head>
<body><nav epub:type="toc" id="toc"><h1>Contents</h1><ol>${navItems}</ol></nav>
<nav epub:type="landmarks" hidden=""><h1>Landmarks</h1><ol>${landmarks}</ol></nav></body>
</html>`);

  // Package document
  const manifest = [
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="style" href="style.css" media-type="text/css"/>`,
    ...items.map(i => `<item id="${i.id}" href="${i.href}" media-type="${i.mediaType}"${i.properties ? ` properties="${i.properties}"` : ''}/>`),
  ].join('\n');

  const spine = items
    .filter(i => i.inSpine)
    .map(i => `<itemref idref="${i.id}"${i.linear === false ? ' linear="no"' : ''}/>`)
    .join('\n');

  const description = (p.kdpDescription || p.synopsis || '').trim();

  oebps.file('content.opf', `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="en">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="bookid">${uuid}</dc:identifier>
<dc:title id="title-main">${escapeHtml(p.title || 'Untitled')}</dc:title>
<meta refines="#title-main" property="title-type">main</meta>
${p.subtitle ? `<dc:title id="title-sub">${escapeHtml(p.subtitle)}</dc:title>\n<meta refines="#title-sub" property="title-type">subtitle</meta>` : ''}
<dc:creator>${escapeHtml(p.author || '')}</dc:creator>
<dc:language>en</dc:language>
<dc:date>${now.split('T')[0]}</dc:date>
<meta property="dcterms:modified">${now}</meta>
${description ? `<dc:description>${escapeHtml(description)}</dc:description>` : ''}
${publisher ? `<dc:publisher>${escapeHtml(publisher)}</dc:publisher>` : ''}
${p.isbn ? `<dc:identifier>${escapeHtml(p.isbn)}</dc:identifier>` : ''}
${cover ? `<meta name="cover" content="cover-image"/>` : ''}
</metadata>
<manifest>${manifest}</manifest>
<spine>${spine}</spine>
</package>`);

  return zip;
}

export async function exportEpub(p: ProjectData, cover?: EpubCover) {
  const zip = buildEpubZip(p, cover);
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
  downloadBlob(blob, `${slugify(p.title || 'manuscript')}.epub`);
}

// ============================================================================
// PDF (print interior)
// ============================================================================

export type PdfFonts = {
  normal: string; bold: string; italic: string; bolditalic: string; // DejaVu Serif, base64 TTFs
  sans?: string; sansBold?: string; // DejaVu Sans, for sans-titled themes
};

const PDF_FONT_FILES: { style: keyof PdfFonts; file: string; optional?: boolean }[] = [
  { style: 'normal', file: 'DejaVuSerif.ttf' },
  { style: 'bold', file: 'DejaVuSerif-Bold.ttf' },
  { style: 'italic', file: 'DejaVuSerif-Italic.ttf' },
  { style: 'bolditalic', file: 'DejaVuSerif-BoldItalic.ttf' },
  { style: 'sans', file: 'DejaVuSans.ttf', optional: true },
  { style: 'sansBold', file: 'DejaVuSans-Bold.ttf', optional: true },
];

async function fetchPdfFonts(): Promise<PdfFonts | null> {
  try {
    const out: Partial<PdfFonts> = {};
    for (const f of PDF_FONT_FILES) {
      const r = await fetch(`/fonts/${f.file}`);
      if (!r.ok) { if (f.optional) continue; return null; }
      const buf = await r.arrayBuffer();
      let bin = '';
      const bytes = new Uint8Array(buf);
      const CHUNK = 0x8000;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
      }
      out[f.style] = btoa(bin);
    }
    return out as PdfFonts;
  } catch {
    return null;
  }
}

export async function buildPdfDoc(p: ProjectData, fonts?: PdfFonts | null) {
  const { jsPDF } = await import('jspdf');
  const { w, h } = trimSize(p);
  const pdf = new jsPDF({ unit: 'in', format: [w, h], orientation: 'portrait' });

  // Embed fonts. KDP requires all fonts embedded in print-interior PDFs;
  // jsPDF's built-in Times is not embedded, so we ship DejaVu Serif and
  // fall back to Times only if the font files are unreachable.
  let FONT = 'times';
  let TITLE_FONT = 'times';
  const theme = getTheme(p.interiorTheme);
  const BREAK = theme.sceneBreak;
  if (fonts) {
    pdf.addFileToVFS('DejaVuSerif.ttf', fonts.normal);
    pdf.addFont('DejaVuSerif.ttf', 'BookSerif', 'normal');
    pdf.addFileToVFS('DejaVuSerif-Bold.ttf', fonts.bold);
    pdf.addFont('DejaVuSerif-Bold.ttf', 'BookSerif', 'bold');
    pdf.addFileToVFS('DejaVuSerif-Italic.ttf', fonts.italic);
    pdf.addFont('DejaVuSerif-Italic.ttf', 'BookSerif', 'italic');
    pdf.addFileToVFS('DejaVuSerif-BoldItalic.ttf', fonts.bolditalic);
    pdf.addFont('DejaVuSerif-BoldItalic.ttf', 'BookSerif', 'bolditalic');
    FONT = 'BookSerif';
    TITLE_FONT = 'BookSerif';
    if (theme.titleFace === 'sans' && fonts.sans && fonts.sansBold) {
      pdf.addFileToVFS('DejaVuSans.ttf', fonts.sans);
      pdf.addFont('DejaVuSans.ttf', 'BookSans', 'normal');
      pdf.addFileToVFS('DejaVuSans-Bold.ttf', fonts.sansBold);
      pdf.addFont('DejaVuSans-Bold.ttf', 'BookSans', 'bold');
      TITLE_FONT = 'BookSans';
    }
  }

  const marginTop = 0.75, marginBottom = 0.75;
  const marginOuter = 0.625, marginInner = 0.875;
  const bodySize = 11;
  const titleSize = theme.titleSizePt;
  const lineStep = (size: number) => size * 0.014 + 0.06;

  let page = 1; // page 1 = title page = recto
  let cursorY = 2.5;
  const chapterOpenPages = new Set<number>([1]);
  const frontPages = new Set<number>([1, 2]);

  const isRecto = () => page % 2 === 1;
  function setMargins() {
    return { left: isRecto() ? marginInner : marginOuter, right: isRecto() ? marginOuter : marginInner };
  }
  function decorate() {
    // Folio + running head on body pages. Chapter-opening and front-matter
    // pages carry neither, which is standard book convention.
    if (frontPages.has(page) || chapterOpenPages.has(page)) return;
    const m = setMargins();
    pdf.setFont(FONT, 'normal');
    pdf.setFontSize(10);
    const x = isRecto() ? w - m.right : m.left;
    pdf.text(String(page), x, h - 0.4, { align: isRecto() ? 'right' : 'left' });
    pdf.setFont(FONT, 'italic');
    pdf.setFontSize(8.5);
    const head = isRecto() ? (p.title || '').toUpperCase() : (p.author || '').toUpperCase();
    if (head) pdf.text(head, w / 2, marginTop - 0.3, { align: 'center' });
  }
  function newPage(opts: { chapterOpen?: boolean; front?: boolean } = {}) {
    pdf.addPage();
    page++;
    if (opts.chapterOpen) chapterOpenPages.add(page);
    if (opts.front) frontPages.add(page);
    decorate();
  }
  function newRectoPage(opts: { chapterOpen?: boolean; front?: boolean } = {}) {
    pdf.addPage();
    page++;
    if (!isRecto()) {
      // Landed on a verso: leave it fully blank (no folio, no head) and
      // turn once more so the section opens on a recto, book-style.
      pdf.addPage();
      page++;
    }
    if (opts.chapterOpen) chapterOpenPages.add(page);
    if (opts.front) frontPages.add(page);
    decorate();
  }
  function writeParagraph(text: string, opts: any = {}) {
    const m = setMargins();
    const textWidth = w - m.left - m.right;
    pdf.setFont(opts.font || FONT, opts.style || 'normal');
    pdf.setFontSize(opts.size || bodySize);
    const lines = pdf.splitTextToSize(text, textWidth - (opts.indent ? 0.25 : 0));
    let y = opts.y || cursorY;
    lines.forEach((ln: string, i: number) => {
      if (y > h - marginBottom - 0.2) {
        newPage();
        y = marginTop;
        pdf.setFont(opts.font || FONT, opts.style || 'normal');
        pdf.setFontSize(opts.size || bodySize);
      }
      const x = opts.center ? w / 2 : (m.left + (opts.indent && i === 0 ? 0.25 : 0));
      pdf.text(ln, x, y, { align: opts.center ? 'center' : 'left' });
      y += lineStep(opts.size || bodySize);
    });
    cursorY = y + 0.05;
  }

  // Drop cap: the chapter's opening paragraph with its first letter set large
  // across roughly three lines. Only used at chapter tops, where vertical
  // space is guaranteed, so the cap region never breaks across pages.
  function writeDropCapParagraph(text: string) {
    const clean = text.trim();
    if (clean.length < 2) { writeParagraph(clean, { indent: false }); return; }
    const m = setMargins();
    const textWidth = w - m.left - m.right;
    const cap = clean[0];
    const rest = clean.slice(1).replace(/^\s+/, '');
    const capSize = bodySize * 3.0;
    pdf.setFont(FONT, 'bold');
    pdf.setFontSize(capSize);
    const capW = pdf.getTextWidth(cap) + 0.06;
    pdf.setFont(FONT, 'normal');
    pdf.setFontSize(bodySize);
    const narrow = pdf.splitTextToSize(rest, textWidth - capW);
    const beside = narrow.slice(0, 3);
    const remainder = narrow.slice(3).join(' ');
    const after = remainder ? pdf.splitTextToSize(remainder, textWidth) : [];
    const step = lineStep(bodySize);
    let y = cursorY;
    pdf.setFont(FONT, 'bold');
    pdf.setFontSize(capSize);
    pdf.text(cap, m.left, y + step * 2);
    pdf.setFont(FONT, 'normal');
    pdf.setFontSize(bodySize);
    beside.forEach((ln: string, i: number) => pdf.text(ln, m.left + capW, y + step * i));
    y += step * Math.max(beside.length, 3);
    after.forEach((ln: string) => {
      if (y > h - marginBottom - 0.2) { newPage(); y = marginTop; pdf.setFont(FONT, 'normal'); pdf.setFontSize(bodySize); }
      pdf.text(ln, m.left, y);
      y += step;
    });
    cursorY = y + 0.05;
  }

  // TITLE PAGE (p1, recto)
  pdf.setFont(FONT, 'bold');
  pdf.setFontSize(titleSize + 8);
  pdf.text(p.title || 'Untitled', w / 2, 3, { align: 'center', maxWidth: w - 1.5 });
  if (p.subtitle) {
    pdf.setFont(FONT, 'italic');
    pdf.setFontSize(14);
    pdf.text(p.subtitle, w / 2, 3.8, { align: 'center', maxWidth: w - 1.5 });
  }
  pdf.setFont(FONT, 'normal');
  pdf.setFontSize(12);
  pdf.text((p.author || '').toUpperCase(), w / 2, h - 1.5, { align: 'center' });

  // COPYRIGHT (p2, verso)
  newPage({ front: true });
  cursorY = marginTop + 0.5;
  const year = String(p.frontMatter?.copyrightYear || p.pubYear || new Date().getFullYear());
  const publisher = p.publisher || p.frontMatter?.publisher || '';
  writeParagraph(`Copyright © ${year} ${p.author || ''}.`, { size: 10 });
  writeParagraph('All rights reserved. No part of this book may be reproduced or transmitted in any form or by any means without permission in writing from the author.', { size: 10 });
  if (p.frontMatter?.fictionDisclaimer) writeParagraph(FICTION_DISCLAIMER, { size: 10 });
  if (p.isbn) writeParagraph('ISBN: ' + p.isbn, { size: 10 });
  if (publisher) writeParagraph('Published by ' + publisher, { size: 10 });
  contributorsLines(p).forEach(line => writeParagraph(line, { size: 10 }));
  writeParagraph(`First edition, ${year}.`, { size: 10 });

  // DEDICATION (recto)
  if (p.dedication) {
    newRectoPage({ front: true });
    pdf.setFont(FONT, 'italic');
    pdf.setFontSize(12);
    pdf.text(p.dedication, w / 2, h / 2.4, { align: 'center', maxWidth: w - 2 });
  }

  // EPIGRAPH (recto)
  const epi = p.frontMatter?.epigraph;
  if (epi?.text) {
    newRectoPage({ front: true });
    pdf.setFont(FONT, 'italic');
    pdf.setFontSize(12);
    pdf.text(epi.text, w / 2, h / 2.6, { align: 'center', maxWidth: w - 2 });
    if (epi.attribution) {
      pdf.setFont(FONT, 'normal');
      pdf.setFontSize(10.5);
      pdf.text(epi.attribution, w / 2, h / 2.6 + 0.5, { align: 'center', maxWidth: w - 2 });
    }
  }

  // FOREWORD (recto)
  if (p.frontMatter?.foreword) {
    newRectoPage({ chapterOpen: true, front: true });
    cursorY = marginTop + 1.2;
    pdf.setFont(FONT, 'bold');
    pdf.setFontSize(titleSize);
    pdf.text('Foreword', w / 2, cursorY, { align: 'center' });
    cursorY += 0.6;
    splitParas(p.frontMatter.foreword).forEach((pa, pi) => {
      writeParagraph(pa.replace(/\n/g, ' '), { indent: pi > 0, size: bodySize });
    });
  }

  // CHAPTERS: every chapter opens on a recto page.
  p.chapters.forEach(ch => {
    newRectoPage({ chapterOpen: true });
    cursorY = marginTop + 1.2;
    const titleText = theme.titleTransform === 'uppercase' ? ch.title.toUpperCase() : ch.title;
    const maxTitleW = w - marginInner - marginOuter;
    pdf.setFont(TITLE_FONT, 'bold');
    pdf.setFontSize(titleSize);
    if (theme.titleLetterSpace) (pdf as any).setCharSpace(0.02);
    // Measure the wrapped title with the same font state it renders in, so
    // the rule and the body start clear of a two-line title instead of
    // striking through it.
    const tLines: string[] = pdf.splitTextToSize(titleText, maxTitleW);
    pdf.text(titleText, w / 2, cursorY, { align: 'center', maxWidth: maxTitleW });
    if (theme.titleLetterSpace) (pdf as any).setCharSpace(0);
    const titleBottom = cursorY + (tLines.length - 1) * (titleSize * 0.0138 * 1.15);
    if (theme.titleRule) {
      pdf.setDrawColor(120);
      pdf.setLineWidth(0.008);
      pdf.line(w / 2 - 0.7, titleBottom + 0.16, w / 2 + 0.7, titleBottom + 0.16);
    }
    cursorY = titleBottom + (theme.titleRule ? 0.55 : 0.5);
    pdf.setFont(FONT, 'normal');
    pdf.setFontSize(bodySize);
    let wroteScene = false;
    ch.scenes.forEach((sc) => {
      const paras = splitParas(sc.body);
      if (paras.length === 0) return;
      if (wroteScene) {
        if (cursorY > h - marginBottom - 0.6) { newPage(); cursorY = marginTop; }
        pdf.setFont(FONT, 'normal');
        pdf.setFontSize(BREAK.length === 1 ? 13 : bodySize);
        pdf.text(BREAK, w / 2, cursorY + 0.1, { align: 'center' });
        pdf.setFontSize(bodySize);
        cursorY += 0.3;
      }
      paras.forEach((pa, pi) => {
        if (!wroteScene && pi === 0 && theme.dropCap) {
          writeDropCapParagraph(pa.replace(/\n/g, ' '));
        } else {
          writeParagraph(pa.replace(/\n/g, ' '), { indent: wroteScene || pi > 0 });
        }
      });
      wroteScene = true;
    });
  });

  // ABOUT THE AUTHOR
  if (p.bio) {
    newRectoPage({ chapterOpen: true });
    cursorY = marginTop + 1.2;
    pdf.setFont(FONT, 'bold');
    pdf.setFontSize(titleSize);
    pdf.text('About the Author', w / 2, cursorY, { align: 'center' });
    cursorY += 0.6;
    pdf.setFont(FONT, 'normal');
    pdf.setFontSize(bodySize);
    splitParas(p.bio).forEach((pa, pi) => writeParagraph(pa.replace(/\n/g, ' '), { indent: pi > 0 }));
  }

  // BACK MATTER composed in the Launch stage
  const backText = p.launchOutputs?.backMatterText || '';
  if (backText.trim()) {
    newRectoPage({ chapterOpen: true });
    cursorY = marginTop + 0.8;
    pdf.setFont(FONT, 'normal');
    pdf.setFontSize(bodySize);
    splitParas(backText).forEach((pa) => {
      writeParagraph(pa.replace(/\n/g, ' '), { indent: false });
      cursorY += 0.08;
    });
  }

  return pdf;
}

export async function exportPdf(p: ProjectData) {
  const fonts = await fetchPdfFonts();
  const pdf = await buildPdfDoc(p, fonts);
  pdf.save(`${slugify(p.title || 'manuscript')}-print.pdf`);
}

// ============================================================================
// Plain text + project bundle
// ============================================================================

export function exportBundle(p: ProjectData) {
  const title = p.title || 'Untitled';
  const txt = `${title}\n${p.subtitle || ''}\nby ${p.author || ''}\n\n` +
    p.chapters.map(ch => `${ch.title}\n${'='.repeat(ch.title.length)}\n\n` + ch.scenes.map(s => s.body).join('\n\n')).join('\n\n');
  downloadBlob(new Blob([txt], { type: 'text/plain' }), `${slugify(title)}.txt`);
  const json = JSON.stringify(p, null, 2);
  setTimeout(() => downloadBlob(new Blob([json], { type: 'application/json' }), `${slugify(title)}-project.json`), 200);
}
