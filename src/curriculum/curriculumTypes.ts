import type { CanonicalWordId, LetterId } from '../data/wordBank';

export type ClassLevelId = 'nursery' | 'k1' | 'k2' | 'grade1';

export type CurriculumFrameworkId = 'early-years-intl' | 'eyfs-uk' | 'nep-foundation';

export type CurriculumDomainId = 'literacy' | 'numeracy' | 'cognition' | 'self-regulation';

export type SkillType =
  | 'picture_recognition'
  | 'initial_letter_sound'
  | 'word_spelling'
  | 'quantity_counting'
  | 'group_joining'
  | 'grid_deduction'
  | 'visual_recall';

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
};

export const WORD_CATEGORY_LABELS: Record<WordCategory, string> = {
  animals: 'Animals',
  food: 'Food & Fruit',
  nature: 'Nature & Sky',
  vehicles: 'Vehicles & Go',
  home: 'Home & Objects',
  concepts: 'Concepts & Music',
};
