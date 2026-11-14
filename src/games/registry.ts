export interface GameRegistryEntry {
  id: 'memory-match' | 'letter-train' | 'letter-river' | 'number-safari' | 'word-fun';
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
      'Flip tall illustrated cards across 10 themes—stories, cars, sports, fruits, vegetables, and car logos—to earn points and celebrate the winner.',
    badgeText: 'Ready to Play',
    ageHint: 'Ages 3–7 • 1–4 Players',
    artPath: 'hub/memory-match.png',
    status: 'available',
    featured: true,
  },
  {
    id: 'letter-train',
    title: 'Letter Train',
    description:
      'Load 3 matching picture words from a rotating 156-word A–Z bank—pick all 3 with zero mistakes to unlock a Golden Crown and cheering applause!',
    badgeText: 'New Game',
    ageHint: 'K1 / LKG • A–Z Phonics',
    artPath: 'hub/letter-train.png',
    status: 'available',
    featured: true,
  },
  {
    id: 'letter-river',
    title: 'Letter River',
    description:
      'Scoop swimming picture fish into 3 matching letter buckets on the dock—fill 3 catches to pop a bucket with a splash and welcome the next letter!',
    badgeText: 'New Game',
    ageHint: 'Ages 4–7 • Phonics Sorting',
    artPath: 'hub/letter-river.png',
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
