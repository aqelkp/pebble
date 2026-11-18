import type { CanonicalWordId, LetterId } from '../data/wordBank';

export type ClassLevelId = 'nursery' | 'k1' | 'k2' | 'grade1';

export type CurriculumFrameworkId = 'early-years-intl' | 'eyfs-uk' | 'nep-foundation';

export type CurriculumDomainId =
  | 'literacy'
  | 'numeracy'
  | 'general-awareness'
  | 'cognition'
  | 'self-regulation';

export type SkillType =
  | 'picture_recognition'
  | 'initial_letter_sound'
  | 'word_spelling'
  | 'letter_formation'
  | 'quantity_counting'
  | 'group_joining'
  | 'grid_deduction'
  | 'visual_recall'
  | 'sight_word_reading'
  | 'phrase_reading'
  | 'number_sense_50'
  | 'shapes_premath'
  | 'general_awareness'
  | 'sequence_order';

export type WordCategory = 'animals' | 'food' | 'nature' | 'vehicles' | 'home' | 'concepts';

export interface ClassLevelOption {
  id: ClassLevelId;
  label: string;
  shortLabel: string;
  ageHint: string;
  available: boolean;
}

export interface CurriculumFrameworkOption {
  id: CurriculumFrameworkId;
  label: string;
  description: string;
}

export interface CurriculumDomainSpec {
  id: CurriculumDomainId;
  title: string;
  subtitle: string;
  accentColor: string;
  targetSkills: readonly SkillType[];
}

export interface CurriculumBenchmarkSpec {
  classLevel: ClassLevelId;
  title: string;
  ageRange: string;
  description: string;
  domains: readonly CurriculumDomainSpec[];
  targetLetters: readonly LetterId[];
  coreWordIds: readonly CanonicalWordId[];
  cvcWordIds: readonly CanonicalWordId[];
  targetNumbers: readonly number[];
  masteryThresholdPct: number;
  minExposuresForMastery: number;
}

export const SKILL_LABELS: Record<SkillType, { label: string; question: string }> = {
  picture_recognition: {
    label: 'Picture Identification',
    question: 'Can he identify the picture of this word?',
  },
  initial_letter_sound: {
    label: 'Starting Letter Sound',
    question: 'Can he identify what letter it starts with?',
  },
  word_spelling: {
    label: 'Letter Spelling & Blending',
    question: 'Can he come up with the letters of this word?',
  },
  letter_formation: {
    label: 'Letter Stroke Order',
    question: 'Can he write capital and small letters in the right stroke order?',
  },
  quantity_counting: {
    label: 'One-to-One Counting',
    question: 'Can he count objects accurately?',
  },
  group_joining: {
    label: 'Group Joining (Early Addition)',
    question: 'Can he join two groups to find the total?',
  },
  grid_deduction: {
    label: 'Pattern & Grid Logic',
    question: 'Can he deduce missing items by row and column?',
  },
  visual_recall: {
    label: 'Visual Working Memory',
    question: 'Can he remember and match card locations?',
  },
  sight_word_reading: {
    label: 'Sight & CVC Word Reading',
    question: 'Can he hear a spoken word and find it in print?',
  },
  phrase_reading: {
    label: 'Phrases & CVC Sound Position',
    question: 'Can he read short CVC + sight-word phrases and spot middle/ending sounds?',
  },
  number_sense_50: {
    label: 'Numbers 0–50, Tens/Ones & Ordinals',
    question: 'Can he recognise 0–50, build tens & ones, read zero–ten, and find 1st–10th?',
  },
  shapes_premath: {
    label: '2D/3D Shapes, Comparisons & Graphs',
    question: 'Can he identify 2D/3D shapes, compare sizes/volumes, measure length, and read bar graphs?',
  },
  general_awareness: {
    label: 'General Awareness & World Around Us',
    question: 'Does he know body senses, helpers, animals, plants, transport, 3Rs, and the sky?',
  },
  sequence_order: {
    label: 'Lifecycles, Routines & Number Order',
    question: 'Can he sequence lifecycles, times of day, and forward/backward counts?',
  },
};

export const WORD_CATEGORY_LABELS: Record<WordCategory, string> = {
  animals: 'Animals',
  food: 'Food & Fruit',
  nature: 'Nature & Sky',
  vehicles: 'Vehicles & Go',
  home: 'Home & Objects',
  concepts: 'Concepts & Music',
};
