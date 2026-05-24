export type ParsedFile = {
  name: string;
  size: number;
  text: string;
  words: number;
};

function cleanText(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .trim();
}

function countWords(s: string): number {
  return (s.match(/\S+/g) || []).length;
}

async function readPlain(file: File): Promise<string> {
  return file.text();
}

async function readDocx(file: File): Promise<string> {
  const mod: any = await import('mammoth');
  const mammoth = mod.default || mod;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || '';
}

async function readPdf(file: File): Promise<string> {
  const mod: any = await import('pdfjs-dist');
  const lib = mod.default || mod;
  lib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${lib.version}/pdf.worker.min.mjs`;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .filter((item: any) => 'str' in item)
      .map((item: any) => item.str)
      .join(' ');
    text += pageText + '\n\n';
  }
  return text;
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const name = file.name;
  const lower = name.toLowerCase();
  let raw = '';
  if (lower.endsWith('.txt') || lower.endsWith('.md') || file.type.startsWith('text/')) {
    raw = await readPlain(file);
  } else if (lower.endsWith('.docx')) {
    raw = await readDocx(file);
  } else if (lower.endsWith('.pdf')) {
    raw = await readPdf(file);
  } else {
    throw new Error(`Unsupported file type: ${name}`);
  }
  const text = cleanText(raw);
  return { name, size: file.size, text, words: countWords(text) };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
