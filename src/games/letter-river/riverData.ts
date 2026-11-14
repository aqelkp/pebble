import {
  ALL_LETTERS,
  LETTER_STATIONS,
  VOWEL_LETTERS,
  getStationSpec,
  isValidLetterId,
  shuffleArray,
  type LetterId,
  type LetterStationSpec,
  type LetterWordSpec,
} from '../letter-train/letterData';

export {
  ALL_LETTERS,
  LETTER_STATIONS,
  VOWEL_LETTERS,
  getStationSpec,
  isValidLetterId,
  shuffleArray,
  type LetterId,
  type LetterStationSpec,
  type LetterWordSpec,
};

export const TRICKY_PAIR_LETTERS: readonly LetterId[] = ['B', 'D', 'P', 'M', 'N', 'S'] as const;

export const RIVER_LEARNING_HYPOTHESIS = {
  skill: 'Sound → Letter Categorization (Ages 4–7)',
  headline: "What We're Teaching: Sound → Letter Discrimination",
  detail:
    'Scoop picture fish from the gentle river and sort them into 3 competing letter buckets. Filling 3 catches pops the bucket and welcomes a new letter—building fast starting-sound recall without timer stress.',
} as const;

export interface FishThemeSpec {
  id: string;
  bodyColor: string;
  bellyColor: string;
  finColor: string;
  cheekColor: string;
}

/**
 * Independent fish color palettes cycled/randomized apart from bucket accents
 * so learners sort by initial sound rather than color matching.
 */
export const FISH_THEMES: readonly FishThemeSpec[] = [
  {
    id: 'coral',
    bodyColor: '#F27A5E',
    bellyColor: '#FDECE7',
    finColor: '#D95B3E',
    cheekColor: '#FFB3A0',
  },
  {
    id: 'honey',
    bodyColor: '#E9AA36',
    bellyColor: '#FEF5E1',
    finColor: '#C58415',
    cheekColor: '#FBD587',
  },
  {
    id: 'indigo',
    bodyColor: '#5B5BD6',
    bellyColor: '#ECEBFF',
    finColor: '#4343B5',
    cheekColor: '#9E9EF5',
  },
  {
    id: 'mint',
    bodyColor: '#3BA99C',
    bellyColor: '#E4F6F3',
    finColor: '#257B71',
    cheekColor: '#8ADBD1',
  },
] as const;

export const GOLDEN_FISH_THEME: FishThemeSpec = {
  id: 'golden',
  bodyColor: '#F2B84B',
  bellyColor: '#FFF9E6',
  finColor: '#C9830B',
  cheekColor: '#FFE08A',
};

export function pickRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 1) return 0;
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return arr[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

/* =========================================================================
   A-Z River Mastery Persistence (localStorage, strictly bounded & validated)
   ========================================================================= */

const RIVER_MASTERY_STORAGE_KEY = 'pebble.letter-river.mastery.v1';

export function loadRiverMasteredLetters(): LetterId[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(RIVER_MASTERY_STORAGE_KEY);
    if (!raw || raw.length > 1024) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const unique = new Set<LetterId>();
    for (const item of parsed.slice(0, 26)) {
      if (isValidLetterId(item)) {
        unique.add(item);
      }
    }
    return ALL_LETTERS.filter((l) => unique.has(l));
  } catch {
    return [];
  }
}

export function saveRiverMasteredLetter(letter: LetterId): LetterId[] {
  const current = new Set<LetterId>(loadRiverMasteredLetters());
  current.add(letter);
  const next = ALL_LETTERS.filter((l) => current.has(l));
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(RIVER_MASTERY_STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

export function clearRiverMasteredLetters(): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(RIVER_MASTERY_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}
