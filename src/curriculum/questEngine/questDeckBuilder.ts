import type { QuestPackId, QuestPrompt, QuestRoundLength } from './questTypes';
import {
  buildAboutMeHelpersPackPool,
  buildAnimalsNaturePackPool,
  buildWorldTransportPackPool,
} from './packs/generalAwarenessPacks';
import { buildReadingPhrasesPackPool } from './packs/literacyPacks';
import {
  buildNumbers50PackPool,
  buildPlaceValueLinesPackPool,
  shuffleItems,
} from './packs/mathPacks';
import {
  buildPreMathPackPool,
  buildShapesPatternsPackPool,
} from './packs/shapesPreMathPacks';

function buildPoolForConcretePack(packId: Exclude<QuestPackId, 'smart-mix'>): QuestPrompt[] {
  switch (packId) {
    case 'numbers-50':
      return [...buildNumbers50PackPool(), ...buildNumbers50PackPool()];
    case 'place-value-lines':
      return [...buildPlaceValueLinesPackPool(), ...buildPlaceValueLinesPackPool()];
    case 'shapes-patterns':
      return [...buildShapesPatternsPackPool(), ...buildShapesPatternsPackPool()];
    case 'pre-math':
      return [...buildPreMathPackPool(), ...buildPreMathPackPool()];
    case 'reading-phrases':
      return [...buildReadingPhrasesPackPool(), ...buildReadingPhrasesPackPool()];
    case 'about-me-helpers':
      return [...buildAboutMeHelpersPackPool(), ...buildAboutMeHelpersPackPool()];
    case 'animals-nature':
      return [...buildAnimalsNaturePackPool(), ...buildAnimalsNaturePackPool()];
    case 'world-transport':
      return [...buildWorldTransportPackPool(), ...buildWorldTransportPackPool()];
  }
}

/**
 * Generates a fresh, deduplicated round of K1 prompts for any pack (or balanced Smart K1 Mix).
 */
export function generateQuestDeck(
  packId: QuestPackId,
  roundLength: QuestRoundLength,
): QuestPrompt[] {
  let rawPool: QuestPrompt[];

  if (packId === 'smart-mix') {
    rawPool = [
      ...shuffleItems(buildNumbers50PackPool()).slice(0, 2),
      ...shuffleItems(buildPlaceValueLinesPackPool()).slice(0, 2),
      ...shuffleItems(buildShapesPatternsPackPool()).slice(0, 2),
      ...shuffleItems(buildPreMathPackPool()).slice(0, 2),
      ...shuffleItems(buildReadingPhrasesPackPool()).slice(0, 2),
      ...shuffleItems(buildAboutMeHelpersPackPool()).slice(0, 2),
      ...shuffleItems(buildAnimalsNaturePackPool()).slice(0, 2),
      ...shuffleItems(buildWorldTransportPackPool()).slice(0, 2),
    ];
  } else {
    rawPool = buildPoolForConcretePack(packId);
  }

  const shuffled = shuffleItems(rawPool);
  const picked: QuestPrompt[] = [];
  const usedConcepts = new Set<string>();

  for (const item of shuffled) {
    if (picked.length >= roundLength) break;
    if (!usedConcepts.has(item.conceptId)) {
      usedConcepts.add(item.conceptId);
      picked.push(item);
    }
  }

  for (const item of shuffled) {
    if (picked.length >= roundLength) break;
    if (!picked.includes(item)) {
      picked.push(item);
    }
  }

  return picked.slice(0, roundLength);
}
