export interface GameRegistryEntry {
  id: 'memory-match' | 'letter-train' | 'letter-river' | 'picture-sudoku' | 'number-safari' | 'word-fun';
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
    id: 'word-fun',
    title: 'Word Fun',
    description:
      'Spell cozy three-letter first words with storybook picture clues and tactile wooden letter blocks.',
    badgeText: 'Ready to Play',
    ageHint: 'Ages 3–7 • 1–4 Players',
    artPath: 'hub/word-fun.png',
    status: 'available',
  },
  {
    id: 'number-safari',
    title: 'Number Safari',
    description:
      'Tap friendly savanna animals to count 1–10 or join groups together with tactile number blocks.',
    badgeText: 'Ready to Play',
    ageHint: 'Ages 3–7 • 1–4 Players',
    artPath: 'hub/number-safari.png',
    status: 'available',
  },
];
