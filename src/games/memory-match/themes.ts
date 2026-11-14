import { assetUrl } from '../../utils/assets';

export type ThemeId = 'lion-king' | 'kung-fu-panda' | 'paw-patrol';
export type BoardSizeId = '4x5' | '4x4' | '5x6';

export interface CharacterCardSpec {
  pairId: string;
  label: string;
  imagePath: string;
}

export interface ThemeSpec {
  id: ThemeId;
  title: string;
  subtitle: string;
  accentColor: string;
  previewPaths: [string, string];
  characters: CharacterCardSpec[];
}

export interface BoardSizeSpec {
  id: BoardSizeId;
  label: string;
  description: string;
  cols: number;
  rows: number;
  cardsCount: number;
  pairs: number;
  isDefault?: boolean;
}

export const DEFAULT_THEME_ID: ThemeId = 'lion-king';
export const DEFAULT_BOARD_SIZE_ID: BoardSizeId = '4x5';

/**
 * Default board layout is 4x5 (4 columns across x 5 rows vertically = 20 cards / 10 pairs).
 */
export const BOARD_SIZES: readonly BoardSizeSpec[] = [
  {
    id: '4x5',
    label: '4 × 5',
    description: '5 vertically • 20 cards',
    cols: 4,
    rows: 5,
    cardsCount: 20,
    pairs: 10,
    isDefault: true,
  },
  {
    id: '4x4',
    label: '4 × 4',
    description: '16 cards • Quick game',
    cols: 4,
    rows: 4,
    cardsCount: 16,
    pairs: 8,
  },
  {
    id: '5x6',
    label: '5 × 6',
    description: '30 cards • Big challenge',
    cols: 5,
    rows: 6,
    cardsCount: 30,
    pairs: 15,
  },
];

export const CARD_THEMES: readonly ThemeSpec[] = [
  {
    id: 'lion-king',
    title: 'Lion King',
    subtitle: 'Pride Lands friends',
    accentColor: '#F2B84B',
    previewPaths: ['themes/lion-king/01-simba.png', 'themes/lion-king/04-timon.png'],
    characters: [
      { pairId: 'lk-01', label: 'Simba', imagePath: 'themes/lion-king/01-simba.png' },
      { pairId: 'lk-02', label: 'Mufasa', imagePath: 'themes/lion-king/02-mufasa.png' },
      { pairId: 'lk-03', label: 'Nala', imagePath: 'themes/lion-king/03-nala.png' },
      { pairId: 'lk-04', label: 'Timon', imagePath: 'themes/lion-king/04-timon.png' },
      { pairId: 'lk-05', label: 'Pumbaa', imagePath: 'themes/lion-king/05-pumbaa.png' },
      { pairId: 'lk-06', label: 'Rafiki', imagePath: 'themes/lion-king/06-rafiki.png' },
      { pairId: 'lk-07', label: 'Zazu', imagePath: 'themes/lion-king/07-zazu.png' },
      { pairId: 'lk-08', label: 'Baby Elephant', imagePath: 'themes/lion-king/08-baby-elephant.png' },
      { pairId: 'lk-09', label: 'Cheetah', imagePath: 'themes/lion-king/09-cheetah.png' },
      { pairId: 'lk-10', label: 'Giraffe', imagePath: 'themes/lion-king/10-giraffe.png' },
      { pairId: 'lk-11', label: 'Zebra', imagePath: 'themes/lion-king/11-zebra.png' },
      { pairId: 'lk-12', label: 'Hyena', imagePath: 'themes/lion-king/12-hyena.png' },
      { pairId: 'lk-13', label: 'Hippo', imagePath: 'themes/lion-king/13-hippo.png' },
      { pairId: 'lk-14', label: 'Rhino', imagePath: 'themes/lion-king/14-rhino.png' },
      { pairId: 'lk-15', label: 'Crane', imagePath: 'themes/lion-king/15-crane.png' },
      { pairId: 'lk-16', label: 'Chameleon', imagePath: 'themes/lion-king/16-chameleon.png' },
    ],
  },
  {
    id: 'kung-fu-panda',
    title: 'Kung Fu Panda',
    subtitle: 'Valley of Peace heroes',
    accentColor: '#3BA99C',
    previewPaths: ['themes/kung-fu-panda/01-po.png', 'themes/kung-fu-panda/02-tigress.png'],
    characters: [
      { pairId: 'kfp-01', label: 'Po', imagePath: 'themes/kung-fu-panda/01-po.png' },
      { pairId: 'kfp-02', label: 'Tigress', imagePath: 'themes/kung-fu-panda/02-tigress.png' },
      { pairId: 'kfp-03', label: 'Master Shifu', imagePath: 'themes/kung-fu-panda/03-shifu.png' },
      { pairId: 'kfp-04', label: 'Master Oogway', imagePath: 'themes/kung-fu-panda/04-oogway.png' },
      { pairId: 'kfp-05', label: 'Monkey', imagePath: 'themes/kung-fu-panda/05-monkey.png' },
      { pairId: 'kfp-06', label: 'Mantis', imagePath: 'themes/kung-fu-panda/06-mantis.png' },
      { pairId: 'kfp-07', label: 'Crane', imagePath: 'themes/kung-fu-panda/07-crane.png' },
      { pairId: 'kfp-08', label: 'Viper', imagePath: 'themes/kung-fu-panda/08-viper.png' },
      { pairId: 'kfp-09', label: 'Mr. Ping', imagePath: 'themes/kung-fu-panda/09-mr-ping.png' },
      { pairId: 'kfp-10', label: 'Tai Lung', imagePath: 'themes/kung-fu-panda/10-tai-lung.png' },
      { pairId: 'kfp-11', label: 'Master Ox', imagePath: 'themes/kung-fu-panda/11-master-ox.png' },
      { pairId: 'kfp-12', label: 'Master Croc', imagePath: 'themes/kung-fu-panda/12-master-croc.png' },
      { pairId: 'kfp-13', label: 'Lord Shen', imagePath: 'themes/kung-fu-panda/13-lord-shen.png' },
      { pairId: 'kfp-14', label: 'Master Ram', imagePath: 'themes/kung-fu-panda/14-master-ram.png' },
      { pairId: 'kfp-15', label: 'Baby Panda', imagePath: 'themes/kung-fu-panda/15-baby-panda.png' },
      { pairId: 'kfp-16', label: 'Bunny Villager', imagePath: 'themes/kung-fu-panda/16-bunny.png' },
    ],
  },
  {
    id: 'paw-patrol',
    title: 'PAW Patrol',
    subtitle: 'Adventure Bay pups',
    accentColor: '#5B5BD6',
    previewPaths: ['themes/paw-patrol/01-chase.png', 'themes/paw-patrol/03-skye.png'],
    characters: [
      { pairId: 'pp-01', label: 'Chase', imagePath: 'themes/paw-patrol/01-chase.png' },
      { pairId: 'pp-02', label: 'Marshall', imagePath: 'themes/paw-patrol/02-marshall.png' },
      { pairId: 'pp-03', label: 'Skye', imagePath: 'themes/paw-patrol/03-skye.png' },
      { pairId: 'pp-04', label: 'Rubble', imagePath: 'themes/paw-patrol/04-rubble.png' },
      { pairId: 'pp-05', label: 'Rocky', imagePath: 'themes/paw-patrol/05-rocky.png' },
      { pairId: 'pp-06', label: 'Zuma', imagePath: 'themes/paw-patrol/06-zuma.png' },
      { pairId: 'pp-07', label: 'Everest', imagePath: 'themes/paw-patrol/07-everest.png' },
      { pairId: 'pp-08', label: 'Tracker', imagePath: 'themes/paw-patrol/08-tracker.png' },
      { pairId: 'pp-09', label: 'Bernie', imagePath: 'themes/paw-patrol/09-bernie.png' },
      { pairId: 'pp-10', label: 'Liberty', imagePath: 'themes/paw-patrol/10-liberty.png' },
      { pairId: 'pp-11', label: 'Sea Beagle', imagePath: 'themes/paw-patrol/11-sea-beagle.png' },
      { pairId: 'pp-12', label: 'Space Corgi', imagePath: 'themes/paw-patrol/12-space-corgi.png' },
      { pairId: 'pp-13', label: 'Medic Retriever', imagePath: 'themes/paw-patrol/13-medic-retriever.png' },
      { pairId: 'pp-14', label: 'Safety Collie', imagePath: 'themes/paw-patrol/14-safety-collie.png' },
      { pairId: 'pp-15', label: 'Robo Dog', imagePath: 'themes/paw-patrol/15-robo-dog.png' },
      { pairId: 'pp-16', label: 'Ranger Basset', imagePath: 'themes/paw-patrol/16-ranger-basset.png' },
    ],
  },
];

export interface DeckCard {
  uid: string;
  pairId: string;
  label: string;
  imageSrc: string;
}

function getRandomInt(maxExclusive: number): number {
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

export function getThemeSpec(themeId: ThemeId): ThemeSpec {
  return CARD_THEMES.find((t) => t.id === themeId) ?? CARD_THEMES[0];
}

export function getBoardSizeSpec(boardSizeId: BoardSizeId): BoardSizeSpec {
  return BOARD_SIZES.find((b) => b.id === boardSizeId) ?? BOARD_SIZES[0];
}

export function buildDeck(themeId: ThemeId, boardSizeId: BoardSizeId): DeckCard[] {
  const theme = getThemeSpec(themeId);
  const size = getBoardSizeSpec(boardSizeId);
  const chosenCharacters = shuffleList(theme.characters).slice(0, size.pairs);

  const pairs: DeckCard[] = chosenCharacters.flatMap((character) => {
    const src = assetUrl(character.imagePath);
    return [
      { uid: `${character.pairId}-a`, pairId: character.pairId, label: character.label, imageSrc: src },
      { uid: `${character.pairId}-b`, pairId: character.pairId, label: character.label, imageSrc: src },
    ];
  });

  return shuffleList(pairs);
}
