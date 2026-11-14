export type LetterId =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M'
  | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';

export type WordArtId =
  // A (6)
  | 'apple' | 'ant' | 'airplane' | 'alligator' | 'anchor' | 'acorn'
  // B (6)
  | 'ball' | 'bus' | 'bee' | 'banana' | 'boat' | 'bear'
  // C (6)
  | 'cat' | 'cake' | 'car' | 'carrot' | 'cow' | 'cup'
  // D (6)
  | 'dog' | 'duck' | 'drum' | 'donut' | 'door' | 'dolphin'
  // E (6)
  | 'egg' | 'elephant' | 'envelope' | 'engine' | 'eagle' | 'earth'
  // F (6)
  | 'fish' | 'frog' | 'flower' | 'firetruck' | 'fox' | 'feather'
  // G (6)
  | 'grapes' | 'gift' | 'guitar' | 'giraffe' | 'goat' | 'glasses'
  // H (6)
  | 'hat' | 'house' | 'heart' | 'horse' | 'helicopter' | 'hammer'
  // I (6)
  | 'igloo' | 'ice-cream' | 'island' | 'iguana' | 'insect' | 'iron'
  // J (6)
  | 'jam' | 'jellyfish' | 'jet' | 'juice' | 'jacket' | 'jigsaw'
  // K (6)
  | 'kite' | 'key' | 'king' | 'koala' | 'kettle' | 'kangaroo'
  // L (6)
  | 'lion' | 'leaf' | 'lamp' | 'lemon' | 'ladybug' | 'ladder'
  // M (6)
  | 'moon' | 'milk' | 'mushroom' | 'monkey' | 'mango' | 'magnet'
  // N (6)
  | 'nest' | 'nut' | 'net' | 'noodles' | 'notebook' | 'necklace'
  // O (6)
  | 'octopus' | 'orange' | 'owl' | 'onion' | 'otter' | 'ostrich'
  // P (6)
  | 'pig' | 'pizza' | 'pencil' | 'penguin' | 'pear' | 'pumpkin'
  // Q (6)
  | 'queen' | 'quilt' | 'quail' | 'quarter' | 'question' | 'quill'
  // R (6)
  | 'rocket' | 'robot' | 'rainbow' | 'rabbit' | 'ring' | 'rose'
  // S (6)
  | 'sun' | 'snowman' | 'snail' | 'strawberry' | 'sock' | 'submarine'
  // T (6)
  | 'tree' | 'turtle' | 'tent' | 'tiger' | 'tomato' | 'truck'
  // U (6)
  | 'umbrella' | 'unicorn' | 'ukulele' | 'up-arrow' | 'urchin' | 'unicycle'
  // V (6)
  | 'van' | 'volcano' | 'violin' | 'vase' | 'vest' | 'vacuum'
  // W (6)
  | 'whale' | 'watermelon' | 'watch' | 'wagon' | 'waffle' | 'worm'
  // X (6)
  | 'xylophone' | 'x-ray' | 'x-ray-fish' | 'x-ray-dino' | 'x-ray-hand' | 'x-mark'
  // Y (6)
  | 'yo-yo' | 'yacht' | 'yarn' | 'yogurt' | 'yak' | 'yolk'
  // Z (6)
  | 'zebra' | 'zipper' | 'zoo' | 'zero' | 'zigzag' | 'zucchini';

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
  words: readonly LetterWordSpec[];
}

export const ALL_LETTERS: readonly LetterId[] = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
] as const;

export const VOWEL_LETTERS: readonly LetterId[] = ['A', 'E', 'I', 'O', 'U'] as const;

const ACCENT_CYCLE = ['#5B5BD6', '#3BA99C', '#F27A5E', '#E09F2D'] as const;
const TINT_CYCLE = ['#FDECE7', '#E4F6F3', '#ECEBFF', '#FEF5E1'] as const;

function makeStation(
  idx: number,
  letter: LetterId,
  phonicsHint: string,
  items: readonly (readonly [WordArtId, string])[],
): LetterStationSpec {
  return {
    letter,
    phonicsHint,
    accentColor: ACCENT_CYCLE[idx % ACCENT_CYCLE.length],
    words: items.map(([id, word], itemIdx) => ({
      id,
      word,
      letter,
      tintBg: TINT_CYCLE[(idx + itemIdx) % TINT_CYCLE.length],
    })),
  };
}

export const LETTER_STATIONS: readonly LetterStationSpec[] = [
  makeStation(0, 'A', 'ah', [
    ['apple', 'Apple'],
    ['ant', 'Ant'],
    ['airplane', 'Airplane'],
    ['alligator', 'Alligator'],
    ['anchor', 'Anchor'],
    ['acorn', 'Acorn'],
  ]),
  makeStation(1, 'B', 'buh', [
    ['ball', 'Ball'],
    ['bus', 'Bus'],
    ['bee', 'Bee'],
    ['banana', 'Banana'],
    ['boat', 'Boat'],
    ['bear', 'Bear'],
  ]),
  makeStation(2, 'C', 'kuh', [
    ['cat', 'Cat'],
    ['cake', 'Cake'],
    ['car', 'Car'],
    ['carrot', 'Carrot'],
    ['cow', 'Cow'],
    ['cup', 'Cup'],
  ]),
  makeStation(3, 'D', 'duh', [
    ['dog', 'Dog'],
    ['duck', 'Duck'],
    ['drum', 'Drum'],
    ['donut', 'Donut'],
    ['door', 'Door'],
    ['dolphin', 'Dolphin'],
  ]),
  makeStation(4, 'E', 'eh', [
    ['egg', 'Egg'],
    ['elephant', 'Elephant'],
    ['envelope', 'Envelope'],
    ['engine', 'Engine'],
    ['eagle', 'Eagle'],
    ['earth', 'Earth'],
  ]),
  makeStation(5, 'F', 'fff', [
    ['fish', 'Fish'],
    ['frog', 'Frog'],
    ['flower', 'Flower'],
    ['firetruck', 'Firetruck'],
    ['fox', 'Fox'],
    ['feather', 'Feather'],
  ]),
  makeStation(6, 'G', 'guh', [
    ['grapes', 'Grapes'],
    ['gift', 'Gift'],
    ['guitar', 'Guitar'],
    ['giraffe', 'Giraffe'],
    ['goat', 'Goat'],
    ['glasses', 'Glasses'],
  ]),
  makeStation(7, 'H', 'huh', [
    ['hat', 'Hat'],
    ['house', 'House'],
    ['heart', 'Heart'],
    ['horse', 'Horse'],
    ['helicopter', 'Helicopter'],
    ['hammer', 'Hammer'],
  ]),
  makeStation(8, 'I', 'ih', [
    ['igloo', 'Igloo'],
    ['ice-cream', 'Ice Cream'],
    ['island', 'Island'],
    ['iguana', 'Iguana'],
    ['insect', 'Insect'],
    ['iron', 'Iron'],
  ]),
  makeStation(9, 'J', 'juh', [
    ['jam', 'Jam'],
    ['jellyfish', 'Jellyfish'],
    ['jet', 'Jet'],
    ['juice', 'Juice'],
    ['jacket', 'Jacket'],
    ['jigsaw', 'Jigsaw'],
  ]),
  makeStation(10, 'K', 'kuh', [
    ['kite', 'Kite'],
    ['key', 'Key'],
    ['king', 'King'],
    ['koala', 'Koala'],
    ['kettle', 'Kettle'],
    ['kangaroo', 'Kangaroo'],
  ]),
  makeStation(11, 'L', 'lll', [
    ['lion', 'Lion'],
    ['leaf', 'Leaf'],
    ['lamp', 'Lamp'],
    ['lemon', 'Lemon'],
    ['ladybug', 'Ladybug'],
    ['ladder', 'Ladder'],
  ]),
  makeStation(12, 'M', 'mmm', [
    ['moon', 'Moon'],
    ['milk', 'Milk'],
    ['mushroom', 'Mushroom'],
    ['monkey', 'Monkey'],
    ['mango', 'Mango'],
    ['magnet', 'Magnet'],
  ]),
  makeStation(13, 'N', 'nnn', [
    ['nest', 'Nest'],
    ['nut', 'Nut'],
    ['net', 'Net'],
    ['noodles', 'Noodles'],
    ['notebook', 'Notebook'],
    ['necklace', 'Necklace'],
  ]),
  makeStation(14, 'O', 'aw', [
    ['octopus', 'Octopus'],
    ['orange', 'Orange'],
    ['owl', 'Owl'],
    ['onion', 'Onion'],
    ['otter', 'Otter'],
    ['ostrich', 'Ostrich'],
  ]),
  makeStation(15, 'P', 'puh', [
    ['pig', 'Pig'],
    ['pizza', 'Pizza'],
    ['pencil', 'Pencil'],
    ['penguin', 'Penguin'],
    ['pear', 'Pear'],
    ['pumpkin', 'Pumpkin'],
  ]),
  makeStation(16, 'Q', 'kwuh', [
    ['queen', 'Queen'],
    ['quilt', 'Quilt'],
    ['quail', 'Quail'],
    ['quarter', 'Quarter'],
    ['question', 'Question'],
    ['quill', 'Quill'],
  ]),
  makeStation(17, 'R', 'rrr', [
    ['rocket', 'Rocket'],
    ['robot', 'Robot'],
    ['rainbow', 'Rainbow'],
    ['rabbit', 'Rabbit'],
    ['ring', 'Ring'],
    ['rose', 'Rose'],
  ]),
  makeStation(18, 'S', 'sss', [
    ['sun', 'Sun'],
    ['snowman', 'Snowman'],
    ['snail', 'Snail'],
    ['strawberry', 'Strawberry'],
    ['sock', 'Sock'],
    ['submarine', 'Submarine'],
  ]),
  makeStation(19, 'T', 'tuh', [
    ['tree', 'Tree'],
    ['turtle', 'Turtle'],
    ['tent', 'Tent'],
    ['tiger', 'Tiger'],
    ['tomato', 'Tomato'],
    ['truck', 'Truck'],
  ]),
  makeStation(20, 'U', 'uh', [
    ['umbrella', 'Umbrella'],
    ['unicorn', 'Unicorn'],
    ['ukulele', 'Ukulele'],
    ['up-arrow', 'Up'],
    ['urchin', 'Urchin'],
    ['unicycle', 'Unicycle'],
  ]),
  makeStation(21, 'V', 'vvv', [
    ['van', 'Van'],
    ['volcano', 'Volcano'],
    ['violin', 'Violin'],
    ['vase', 'Vase'],
    ['vest', 'Vest'],
    ['vacuum', 'Vacuum'],
  ]),
  makeStation(22, 'W', 'wuh', [
    ['whale', 'Whale'],
    ['watermelon', 'Watermelon'],
    ['watch', 'Watch'],
    ['wagon', 'Wagon'],
    ['waffle', 'Waffle'],
    ['worm', 'Worm'],
  ]),
  makeStation(23, 'X', 'ks', [
    ['xylophone', 'Xylophone'],
    ['x-ray', 'X-Ray'],
    ['x-ray-fish', 'X-Ray Fish'],
    ['x-ray-dino', 'X-Ray Dino'],
    ['x-ray-hand', 'X-Ray Hand'],
    ['x-mark', 'X-Mark'],
  ]),
  makeStation(24, 'Y', 'yuh', [
    ['yo-yo', 'Yo-Yo'],
    ['yacht', 'Yacht'],
    ['yarn', 'Yarn'],
    ['yogurt', 'Yogurt'],
    ['yak', 'Yak'],
    ['yolk', 'Yolk'],
  ]),
  makeStation(25, 'Z', 'zzz', [
    ['zebra', 'Zebra'],
    ['zipper', 'Zipper'],
    ['zoo', 'Zoo'],
    ['zero', 'Zero'],
    ['zigzag', 'Zigzag'],
    ['zucchini', 'Zucchini'],
  ]),
];

const STATION_MAP: ReadonlyMap<LetterId, LetterStationSpec> = new Map(
  LETTER_STATIONS.map((s) => [s.letter, s]),
);

const ALL_WORDS: readonly LetterWordSpec[] = LETTER_STATIONS.flatMap((s) => s.words);

// Tracks which 3 target words were last dealt for a given letter so consecutive plays rotate words!
const lastSeenTargetIdsByLetter = new Map<LetterId, Set<WordArtId>>();

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
 * Builds a fresh 6-card station platform for `letter`:
 * - Randomly picks 3 target words from the letter's 6-word bank (preferring words
 *   not shown on the previous visit to this letter, mixed with random shuffle so
 *   every game opening feels fresh!).
 * - Randomly picks 3 distractors from 3 distinct other letters across the 150-word pool.
 */
export function buildPlatformCards(letter: LetterId): PlatformCardItem[] {
  const station = getStationSpec(letter);
  const lastSeen = lastSeenTargetIdsByLetter.get(letter);

  let chosenSpecs: LetterWordSpec[];
  if (lastSeen && lastSeen.size > 0 && station.words.length >= 6) {
    // Mix unseen words first + 1 random overlap chance so combinations vary naturally
    const unseen = shuffleArray(station.words.filter((w) => !lastSeen.has(w.id)));
    const seen = shuffleArray(station.words.filter((w) => lastSeen.has(w.id)));
    // Either 3 unseen or 2 unseen + 1 seen at random so all C(6,3)=20 combos occur!
    const takeUnseen = getRandomInt(2) === 0 ? 3 : 2;
    chosenSpecs = shuffleArray([
      ...unseen.slice(0, takeUnseen),
      ...seen.slice(0, 3 - takeUnseen),
    ]).slice(0, 3);
  } else {
    chosenSpecs = shuffleArray(station.words).slice(0, 3);
  }

  lastSeenTargetIdsByLetter.set(
    letter,
    new Set<WordArtId>(chosenSpecs.map((w) => w.id)),
  );

  const nonce = getRandomInt(1_000_000);
  const targets: PlatformCardItem[] = chosenSpecs.map((spec) => ({
    uid: `${letter}-ok-${spec.id}-${nonce}`,
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
      uid: `${letter}-no-${candidate.id}-${nonce}`,
      spec: candidate,
      isTarget: false,
    });
  }

  return shuffleArray([...targets, ...distractors]);
}

/* =========================================================================
   A-Z Mastery & Perfect Crown Persistence (localStorage, strictly validated)
   ========================================================================= */

const MASTERY_STORAGE_KEY = 'pebble.letter-train.mastery.v1';
const PERFECT_STORAGE_KEY = 'pebble.letter-train.perfect.v1';

function loadValidatedLetterSet(storageKey: string): LetterId[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(storageKey);
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

export function loadMasteredLetters(): LetterId[] {
  return loadValidatedLetterSet(MASTERY_STORAGE_KEY);
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

export function loadPerfectLetters(): LetterId[] {
  return loadValidatedLetterSet(PERFECT_STORAGE_KEY);
}

export function savePerfectLetter(letter: LetterId): LetterId[] {
  const current = new Set<LetterId>(loadPerfectLetters());
  current.add(letter);
  const next = ALL_LETTERS.filter((l) => current.has(l));
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PERFECT_STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore storage quota errors
  }
  return next;
}
