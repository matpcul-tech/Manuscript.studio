export type Scene = {
  id: string;
  title: string;
  body: string;
};

export type Chapter = {
  id: string;
  title: string;
  open: boolean;
  scenes: Scene[];
};

export type ProjectData = {
  // setup
  title: string;
  subtitle: string;
  author: string;
  genre: string;
  trim: string;
  interior: string;
  paper: string;
  publisher: string;
  pubYear: number;
  isbn: string;
  dedication: string;
  bio: string;
  // voice
  voiceSample: string;
  voiceNotes: string;
  voiceProfile: string;
  // manuscript
  chapters: Chapter[];
  activeSceneId: string;
  // cover
  coverPreset: string;
  titleFont: string;
  titleSize: number;
  titleColor: string;
  overlayAmt: number;
  // ui
  currentStage: string;
  // write mode
  writeMode: 'quick' | 'manual';
  quickPrompt: string;
  quickWordTarget: number;
  // kdp launch
  kdpDescription: string;
  kdpKeywords: string[];
  kdpCategories: string[];
  kdpPrice: number;
  kdpSelect: boolean;
  kdpStepIndex: number;
  // launch v2: sub-section workflow
  launchSubsection: string;
  frontMatter: {
    authorFirst: string;
    authorLast: string;
    contributors: { role: string; first: string; last: string }[];
    epigraph: { text: string; attribution: string };
    foreword: string;
    copyrightYear: number;
    publisher: string;
    fictionDisclaimer: boolean;
  };
  backMatter: {
    sections: { id: string; type: string; enabled: boolean; data: any }[];
    order: string[];
  };
  descriptionVariants: {
    variantA: { html: string; plain: string };
    variantB: { html: string; plain: string };
    variantC: { html: string; plain: string };
    selected: '' | 'a' | 'b' | 'c';
  };
  backCover: {
    hookHeadline: string;
    body: string;
    pullQuote: string;
    authorBioOneLine: string;
    genreTag: string;
  };
  metadataPack: {
    seriesName: string;
    seriesNumber: number;
    edition: number;
    keywords: string[];
    categories: { path: string; reason: string }[];
    readingAgeMin: number;
    readingAgeMax: number;
    sexuallyExplicit: boolean;
    isbn: string;
    useKDPFreeISBN: boolean;
  };
  asin: string;
  launchOutputs: {
    backMatterText: string;
    backCoverText: string;
    metadataText: string;
  };
};

export function cid(): string {
  return 'i_' + Math.random().toString(36).slice(2, 10);
}

export function defaultProjectData(): ProjectData {
  const firstSc = { id: cid(), title: 'Opening', body: '' };
  return {
    title: '',
    subtitle: '',
    author: '',
    genre: 'literary',
    trim: '5.25x8',
    interior: 'bw',
    paper: 'cream',
    publisher: '',
    pubYear: new Date().getFullYear(),
    isbn: '',
    dedication: '',
    bio: '',
    voiceSample: '',
    voiceNotes: '',
    voiceProfile: '',
    chapters: [{ id: cid(), title: 'Chapter 1', open: true, scenes: [firstSc] }],
    activeSceneId: firstSc.id,
    coverPreset: 'midnight',
    titleFont: 'Playfair Display',
    titleSize: 36,
    titleColor: '#ffffff',
    overlayAmt: 35,
    currentStage: 'setup',
    writeMode: 'quick',
    quickPrompt: '',
    quickWordTarget: 60000,
    kdpDescription: '',
    kdpKeywords: [],
    kdpCategories: [],
    kdpPrice: 4.99,
    kdpSelect: false,
    kdpStepIndex: 0,
    launchSubsection: 'frontmatter',
    frontMatter: {
      authorFirst: '',
      authorLast: '',
      contributors: [],
      epigraph: { text: '', attribution: '' },
      foreword: '',
      copyrightYear: new Date().getFullYear(),
      publisher: 'Published independently',
      fictionDisclaimer: true,
    },
    backMatter: {
      sections: [],
      order: [],
    },
    descriptionVariants: {
      variantA: { html: '', plain: '' },
      variantB: { html: '', plain: '' },
      variantC: { html: '', plain: '' },
      selected: '',
    },
    backCover: {
      hookHeadline: '',
      body: '',
      pullQuote: '',
      authorBioOneLine: '',
      genreTag: '',
    },
    metadataPack: {
      seriesName: '',
      seriesNumber: 0,
      edition: 1,
      keywords: ['', '', '', '', '', '', ''],
      categories: [],
      readingAgeMin: 0,
      readingAgeMax: 0,
      sexuallyExplicit: false,
      isbn: '',
      useKDPFreeISBN: true,
    },
    asin: '',
    launchOutputs: {
      backMatterText: '',
      backCoverText: '',
      metadataText: '',
    },
  };
}
