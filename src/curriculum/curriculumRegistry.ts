import type {
  ClassLevelId,
  ClassLevelOption,
  CurriculumBenchmarkSpec,
  CurriculumFrameworkId,
  CurriculumFrameworkOption,
} from './curriculumTypes';
import { K1_BENCHMARK } from './levels/k1';

export const CLASS_LEVEL_OPTIONS: readonly ClassLevelOption[] = [
  {
    id: 'nursery',
    label: 'Nursery',
    shortLabel: 'Nursery',
    ageHint: 'Ages 2.5 – 3.5',
    available: false,
  },
  {
    id: 'k1',
    label: 'K1 (LKG)',
    shortLabel: 'K1',
    ageHint: 'Ages 3.5 – 4.5',
    available: true,
  },
  {
    id: 'k2',
    label: 'K2 (UKG)',
    shortLabel: 'K2',
    ageHint: 'Ages 4.5 – 5.5',
    available: false,
  },
  {
    id: 'grade1',
    label: 'Grade 1',
    shortLabel: 'G1',
    ageHint: 'Ages 5.5 – 6.5',
    available: false,
  },
];

export const CURRICULUM_FRAMEWORKS: readonly CurriculumFrameworkOption[] = [
  {
    id: 'early-years-intl',
    label: 'Early Years International (Default)',
    description: 'Balanced phonics, vocabulary, numeracy, and logic milestones.',
  },
  {
    id: 'eyfs-uk',
    label: 'EYFS (UK Early Years)',
    description: 'Coming soon — UK Early Years Foundation Stage mapping.',
  },
  {
    id: 'nep-foundation',
    label: 'NEP Foundational Stage',
    description: 'Coming soon — Foundational Literacy & Numeracy (FLN) mapping.',
  },
];

export const DEFAULT_CLASS_LEVEL: ClassLevelId = 'k1';
export const DEFAULT_FRAMEWORK_ID: CurriculumFrameworkId = 'early-years-intl';

const BENCHMARKS_BY_CLASS: Partial<Record<ClassLevelId, CurriculumBenchmarkSpec>> = {
  k1: K1_BENCHMARK,
};

export function isValidClassLevelId(value: unknown): value is ClassLevelId {
  return (
    value === 'nursery' || value === 'k1' || value === 'k2' || value === 'grade1'
  );
}

export function isValidFrameworkId(value: unknown): value is CurriculumFrameworkId {
  return (
    value === 'early-years-intl' || value === 'eyfs-uk' || value === 'nep-foundation'
  );
}

export function getCurriculumForClass(classLevel: ClassLevelId = DEFAULT_CLASS_LEVEL): CurriculumBenchmarkSpec {
  return BENCHMARKS_BY_CLASS[classLevel] ?? K1_BENCHMARK;
}
