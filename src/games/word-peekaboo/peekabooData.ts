import { assetUrl } from '../../utils/assets';
import type { ThemeId } from '../memory-match/themes';

export type PeekabooPackId =
  | 'all'
  | 'sight-all'
  | 'sight-1'
  | 'sight-2'
  | 'cvc-ai'
  | 'cvc-o'
  | 'cvc-e';

export type PeekabooWorldId =
  | 'all-stories'
  | 'cars'
  | 'paw-patrol'
  | 'lion-king'
  | 'toy-story'
  | 'kung-fu-panda'
  | 'tom-and-jerry';

export type PeekabooRoundLength = 1 | 3 | 5;

export type PeekabooWordId =
  | 'i'
  | 'he'
  | 'she'
  | 'the'
  | 'be'
  | 'to'
  | 'do'
  | 'me'
  | 'we'
  | 'was'
  | 'of'
  | 'are'
  | 'all'
  | 'you'
  | 'go'
  | 'no'
  | 'cab'
  | 'lid'
  | 'jam'
  | 'sip'
  | 'tap'
  | 'pig'
  | 'bag'
  | 'fin'
  | 'fan'
  | 'bib'
  | 'job'
  | 'mop'
  | 'nod'
  | 'dog'
  | 'hot'
  | 'pot'
  | 'jog'
  | 'top'
  | 'jet'
  | 'red'
  | 'ten'
  | 'pet'
  | 'bed'
  | 'leg'
  | 'hen'
  | 'net';

export interface PeekabooWordSpec {
  id: PeekabooWordId;
  display: string;
  kind: 'sight' | 'cvc';
  packs: readonly Exclude<PeekabooPackId, 'all' | 'sight-all'>[];
  initialChar: string;
  ending: string;
}

export interface PeekabooPackSpec {
  id: PeekabooPackId;
  title: string;
  subtitle: string;
  pageBadge: string;
  accentColor: string;
  sampleWords: readonly [string, string, string];
  wordIds: readonly PeekabooWordId[];
}

export interface PeekabooCharacterSpec {
  pairId: string;
  name: string;
  themeId: Exclude<PeekabooWorldId, 'all-stories'> & ThemeId;
  themeTitle: string;
  accentColor: string;
  imagePath: string;
}

export interface PeekabooWorldSpec {
  id: PeekabooWorldId;
  title: string;
  accentColor: string;
  previewPath: string;
}

export interface WordPeekabooConfig {
  packId: PeekabooPackId;
  worldId: PeekabooWorldId;
  roundLength: PeekabooRoundLength;
}

export interface PeekabooTileSpec {
  slotIndex: number;
  wordId: PeekabooWordId;
  display: string;
  kind: 'sight' | 'cvc';
  isTarget: boolean;
}

export interface PeekabooCardSpec {
  cardUid: string;
  character: PeekabooCharacterSpec;
  tiles: PeekabooTileSpec[];
  targetQueue: PeekabooWordId[];
}

export interface PeekabooWordMasteryEntry {
  exposures: number;
  cleanReads: number;
  lastSeenAt: number;
}

export type PeekabooMasteryMap = Partial<Record<PeekabooWordId, PeekabooWordMasteryEntry>>;

export const TILES_PER_BOARD = 8;
export const TARGETS_PER_BOARD = 6;
export const PEEKABOO_MASTERY_KEY = 'pebble.word-peekaboo.mastery.v1';

export const PEEKABOO_WORDS: readonly PeekabooWordSpec[] = [
  // Sight Words 1 (KLAY Page 1)
  { id: 'i', display: 'I', kind: 'sight', packs: ['sight-1'], initialChar: 'i', ending: 'i' },
  { id: 'he', display: 'he', kind: 'sight', packs: ['sight-1'], initialChar: 'h', ending: 'e' },
  { id: 'she', display: 'she', kind: 'sight', packs: ['sight-1'], initialChar: 's', ending: 'he' },
  { id: 'the', display: 'the', kind: 'sight', packs: ['sight-1', 'sight-2'], initialChar: 't', ending: 'he' },
  { id: 'be', display: 'be', kind: 'sight', packs: ['sight-1'], initialChar: 'b', ending: 'e' },
  { id: 'to', display: 'to', kind: 'sight', packs: ['sight-1'], initialChar: 't', ending: 'o' },
  { id: 'do', display: 'do', kind: 'sight', packs: ['sight-1'], initialChar: 'd', ending: 'o' },
  { id: 'me', display: 'me', kind: 'sight', packs: ['sight-1'], initialChar: 'm', ending: 'e' },
  // Sight Words 2 (KLAY Page 13)
  { id: 'we', display: 'we', kind: 'sight', packs: ['sight-2'], initialChar: 'w', ending: 'e' },
  { id: 'was', display: 'was', kind: 'sight', packs: ['sight-2'], initialChar: 'w', ending: 'as' },
  { id: 'of', display: 'of', kind: 'sight', packs: ['sight-2'], initialChar: 'o', ending: 'f' },
  { id: 'are', display: 'are', kind: 'sight', packs: ['sight-2'], initialChar: 'a', ending: 're' },
  { id: 'all', display: 'all', kind: 'sight', packs: ['sight-2'], initialChar: 'a', ending: 'll' },
  { id: 'you', display: 'you', kind: 'sight', packs: ['sight-2'], initialChar: 'y', ending: 'ou' },
  { id: 'go', display: 'go', kind: 'sight', packs: ['sight-2'], initialChar: 'g', ending: 'o' },
  { id: 'no', display: 'no', kind: 'sight', packs: ['sight-2'], initialChar: 'n', ending: 'o' },
  // Short a & i CVC (KLAY Page 10)
  { id: 'cab', display: 'cab', kind: 'cvc', packs: ['cvc-ai'], initialChar: 'c', ending: 'ab' },
  { id: 'lid', display: 'lid', kind: 'cvc', packs: ['cvc-ai'], initialChar: 'l', ending: 'id' },
  { id: 'jam', display: 'jam', kind: 'cvc', packs: ['cvc-ai'], initialChar: 'j', ending: 'am' },
  { id: 'sip', display: 'sip', kind: 'cvc', packs: ['cvc-ai'], initialChar: 's', ending: 'ip' },
  { id: 'tap', display: 'tap', kind: 'cvc', packs: ['cvc-ai'], initialChar: 't', ending: 'ap' },
  { id: 'pig', display: 'pig', kind: 'cvc', packs: ['cvc-ai'], initialChar: 'p', ending: 'ig' },
  { id: 'bag', display: 'bag', kind: 'cvc', packs: ['cvc-ai'], initialChar: 'b', ending: 'ag' },
  { id: 'fin', display: 'fin', kind: 'cvc', packs: ['cvc-ai'], initialChar: 'f', ending: 'in' },
  { id: 'fan', display: 'fan', kind: 'cvc', packs: ['cvc-ai'], initialChar: 'f', ending: 'an' },
  { id: 'bib', display: 'bib', kind: 'cvc', packs: ['cvc-ai'], initialChar: 'b', ending: 'ib' },
  // Short o CVC (KLAY Page 25)
  { id: 'job', display: 'job', kind: 'cvc', packs: ['cvc-o'], initialChar: 'j', ending: 'ob' },
  { id: 'mop', display: 'mop', kind: 'cvc', packs: ['cvc-o'], initialChar: 'm', ending: 'op' },
  { id: 'nod', display: 'nod', kind: 'cvc', packs: ['cvc-o'], initialChar: 'n', ending: 'od' },
  { id: 'dog', display: 'dog', kind: 'cvc', packs: ['cvc-o'], initialChar: 'd', ending: 'og' },
  { id: 'hot', display: 'hot', kind: 'cvc', packs: ['cvc-o'], initialChar: 'h', ending: 'ot' },
  { id: 'pot', display: 'pot', kind: 'cvc', packs: ['cvc-o'], initialChar: 'p', ending: 'ot' },
  { id: 'jog', display: 'jog', kind: 'cvc', packs: ['cvc-o'], initialChar: 'j', ending: 'og' },
  { id: 'top', display: 'top', kind: 'cvc', packs: ['cvc-o'], initialChar: 't', ending: 'op' },
  // Short e CVC (KLAY Page 34)
  { id: 'jet', display: 'jet', kind: 'cvc', packs: ['cvc-e'], initialChar: 'j', ending: 'et' },
  { id: 'red', display: 'red', kind: 'cvc', packs: ['cvc-e'], initialChar: 'r', ending: 'ed' },
  { id: 'ten', display: 'ten', kind: 'cvc', packs: ['cvc-e'], initialChar: 't', ending: 'en' },
  { id: 'pet', display: 'pet', kind: 'cvc', packs: ['cvc-e'], initialChar: 'p', ending: 'et' },
  { id: 'bed', display: 'bed', kind: 'cvc', packs: ['cvc-e'], initialChar: 'b', ending: 'ed' },
  { id: 'leg', display: 'leg', kind: 'cvc', packs: ['cvc-e'], initialChar: 'l', ending: 'eg' },
  { id: 'hen', display: 'hen', kind: 'cvc', packs: ['cvc-e'], initialChar: 'h', ending: 'en' },
  { id: 'net', display: 'net', kind: 'cvc', packs: ['cvc-e'], initialChar: 'n', ending: 'et' },
];

const WORD_SPEC_BY_ID = new Map<PeekabooWordId, PeekabooWordSpec>(
  PEEKABOO_WORDS.map((w) => [w.id, w]),
);

export const VALID_PEEKABOO_WORD_IDS: readonly PeekabooWordId[] = PEEKABOO_WORDS.map((w) => w.id);
const VALID_WORD_ID_SET = new Set<string>(VALID_PEEKABOO_WORD_IDS);

export const PEEKABOO_PACKS: readonly PeekabooPackSpec[] = [
  {
    id: 'all',
    title: 'All KLAY Words',
    subtitle: 'Full sight & CVC mix',
    pageBadge: 'All 5 Pages',
    accentColor: '#5B5BD6',
    sampleWords: ['was', 'the', 'jet'],
    wordIds: PEEKABOO_WORDS.map((w) => w.id),
  },
  {
    id: 'sight-all',
    title: 'All Sight Words',
    subtitle: '16 heart words on sight',
    pageBadge: 'Pages 1 & 13',
    accentColor: '#3BA99C',
    sampleWords: ['she', 'was', 'you'],
    wordIds: PEEKABOO_WORDS.filter((w) => w.kind === 'sight').map((w) => w.id),
  },
  {
    id: 'sight-1',
    title: 'Sight Words 1',
    subtitle: 'I, he, she, the, be, to, do, me',
    pageBadge: 'Page 1',
    accentColor: '#3BA99C',
    sampleWords: ['I', 'she', 'the'],
    wordIds: PEEKABOO_WORDS.filter((w) => w.packs.includes('sight-1')).map((w) => w.id),
  },
  {
    id: 'sight-2',
    title: 'Sight Words 2',
    subtitle: 'we, the, was, of, are, all, you, go, no',
    pageBadge: 'Page 13',
    accentColor: '#5B5BD6',
    sampleWords: ['was', 'are', 'you'],
    wordIds: PEEKABOO_WORDS.filter((w) => w.packs.includes('sight-2')).map((w) => w.id),
  },
  {
    id: 'cvc-ai',
    title: 'Short a & i Words',
    subtitle: 'cab, jam, tap, bag, fan, lid, pig...',
    pageBadge: 'Page 10',
    accentColor: '#F27A5E',
    sampleWords: ['jam', 'pig', 'fan'],
    wordIds: PEEKABOO_WORDS.filter((w) => w.packs.includes('cvc-ai')).map((w) => w.id),
  },
  {
    id: 'cvc-o',
    title: 'Short o Words',
    subtitle: 'job, mop, nod, dog, hot, pot, jog, top',
    pageBadge: 'Page 25',
    accentColor: '#E09F2D',
    sampleWords: ['dog', 'mop', 'top'],
    wordIds: PEEKABOO_WORDS.filter((w) => w.packs.includes('cvc-o')).map((w) => w.id),
  },
  {
    id: 'cvc-e',
    title: 'Short e Words',
    subtitle: 'jet, red, ten, pet, bed, leg, hen, net',
    pageBadge: 'Page 34',
    accentColor: '#56A35B',
    sampleWords: ['jet', 'red', 'hen'],
    wordIds: PEEKABOO_WORDS.filter((w) => w.packs.includes('cvc-e')).map((w) => w.id),
  },
];

export const PEEKABOO_CHARACTERS: readonly PeekabooCharacterSpec[] = [
  // Cars (8)
  { pairId: 'cars-01', name: 'Lightning McQueen', themeId: 'cars', themeTitle: 'Cars', accentColor: '#E14D43', imagePath: 'themes/cars/01-mcqueen.png' },
  { pairId: 'cars-04', name: 'Mater', themeId: 'cars', themeTitle: 'Cars', accentColor: '#E14D43', imagePath: 'themes/cars/04-mater.png' },
  { pairId: 'cars-06', name: 'Cruz Ramirez', themeId: 'cars', themeTitle: 'Cars', accentColor: '#E14D43', imagePath: 'themes/cars/06-cruz-ramirez.png' },
  { pairId: 'cars-05', name: 'Sally', themeId: 'cars', themeTitle: 'Cars', accentColor: '#E14D43', imagePath: 'themes/cars/05-sally.png' },
  { pairId: 'cars-03', name: 'Doc Hudson', themeId: 'cars', themeTitle: 'Cars', accentColor: '#E14D43', imagePath: 'themes/cars/03-hudson.png' },
  { pairId: 'cars-02', name: 'Jackson Storm', themeId: 'cars', themeTitle: 'Cars', accentColor: '#E14D43', imagePath: 'themes/cars/02-jackson-storm.png' },
  { pairId: 'cars-13', name: 'Mack', themeId: 'cars', themeTitle: 'Cars', accentColor: '#E14D43', imagePath: 'themes/cars/13-mack.png' },
  { pairId: 'cars-07', name: 'Luigi', themeId: 'cars', themeTitle: 'Cars', accentColor: '#E14D43', imagePath: 'themes/cars/07-luigi.png' },
  // PAW Patrol (8)
  { pairId: 'pp-01', name: 'Chase', themeId: 'paw-patrol', themeTitle: 'PAW Patrol', accentColor: '#5B5BD6', imagePath: 'themes/paw-patrol/01-chase.png' },
  { pairId: 'pp-02', name: 'Marshall', themeId: 'paw-patrol', themeTitle: 'PAW Patrol', accentColor: '#5B5BD6', imagePath: 'themes/paw-patrol/02-marshall.png' },
  { pairId: 'pp-03', name: 'Skye', themeId: 'paw-patrol', themeTitle: 'PAW Patrol', accentColor: '#5B5BD6', imagePath: 'themes/paw-patrol/03-skye.png' },
  { pairId: 'pp-04', name: 'Rubble', themeId: 'paw-patrol', themeTitle: 'PAW Patrol', accentColor: '#5B5BD6', imagePath: 'themes/paw-patrol/04-rubble.png' },
  { pairId: 'pp-05', name: 'Rocky', themeId: 'paw-patrol', themeTitle: 'PAW Patrol', accentColor: '#5B5BD6', imagePath: 'themes/paw-patrol/05-rocky.png' },
  { pairId: 'pp-06', name: 'Zuma', themeId: 'paw-patrol', themeTitle: 'PAW Patrol', accentColor: '#5B5BD6', imagePath: 'themes/paw-patrol/06-zuma.png' },
  { pairId: 'pp-07', name: 'Everest', themeId: 'paw-patrol', themeTitle: 'PAW Patrol', accentColor: '#5B5BD6', imagePath: 'themes/paw-patrol/07-everest.png' },
  { pairId: 'pp-08', name: 'Tracker', themeId: 'paw-patrol', themeTitle: 'PAW Patrol', accentColor: '#5B5BD6', imagePath: 'themes/paw-patrol/08-tracker.png' },
  // Lion King (6)
  { pairId: 'lk-01', name: 'Simba', themeId: 'lion-king', themeTitle: 'Lion King', accentColor: '#F2B84B', imagePath: 'themes/lion-king/01-simba.png' },
  { pairId: 'lk-02', name: 'Mufasa', themeId: 'lion-king', themeTitle: 'Lion King', accentColor: '#F2B84B', imagePath: 'themes/lion-king/02-mufasa.png' },
  { pairId: 'lk-03', name: 'Nala', themeId: 'lion-king', themeTitle: 'Lion King', accentColor: '#F2B84B', imagePath: 'themes/lion-king/03-nala.png' },
  { pairId: 'lk-04', name: 'Timon', themeId: 'lion-king', themeTitle: 'Lion King', accentColor: '#F2B84B', imagePath: 'themes/lion-king/04-timon.png' },
  { pairId: 'lk-05', name: 'Pumbaa', themeId: 'lion-king', themeTitle: 'Lion King', accentColor: '#F2B84B', imagePath: 'themes/lion-king/05-pumbaa.png' },
  { pairId: 'lk-07', name: 'Zazu', themeId: 'lion-king', themeTitle: 'Lion King', accentColor: '#F2B84B', imagePath: 'themes/lion-king/07-zazu.png' },
  // Toy Story (6)
  { pairId: 'ts-01', name: 'Woody', themeId: 'toy-story', themeTitle: 'Toy Story', accentColor: '#F27A5E', imagePath: 'themes/toy-story/01-woody.png' },
  { pairId: 'ts-02', name: 'Buzz Lightyear', themeId: 'toy-story', themeTitle: 'Toy Story', accentColor: '#F27A5E', imagePath: 'themes/toy-story/02-buzz.png' },
  { pairId: 'ts-03', name: 'Jessie', themeId: 'toy-story', themeTitle: 'Toy Story', accentColor: '#F27A5E', imagePath: 'themes/toy-story/03-jessie.png' },
  { pairId: 'ts-04', name: 'Rex', themeId: 'toy-story', themeTitle: 'Toy Story', accentColor: '#F27A5E', imagePath: 'themes/toy-story/04-rex.png' },
  { pairId: 'ts-06', name: 'Slinky Dog', themeId: 'toy-story', themeTitle: 'Toy Story', accentColor: '#F27A5E', imagePath: 'themes/toy-story/06-slinky-dog.png' },
  { pairId: 'ts-07', name: 'Bullseye', themeId: 'toy-story', themeTitle: 'Toy Story', accentColor: '#F27A5E', imagePath: 'themes/toy-story/07-bullseye.png' },
  // Kung Fu Panda (5)
  { pairId: 'kfp-01', name: 'Po', themeId: 'kung-fu-panda', themeTitle: 'Kung Fu Panda', accentColor: '#3BA99C', imagePath: 'themes/kung-fu-panda/01-po.png' },
  { pairId: 'kfp-02', name: 'Tigress', themeId: 'kung-fu-panda', themeTitle: 'Kung Fu Panda', accentColor: '#3BA99C', imagePath: 'themes/kung-fu-panda/02-tigress.png' },
  { pairId: 'kfp-03', name: 'Master Shifu', themeId: 'kung-fu-panda', themeTitle: 'Kung Fu Panda', accentColor: '#3BA99C', imagePath: 'themes/kung-fu-panda/03-shifu.png' },
  { pairId: 'kfp-04', name: 'Master Oogway', themeId: 'kung-fu-panda', themeTitle: 'Kung Fu Panda', accentColor: '#3BA99C', imagePath: 'themes/kung-fu-panda/04-oogway.png' },
  { pairId: 'kfp-05', name: 'Monkey', themeId: 'kung-fu-panda', themeTitle: 'Kung Fu Panda', accentColor: '#3BA99C', imagePath: 'themes/kung-fu-panda/05-monkey.png' },
  // Tom & Jerry (5)
  { pairId: 'tj-01', name: 'Tom', themeId: 'tom-and-jerry', themeTitle: 'Tom & Jerry', accentColor: '#5B7AB8', imagePath: 'themes/tom-and-jerry/01-tom.png' },
  { pairId: 'tj-02', name: 'Jerry', themeId: 'tom-and-jerry', themeTitle: 'Tom & Jerry', accentColor: '#5B7AB8', imagePath: 'themes/tom-and-jerry/02-jerry.png' },
  { pairId: 'tj-03', name: 'Spike', themeId: 'tom-and-jerry', themeTitle: 'Tom & Jerry', accentColor: '#5B7AB8', imagePath: 'themes/tom-and-jerry/03-spike.png' },
  { pairId: 'tj-04', name: 'Tyke', themeId: 'tom-and-jerry', themeTitle: 'Tom & Jerry', accentColor: '#5B7AB8', imagePath: 'themes/tom-and-jerry/04-tyke.png' },
  { pairId: 'tj-05', name: 'Tuffy', themeId: 'tom-and-jerry', themeTitle: 'Tom & Jerry', accentColor: '#5B7AB8', imagePath: 'themes/tom-and-jerry/05-tuffy.png' },
];

const CHARACTER_BY_PAIR_ID = new Map<string, PeekabooCharacterSpec>(
  PEEKABOO_CHARACTERS.map((c) => [c.pairId, c]),
);

export const PEEKABOO_WORLDS: readonly PeekabooWorldSpec[] = [
  { id: 'all-stories', title: 'All Friends', accentColor: '#5B5BD6', previewPath: 'hub/word-peekaboo.png' },
  { id: 'cars', title: 'Cars', accentColor: '#E14D43', previewPath: 'themes/cars/01-mcqueen.png' },
  { id: 'paw-patrol', title: 'PAW Patrol', accentColor: '#5B5BD6', previewPath: 'themes/paw-patrol/01-chase.png' },
  { id: 'lion-king', title: 'Lion King', accentColor: '#F2B84B', previewPath: 'themes/lion-king/01-simba.png' },
  { id: 'toy-story', title: 'Toy Story', accentColor: '#F27A5E', previewPath: 'themes/toy-story/01-woody.png' },
  { id: 'kung-fu-panda', title: 'Kung Fu Panda', accentColor: '#3BA99C', previewPath: 'themes/kung-fu-panda/01-po.png' },
  { id: 'tom-and-jerry', title: 'Tom & Jerry', accentColor: '#5B7AB8', previewPath: 'themes/tom-and-jerry/01-tom.png' },
];

function getRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 1) return 0;
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return arr[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

function shuffleList<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = getRandomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getDefaultWordPeekabooConfig(): WordPeekabooConfig {
  return {
    packId: 'all',
    worldId: 'all-stories',
    roundLength: 3,
  };
}

// TODO(security): Pebble runs 100% locally in the browser as a static client-only PWA with no
// backend server. Configs restored from storage are validated against strict allow-lists.
export function isValidWordPeekabooConfig(value: unknown): value is WordPeekabooConfig {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<WordPeekabooConfig>;
  const validPack = typeof c.packId === 'string' && PEEKABOO_PACKS.some((p) => p.id === c.packId);
  const validWorld =
    typeof c.worldId === 'string' && PEEKABOO_WORLDS.some((w) => w.id === c.worldId);
  const validLen = c.roundLength === 1 || c.roundLength === 3 || c.roundLength === 5;
  return validPack && validWorld && validLen;
}

export function getPeekabooPackSpec(packId: PeekabooPackId): PeekabooPackSpec {
  return PEEKABOO_PACKS.find((p) => p.id === packId) ?? PEEKABOO_PACKS[0];
}

export function getPeekabooWorldSpec(worldId: PeekabooWorldId): PeekabooWorldSpec {
  return PEEKABOO_WORLDS.find((w) => w.id === worldId) ?? PEEKABOO_WORLDS[0];
}

export function getPeekabooWordSpec(wordId: PeekabooWordId): PeekabooWordSpec {
  return WORD_SPEC_BY_ID.get(wordId) ?? PEEKABOO_WORDS[0];
}

export function getPeekabooCharacterByPairId(pairId: string): PeekabooCharacterSpec | undefined {
  return CHARACTER_BY_PAIR_ID.get(pairId);
}

export function isValidPeekabooWordId(value: unknown): value is PeekabooWordId {
  return typeof value === 'string' && VALID_WORD_ID_SET.has(value);
}

function pickSessionCharacters(
  worldId: PeekabooWorldId,
  count: PeekabooRoundLength,
): PeekabooCharacterSpec[] {
  if (worldId !== 'all-stories') {
    const themeChars = PEEKABOO_CHARACTERS.filter((c) => c.themeId === worldId);
    const lead = themeChars[0];
    const restShuffled = shuffleList(themeChars.slice(1));
    const ordered =
      lead && getRandomInt(2) === 0 ? [lead, ...restShuffled] : shuffleList(themeChars);
    return ordered.slice(0, count);
  }

  const themeIds: Exclude<PeekabooWorldId, 'all-stories'>[] = [
    'cars',
    'paw-patrol',
    'lion-king',
    'toy-story',
    'kung-fu-panda',
    'tom-and-jerry',
  ];
  const themeOrder = shuffleList(themeIds);
  const buckets = themeOrder.map((tId) => {
    const chars = PEEKABOO_CHARACTERS.filter((c) => c.themeId === tId);
    const lead = chars[0];
    const rest = shuffleList(chars.slice(1));
    return lead && getRandomInt(2) === 0 ? [lead, ...rest] : shuffleList(chars);
  });

  const picked: PeekabooCharacterSpec[] = [];
  let roundOffset = 0;
  while (picked.length < count) {
    let addedAny = false;
    for (const bucket of buckets) {
      if (roundOffset < bucket.length) {
        picked.push(bucket[roundOffset]);
        addedAny = true;
        if (picked.length >= count) break;
      }
    }
    if (!addedAny) break;
    roundOffset += 1;
  }
  return picked;
}

function scoreLookAlikeSimilarity(
  candidate: PeekabooWordSpec,
  targets: readonly PeekabooWordSpec[],
): number {
  let best = 0;
  for (const target of targets) {
    let score = 0;
    if (candidate.initialChar === target.initialChar) score += 3;
    if (candidate.ending === target.ending) score += 3;
    if (candidate.display.length === target.display.length) score += 2;
    if (candidate.kind === target.kind) score += 1;
    if (candidate.display.length >= 2 && target.display.length >= 2) {
      const midC = candidate.display.toLowerCase()[1];
      const midT = target.display.toLowerCase()[1];
      if (midC === midT) score += 1;
    }
    if (score > best) best = score;
  }
  return best;
}

function buildBoardFromTargets(
  packPool: readonly PeekabooWordId[],
  targetIds: readonly PeekabooWordId[],
  character: PeekabooCharacterSpec,
  cardIndex: number,
): PeekabooCardSpec {
  const targetSet = new Set<PeekabooWordId>(targetIds);
  const targetSpecs = targetIds.map((id) => getPeekabooWordSpec(id));

  const distractorCandidates = packPool
    .filter((id) => !targetSet.has(id))
    .map((id) => {
      const spec = getPeekabooWordSpec(id);
      return {
        id,
        score: scoreLookAlikeSimilarity(spec, targetSpecs) + getRandomInt(3) * 0.45,
      };
    })
    .sort((a, b) => b.score - a.score);

  const neededDistractors = Math.max(0, TILES_PER_BOARD - targetIds.length);
  const distractorIds = distractorCandidates.slice(0, neededDistractors).map((d) => d.id);

  // Defensive safeguard in case a pack ever shrinks below 8 words
  if (distractorIds.length < neededDistractors) {
    for (const w of shuffleList(PEEKABOO_WORDS)) {
      if (!targetSet.has(w.id) && !distractorIds.includes(w.id)) {
        distractorIds.push(w.id);
        if (distractorIds.length >= neededDistractors) break;
      }
    }
  }

  const combinedIds = shuffleList([...targetIds, ...distractorIds]).slice(0, TILES_PER_BOARD);
  const tiles: PeekabooTileSpec[] = combinedIds.map((wordId, slotIndex) => {
    const spec = getPeekabooWordSpec(wordId);
    return {
      slotIndex,
      wordId,
      display: spec.display,
      kind: spec.kind,
      isTarget: targetSet.has(wordId),
    };
  });

  const targetQueue = shuffleList(targetIds);

  return {
    cardUid: `${character.pairId}-${cardIndex}-${getRandomInt(100000)}`,
    character,
    tiles,
    targetQueue,
  };
}

export function buildFreshBoardForCharacter(
  packId: PeekabooPackId,
  character: PeekabooCharacterSpec,
  cardIndex: number,
): PeekabooCardSpec {
  const pack = getPeekabooPackSpec(packId);
  const shuffledPool = shuffleList(pack.wordIds);
  const targets = shuffledPool.slice(0, Math.min(TARGETS_PER_BOARD, shuffledPool.length));
  return buildBoardFromTargets(pack.wordIds, targets, character, cardIndex);
}

export function buildPeekabooSessionDeck(config: WordPeekabooConfig): PeekabooCardSpec[] {
  const pack = getPeekabooPackSpec(config.packId);
  const characters = pickSessionCharacters(config.worldId, config.roundLength);
  let bag = shuffleList(pack.wordIds);

  return characters.map((character, cardIndex) => {
    const targets: PeekabooWordId[] = [];
    const pickedSet = new Set<PeekabooWordId>();

    while (targets.length < TARGETS_PER_BOARD) {
      if (bag.length === 0) {
        bag = shuffleList(pack.wordIds);
      }
      const nextIdx = bag.findIndex((id) => !pickedSet.has(id));
      if (nextIdx >= 0) {
        const [wordId] = bag.splice(nextIdx, 1);
        pickedSet.add(wordId);
        targets.push(wordId);
      } else {
        // Fallback if bag somehow only had duplicates of already-picked words
        const alt = shuffleList(pack.wordIds).find((id) => !pickedSet.has(id));
        if (!alt) break;
        pickedSet.add(alt);
        targets.push(alt);
      }
    }

    return buildBoardFromTargets(pack.wordIds, targets, character, cardIndex);
  });
}

// TODO(security): Local mastery tracking is validated against VALID_WORD_ID_SET and finite numeric
// bounds before use, since Pebble stores all progress locally in the browser with no backend.
export function loadPeekabooMastery(): PeekabooMasteryMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PEEKABOO_MASTERY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const clean: PeekabooMasteryMap = {};
    for (const [key, val] of Object.entries(parsed)) {
      if (!isValidPeekabooWordId(key)) continue;
      if (!val || typeof val !== 'object') continue;
      const entry = val as Partial<PeekabooWordMasteryEntry>;
      if (
        typeof entry.exposures === 'number' &&
        Number.isFinite(entry.exposures) &&
        typeof entry.cleanReads === 'number' &&
        Number.isFinite(entry.cleanReads) &&
        typeof entry.lastSeenAt === 'number' &&
        Number.isFinite(entry.lastSeenAt)
      ) {
        clean[key] = {
          exposures: Math.max(0, Math.min(9999, Math.floor(entry.exposures))),
          cleanReads: Math.max(0, Math.min(9999, Math.floor(entry.cleanReads))),
          lastSeenAt: Math.max(0, Math.floor(entry.lastSeenAt)),
        };
      }
    }
    return clean;
  } catch {
    return {};
  }
}

export function recordPeekabooWordRead(wordId: PeekabooWordId, cleanFirstTry: boolean): void {
  if (typeof window === 'undefined' || !isValidPeekabooWordId(wordId)) return;
  try {
    const current = loadPeekabooMastery();
    const prev = current[wordId] ?? { exposures: 0, cleanReads: 0, lastSeenAt: 0 };
    current[wordId] = {
      exposures: Math.min(9999, prev.exposures + 1),
      cleanReads: Math.min(9999, prev.cleanReads + (cleanFirstTry ? 1 : 0)),
      lastSeenAt: Date.now(),
    };
    window.localStorage.setItem(PEEKABOO_MASTERY_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage quota or disabled storage errors
  }
}

export function getPackReadProgress(
  packId: PeekabooPackId,
  mastery: PeekabooMasteryMap,
): { readCount: number; masteredCount: number; total: number } {
  const pack = getPeekabooPackSpec(packId);
  let readCount = 0;
  let masteredCount = 0;
  for (const wordId of pack.wordIds) {
    const stat = mastery[wordId];
    if (!stat) continue;
    if (stat.exposures >= 1 && stat.cleanReads >= 1) {
      readCount += 1;
    }
    if (stat.cleanReads >= 2) {
      masteredCount += 1;
    }
  }
  return { readCount, masteredCount, total: pack.wordIds.length };
}

export function getPeekabooCharacterPreviewSrc(worldId: PeekabooWorldId): string {
  return assetUrl(getPeekabooWorldSpec(worldId).previewPath);
}
