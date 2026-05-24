import type { ProjectData } from './types';
import JSZip from 'jszip';

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

export function exportDocx(p: ProjectData) {
  const title = p.title || 'Untitled';
  let html = `<div class="title-page"><h1>${escapeHtml(title)}</h1>`;
  if (p.subtitle) html += `<div class="subtitle">${escapeHtml(p.subtitle)}</div>`;
  html += `<div class="author">${escapeHtml(p.author || '')}</div></div>`;

  html += `<div class="copyright-page"><p class="first">Copyright &copy; ${escapeHtml(String(p.pubYear || new Date().getFullYear()))} ${escapeHtml(p.author || '')}.</p>`;
  html += `<p class="first">All rights reserved. No part of this book may be reproduced or transmitted in any form or by any means, electronic or mechanical, including photocopying, recording, or by any information storage and retrieval system, without permission in writing from the author.</p>`;
  if (p.isbn) html += `<p class="first">ISBN: ${escapeHtml(p.isbn)}</p>`;
  if (p.publisher) html += `<p class="first">Published by ${escapeHtml(p.publisher)}</p>`;
  html += `<p class="first">First edition, ${escapeHtml(String(p.pubYear || new Date().getFullYear()))}.</p></div>`;

  if (p.dedication) {
    html += `<div class="dedication-page"><div class="dedication">${escapeHtml(p.dedication)}</div></div>`;
  }

  html += `<div class="toc-page toc"><h2>Contents</h2>`;
  p.chapters.forEach(ch => {
    html += `<div class="toc-entry"><span>${escapeHtml(ch.title)}</span></div>`;
  });
  html += `</div>`;

  p.chapters.forEach((ch, i) => {
    html += `<h1${i === 0 ? ' class="first"' : ''}>${escapeHtml(ch.title)}</h1>`;
    ch.scenes.forEach((sc, si) => {
      if (sc.body.trim()) {
        const paras = sc.body.split(/\n\n+/);
        paras.forEach((para, pi) => {
          if (para.trim()) {
            const cls = (si === 0 && pi === 0) ? ' class="first"' : '';
            html += `<p${cls}>${escapeHtml(para.trim()).replace(/\n/g, '<br>')}</p>`;
          }
        });
      }
    });
  });

  if (p.bio) {
    html += `<h1>About the Author</h1><p class="first">${escapeHtml(p.bio)}</p>`;
  }

  const fullHtml = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
@page { size: ${p.trim.replace('x', 'in ')}in; margin: 0.75in 0.625in 0.75in 0.875in; mso-mirror-margins: yes; }
body { font-family: 'Garamond', 'Georgia', serif; font-size: 11pt; line-height: 1.5; }
h1 { font-size: 24pt; text-align: center; page-break-before: always; margin: 1in 0 0.5in; font-weight: 600; }
h1.first { page-break-before: avoid; }
h2 { font-size: 14pt; text-align: center; margin: 0.5in 0 0.25in; }
p { text-indent: 0.25in; margin: 0; text-align: justify; }
p.first { text-indent: 0; }
.title-page { text-align: center; page-break-after: always; }
.title-page h1 { font-size: 36pt; margin-top: 2.5in; page-break-before: avoid; }
.title-page .subtitle { font-size: 16pt; font-style: italic; margin-top: 0.3in; }
.title-page .author { font-size: 14pt; margin-top: 1.5in; letter-spacing: 0.1em; text-transform: uppercase; }
.copyright-page, .dedication-page, .toc-page { page-break-after: always; }
.copyright-page { font-size: 10pt; }
.dedication { text-align: center; margin-top: 3in; font-style: italic; font-size: 12pt; }
.toc-entry { padding: 6pt 0; }
</style></head><body>${html}</body></html>`;

  const blob = new Blob([fullHtml], { type: 'application/msword' });
  downloadBlob(blob, `${slugify(title)}.doc`);
}

export async function exportEpub(p: ProjectData) {
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
  const uuid = 'urn:uuid:' + (crypto as any).randomUUID();
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

  const chapterFiles: { fname: string; title: string; idx: number }[] = [];
  p.chapters.forEach((ch, idx) => {
    const fname = `chapter_${String(idx + 1).padStart(3, '0')}.xhtml`;
    const body = ch.scenes.map(sc =>
      sc.body.split(/\n\n+/).map(pa => pa.trim() ? `<p>${escapeHtml(pa.trim())}</p>` : '').join('\n')
    ).join('\n<hr class="scene-break"/>\n');
    oebps.file(fname, `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${escapeHtml(ch.title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body><h1>${escapeHtml(ch.title)}</h1>${body}</body>
</html>`);
    chapterFiles.push({ fname, title: ch.title, idx });
  });

  oebps.file('title.xhtml', `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Title Page</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body class="title-page">
<h1 class="title">${escapeHtml(p.title || 'Untitled')}</h1>
${p.subtitle ? `<p class="subtitle">${escapeHtml(p.subtitle)}</p>` : ''}
<p class="author">${escapeHtml(p.author || '')}</p>
</body>
</html>`);

  oebps.file('copyright.xhtml', `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Copyright</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body class="copyright">
<p>Copyright &#169; ${escapeHtml(String(p.pubYear || new Date().getFullYear()))} ${escapeHtml(p.author || '')}.</p>
<p>All rights reserved. No part of this book may be reproduced or transmitted in any form or by any means without permission in writing from the author.</p>
${p.isbn ? `<p>ISBN: ${escapeHtml(p.isbn)}</p>` : ''}
${p.publisher ? `<p>Published by ${escapeHtml(p.publisher)}</p>` : ''}
</body>
</html>`);

  if (p.dedication) {
    oebps.file('dedication.xhtml', `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Dedication</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body class="dedication-page"><p class="dedication">${escapeHtml(p.dedication)}</p></body>
</html>`);
  }

  if (p.bio) {
    oebps.file('bio.xhtml', `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>About the Author</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body><h1>About the Author</h1><p>${escapeHtml(p.bio)}</p></body>
</html>`);
  }

  oebps.file('style.css', `body { font-family: serif; line-height: 1.6; margin: 1em; }
h1 { font-family: serif; font-weight: 600; text-align: center; margin: 2em 0 1em; font-size: 1.6em; }
p { text-indent: 1.2em; margin: 0 0 0.3em; text-align: justify; }
.title-page { text-align: center; }
.title-page .title { font-size: 2.4em; margin-top: 3em; }
.title-page .subtitle { font-style: italic; font-size: 1.1em; }
.title-page .author { margin-top: 2em; text-transform: uppercase; letter-spacing: 0.1em; }
.dedication { text-align: center; font-style: italic; margin-top: 4em; }
.copyright p { text-indent: 0; }
.scene-break { border: none; text-align: center; margin: 1em 0; }
.scene-break::after { content: "* * *"; letter-spacing: 0.5em; color: #555; }`);

  let navItems = '';
  navItems += `<li><a href="title.xhtml">Title Page</a></li>`;
  navItems += `<li><a href="copyright.xhtml">Copyright</a></li>`;
  if (p.dedication) navItems += `<li><a href="dedication.xhtml">Dedication</a></li>`;
  chapterFiles.forEach(c => { navItems += `<li><a href="${c.fname}">${escapeHtml(c.title)}</a></li>`; });
  if (p.bio) navItems += `<li><a href="bio.xhtml">About the Author</a></li>`;

  oebps.file('nav.xhtml', `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Table of Contents</title></head>
<body><nav epub:type="toc" id="toc"><h1>Contents</h1><ol>${navItems}</ol></nav></body>
</html>`);

  let manifest = `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
<item id="style" href="style.css" media-type="text/css"/>
<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>
<item id="copyright" href="copyright.xhtml" media-type="application/xhtml+xml"/>`;
  if (p.dedication) manifest += `\n<item id="dedication" href="dedication.xhtml" media-type="application/xhtml+xml"/>`;
  chapterFiles.forEach(c => { manifest += `\n<item id="ch${c.idx + 1}" href="${c.fname}" media-type="application/xhtml+xml"/>`; });
  if (p.bio) manifest += `\n<item id="bio" href="bio.xhtml" media-type="application/xhtml+xml"/>`;

  let spine = `<itemref idref="title"/>\n<itemref idref="copyright"/>`;
  if (p.dedication) spine += `\n<itemref idref="dedication"/>`;
  chapterFiles.forEach(c => { spine += `\n<itemref idref="ch${c.idx + 1}"/>`; });
  if (p.bio) spine += `\n<itemref idref="bio"/>`;

  oebps.file('content.opf', `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="en">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="bookid">${uuid}</dc:identifier>
<dc:title>${escapeHtml(p.title || 'Untitled')}</dc:title>
<dc:creator>${escapeHtml(p.author || '')}</dc:creator>
<dc:language>en</dc:language>
<dc:date>${now.split('T')[0]}</dc:date>
<meta property="dcterms:modified">${now}</meta>
${p.subtitle ? `<dc:description>${escapeHtml(p.subtitle)}</dc:description>` : ''}
${p.isbn ? `<dc:identifier>${escapeHtml(p.isbn)}</dc:identifier>` : ''}
</metadata>
<manifest>${manifest}</manifest>
<spine>${spine}</spine>
</package>`);

  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
  downloadBlob(blob, `${slugify(p.title || 'manuscript')}.epub`);
}

export async function exportPdf(p: ProjectData) {
  const { jsPDF } = await import('jspdf');
  const [w, h] = p.trim.split('x').map(parseFloat);
  const pdf = new jsPDF({ unit: 'in', format: [w, h], orientation: 'portrait' });
  const marginTop = 0.75, marginBottom = 0.75;
  const marginOuter = 0.625, marginInner = 0.875;
  const bodySize = 11;
  const titleSize = 22;

  let page = 1;
  let cursorY = 2.5;

  function setMargins() {
    const isRight = page % 2 === 1;
    return { left: isRight ? marginInner : marginOuter, right: isRight ? marginOuter : marginInner };
  }
  function newPage() { pdf.addPage(); page++; }
  function addPageNumber() {
    if (page < 3) return;
    const m = setMargins();
    pdf.setFont('times', 'normal');
    pdf.setFontSize(10);
    const x = page % 2 === 1 ? w - m.right : m.left;
    pdf.text(String(page), x, h - 0.4, { align: page % 2 === 1 ? 'right' : 'left' });
  }
  function writeParagraph(text: string, opts: any = {}) {
    const m = setMargins();
    const textWidth = w - m.left - m.right;
    pdf.setFont(opts.font || 'times', opts.style || 'normal');
    pdf.setFontSize(opts.size || bodySize);
    const lines = pdf.splitTextToSize(text, textWidth - (opts.indent ? 0.25 : 0));
    let y = opts.y || cursorY;
    lines.forEach((ln: string, i: number) => {
      if (y > h - marginBottom - 0.2) {
        addPageNumber(); newPage(); y = marginTop;
      }
      const x = opts.center ? w / 2 : (m.left + (opts.indent && i === 0 ? 0.25 : 0));
      pdf.text(ln, x, y, { align: opts.center ? 'center' : 'left' });
      y += (opts.size || bodySize) * 0.014 + 0.06;
    });
    cursorY = y + 0.05;
  }

  // TITLE PAGE
  pdf.setFont('times', 'bold');
  pdf.setFontSize(titleSize + 8);
  pdf.text(p.title || 'Untitled', w / 2, 3, { align: 'center' });
  if (p.subtitle) {
    pdf.setFont('times', 'italic');
    pdf.setFontSize(14);
    pdf.text(p.subtitle, w / 2, 3.6, { align: 'center', maxWidth: w - 1.5 });
  }
  pdf.setFont('times', 'normal');
  pdf.setFontSize(12);
  pdf.text((p.author || '').toUpperCase(), w / 2, h - 1.5, { align: 'center' });

  newPage();
  cursorY = marginTop + 0.5;
  writeParagraph(`Copyright © ${p.pubYear || new Date().getFullYear()} ${p.author || ''}.`, { size: 10 });
  writeParagraph('All rights reserved. No part of this book may be reproduced or transmitted in any form or by any means without permission in writing from the author.', { size: 10 });
  if (p.isbn) writeParagraph('ISBN: ' + p.isbn, { size: 10 });
  if (p.publisher) writeParagraph('Published by ' + p.publisher, { size: 10 });
  writeParagraph(`First edition, ${p.pubYear || new Date().getFullYear()}.`, { size: 10 });

  if (p.dedication) {
    newPage();
    pdf.setFont('times', 'italic');
    pdf.setFontSize(12);
    pdf.text(p.dedication, w / 2, h / 2, { align: 'center', maxWidth: w - 2 });
  }

  p.chapters.forEach(ch => {
    newPage();
    cursorY = marginTop + 1.2;
    pdf.setFont('times', 'bold');
    pdf.setFontSize(titleSize);
    pdf.text(ch.title, w / 2, cursorY, { align: 'center' });
    cursorY += 0.6;
    pdf.setFont('times', 'normal');
    pdf.setFontSize(bodySize);
    ch.scenes.forEach((sc, si) => {
      if (si > 0) {
        pdf.text('* * *', w / 2, cursorY + 0.1, { align: 'center' });
        cursorY += 0.3;
      }
      const paras = sc.body.split(/\n\n+/).filter(pa => pa.trim());
      paras.forEach((pa, pi) => {
        writeParagraph(pa.trim().replace(/\n/g, ' '), { indent: pi > 0 || si > 0 });
      });
    });
    addPageNumber();
  });

  if (p.bio) {
    newPage();
    cursorY = marginTop + 1.2;
    pdf.setFont('times', 'bold');
    pdf.setFontSize(titleSize);
    pdf.text('About the Author', w / 2, cursorY, { align: 'center' });
    cursorY += 0.6;
    pdf.setFont('times', 'normal');
    pdf.setFontSize(bodySize);
    writeParagraph(p.bio);
    addPageNumber();
  }

  pdf.save(`${slugify(p.title || 'manuscript')}-print.pdf`);
}

export function exportBundle(p: ProjectData) {
  const title = p.title || 'Untitled';
  const txt = `${title}\n${p.subtitle || ''}\nby ${p.author || ''}\n\n` +
    p.chapters.map(ch => `${ch.title}\n${'='.repeat(ch.title.length)}\n\n` + ch.scenes.map(s => s.body).join('\n\n')).join('\n\n');
  downloadBlob(new Blob([txt], { type: 'text/plain' }), `${slugify(title)}.txt`);
  const json = JSON.stringify(p, null, 2);
  setTimeout(() => downloadBlob(new Blob([json], { type: 'application/json' }), `${slugify(title)}-project.json`), 200);
}
