export interface GameRegistryEntry {
  id: 'memory-match' | 'number-safari' | 'word-fun';
  title: string;
  description: string;
  badgeText: string;
  ageHint: string;
  artPath: string;
  status: 'available' | 'coming-soon';
  featured?: boolean;
}

export const GAME_REGISTRY: readonly GameRegistryEntry[] = [
  {
    id: 'memory-match',
    title: 'Memory Match',
    description:
      'Flip tall illustrated cards to find matching characters, earn +1 point per pair, and celebrate the winner together.',
    badgeText: 'Ready to Play',
    ageHint: 'Ages 3–7 • 1–4 Players',
    artPath: 'hub/memory-match.png',
    status: 'available',
    featured: true,
  },
  {
    id: 'number-safari',
    title: 'Number Safari',
    description: 'Count friendly animals along the savanna trail with tactile number blocks.',
    badgeText: 'Coming Soon',
    ageHint: 'Counting & Early Math',
    artPath: 'hub/number-safari.png',
    status: 'coming-soon',
  },
  {
    id: 'word-fun',
    title: 'Word Fun',
    description: 'Build cozy three-letter words by matching rounded picture tiles.',
    badgeText: 'Coming Soon',
    ageHint: 'Phonics & First Words',
    artPath: 'hub/word-fun.png',
    status: 'coming-soon',
  },
];
