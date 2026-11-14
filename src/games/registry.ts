export interface GameRegistryEntry {
  id: 'memory-match' | 'letter-train' | 'picture-sudoku' | 'number-safari' | 'word-fun';
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
    id: 'picture-sudoku',
    title: 'Picture Sudoku',
    description:
      'Fill every row and column with matching theme pictures—drag the missing cards into place on 3×3, 4×4, or 5×5 puzzles.',
    badgeText: 'New Game',
    ageHint: 'Ages 4–8 • Logic & Patterns',
    artPath: 'hub/picture-sudoku.png',
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
