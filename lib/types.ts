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
  };
}
