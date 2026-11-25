export type WordHuntGridSize = '5x5' | '6x6' | '7x7';

export type WordHuntPackId = 'all' | 'cvc' | 'sight' | 'animals' | 'everyday';

export type WordHuntCaseMode = 'upper' | 'lower';

export type WordHuntDirection = 'H' | 'V' | 'D';

export interface WordHuntConfig {
  gridSize: WordHuntGridSize;
  packId: WordHuntPackId;
  caseMode: WordHuntCaseMode;
}

export interface WordHuntGridSizeSpec {
  id: WordHuntGridSize;
  label: string;
  badge: string;
  description: string;
  size: number;
  wordCount: number;
  maxWordLength: number;
  directions: readonly WordHuntDirection[];
  directionHint: string;
}

export interface WordHuntPackSpec {
  id: WordHuntPackId;
  title: string;
  subtitle: string;
  accentColor: string;
  sampleWords: readonly [string, string, string];
}

export interface WordHuntEntry {
  id: string;
  word: string; // Uppercase A-Z
  audioId: string; // Verified file in public/audio/words/<audioId>.mp3
  packId: Exclude<WordHuntPackId, 'all'>;
}

export interface GridCoord {
  row: number;
  col: number;
}

export interface PlacedWord {
  id: string;
  word: string;
  audioId: string;
  packId: Exclude<WordHuntPackId, 'all'>;
  cells: GridCoord[];
  direction: WordHuntDirection;
  color: string;
}

export interface WordHuntPuzzle {
  id: string;
  size: number;
  grid: string[][]; // Uppercase letters
  words: PlacedWord[];
  directions: readonly WordHuntDirection[];
}

export interface WordHuntMasteryStats {
  gridsCompleted: number;
  wordsFound: number;
  flawlessGrids: number;
}

export const WORD_HUNT_SESSION_KEY = 'pebble.word-hunt.session.v1';
const WORD_HUNT_MASTERY_KEY = 'pebble.word-hunt.mastery.v1';

export const WORD_HUNT_COLORS: readonly string[] = [
  '#3BA99C', // Sage Mint
  '#5B5BD6', // Warm Indigo
  '#F27A5E', // Soft Coral
  '#E09F24', // Warm Honey
  '#3B82C4', // Calm Sky
  '#8B6CE0', // Soft Lavender
];

export const WORD_HUNT_GRID_SIZES: readonly WordHuntGridSizeSpec[] = [
  {
    id: '5x5',
    label: '5 × 5 Grid',
    badge: 'Starter',
    description: '4 short words across (→)',
    size: 5,
    wordCount: 4,
    maxWordLength: 4,
    directions: ['H'],
    directionHint: 'Across →',
  },
  {
    id: '6x6',
    label: '6 × 6 Grid',
    badge: 'Classic',
    description: '5 words across & down (→ ↓)',
    size: 6,
    wordCount: 5,
    maxWordLength: 5,
    directions: ['H', 'V'],
    directionHint: 'Across → & Down ↓',
  },
  {
    id: '7x7',
    label: '7 × 7 Grid',
    badge: 'Explorer',
    description: '6 words across, down & diagonal (→ ↓ ↘)',
    size: 7,
    wordCount: 6,
    maxWordLength: 6,
    directions: ['H', 'V', 'D'],
    directionHint: 'Across →, Down ↓ & Diagonal ↘',
  },
];

export const WORD_HUNT_PACKS: readonly WordHuntPackSpec[] = [
  {
    id: 'all',
    title: 'All Cozy Words',
    subtitle: 'Mix of phonics, sight & world words',
    accentColor: '#5B5BD6',
    sampleWords: ['CAT', 'SUN', 'THE'],
  },
  {
    id: 'cvc',
    title: 'CVC Phonics',
    subtitle: 'Short 3-letter sound-out words',
    accentColor: '#3BA99C',
    sampleWords: ['CAT', 'DOG', 'BUS'],
  },
  {
    id: 'sight',
    title: 'Sight Words',
    subtitle: 'Everyday K1/K2 reading words',
    accentColor: '#8B6CE0',
    sampleWords: ['THE', 'SEE', 'CAN'],
  },
  {
    id: 'animals',
    title: 'Animals & Nature',
    subtitle: 'Friendly creatures & outdoors',
    accentColor: '#F27A5E',
    sampleWords: ['FOX', 'LION', 'TREE'],
  },
  {
    id: 'everyday',
    title: 'Home & Play',
    subtitle: 'Toys, snacks & cozy things',
    accentColor: '#E09F24',
    sampleWords: ['CUP', 'BALL', 'CAKE'],
  },
];

// Every audioId below is verified to exist in public/audio/words/<audioId>.mp3
export const WORD_HUNT_ENTRIES: readonly WordHuntEntry[] = [
  // CVC Phonics (3-letter)
  { id: 'cat', word: 'CAT', audioId: 'cat', packId: 'cvc' },
  { id: 'dog', word: 'DOG', audioId: 'dog', packId: 'cvc' },
  { id: 'pig', word: 'PIG', audioId: 'pig', packId: 'cvc' },
  { id: 'fox', word: 'FOX', audioId: 'fox', packId: 'cvc' },
  { id: 'hen', word: 'HEN', audioId: 'hen', packId: 'cvc' },
  { id: 'cow', word: 'COW', audioId: 'cow', packId: 'cvc' },
  { id: 'bug', word: 'BUG', audioId: 'bug', packId: 'cvc' },
  { id: 'cup', word: 'CUP', audioId: 'cup', packId: 'cvc' },
  { id: 'hat', word: 'HAT', audioId: 'hat', packId: 'cvc' },
  { id: 'bed', word: 'BED', audioId: 'bed', packId: 'cvc' },
  { id: 'box', word: 'BOX', audioId: 'box', packId: 'cvc' },
  { id: 'pot', word: 'POT', audioId: 'pot', packId: 'cvc' },
  { id: 'pan', word: 'PAN', audioId: 'pan', packId: 'cvc' },
  { id: 'jar', word: 'JAR', audioId: 'jar', packId: 'cvc' },
  { id: 'jam', word: 'JAM', audioId: 'jam', packId: 'cvc' },
  { id: 'bag', word: 'BAG', audioId: 'bag', packId: 'cvc' },
  { id: 'bus', word: 'BUS', audioId: 'bus', packId: 'cvc' },
  { id: 'car', word: 'CAR', audioId: 'car', packId: 'cvc' },
  { id: 'van', word: 'VAN', audioId: 'van', packId: 'cvc' },
  { id: 'jet', word: 'JET', audioId: 'jet', packId: 'cvc' },
  { id: 'map', word: 'MAP', audioId: 'map', packId: 'cvc' },
  { id: 'net', word: 'NET', audioId: 'net', packId: 'cvc' },
  { id: 'nut', word: 'NUT', audioId: 'nut', packId: 'cvc' },
  { id: 'top', word: 'TOP', audioId: 'top', packId: 'cvc' },
  { id: 'sun', word: 'SUN', audioId: 'sun', packId: 'cvc' },
  { id: 'log', word: 'LOG', audioId: 'log', packId: 'cvc' },
  { id: 'web', word: 'WEB', audioId: 'web', packId: 'cvc' },
  { id: 'pod', word: 'POD', audioId: 'pod', packId: 'cvc' },
  { id: 'gem', word: 'GEM', audioId: 'gem', packId: 'cvc' },
  { id: 'sub', word: 'SUB', audioId: 'sub', packId: 'cvc' },

  // Sight Words (3-letter)
  { id: 'the', word: 'THE', audioId: 'the', packId: 'sight' },
  { id: 'see', word: 'SEE', audioId: 'see', packId: 'sight' },
  { id: 'can', word: 'CAN', audioId: 'can', packId: 'sight' },
  { id: 'you', word: 'YOU', audioId: 'you', packId: 'sight' },
  { id: 'are', word: 'ARE', audioId: 'are', packId: 'sight' },
  { id: 'she', word: 'SHE', audioId: 'she', packId: 'sight' },
  { id: 'all', word: 'ALL', audioId: 'all', packId: 'sight' },
  { id: 'for', word: 'FOR', audioId: 'for', packId: 'sight' },
  { id: 'and', word: 'AND', audioId: 'and', packId: 'sight' },
  { id: 'was', word: 'WAS', audioId: 'was', packId: 'sight' },

  // Animals & Nature (3-6 letters)
  { id: 'ant', word: 'ANT', audioId: 'ant', packId: 'animals' },
  { id: 'bee', word: 'BEE', audioId: 'bee', packId: 'animals' },
  { id: 'owl', word: 'OWL', audioId: 'owl', packId: 'animals' },
  { id: 'yak', word: 'YAK', audioId: 'yak', packId: 'animals' },
  { id: 'zoo', word: 'ZOO', audioId: 'zoo', packId: 'animals' },
  { id: 'sky', word: 'SKY', audioId: 'sky', packId: 'animals' },
  { id: 'sea', word: 'SEA', audioId: 'sea', packId: 'animals' },
  { id: 'bear', word: 'BEAR', audioId: 'bear', packId: 'animals' },
  { id: 'duck', word: 'DUCK', audioId: 'duck', packId: 'animals' },
  { id: 'fish', word: 'FISH', audioId: 'fish', packId: 'animals' },
  { id: 'frog', word: 'FROG', audioId: 'frog', packId: 'animals' },
  { id: 'goat', word: 'GOAT', audioId: 'goat', packId: 'animals' },
  { id: 'lion', word: 'LION', audioId: 'lion', packId: 'animals' },
  { id: 'worm', word: 'WORM', audioId: 'worm', packId: 'animals' },
  { id: 'leaf', word: 'LEAF', audioId: 'leaf', packId: 'animals' },
  { id: 'moon', word: 'MOON', audioId: 'moon', packId: 'animals' },
  { id: 'nest', word: 'NEST', audioId: 'nest', packId: 'animals' },
  { id: 'rose', word: 'ROSE', audioId: 'rose', packId: 'animals' },
  { id: 'tree', word: 'TREE', audioId: 'tree', packId: 'animals' },
  { id: 'eagle', word: 'EAGLE', audioId: 'eagle', packId: 'animals' },
  { id: 'horse', word: 'HORSE', audioId: 'horse', packId: 'animals' },
  { id: 'koala', word: 'KOALA', audioId: 'koala', packId: 'animals' },
  { id: 'otter', word: 'OTTER', audioId: 'otter', packId: 'animals' },
  { id: 'snail', word: 'SNAIL', audioId: 'snail', packId: 'animals' },
  { id: 'tiger', word: 'TIGER', audioId: 'tiger', packId: 'animals' },
  { id: 'whale', word: 'WHALE', audioId: 'whale', packId: 'animals' },
  { id: 'zebra', word: 'ZEBRA', audioId: 'zebra', packId: 'animals' },
  { id: 'flower', word: 'FLOWER', audioId: 'flower', packId: 'animals' },
  { id: 'monkey', word: 'MONKEY', audioId: 'monkey', packId: 'animals' },
  { id: 'rabbit', word: 'RABBIT', audioId: 'rabbit', packId: 'animals' },
  { id: 'turtle', word: 'TURTLE', audioId: 'turtle', packId: 'animals' },

  // Everyday Home & Play (3-6 letters)
  { id: 'egg', word: 'EGG', audioId: 'egg', packId: 'everyday' },
  { id: 'key', word: 'KEY', audioId: 'key', packId: 'everyday' },
  { id: 'ball', word: 'BALL', audioId: 'ball', packId: 'everyday' },
  { id: 'boat', word: 'BOAT', audioId: 'boat', packId: 'everyday' },
  { id: 'cake', word: 'CAKE', audioId: 'cake', packId: 'everyday' },
  { id: 'door', word: 'DOOR', audioId: 'door', packId: 'everyday' },
  { id: 'drum', word: 'DRUM', audioId: 'drum', packId: 'everyday' },
  { id: 'gift', word: 'GIFT', audioId: 'gift', packId: 'everyday' },
  { id: 'king', word: 'KING', audioId: 'king', packId: 'everyday' },
  { id: 'kite', word: 'KITE', audioId: 'kite', packId: 'everyday' },
  { id: 'lamp', word: 'LAMP', audioId: 'lamp', packId: 'everyday' },
  { id: 'milk', word: 'MILK', audioId: 'milk', packId: 'everyday' },
  { id: 'pear', word: 'PEAR', audioId: 'pear', packId: 'everyday' },
  { id: 'ring', word: 'RING', audioId: 'ring', packId: 'everyday' },
  { id: 'sock', word: 'SOCK', audioId: 'sock', packId: 'everyday' },
  { id: 'tent', word: 'TENT', audioId: 'tent', packId: 'everyday' },
  { id: 'vase', word: 'VASE', audioId: 'vase', packId: 'everyday' },
  { id: 'vest', word: 'VEST', audioId: 'vest', packId: 'everyday' },
  { id: 'yarn', word: 'YARN', audioId: 'yarn', packId: 'everyday' },
  { id: 'apple', word: 'APPLE', audioId: 'apple', packId: 'everyday' },
  { id: 'donut', word: 'DONUT', audioId: 'donut', packId: 'everyday' },
  { id: 'heart', word: 'HEART', audioId: 'heart', packId: 'everyday' },
  { id: 'house', word: 'HOUSE', audioId: 'house', packId: 'everyday' },
  { id: 'igloo', word: 'IGLOO', audioId: 'igloo', packId: 'everyday' },
  { id: 'juice', word: 'JUICE', audioId: 'juice', packId: 'everyday' },
  { id: 'lemon', word: 'LEMON', audioId: 'lemon', packId: 'everyday' },
  { id: 'mango', word: 'MANGO', audioId: 'mango', packId: 'everyday' },
  { id: 'pizza', word: 'PIZZA', audioId: 'pizza', packId: 'everyday' },
  { id: 'queen', word: 'QUEEN', audioId: 'queen', packId: 'everyday' },
  { id: 'quilt', word: 'QUILT', audioId: 'quilt', packId: 'everyday' },
  { id: 'robot', word: 'ROBOT', audioId: 'robot', packId: 'everyday' },
  { id: 'truck', word: 'TRUCK', audioId: 'truck', packId: 'everyday' },
  { id: 'wagon', word: 'WAGON', audioId: 'wagon', packId: 'everyday' },
  { id: 'watch', word: 'WATCH', audioId: 'watch', packId: 'everyday' },
  { id: 'banana', word: 'BANANA', audioId: 'banana', packId: 'everyday' },
  { id: 'carrot', word: 'CARROT', audioId: 'carrot', packId: 'everyday' },
  { id: 'grapes', word: 'GRAPES', audioId: 'grapes', packId: 'everyday' },
  { id: 'guitar', word: 'GUITAR', audioId: 'guitar', packId: 'everyday' },
  { id: 'jacket', word: 'JACKET', audioId: 'jacket', packId: 'everyday' },
  { id: 'orange', word: 'ORANGE', audioId: 'orange', packId: 'everyday' },
  { id: 'pencil', word: 'PENCIL', audioId: 'pencil', packId: 'everyday' },
  { id: 'rocket', word: 'ROCKET', audioId: 'rocket', packId: 'everyday' },
  { id: 'waffle', word: 'WAFFLE', audioId: 'waffle', packId: 'everyday' },
];

const FILLER_ALPHABET = 'ABCDEFGHIKLMNOPRSTUVWYZ';

export function getDefaultWordHuntConfig(): WordHuntConfig {
  return {
    gridSize: '6x6',
    packId: 'all',
    caseMode: 'upper',
  };
}

export function isValidWordHuntGridSize(value: unknown): value is WordHuntGridSize {
  return value === '5x5' || value === '6x6' || value === '7x7';
}

export function isValidWordHuntPackId(value: unknown): value is WordHuntPackId {
  return (
    value === 'all' ||
    value === 'cvc' ||
    value === 'sight' ||
    value === 'animals' ||
    value === 'everyday'
  );
}

export function isValidWordHuntCaseMode(value: unknown): value is WordHuntCaseMode {
  return value === 'upper' || value === 'lower';
}

export function isValidWordHuntConfig(value: unknown): value is WordHuntConfig {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<WordHuntConfig>;
  return (
    isValidWordHuntGridSize(candidate.gridSize) &&
    isValidWordHuntPackId(candidate.packId) &&
    isValidWordHuntCaseMode(candidate.caseMode)
  );
}

export function getWordHuntGridSpec(gridSize: WordHuntGridSize): WordHuntGridSizeSpec {
  return WORD_HUNT_GRID_SIZES.find((s) => s.id === gridSize) ?? WORD_HUNT_GRID_SIZES[1];
}

export function getWordHuntPackSpec(packId: WordHuntPackId): WordHuntPackSpec {
  return WORD_HUNT_PACKS.find((p) => p.id === packId) ?? WORD_HUNT_PACKS[0];
}

export function formatWordCase(text: string, caseMode: WordHuntCaseMode): string {
  return caseMode === 'lower' ? text.toLowerCase() : text.toUpperCase();
}

function shuffleArray<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function directionDelta(dir: WordHuntDirection): { dr: number; dc: number } {
  switch (dir) {
    case 'H':
      return { dr: 0, dc: 1 };
    case 'V':
      return { dr: 1, dc: 0 };
    case 'D':
      return { dr: 1, dc: 1 };
  }
}

interface PlacementCandidate {
  row: number;
  col: number;
  direction: WordHuntDirection;
  intersections: number;
}

function getPoolForConfig(config: WordHuntConfig): WordHuntEntry[] {
  const spec = getWordHuntGridSpec(config.gridSize);
  const filtered = WORD_HUNT_ENTRIES.filter((entry) => {
    if (entry.word.length > spec.maxWordLength) return false;
    if (config.packId === 'all') return true;
    return entry.packId === config.packId;
  });
  return filtered.length >= spec.wordCount
    ? filtered
    : WORD_HUNT_ENTRIES.filter((entry) => entry.word.length <= spec.maxWordLength);
}

function gridContainsWordOutsidePlaced(
  grid: string[][],
  targetWord: string,
  placedCellsKey: string,
): boolean {
  const n = grid.length;
  const dirs: readonly WordHuntDirection[] = ['H', 'V', 'D'];
  for (const dir of dirs) {
    const { dr, dc } = directionDelta(dir);
    for (let r = 0; r < n; r += 1) {
      for (let c = 0; c < n; c += 1) {
        const endR = r + dr * (targetWord.length - 1);
        const endC = c + dc * (targetWord.length - 1);
        if (endR < 0 || endR >= n || endC < 0 || endC >= n) continue;
        let matches = true;
        const coords: string[] = [];
        for (let k = 0; k < targetWord.length; k += 1) {
          const rr = r + dr * k;
          const cc = c + dc * k;
          if (grid[rr][cc] !== targetWord[k]) {
            matches = false;
            break;
          }
          coords.push(`${rr},${cc}`);
        }
        if (matches && coords.join('|') !== placedCellsKey) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Generates a fresh crossword-style N x N word search puzzle.
 * Prefers clean shared-letter intersections when placing words in different directions,
 * and avoids accidental duplicate occurrences of target words in filler cells.
 */
export function generateWordHuntPuzzle(
  config: WordHuntConfig,
  avoidWordIds?: readonly string[],
): WordHuntPuzzle {
  const spec = getWordHuntGridSpec(config.gridSize);
  const pool = getPoolForConfig(config);
  const avoidSet = new Set(avoidWordIds ?? []);

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const freshPool = pool.filter((e) => !avoidSet.has(e.id));
    const sourcePool = freshPool.length >= spec.wordCount ? freshPool : pool;
    const picked = shuffleArray(sourcePool).slice(0, spec.wordCount);

    // Ensure no picked word is a substring of another picked word
    const hasSubstringConflict = picked.some((a, i) =>
      picked.some((b, j) => i !== j && b.word.includes(a.word)),
    );
    if (hasSubstringConflict && attempt < 25) {
      continue;
    }

    // Place longer words first for higher success rate
    const ordered = [...picked].sort((a, b) => b.word.length - a.word.length);
    const grid: (string | null)[][] = Array.from({ length: spec.size }, () =>
      Array.from({ length: spec.size }, () => null),
    );
    const placed: PlacedWord[] = [];
    const usedDirCounts: Record<WordHuntDirection, number> = { H: 0, V: 0, D: 0 };

    let allPlaced = true;
    for (let idx = 0; idx < ordered.length; idx += 1) {
      const entry = ordered[idx];
      const candidates: PlacementCandidate[] = [];

      for (const dir of spec.directions) {
        const { dr, dc } = directionDelta(dir);
        for (let r = 0; r < spec.size; r += 1) {
          for (let c = 0; c < spec.size; c += 1) {
            const endR = r + dr * (entry.word.length - 1);
            const endC = c + dc * (entry.word.length - 1);
            if (endR < 0 || endR >= spec.size || endC < 0 || endC >= spec.size) continue;

            let valid = true;
            let intersections = 0;
            for (let k = 0; k < entry.word.length; k += 1) {
              const rr = r + dr * k;
              const cc = c + dc * k;
              const existing = grid[rr][cc];
              if (existing !== null && existing !== entry.word[k]) {
                valid = false;
                break;
              }
              if (existing === entry.word[k]) {
                intersections += 1;
              }
            }
            if (valid) {
              candidates.push({ row: r, col: c, direction: dir, intersections });
            }
          }
        }
      }

      if (candidates.length === 0) {
        allPlaced = false;
        break;
      }

      // Score candidates: reward crossword intersections & balanced direction variety
      const scored = candidates.map((cand) => {
        const dirBalanceBonus = usedDirCounts[cand.direction] === 0 ? 4 : -usedDirCounts[cand.direction];
        const intersectionBonus = cand.intersections > 0 ? cand.intersections * 6 : 0;
        const jitter = Math.random() * 2.5;
        return { cand, score: intersectionBonus + dirBalanceBonus + jitter };
      });
      scored.sort((a, b) => b.score - a.score);
      const chosen = scored[0].cand;

      const { dr, dc } = directionDelta(chosen.direction);
      const cells: GridCoord[] = [];
      for (let k = 0; k < entry.word.length; k += 1) {
        const rr = chosen.row + dr * k;
        const cc = chosen.col + dc * k;
        grid[rr][cc] = entry.word[k];
        cells.push({ row: rr, col: cc });
      }
      usedDirCounts[chosen.direction] += 1;
      placed.push({
        id: entry.id,
        word: entry.word,
        audioId: entry.audioId,
        packId: entry.packId,
        cells,
        direction: chosen.direction,
        color: WORD_HUNT_COLORS[idx % WORD_HUNT_COLORS.length],
      });
    }

    if (!allPlaced) continue;

    // Fill empty cells with random letters, avoiding accidental duplicate target words
    const filledGrid: string[][] = grid.map((row) =>
      row.map((ch) =>
        ch ?? FILLER_ALPHABET[Math.floor(Math.random() * FILLER_ALPHABET.length)],
      ),
    );

    // Quick repair pass if filler accidentally spelled a target word elsewhere
    for (let repair = 0; repair < 6; repair += 1) {
      let clean = true;
      for (const pw of placed) {
        const key = pw.cells.map((c) => `${c.row},${c.col}`).join('|');
        if (gridContainsWordOutsidePlaced(filledGrid, pw.word, key)) {
          clean = false;
          // Re-randomize non-word cells
          for (let r = 0; r < spec.size; r += 1) {
            for (let c = 0; c < spec.size; c += 1) {
              if (grid[r][c] === null) {
                filledGrid[r][c] =
                  FILLER_ALPHABET[Math.floor(Math.random() * FILLER_ALPHABET.length)];
              }
            }
          }
          break;
        }
      }
      if (clean) break;
    }

    // Shuffle word bank display order so it doesn't leak placement order
    const displayWords = shuffleArray(placed).map((pw, idx) => ({
      ...pw,
      color: WORD_HUNT_COLORS[idx % WORD_HUNT_COLORS.length],
    }));

    return {
      id: `wh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      size: spec.size,
      grid: filledGrid,
      words: displayWords,
      directions: spec.directions,
    };
  }

  // Deterministic fallback (should never be reached with our large word bank)
  const fallbackWords = WORD_HUNT_ENTRIES.filter((e) => e.word.length <= spec.size).slice(
    0,
    spec.wordCount,
  );
  const grid: string[][] = Array.from({ length: spec.size }, () =>
    Array.from({ length: spec.size }, () =>
      FILLER_ALPHABET[Math.floor(Math.random() * FILLER_ALPHABET.length)],
    ),
  );
  const placed: PlacedWord[] = fallbackWords.map((entry, rowIdx) => {
    const cells: GridCoord[] = [];
    for (let c = 0; c < entry.word.length; c += 1) {
      grid[rowIdx][c] = entry.word[c];
      cells.push({ row: rowIdx, col: c });
    }
    return {
      id: entry.id,
      word: entry.word,
      audioId: entry.audioId,
      packId: entry.packId,
      cells,
      direction: 'H',
      color: WORD_HUNT_COLORS[rowIdx % WORD_HUNT_COLORS.length],
    };
  });

  return {
    id: `wh-fallback-${Date.now()}`,
    size: spec.size,
    grid,
    words: placed,
    directions: spec.directions,
  };
}

/**
 * Computes the cells along the closest valid straight line from `start` to `end`.
 * Supports horizontal, vertical, and (when allowDiagonal is true) 45-degree diagonal lines.
 */
export function getLineCells(
  start: GridCoord,
  end: GridCoord,
  gridSize: number,
  allowDiagonal: boolean,
): GridCoord[] {
  const drRaw = end.row - start.row;
  const dcRaw = end.col - start.col;

  if (drRaw === 0 && dcRaw === 0) {
    return [start];
  }

  const absR = Math.abs(drRaw);
  const absC = Math.abs(dcRaw);

  let stepR = 0;
  let stepC = 0;
  let steps = 0;

  if (allowDiagonal && absR > 0 && absC > 0 && Math.abs(absR - absC) <= Math.max(1, Math.floor(Math.max(absR, absC) * 0.45))) {
    stepR = Math.sign(drRaw);
    stepC = Math.sign(dcRaw);
    steps = Math.max(absR, absC);
  } else if (absC >= absR) {
    stepR = 0;
    stepC = Math.sign(dcRaw);
    steps = absC;
  } else {
    stepR = Math.sign(drRaw);
    stepC = 0;
    steps = absR;
  }

  const cells: GridCoord[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const r = start.row + stepR * i;
    const c = start.col + stepC * i;
    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) break;
    cells.push({ row: r, col: c });
  }
  return cells;
}

export function isValidStraightLinePair(
  start: GridCoord,
  end: GridCoord,
  allowDiagonal: boolean,
): boolean {
  const dr = end.row - start.row;
  const dc = end.col - start.col;
  if (dr === 0 && dc === 0) return false;
  if (dr === 0 || dc === 0) return true;
  if (allowDiagonal && Math.abs(dr) === Math.abs(dc)) return true;
  return false;
}

export function loadWordHuntMastery(): WordHuntMasteryStats {
  try {
    const raw = window.localStorage.getItem(WORD_HUNT_MASTERY_KEY);
    if (!raw) return { gridsCompleted: 0, wordsFound: 0, flawlessGrids: 0 };
    const parsed = JSON.parse(raw) as Partial<WordHuntMasteryStats>;
    return {
      gridsCompleted:
        typeof parsed.gridsCompleted === 'number' && parsed.gridsCompleted >= 0
          ? Math.min(9999, Math.floor(parsed.gridsCompleted))
          : 0,
      wordsFound:
        typeof parsed.wordsFound === 'number' && parsed.wordsFound >= 0
          ? Math.min(99999, Math.floor(parsed.wordsFound))
          : 0,
      flawlessGrids:
        typeof parsed.flawlessGrids === 'number' && parsed.flawlessGrids >= 0
          ? Math.min(9999, Math.floor(parsed.flawlessGrids))
          : 0,
    };
  } catch {
    return { gridsCompleted: 0, wordsFound: 0, flawlessGrids: 0 };
  }
}

export function recordWordHuntGridFinished(
  wordsFoundCount: number,
  flawless: boolean,
): WordHuntMasteryStats {
  const prev = loadWordHuntMastery();
  const next: WordHuntMasteryStats = {
    gridsCompleted: Math.min(9999, prev.gridsCompleted + 1),
    wordsFound: Math.min(99999, prev.wordsFound + Math.max(0, wordsFoundCount)),
    flawlessGrids: Math.min(9999, prev.flawlessGrids + (flawless ? 1 : 0)),
  };
  try {
    window.localStorage.setItem(WORD_HUNT_MASTERY_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
  return next;
}
