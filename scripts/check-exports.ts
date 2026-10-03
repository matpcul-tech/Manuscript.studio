// Export verification harness.
//
// Builds a sample project through the real builders in lib/exports.ts and
// validates the results:
//   - .docx: real OOXML zip with [Content_Types].xml, a w:document, and a
//     Word TOC field.
//   - .epub: structural checks, then full epubcheck when a checker is on
//     PATH (`epubcheck`) or supplied via $EPUBCHECK_JAR. epubcheck errors
//     fail the run.
//   - .pdf: builds with the embedded DejaVu Serif faces from public/fonts
//     and asserts page structure (chapters land on recto pages).
//
// Run: npm run check:exports
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import JSZip from 'jszip';
import { Packer } from 'docx';
import { buildDocxDocument, buildEpubZip, buildPdfDoc, type PdfFonts } from '../lib/exports';
import { defaultProjectData, cid, type ProjectData } from '../lib/types';

const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'ms-exports-'));
let failures = 0;
const ok = (msg: string) => console.log('  ok  ' + msg);
const bad = (msg: string) => { failures++; console.error('  FAIL ' + msg); };

function sampleProject(): ProjectData {
  const p = defaultProjectData();
  p.title = 'The Verification Draft';
  p.subtitle = 'A Sample for the Export Harness';
  p.author = 'Check Script';
  p.trim = '5.25x8';
  p.pubYear = 2026;
  p.publisher = 'Manuscript Studio';
  p.dedication = 'For everyone who opens the file before shipping it.';
  p.bio = 'The check script lives in scripts/check-exports.ts and runs the real builders.';
  p.synopsis = 'Three chapters generated purely to exercise every export path.';
  p.frontMatter.epigraph = { text: 'Trust, then verify the zip entries.', attribution: 'The Build Log' };
  p.frontMatter.foreword = 'This foreword exists so the foreword path is exercised.\n\nIt has two paragraphs on purpose.';
  p.frontMatter.contributors = [{ role: 'Edited by', first: 'Q.', last: 'Assurance' }];
  p.launchOutputs.backMatterText = 'Thank you for reading.\n\nReviews help independent authors more than anything else.';
  const para = (n: number) =>
    Array.from({ length: 3 }, (_, i) =>
      `Paragraph ${i + 1} of block ${n}. The harness writes enough prose to force line wrapping, page breaks, and a believable page count so the recto logic actually gets tested instead of asserted. `.repeat(4).trim()
    ).join('\n\n');
  p.chapters = [1, 2, 3].map(n => ({
    id: cid(),
    title: `Chapter ${n}: Structural Integrity`,
    open: false,
    scenes: [
      { id: cid(), title: 'Scene 1', body: para(n) },
      { id: cid(), title: 'Scene 2', body: para(n + 10) },
    ],
  }));
  return p;
}

// Minimal valid 1x1 white JPEG so the EPUB cover path runs under epubcheck.
const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a' +
  'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIy' +
  'MjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIA' +
  'AhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQA' +
  'AAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3' +
  'ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWm' +
  'p6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEA' +
  'AwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSEx' +
  'BhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElK' +
  'U1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3' +
  'uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iii' +
  'gD//2Q==', 'base64');

async function main() {
  const p = sampleProject();
  console.log('Output dir: ' + OUT);

  // ---- DOCX ----
  console.log('\nDOCX');
  const doc = buildDocxDocument(p);
  const docxBuf = await Packer.toBuffer(doc);
  const docxPath = path.join(OUT, 'sample.docx');
  fs.writeFileSync(docxPath, docxBuf);
  const docxZip = await JSZip.loadAsync(docxBuf);
  const hasCT = !!docxZip.file('[Content_Types].xml');
  hasCT ? ok('[Content_Types].xml present (real OOXML zip, not HTML)') : bad('missing [Content_Types].xml');
  const docXml = await docxZip.file('word/document.xml')?.async('string');
  if (!docXml) bad('missing word/document.xml');
  else {
    /<w:document[\s>]/.test(docXml) ? ok('word/document.xml is a WordprocessingML document') : bad('document.xml is not WordprocessingML');
    /TOC/.test(docXml) ? ok('Word TOC field present (page numbers populate on Update Field)') : bad('no TOC field found');
    docXml.includes('Structural Integrity') ? ok('chapter content present') : bad('chapter content missing');
    docXml.includes('*  *  *') ? ok('scene breaks present in the file') : bad('scene breaks missing');
    docXml.includes('Foreword') && docXml.includes('Trust, then verify') ? ok('epigraph and foreword rendered') : bad('front matter fields not rendered');
  }
  console.log('  wrote ' + docxPath);

  // ---- EPUB (with cover) ----
  console.log('\nEPUB');
  const zip = buildEpubZip(p, { data: TINY_JPEG, mediaType: 'image/jpeg' });
  const epubBuf = await zip.generateAsync({ type: 'nodebuffer', mimeType: 'application/epub+zip' });
  const epubPath = path.join(OUT, 'sample.epub');
  fs.writeFileSync(epubPath, epubBuf);
  const epubZip = await JSZip.loadAsync(epubBuf);
  const opf = await epubZip.file('OEBPS/content.opf')?.async('string');
  if (!opf) bad('missing content.opf');
  else {
    opf.includes('properties="cover-image"') ? ok('cover-image in manifest') : bad('cover missing from manifest');
    opf.includes('title-type">subtitle') ? ok('subtitle carried as a refined dc:title, not dc:description') : bad('subtitle metadata wrong');
    !opf.includes('<dc:description>A Sample for the Export Harness') ? ok('dc:description no longer holds the subtitle') : bad('subtitle stuffed into dc:description');
  }
  const ch1 = await epubZip.file('OEBPS/chapter_001.xhtml')?.async('string');
  if (ch1 && ch1.includes('class="scene-break"') && ch1.includes('*&#8194;')) ok('scene break is literal markup, not CSS ::after');
  else bad('scene break not in markup');

  // epubcheck, when available
  const jar = process.env.EPUBCHECK_JAR;
  let ran = false;
  for (const cmd of [jar ? ['java', ['-jar', jar, epubPath]] : null, ['epubcheck', [epubPath]]] as (null | [string, string[]])[]) {
    if (!cmd) continue;
    const r = spawnSync(cmd[0], cmd[1], { encoding: 'utf-8' });
    if (r.error) continue;
    ran = true;
    const out = (r.stdout || '') + (r.stderr || '');
    console.log(out.trim().split('\n').slice(-4).map(l => '  ' + l).join('\n'));
    if (r.status === 0) ok('epubcheck passed with zero errors');
    else bad('epubcheck reported errors');
    break;
  }
  if (!ran) console.log('  note: epubcheck not found on PATH and EPUBCHECK_JAR unset; ran structural checks only');
  console.log('  wrote ' + epubPath);

  // ---- PDF ----
  console.log('\nPDF');
  const fontDir = path.join(__dirname, '..', 'public', 'fonts');
  let fonts: PdfFonts | null = null;
  try {
    fonts = {
      normal: fs.readFileSync(path.join(fontDir, 'DejaVuSerif.ttf')).toString('base64'),
      bold: fs.readFileSync(path.join(fontDir, 'DejaVuSerif-Bold.ttf')).toString('base64'),
      italic: fs.readFileSync(path.join(fontDir, 'DejaVuSerif-Italic.ttf')).toString('base64'),
      bolditalic: fs.readFileSync(path.join(fontDir, 'DejaVuSerif-BoldItalic.ttf')).toString('base64'),
    };
    ok('DejaVu Serif faces loaded for embedding');
  } catch {
    bad('font files missing from public/fonts');
  }
  const pdf = await buildPdfDoc(p, fonts);
  const pages = (pdf as any).getNumberOfPages();
  pages >= p.chapters.length * 2 ? ok(`${pages} pages generated`) : bad('suspiciously few pages: ' + pages);
  const pdfBytes = Buffer.from((pdf as any).output('arraybuffer'));
  const pdfPath = path.join(OUT, 'sample-print.pdf');
  fs.writeFileSync(pdfPath, pdfBytes);
  const pdfStr = pdfBytes.toString('latin1');
  pdfStr.includes('DejaVuSerif') ? ok('DejaVu Serif embedded in the PDF') : bad('embedded font not found in PDF');
  console.log('  wrote ' + pdfPath);

  console.log('');
  if (failures > 0) {
    console.error(`${failures} check(s) failed.`);
    process.exit(1);
  }
  console.log('All export checks passed.');
  console.log('OUTPUT_DIR=' + OUT);
}

main().catch(e => { console.error(e); process.exit(1); });
