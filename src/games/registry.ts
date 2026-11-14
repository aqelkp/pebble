export interface GameRegistryEntry {
  id: 'memory-match' | 'letter-train' | 'number-safari' | 'word-fun';
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
      'Load all 3 matching picture cards onto each A–Z steam train to hear the whistle blow—watch out or wrong picks will overheat the boiler!',
    badgeText: 'New Game',
    ageHint: 'K1 / LKG • A–Z Phonics',
    artPath: 'hub/letter-train.png',
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
    description: 'Count friendly animals along the savanna trail with tactile number blocks.',
    badgeText: 'Coming Soon',
    ageHint: 'Counting & Early Math',
    artPath: 'hub/number-safari.png',
    status: 'coming-soon',
  },
];
