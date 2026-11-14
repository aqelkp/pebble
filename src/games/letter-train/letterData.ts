export type LetterId =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M'
  | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';

export type WordArtId =
  | 'apple' | 'ant' | 'airplane'
  | 'ball' | 'bus' | 'bee'
  | 'cat' | 'cake' | 'car'
  | 'dog' | 'duck' | 'drum'
  | 'egg' | 'elephant' | 'envelope'
  | 'fish' | 'frog' | 'flower'
  | 'grapes' | 'gift' | 'guitar'
  | 'hat' | 'house' | 'heart'
  | 'igloo' | 'ice-cream' | 'island'
  | 'jam' | 'jellyfish' | 'jet'
  | 'kite' | 'key' | 'king'
  | 'lion' | 'leaf' | 'lamp'
  | 'moon' | 'milk' | 'mushroom'
  | 'nest' | 'nut' | 'net'
  | 'octopus' | 'orange' | 'owl'
  | 'pig' | 'pizza' | 'pencil'
  | 'queen' | 'quilt' | 'quail'
  | 'rocket' | 'robot' | 'rainbow'
  | 'sun' | 'snowman' | 'snail'
  | 'tree' | 'turtle' | 'tent'
  | 'umbrella' | 'unicorn' | 'ukulele'
  | 'van' | 'volcano' | 'violin'
  | 'whale' | 'watermelon' | 'watch'
  | 'xylophone' | 'x-ray' | 'x-ray-fish'
  | 'yo-yo' | 'yacht' | 'yarn'
  | 'zebra' | 'zipper' | 'zoo';

export interface LetterWordSpec {
  id: WordArtId;
  word: string;
  letter: LetterId;
  tintBg: string;
}

export interface LetterStationSpec {
  letter: LetterId;
  phonicsHint: string;
  accentColor: string;
  words: readonly [LetterWordSpec, LetterWordSpec, LetterWordSpec];
}

export const ALL_LETTERS: readonly LetterId[] = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
] as const;

export const VOWEL_LETTERS: readonly LetterId[] = ['A', 'E', 'I', 'O', 'U'] as const;

const ACCENT_CYCLE = ['#5B5BD6', '#3BA99C', '#F27A5E', '#E09F2D'] as const;

function makeStation(
  idx: number,
  letter: LetterId,
  phonicsHint: string,
  items: readonly [
    [WordArtId, string, string],
    [WordArtId, string, string],
    [WordArtId, string, string],
  ],
): LetterStationSpec {
  return {
    letter,
    phonicsHint,
    accentColor: ACCENT_CYCLE[idx % ACCENT_CYCLE.length],
    words: [
      { id: items[0][0], word: items[0][1], letter, tintBg: items[0][2] },
      { id: items[1][0], word: items[1][1], letter, tintBg: items[1][2] },
      { id: items[2][0], word: items[2][1], letter, tintBg: items[2][2] },
    ],
  };
}

export const LETTER_STATIONS: readonly LetterStationSpec[] = [
  makeStation(0, 'A', 'ah', [
    ['apple', 'Apple', '#FDECE7'],
    ['ant', 'Ant', '#FEF5E1'],
    ['airplane', 'Airplane', '#ECEBFF'],
  ]),
  makeStation(1, 'B', 'buh', [
    ['ball', 'Ball', '#E4F6F3'],
    ['bus', 'Bus', '#FEF5E1'],
    ['bee', 'Bee', '#FEF5E1'],
  ]),
  makeStation(2, 'C', 'kuh', [
    ['cat', 'Cat', '#FEF5E1'],
    ['cake', 'Cake', '#FDECE7'],
    ['car', 'Car', '#ECEBFF'],
  ]),
  makeStation(3, 'D', 'duh', [
    ['dog', 'Dog', '#FEF5E1'],
    ['duck', 'Duck', '#E4F6F3'],
    ['drum', 'Drum', '#FDECE7'],
  ]),
  makeStation(4, 'E', 'eh', [
    ['egg', 'Egg', '#FEF5E1'],
    ['elephant', 'Elephant', '#ECEBFF'],
    ['envelope', 'Envelope', '#E4F6F3'],
  ]),
  makeStation(5, 'F', 'fff', [
    ['fish', 'Fish', '#E4F6F3'],
    ['frog', 'Frog', '#E4F6F3'],
    ['flower', 'Flower', '#FDECE7'],
  ]),
  makeStation(6, 'G', 'guh', [
    ['grapes', 'Grapes', '#ECEBFF'],
    ['gift', 'Gift', '#FDECE7'],
    ['guitar', 'Guitar', '#FEF5E1'],
  ]),
  makeStation(7, 'H', 'huh', [
    ['hat', 'Hat', '#FEF5E1'],
    ['house', 'House', '#E4F6F3'],
    ['heart', 'Heart', '#FDECE7'],
  ]),
  makeStation(8, 'I', 'ih', [
    ['igloo', 'Igloo', '#E4F6F3'],
    ['ice-cream', 'Ice Cream', '#FDECE7'],
    ['island', 'Island', '#FEF5E1'],
  ]),
  makeStation(9, 'J', 'juh', [
    ['jam', 'Jam', '#FDECE7'],
    ['jellyfish', 'Jellyfish', '#ECEBFF'],
    ['jet', 'Jet', '#E4F6F3'],
  ]),
  makeStation(10, 'K', 'kuh', [
    ['kite', 'Kite', '#E4F6F3'],
    ['key', 'Key', '#FEF5E1'],
    ['king', 'King', '#ECEBFF'],
  ]),
  makeStation(11, 'L', 'lll', [
    ['lion', 'Lion', '#FEF5E1'],
    ['leaf', 'Leaf', '#E4F6F3'],
    ['lamp', 'Lamp', '#FDECE7'],
  ]),
  makeStation(12, 'M', 'mmm', [
    ['moon', 'Moon', '#ECEBFF'],
    ['milk', 'Milk', '#E4F6F3'],
    ['mushroom', 'Mushroom', '#FDECE7'],
  ]),
  makeStation(13, 'N', 'nnn', [
    ['nest', 'Nest', '#FEF5E1'],
    ['nut', 'Nut', '#FDECE7'],
    ['net', 'Net', '#E4F6F3'],
  ]),
  makeStation(14, 'O', 'aw', [
    ['octopus', 'Octopus', '#FDECE7'],
    ['orange', 'Orange', '#FEF5E1'],
    ['owl', 'Owl', '#ECEBFF'],
  ]),
  makeStation(15, 'P', 'puh', [
    ['pig', 'Pig', '#FDECE7'],
    ['pizza', 'Pizza', '#FEF5E1'],
    ['pencil', 'Pencil', '#E4F6F3'],
  ]),
  makeStation(16, 'Q', 'kwuh', [
    ['queen', 'Queen', '#ECEBFF'],
    ['quilt', 'Quilt', '#E4F6F3'],
    ['quail', 'Quail', '#FEF5E1'],
  ]),
  makeStation(17, 'R', 'rrr', [
    ['rocket', 'Rocket', '#ECEBFF'],
    ['robot', 'Robot', '#E4F6F3'],
    ['rainbow', 'Rainbow', '#FEF5E1'],
  ]),
  makeStation(18, 'S', 'sss', [
    ['sun', 'Sun', '#FEF5E1'],
    ['snowman', 'Snowman', '#E4F6F3'],
    ['snail', 'Snail', '#FDECE7'],
  ]),
  makeStation(19, 'T', 'tuh', [
    ['tree', 'Tree', '#E4F6F3'],
    ['turtle', 'Turtle', '#E4F6F3'],
    ['tent', 'Tent', '#FEF5E1'],
  ]),
  makeStation(20, 'U', 'uh', [
    ['umbrella', 'Umbrella', '#ECEBFF'],
    ['unicorn', 'Unicorn', '#FDECE7'],
    ['ukulele', 'Ukulele', '#FEF5E1'],
  ]),
  makeStation(21, 'V', 'vvv', [
    ['van', 'Van', '#E4F6F3'],
    ['volcano', 'Volcano', '#FDECE7'],
    ['violin', 'Violin', '#FEF5E1'],
  ]),
  makeStation(22, 'W', 'wuh', [
    ['whale', 'Whale', '#E4F6F3'],
    ['watermelon', 'Watermelon', '#FDECE7'],
    ['watch', 'Watch', '#ECEBFF'],
  ]),
  makeStation(23, 'X', 'ks', [
    ['xylophone', 'Xylophone', '#FEF5E1'],
    ['x-ray', 'X-Ray', '#ECEBFF'],
    ['x-ray-fish', 'X-Ray Fish', '#E4F6F3'],
  ]),
  makeStation(24, 'Y', 'yuh', [
    ['yo-yo', 'Yo-Yo', '#FDECE7'],
    ['yacht', 'Yacht', '#E4F6F3'],
    ['yarn', 'Yarn', '#ECEBFF'],
  ]),
  makeStation(25, 'Z', 'zzz', [
    ['zebra', 'Zebra', '#ECEBFF'],
    ['zipper', 'Zipper', '#FEF5E1'],
    ['zoo', 'Zoo', '#E4F6F3'],
  ]),
];

const STATION_MAP: ReadonlyMap<LetterId, LetterStationSpec> = new Map(
  LETTER_STATIONS.map((s) => [s.letter, s]),
);

const ALL_WORDS: readonly LetterWordSpec[] = LETTER_STATIONS.flatMap((s) => s.words);

export function isValidLetterId(value: unknown): value is LetterId {
  return typeof value === 'string' && (ALL_LETTERS as readonly string[]).includes(value);
}

export function getStationSpec(letter: LetterId): LetterStationSpec {
  return STATION_MAP.get(letter) ?? LETTER_STATIONS[0];
}

function getRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 1) return 0;
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return arr[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

export function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = getRandomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export interface PlatformCardItem {
  uid: string;
  spec: LetterWordSpec;
  isTarget: boolean;
}

/**
 * Builds a 6-card station platform for a target letter:
 * 3 correct words starting with `letter` + 3 distinct distractors from other letters.
 */
export function buildPlatformCards(letter: LetterId): PlatformCardItem[] {
  const station = getStationSpec(letter);
  const targets: PlatformCardItem[] = station.words.map((spec) => ({
    uid: `${letter}-ok-${spec.id}`,
    spec,
    isTarget: true,
  }));

  const otherPool = shuffleArray(ALL_WORDS.filter((w) => w.letter !== letter));
  const usedLetters = new Set<LetterId>([letter]);
  const distractors: PlatformCardItem[] = [];

  for (const candidate of otherPool) {
    if (distractors.length >= 3) break;
    if (usedLetters.has(candidate.letter)) continue;
    usedLetters.add(candidate.letter);
    distractors.push({
      uid: `${letter}-no-${candidate.id}`,
      spec: candidate,
      isTarget: false,
    });
  }

  return shuffleArray([...targets, ...distractors]);
}

/* =========================================================================
   A-Z Mastery Persistence (localStorage, strictly bounded & validated)
   ========================================================================= */

const MASTERY_STORAGE_KEY = 'pebble.letter-train.mastery.v1';

export function loadMasteredLetters(): LetterId[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(MASTERY_STORAGE_KEY);
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

export function saveMasteredLetter(letter: LetterId): LetterId[] {
  const current = new Set<LetterId>(loadMasteredLetters());
  current.add(letter);
  const next = ALL_LETTERS.filter((l) => current.has(l));
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

export function clearMasteredLetters(): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(MASTERY_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}
