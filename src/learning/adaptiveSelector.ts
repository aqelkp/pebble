import type { SkillType } from '../curriculum/curriculumTypes';
import {
  getLearningSettings,
  getMasteryTier,
  getPlayerConceptStats,
  type ConceptSkillStat,
  type MasteryTier,
} from './learningStore';

const TIER_WEIGHTS: Record<MasteryTier, number> = {
  'needs-practice': 5.0,
  unseen: 3.0,
  developing: 2.5,
  mastered: 1.0,
};

function getSecureRandom(): number {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return arr[0] / 4294967296;
  }
  return Math.random();
}

/**
 * Selects `count` items without replacement, weighting "needs-practice" and "unseen"
 * concepts higher when Adaptive Practice is enabled in Parent Settings.
 * Always keeps a healthy mix (~25%+ chance) of mastered items for child confidence.
 */
export function pickWeightedAdaptive<T>(
  items: readonly T[],
  getConceptId: (item: T) => string,
  playerId: string,
  skillType: SkillType,
  count: number,
): T[] {
  if (items.length === 0 || count <= 0) return [];
  const targetCount = Math.min(count, items.length);
  const settings = getLearningSettings();

  if (!settings.adaptivePracticeEnabled) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(getSecureRandom() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, targetCount);
  }

  const stats = getPlayerConceptStats(playerId);
  const statByConcept = new Map<string, ConceptSkillStat>();
  for (const s of stats) {
    if (s.skillType === skillType) {
      statByConcept.set(s.conceptId, s);
    }
  }

  const pool = items.map((item) => {
    const stat = statByConcept.get(getConceptId(item));
    const tier = getMasteryTier(stat);
    return {
      item,
      weight: TIER_WEIGHTS[tier],
    };
  });

  const chosen: T[] = [];
  while (chosen.length < targetCount && pool.length > 0) {
    const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
    let threshold = getSecureRandom() * totalWeight;
    let pickedIdx = 0;

    for (let i = 0; i < pool.length; i += 1) {
      threshold -= pool[i].weight;
      if (threshold <= 0) {
        pickedIdx = i;
        break;
      }
    }

    chosen.push(pool[pickedIdx].item);
    pool.splice(pickedIdx, 1);
  }

  return chosen;
}
