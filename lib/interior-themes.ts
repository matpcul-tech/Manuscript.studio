// ============================================================================
// Interior themes: one spec consumed by the PDF, EPUB, and DOCX builders and
// by the Publish stage picker, so the printed book, the Kindle file, and the
// manuscript all carry the same design decisions. Every glyph used here is
// verified present in the embedded DejaVu faces (the fleuron is not, which
// is why the elegant break is the traditional asterism instead).
// ============================================================================

export type InteriorTheme = {
  id: string;
  name: string;
  blurb: string;
  titleFace: 'serif' | 'sans';
  titleTransform: 'none' | 'uppercase';
  titleSizePt: number;      // chapter title size in the print PDF
  titleLetterSpace: boolean; // letterspaced title (print + EPUB)
  titleRule: boolean;        // thin centered rule under the chapter title
  dropCap: boolean;          // drop cap on the first paragraph of each chapter
  sceneBreak: string;        // glyph string used across PDF, EPUB, and DOCX
};

export const INTERIOR_THEMES: Record<string, InteriorTheme> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    blurb: 'Traditional trade interior. Bold serif titles, asterisk breaks.',
    titleFace: 'serif',
    titleTransform: 'none',
    titleSizePt: 22,
    titleLetterSpace: false,
    titleRule: false,
    dropCap: false,
    sceneBreak: '*  *  *',
  },
  elegant: {
    id: 'elegant',
    name: 'Elegant',
    blurb: 'Letterspaced capitals, drop caps, asterism breaks.',
    titleFace: 'serif',
    titleTransform: 'uppercase',
    titleSizePt: 17,
    titleLetterSpace: true,
    titleRule: true,
    dropCap: true,
    sceneBreak: '⁂',
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    blurb: 'Clean sans titles, diamond breaks.',
    titleFace: 'sans',
    titleTransform: 'none',
    titleSizePt: 20,
    titleLetterSpace: false,
    titleRule: false,
    dropCap: false,
    sceneBreak: '◆ ◆ ◆',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    blurb: 'Understated titles, generous space, tilde breaks.',
    titleFace: 'serif',
    titleTransform: 'none',
    titleSizePt: 16,
    titleLetterSpace: false,
    titleRule: false,
    dropCap: false,
    sceneBreak: '~',
  },
};

export function getTheme(id?: string): InteriorTheme {
  return INTERIOR_THEMES[id || 'classic'] || INTERIOR_THEMES.classic;
}
