import {
  CANONICAL_WORDS,
  type CanonicalWordEntry,
  type LetterWordArtId,
} from '../../data/wordBank';

export type TwinWordEntry = CanonicalWordEntry & { id: LetterWordArtId };

const TWIN_ART_WORDS: readonly TwinWordEntry[] = CANONICAL_WORDS.filter(
  (entry): entry is TwinWordEntry => entry.inLetterGames,
);

export type TwinDifficulty = 'easy-4' | 'standard-5' | 'tricky-6';
export type TwinRoundSize = '5-cards' | '8-cards' | '10-cards';

export interface SpotTheTwinConfig {
  difficulty: TwinDifficulty;
  roundSize: TwinRoundSize;
}

export interface TwinCardSlotItem {
  uid: string;
  word: TwinWordEntry;
  isTwin: boolean;
  scale: number;
  rotationDeg: number;
}

export interface TwinRoundPair {
  id: string;
  twinWord: TwinWordEntry;
  leftCard: TwinCardSlotItem[];
  rightCard: TwinCardSlotItem[];
}

export const TWIN_DIFFICULTY_OPTIONS: readonly {
  id: TwinDifficulty;
  label: string;
  itemsPerCard: number;
  description: string;
  isDefault?: boolean;
}[] = [
  {
    id: 'easy-4',
    label: '4 Pictures',
    itemsPerCard: 4,
    description: 'Cozy cards · ages 3–4',
    isDefault: true,
  },
  {
    id: 'standard-5',
    label: '5 Pictures',
    itemsPerCard: 5,
    description: 'Balanced scan · ages 4–6',
  },
  {
    id: 'tricky-6',
    label: '6 Pictures',
    itemsPerCard: 6,
    description: 'Eagle eyes challenge · ages 5+',
  },
];

export const TWIN_ROUND_OPTIONS: readonly {
  id: TwinRoundSize;
  label: string;
  pairsCount: number;
  description: string;
  isDefault?: boolean;
}[] = [
  {
    id: '5-cards',
    label: '5 Pairs',
    pairsCount: 5,
    description: 'Quick focus break (~45 sec)',
    isDefault: true,
  },
  {
    id: '8-cards',
    label: '8 Pairs',
    pairsCount: 8,
    description: 'Standard game (~90 sec)',
  },
  {
    id: '10-cards',
    label: '10 Pairs',
    pairsCount: 10,
    description: 'Super spotter adventure',
  },
];

export function getTwinItemsPerCard(difficulty: TwinDifficulty): number {
  return (
    TWIN_DIFFICULTY_OPTIONS.find((opt) => opt.id === difficulty)?.itemsPerCard ?? 4
  );
}

export function getTwinPairsCount(roundSize: TwinRoundSize): number {
  return TWIN_ROUND_OPTIONS.find((opt) => opt.id === roundSize)?.pairsCount ?? 5;
}

export function getDefaultSpotTheTwinConfig(): SpotTheTwinConfig {
  return {
    difficulty: 'easy-4',
    roundSize: '5-cards',
  };
}

export function isValidSpotTheTwinConfig(value: unknown): value is SpotTheTwinConfig {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<SpotTheTwinConfig>;
  return (
    (c.difficulty === 'easy-4' || c.difficulty === 'standard-5' || c.difficulty === 'tricky-6') &&
    (c.roundSize === '5-cards' || c.roundSize === '8-cards' || c.roundSize === '10-cards')
  );
}

function createMulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng<T>(items: readonly T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const SCALE_VARIANTS = [0.88, 0.96, 1.0, 1.08, 1.12, 0.92] as const;
const ROTATION_VARIANTS = [-14, -7, 0, 8, 14, -10] as const;

/**
 * Generates Dobble-style twin pairs where leftCard and rightCard share STRICTLY 1
 * picture word across every round pair.
 */
export function generateTwinRoundDeck(
  config: SpotTheTwinConfig,
  seedBase?: number,
): TwinRoundPair[] {
  const itemsPerCard = getTwinItemsPerCard(config.difficulty);
  const pairsCount = getTwinPairsCount(config.roundSize);
  const distinctNeeded = 1 + (itemsPerCard - 1) * 2;
  const baseSeed = seedBase ?? Date.now();
  const baseRng = createMulberry32(baseSeed);

  // Pick unique twin words across the whole round when possible (only illustrated letter-game words)
  const twinOrder = shuffleWithRng(TWIN_ART_WORDS, baseRng);
  const pairs: TwinRoundPair[] = [];

  for (let pairIdx = 0; pairIdx < pairsCount; pairIdx += 1) {
    const rng = createMulberry32((baseSeed ^ ((pairIdx + 1) * 0x9e3779b1)) >>> 0);
    const twinWord = twinOrder[pairIdx % twinOrder.length];
    const remainingPool = shuffleWithRng(
      TWIN_ART_WORDS.filter((w) => w.id !== twinWord.id),
      rng,
    );

    const uniqueSlice = remainingPool.slice(0, distinctNeeded - 1);
    const leftOthers = uniqueSlice.slice(0, itemsPerCard - 1);
    const rightOthers = uniqueSlice.slice(itemsPerCard - 1, (itemsPerCard - 1) * 2);

    const leftScales = shuffleWithRng(SCALE_VARIANTS, rng);
    const rightScales = shuffleWithRng(SCALE_VARIANTS, rng);
    const leftRots = shuffleWithRng(ROTATION_VARIANTS, rng);
    const rightRots = shuffleWithRng(ROTATION_VARIANTS, rng);

    const leftCard = shuffleWithRng([twinWord, ...leftOthers], rng).map((word, idx) => ({
      uid: `left-${pairIdx}-${idx}-${word.id}`,
      word,
      isTwin: word.id === twinWord.id,
      scale: leftScales[idx % leftScales.length],
      rotationDeg: leftRots[idx % leftRots.length],
    }));

    const rightCard = shuffleWithRng([twinWord, ...rightOthers], rng).map((word, idx) => ({
      uid: `right-${pairIdx}-${idx}-${word.id}`,
      word,
      isTwin: word.id === twinWord.id,
      scale: rightScales[idx % rightScales.length],
      rotationDeg: rightRots[idx % rightRots.length],
    }));

    pairs.push({
      id: `twin-pair-${baseSeed}-${pairIdx}`,
      twinWord,
      leftCard,
      rightCard,
    });
  }

  return pairs;
}
