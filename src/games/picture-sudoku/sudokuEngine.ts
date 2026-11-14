import type { CharacterCardSpec } from '../memory-match/themes';

export type SudokuSize = 3 | 4 | 5;

export interface SudokuSizeSpec {
  size: SudokuSize;
  label: string;
  description: string;
  blanksCount: number;
  isDefault?: boolean;
}

export const DEFAULT_SUDOKU_SIZE: SudokuSize = 4;

export const SUDOKU_SIZES: readonly SudokuSizeSpec[] = [
  {
    size: 3,
    label: '3 × 3',
    description: '3 pictures • 4 missing cards',
    blanksCount: 4,
  },
  {
    size: 4,
    label: '4 × 4',
    description: '4 pictures • 2×2 boxes • 6 missing',
    blanksCount: 6,
    isDefault: true,
  },
  {
    size: 5,
    label: '5 × 5',
    description: '5 pictures • 9 missing cards',
    blanksCount: 9,
  },
];

export interface TrayCard {
  uid: string;
  symbolIndex: number;
}

export interface SudokuPuzzle {
  size: SudokuSize;
  symbols: CharacterCardSpec[];
  solution: number[][];
  givens: (number | null)[][];
  initialTray: TrayCard[];
}

export interface ConflictInfo {
  reason: 'row' | 'col' | 'box';
  conflictCells: Array<{ row: number; col: number }>;
  bandCells: Array<{ row: number; col: number }>;
  message: string;
}

export function getRowColBandCells(
  row: number,
  col: number,
  size: SudokuSize,
): Array<{ row: number; col: number }> {
  const cells: Array<{ row: number; col: number }> = [];
  for (let i = 0; i < size; i += 1) {
    cells.push({ row, col: i });
    if (i !== row) {
      cells.push({ row: i, col });
    }
  }
  return cells;
}

export function getSudokuSizeSpec(size: SudokuSize): SudokuSizeSpec {
  return SUDOKU_SIZES.find((s) => s.size === size) ?? SUDOKU_SIZES[1];
}

function shuffleArray<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateSolvedGrid(size: SudokuSize): number[][] {
  const symbolPerm = shuffleArray(Array.from({ length: size }, (_, i) => i));

  if (size === 4) {
    // Valid 4x4 Sudoku base with 2x2 boxes
    const base = [
      [0, 1, 2, 3],
      [2, 3, 0, 1],
      [1, 0, 3, 2],
      [3, 2, 1, 0],
    ];

    // Permute rows within bands and swap bands
    const bandOrder = shuffleArray([0, 1]);
    const rowOrder = bandOrder.flatMap((b) =>
      shuffleArray([0, 1]).map((offset) => b * 2 + offset),
    );

    // Permute cols within stacks and swap stacks
    const stackOrder = shuffleArray([0, 1]);
    const colOrder = stackOrder.flatMap((s) =>
      shuffleArray([0, 1]).map((offset) => s * 2 + offset),
    );

    return rowOrder.map((r) => colOrder.map((c) => symbolPerm[base[r][c]]));
  }

  // For 3x3 and 5x5 (prime sizes), cyclic Latin square + row/col permutations
  const rowOrder = shuffleArray(Array.from({ length: size }, (_, i) => i));
  const colOrder = shuffleArray(Array.from({ length: size }, (_, i) => i));

  return rowOrder.map((r) =>
    colOrder.map((c) => symbolPerm[(r + c) % size]),
  );
}

function isPlacementValid(
  grid: (number | null)[][],
  row: number,
  col: number,
  val: number,
  size: SudokuSize,
): boolean {
  for (let i = 0; i < size; i += 1) {
    if (grid[row][i] === val) return false;
    if (grid[i][col] === val) return false;
  }

  if (size === 4) {
    const boxRowStart = Math.floor(row / 2) * 2;
    const boxColStart = Math.floor(col / 2) * 2;
    for (let r = boxRowStart; r < boxRowStart + 2; r += 1) {
      for (let c = boxColStart; c < boxColStart + 2; c += 1) {
        if (grid[r][c] === val) return false;
      }
    }
  }

  return true;
}

function countSolutions(
  grid: (number | null)[][],
  size: SudokuSize,
  limit = 2,
): number {
  let emptyRow = -1;
  let emptyCol = -1;

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (grid[r][c] === null) {
        emptyRow = r;
        emptyCol = c;
        break;
      }
    }
    if (emptyRow !== -1) break;
  }

  if (emptyRow === -1) {
    return 1;
  }

  let total = 0;
  for (let val = 0; val < size; val += 1) {
    if (isPlacementValid(grid, emptyRow, emptyCol, val, size)) {
      grid[emptyRow][emptyCol] = val;
      total += countSolutions(grid, size, limit);
      grid[emptyRow][emptyCol] = null;
      if (total >= limit) return total;
    }
  }

  return total;
}

export function generateSudokuPuzzle(
  size: SudokuSize,
  themeCharacters: readonly CharacterCardSpec[],
): SudokuPuzzle {
  const symbols = shuffleArray(themeCharacters).slice(0, size);
  const solution = generateSolvedGrid(size);
  const givens: (number | null)[][] = solution.map((row) => [...row]);

  const targetBlanks = getSudokuSizeSpec(size).blanksCount;
  const allCoords = shuffleArray(
    Array.from({ length: size * size }, (_, idx) => ({
      row: Math.floor(idx / size),
      col: idx % size,
    })),
  );

  const removedSymbols: number[] = [];

  for (const { row, col } of allCoords) {
    if (removedSymbols.length >= targetBlanks) break;
    const backup = givens[row][col];
    if (backup === null) continue;

    givens[row][col] = null;
    const testCopy = givens.map((r) => [...r]);
    if (countSolutions(testCopy, size, 2) === 1) {
      removedSymbols.push(backup);
    } else {
      givens[row][col] = backup;
    }
  }

  const initialTray: TrayCard[] = shuffleArray(removedSymbols).map((symbolIndex, idx) => ({
    uid: `tray-${Date.now()}-${idx}-${symbolIndex}`,
    symbolIndex,
  }));

  return {
    size,
    symbols,
    solution,
    givens,
    initialTray,
  };
}

export function findPlacementConflict(
  board: (number | null)[][],
  row: number,
  col: number,
  symbolIndex: number,
  size: SudokuSize,
  symbols: readonly CharacterCardSpec[],
): ConflictInfo | null {
  const label = symbols[symbolIndex]?.label ?? 'This picture';

  const rowConflicts: Array<{ row: number; col: number }> = [];
  for (let c = 0; c < size; c += 1) {
    if (c !== col && board[row][c] === symbolIndex) {
      rowConflicts.push({ row, col: c });
    }
  }
  if (rowConflicts.length > 0) {
    const bandCells = Array.from({ length: size }, (_, c) => ({ row, col: c }));
    return {
      reason: 'row',
      conflictCells: [...rowConflicts, { row, col }],
      bandCells,
      message: `${label} is already in this row!`,
    };
  }

  const colConflicts: Array<{ row: number; col: number }> = [];
  for (let r = 0; r < size; r += 1) {
    if (r !== row && board[r][col] === symbolIndex) {
      colConflicts.push({ row: r, col });
    }
  }
  if (colConflicts.length > 0) {
    const bandCells = Array.from({ length: size }, (_, r) => ({ row: r, col }));
    return {
      reason: 'col',
      conflictCells: [...colConflicts, { row, col }],
      bandCells,
      message: `${label} is already in this column!`,
    };
  }

  if (size === 4) {
    const boxRowStart = Math.floor(row / 2) * 2;
    const boxColStart = Math.floor(col / 2) * 2;
    const boxConflicts: Array<{ row: number; col: number }> = [];
    const bandCells: Array<{ row: number; col: number }> = [];
    for (let r = boxRowStart; r < boxRowStart + 2; r += 1) {
      for (let c = boxColStart; c < boxColStart + 2; c += 1) {
        bandCells.push({ row: r, col: c });
        if ((r !== row || c !== col) && board[r][c] === symbolIndex) {
          boxConflicts.push({ row: r, col: c });
        }
      }
    }
    if (boxConflicts.length > 0) {
      return {
        reason: 'box',
        conflictCells: [...boxConflicts, { row, col }],
        bandCells,
        message: `${label} is already in this 2×2 box!`,
      };
    }
  }

  return null;
}

export function isBoardSolved(
  board: (number | null)[][],
  size: SudokuSize,
): boolean {
  for (let r = 0; r < size; r += 1) {
    const rowSet = new Set<number>();
    const colSet = new Set<number>();
    for (let c = 0; c < size; c += 1) {
      const rVal = board[r][c];
      const cVal = board[c][r];
      if (rVal === null || cVal === null) return false;
      rowSet.add(rVal);
      colSet.add(cVal);
    }
    if (rowSet.size !== size || colSet.size !== size) return false;
  }

  if (size === 4) {
    for (let br = 0; br < 4; br += 2) {
      for (let bc = 0; bc < 4; bc += 2) {
        const boxSet = new Set<number>();
        for (let r = br; r < br + 2; r += 1) {
          for (let c = bc; c < bc + 2; c += 1) {
            const val = board[r][c];
            if (val === null) return false;
            boxSet.add(val);
          }
        }
        if (boxSet.size !== 4) return false;
      }
    }
  }

  return true;
}
