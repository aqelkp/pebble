import {
  CARD_THEMES,
  getThemeSpec,
  type CharacterCardSpec,
  type ThemeId,
} from '../memory-match/themes';

export type JigsawGridSize = '2x2' | '2x3' | '3x3';
export type JigsawRoundSize = '2-puzzles' | '3-puzzles' | '5-puzzles';

export interface StickerJigsawConfig {
  size: JigsawGridSize;
  roundSize: JigsawRoundSize;
  themeId: ThemeId;
}

export interface JigsawSizeSpec {
  id: JigsawGridSize;
  label: string;
  rows: number;
  cols: number;
  description: string;
  isDefault?: boolean;
}

export const JIGSAW_SIZE_SPECS: readonly JigsawSizeSpec[] = [
  {
    id: '2x2',
    label: '2 × 2',
    rows: 2,
    cols: 2,
    description: '4 chunky pieces · Great for ages 3–4',
    isDefault: true,
  },
  {
    id: '2x3',
    label: '2 × 3',
    rows: 2,
    cols: 3,
    description: '6 pieces · Classic sticker challenge',
  },
  {
    id: '3x3',
    label: '3 × 3',
    rows: 3,
    cols: 3,
    description: '9 pieces · Master sticker builder',
  },
];

export const JIGSAW_ROUND_OPTIONS: readonly {
  id: JigsawRoundSize;
  label: string;
  puzzlesCount: number;
  description: string;
  isDefault?: boolean;
}[] = [
  { id: '2-puzzles', label: '2 Stickers', puzzlesCount: 2, description: 'Quick sticker break' },
  {
    id: '3-puzzles',
    label: '3 Stickers',
    puzzlesCount: 3,
    description: 'Standard sticker album',
    isDefault: true,
  },
  { id: '5-puzzles', label: '5 Stickers', puzzlesCount: 5, description: 'Full sticker set' },
];

export function getJigsawSizeSpec(size: JigsawGridSize): JigsawSizeSpec {
  return JIGSAW_SIZE_SPECS.find((s) => s.id === size) ?? JIGSAW_SIZE_SPECS[0];
}

export function getPuzzlesCount(roundSize: JigsawRoundSize): number {
  return JIGSAW_ROUND_OPTIONS.find((r) => r.id === roundSize)?.puzzlesCount ?? 3;
}

export function getDefaultStickerJigsawConfig(): StickerJigsawConfig {
  return {
    size: '2x2',
    roundSize: '3-puzzles',
    themeId: 'lion-king',
  };
}

export function isValidStickerJigsawConfig(value: unknown): value is StickerJigsawConfig {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<StickerJigsawConfig>;
  return (
    (c.size === '2x2' || c.size === '2x3' || c.size === '3x3') &&
    (c.roundSize === '2-puzzles' || c.roundSize === '3-puzzles' || c.roundSize === '5-puzzles') &&
    typeof c.themeId === 'string' &&
    CARD_THEMES.some((theme) => theme.id === c.themeId)
  );
}

export interface JigsawPieceSpec {
  uid: string;
  row: number;
  col: number;
  slotKey: string;
}

export interface StickerJigsawPuzzle {
  id: string;
  character: CharacterCardSpec;
  rows: number;
  cols: number;
  preplacedSlots: Record<string, JigsawPieceSpec>;
  remainingTargetCount: number;
  initialTray: JigsawPieceSpec[];
}

export function jigsawSlotKey(row: number, col: number): string {
  return `${row}-${col}`;
}

function createMulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng<T>(items: readonly T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function pickRoundCharacters(
  themeId: ThemeId,
  puzzlesCount: number,
  excludeIds: string[] = [],
): CharacterCardSpec[] {
  const theme = getThemeSpec(themeId);
  const eligible = theme.characters.filter((c) => !excludeIds.includes(c.pairId));
  const pool = eligible.length >= puzzlesCount ? eligible : theme.characters;
  const rng = createMulberry32(Date.now() >>> 0);
  return shuffleWithRng(pool, rng).slice(0, puzzlesCount);
}

export function generateJigsawPuzzle(
  size: JigsawGridSize,
  character: CharacterCardSpec,
  puzzleIndex: number,
  seed?: number,
): StickerJigsawPuzzle {
  const spec = getJigsawSizeSpec(size);
  const effectiveSeed =
    seed ?? ((Date.now() ^ ((puzzleIndex + 1) * 0x85ebca6b)) >>> 0);
  const rng = createMulberry32(effectiveSeed);

  const allPieces: JigsawPieceSpec[] = [];
  for (let r = 0; r < spec.rows; r += 1) {
    for (let c = 0; c < spec.cols; c += 1) {
      const slotKey = jigsawSlotKey(r, c);
      allPieces.push({
        uid: `piece-${puzzleIndex}-${slotKey}-${Math.floor(rng() * 10000)}`,
        row: r,
        col: c,
        slotKey,
      });
    }
  }

  // Give 1 friendly starter piece for 2x2 puzzle 0, and 1–2 for larger boards so visual anchor is clear
  const starterCount =
    size === '2x2' ? (puzzleIndex === 0 ? 1 : 0) : size === '2x3' ? 1 : 2;

  const shuffled = shuffleWithRng(allPieces, rng);
  const preplacedList = shuffled.slice(0, starterCount);
  const trayList = shuffleWithRng(shuffled.slice(starterCount), rng);

  const preplacedSlots: Record<string, JigsawPieceSpec> = {};
  for (const piece of preplacedList) {
    preplacedSlots[piece.slotKey] = piece;
  }

  return {
    id: `jigsaw-${effectiveSeed}-${puzzleIndex}-${character.pairId}`,
    character,
    rows: spec.rows,
    cols: spec.cols,
    preplacedSlots,
    remainingTargetCount: trayList.length,
    initialTray: trayList,
  };
}
