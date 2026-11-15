import { CARD_THEMES, type ThemeId } from '../memory-match/themes';

export type RoadBoardSize = '3x3' | '3x4' | '4x4';
export type RoadRoundSize = '2-roads' | '3-roads' | '5-roads';
export type VehicleId =
  | 'fire-truck'
  | 'police-cruiser'
  | 'ambulance'
  | 'safari-jeep'
  | 'tow-truck'
  | 'school-bus';
export type RoadBiomeId = 'sunny-town' | 'river-bridge' | 'canyon-pass';

export type CardinalDir = 'N' | 'E' | 'S' | 'W';
export type RoadSegmentType = 'NS' | 'EW' | 'NE' | 'NW' | 'SE' | 'SW';

export interface RescueRoadConfig {
  size: RoadBoardSize;
  roundSize: RoadRoundSize;
  vehicleId: VehicleId;
  themeId: ThemeId;
}

export interface RoadSizeSpec {
  id: RoadBoardSize;
  label: string;
  rows: number;
  cols: number;
  description: string;
  isDefault?: boolean;
}

export const ROAD_SIZE_SPECS: readonly RoadSizeSpec[] = [
  {
    id: '3x3',
    label: '3 × 3',
    rows: 3,
    cols: 3,
    description: '9 tiles · Quick paths for ages 3–4',
    isDefault: true,
  },
  {
    id: '3x4',
    label: '3 × 4',
    rows: 4,
    cols: 3,
    description: '12 tiles · Longer winding rescues',
  },
  {
    id: '4x4',
    label: '4 × 4',
    rows: 4,
    cols: 4,
    description: '16 tiles · Big town adventure',
  },
];

export interface RoadBiomeSpec {
  id: RoadBiomeId;
  label: string;
  boardTint: string;
  sceneryBg: string;
  shoulderColor: string;
}

export const ROAD_BIOMES: readonly RoadBiomeSpec[] = [
  {
    id: 'sunny-town',
    label: 'Sunny Town',
    boardTint: '#F2F9F4',
    sceneryBg: '#E3F2EA',
    shoulderColor: '#D5C39D',
  },
  {
    id: 'river-bridge',
    label: 'River Valley',
    boardTint: '#EEF8FA',
    sceneryBg: '#DDF0F5',
    shoulderColor: '#98CDD6',
  },
  {
    id: 'canyon-pass',
    label: 'Honey Canyon',
    boardTint: '#FDF6EC',
    sceneryBg: '#F9EAD4',
    shoulderColor: '#E5B47A',
  },
];

export function getRoadBiomeSpec(biome: RoadBiomeId): RoadBiomeSpec {
  return ROAD_BIOMES.find((b) => b.id === biome) ?? ROAD_BIOMES[0];
}

export const ROAD_ROUND_OPTIONS: readonly {
  id: RoadRoundSize;
  label: string;
  roadsCount: number;
  description: string;
  isDefault?: boolean;
}[] = [
  { id: '2-roads', label: '2 Roads', roadsCount: 2, description: 'Quick break (about 45 sec)' },
  {
    id: '3-roads',
    label: '3 Roads',
    roadsCount: 3,
    description: 'Standard rescue shift',
    isDefault: true,
  },
  { id: '5-roads', label: '5 Roads', roadsCount: 5, description: 'Full rescue adventure' },
];

export interface VehicleSpec {
  id: VehicleId;
  label: string;
  bodyColor: string;
  accentColor: string;
  roofColor: string;
}

export const RESCUE_VEHICLES: readonly VehicleSpec[] = [
  {
    id: 'fire-truck',
    label: 'Fire Engine',
    bodyColor: '#F27A5E',
    accentColor: '#F2B84B',
    roofColor: '#5B5BD6',
  },
  {
    id: 'police-cruiser',
    label: 'Patrol Car',
    bodyColor: '#5B5BD6',
    accentColor: '#3BA99C',
    roofColor: '#F27A5E',
  },
  {
    id: 'ambulance',
    label: 'Rescue Van',
    bodyColor: '#3BA99C',
    accentColor: '#F27A5E',
    roofColor: '#F2B84B',
  },
  {
    id: 'safari-jeep',
    label: 'Safari Jeep',
    bodyColor: '#E59D2C',
    accentColor: '#3BA99C',
    roofColor: '#5B5BD6',
  },
  {
    id: 'tow-truck',
    label: 'Tow Truck',
    bodyColor: '#5B5BD6',
    accentColor: '#F2B84B',
    roofColor: '#F27A5E',
  },
  {
    id: 'school-bus',
    label: 'Sunny Bus',
    bodyColor: '#F2B84B',
    accentColor: '#5B5BD6',
    roofColor: '#FFFFFF',
  },
];

export function getRoadSizeSpec(size: RoadBoardSize): RoadSizeSpec {
  return ROAD_SIZE_SPECS.find((s) => s.id === size) ?? ROAD_SIZE_SPECS[0];
}

export function getVehicleSpec(id: VehicleId): VehicleSpec {
  return RESCUE_VEHICLES.find((v) => v.id === id) ?? RESCUE_VEHICLES[0];
}

export function getRoadsCount(roundSize: RoadRoundSize): number {
  return ROAD_ROUND_OPTIONS.find((r) => r.id === roundSize)?.roadsCount ?? 3;
}

export function getDefaultRescueRoadConfig(): RescueRoadConfig {
  return {
    size: '3x3',
    roundSize: '3-roads',
    vehicleId: 'fire-truck',
    themeId: 'paw-patrol',
  };
}

export function isValidRescueRoadConfig(value: unknown): value is RescueRoadConfig {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<RescueRoadConfig>;
  return (
    (c.size === '3x3' || c.size === '3x4' || c.size === '4x4') &&
    (c.roundSize === '2-roads' || c.roundSize === '3-roads' || c.roundSize === '5-roads') &&
    RESCUE_VEHICLES.some((v) => v.id === c.vehicleId) &&
    typeof c.themeId === 'string' &&
    CARD_THEMES.some((theme) => theme.id === c.themeId)
  );
}

const SEGMENT_PORTS: Record<RoadSegmentType, [CardinalDir, CardinalDir]> = {
  NS: ['N', 'S'],
  EW: ['E', 'W'],
  NE: ['N', 'E'],
  NW: ['N', 'W'],
  SE: ['S', 'E'],
  SW: ['S', 'W'],
};

const ALL_SEGMENTS: readonly RoadSegmentType[] = ['NS', 'EW', 'NE', 'NW', 'SE', 'SW'];

export const SEGMENT_LABELS: Record<RoadSegmentType, string> = {
  NS: 'Up-Down',
  EW: 'Across',
  NE: 'Up-Right',
  NW: 'Up-Left',
  SE: 'Down-Right',
  SW: 'Down-Left',
};

const DIR_LABELS: Record<CardinalDir, string> = {
  N: 'up',
  E: 'right',
  S: 'down',
  W: 'left',
};

export function getSegmentPorts(segment: RoadSegmentType): [CardinalDir, CardinalDir] {
  return SEGMENT_PORTS[segment];
}

export function portsToSegment(a: CardinalDir, b: CardinalDir): RoadSegmentType {
  const pair = new Set<CardinalDir>([a, b]);
  for (const seg of ALL_SEGMENTS) {
    const [p1, p2] = SEGMENT_PORTS[seg];
    if (pair.has(p1) && pair.has(p2)) return seg;
  }
  return 'NS';
}

export interface RoadPathStep {
  row: number;
  col: number;
  segment: RoadSegmentType;
  entryDir: CardinalDir;
  exitDir: CardinalDir;
}

export interface RoadCell {
  row: number;
  col: number;
  kind: 'fixed' | 'slot' | 'scenery';
  segment?: RoadSegmentType;
  sceneryVariant?: 'tree' | 'bush' | 'pebbles' | 'pond';
}

export interface RoadTrayTile {
  uid: string;
  segment: RoadSegmentType;
}

export interface RescueRoadPuzzle {
  id: string;
  rows: number;
  cols: number;
  biome: RoadBiomeId;
  startCol: number;
  finishCol: number;
  bonusCellKey: string | null;
  path: RoadPathStep[];
  cells: RoadCell[][];
  slotTargets: Record<string, RoadSegmentType>;
  initialTray: RoadTrayTile[];
  missingCount: number;
}

export function roadCellKey(row: number, col: number): string {
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

function generateWindingPath(
  rows: number,
  cols: number,
  rng: () => number,
): { startCol: number; finishCol: number; path: RoadPathStep[] } {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const startCol = Math.floor(rng() * cols);
    const steps: RoadPathStep[] = [];
    let currentCol = startCol;

    for (let r = 0; r < rows; r += 1) {
      let targetCol = currentCol;
      if (attempt < 20) {
        const candidates = Array.from({ length: cols }, (_, c) => c);
        // Encourage horizontal variety on rows without always jumping edge-to-edge
        targetCol = candidates[Math.floor(rng() * candidates.length)];
      }
      if (targetCol === currentCol) {
        steps.push({
          row: r,
          col: currentCol,
          segment: 'NS',
          entryDir: 'N',
          exitDir: 'S',
        });
      } else {
        const dir: 1 | -1 = targetCol > currentCol ? 1 : -1;
        const stepOutDir: CardinalDir = dir === 1 ? 'E' : 'W';
        const stepInDir: CardinalDir = dir === 1 ? 'W' : 'E';

        steps.push({
          row: r,
          col: currentCol,
          segment: portsToSegment('N', stepOutDir),
          entryDir: 'N',
          exitDir: stepOutDir,
        });

        for (let c = currentCol + dir; c !== targetCol; c += dir) {
          steps.push({
            row: r,
            col: c,
            segment: 'EW',
            entryDir: stepInDir,
            exitDir: stepOutDir,
          });
        }

        steps.push({
          row: r,
          col: targetCol,
          segment: portsToSegment(stepInDir, 'S'),
          entryDir: stepInDir,
          exitDir: 'S',
        });
        currentCol = targetCol;
      }
    }

    const turnCount = steps.filter((s) => s.segment !== 'NS').length;
    if (turnCount >= 2 || attempt === 23) {
      return { startCol, finishCol: currentCol, path: steps };
    }
  }

  // Deterministic fallback guaranteed valid
  return {
    startCol: 0,
    finishCol: 1,
    path: [
      { row: 0, col: 0, segment: 'NS', entryDir: 'N', exitDir: 'S' },
      { row: 1, col: 0, segment: 'NE', entryDir: 'N', exitDir: 'E' },
      { row: 1, col: 1, segment: 'SW', entryDir: 'W', exitDir: 'S' },
      { row: 2, col: 1, segment: 'NS', entryDir: 'N', exitDir: 'S' },
    ],
  };
}

const SCENERY_VARIANTS: readonly NonNullable<RoadCell['sceneryVariant']>[] = [
  'tree',
  'bush',
  'pebbles',
  'pond',
];

export function generateRescueRoadPuzzle(
  size: RoadBoardSize,
  puzzleIndex: number,
  seed?: number,
): RescueRoadPuzzle {
  const spec = getRoadSizeSpec(size);
  const effectiveSeed =
    seed ?? ((Date.now() ^ ((puzzleIndex + 1) * 0x9e3779b1)) >>> 0);
  const rng = createMulberry32(effectiveSeed);

  const { startCol, finishCol, path } = generateWindingPath(spec.rows, spec.cols, rng);
  const biome = ROAD_BIOMES[puzzleIndex % ROAD_BIOMES.length].id;
  const bonusIdx = path.length >= 3 ? Math.floor(path.length / 2) : -1;
  const bonusCellKey =
    bonusIdx >= 0 ? roadCellKey(path[bonusIdx].row, path[bonusIdx].col) : null;

  const targetMissing =
    size === '3x3'
      ? puzzleIndex === 0
        ? 2
        : Math.min(3, Math.max(2, path.length - 1))
      : size === '4x4'
        ? puzzleIndex === 0
          ? 3
          : Math.min(4, Math.max(3, path.length - 3))
        : puzzleIndex === 0
          ? 2
          : Math.min(4, Math.max(3, path.length - 2));

  // Prefer mixing turns and straights; keep at least 1 anchor fixed cell
  const stepIndices = path.map((_, idx) => idx);
  const pickedIndices = new Set(shuffleWithRng(stepIndices, rng).slice(0, targetMissing));

  const pathByKey = new Map<string, RoadPathStep>();
  const slotTargets: Record<string, RoadSegmentType> = {};
  const neededSegments: RoadSegmentType[] = [];

  path.forEach((step, idx) => {
    const key = roadCellKey(step.row, step.col);
    pathByKey.set(key, step);
    if (pickedIndices.has(idx)) {
      slotTargets[key] = step.segment;
      neededSegments.push(step.segment);
    }
  });

  // Add 1 distractor road tile different from most needed segment so child must inspect shape
  const neededSet = new Set(neededSegments);
  const distinctPool = ALL_SEGMENTS.filter((seg) => !neededSet.has(seg));
  const distractorPool = distinctPool.length > 0 ? distinctPool : ALL_SEGMENTS;
  const distractorSeg = distractorPool[Math.floor(rng() * distractorPool.length)];

  const trayRaw = shuffleWithRng([...neededSegments, distractorSeg], rng).map((segment, i) => ({
    uid: `tile-${puzzleIndex}-${i}-${segment}-${Math.floor(rng() * 10000)}`,
    segment,
  }));

  const cells: RoadCell[][] = [];
  for (let r = 0; r < spec.rows; r += 1) {
    const rowCells: RoadCell[] = [];
    for (let c = 0; c < spec.cols; c += 1) {
      const key = roadCellKey(r, c);
      const step = pathByKey.get(key);
      if (!step) {
        const variantIdx = Math.floor(rng() * SCENERY_VARIANTS.length);
        rowCells.push({
          row: r,
          col: c,
          kind: 'scenery',
          sceneryVariant: SCENERY_VARIANTS[variantIdx],
        });
      } else if (slotTargets[key]) {
        rowCells.push({
          row: r,
          col: c,
          kind: 'slot',
          segment: step.segment,
        });
      } else {
        rowCells.push({
          row: r,
          col: c,
          kind: 'fixed',
          segment: step.segment,
        });
      }
    }
    cells.push(rowCells);
  }

  return {
    id: `road-${effectiveSeed}-${puzzleIndex}`,
    rows: spec.rows,
    cols: spec.cols,
    biome,
    startCol,
    finishCol,
    bonusCellKey,
    path,
    cells,
    slotTargets,
    initialTray: trayRaw,
    missingCount: neededSegments.length,
  };
}

export function buildRoadMismatchLesson(
  placedSegment: RoadSegmentType,
  expectedSegment: RoadSegmentType,
): {
  title: string;
  explanation: string;
  hint: string;
  wrongDirs: CardinalDir[];
  neededDirs: CardinalDir[];
} {
  const placedPorts = new Set(getSegmentPorts(placedSegment));
  const expectedPorts = getSegmentPorts(expectedSegment);
  const expectedSet = new Set(expectedPorts);

  const wrongDirs = [...placedPorts].filter((d) => !expectedSet.has(d));
  const neededDirs = expectedPorts.filter((d) => !placedPorts.has(d));

  const dirText = expectedPorts.map((d) => DIR_LABELS[d]).join(' & ');

  return {
    title: 'Road Goes Off Track!',
    explanation: `Look closely: the ${SEGMENT_LABELS[placedSegment].toLowerCase()} does not join the open road! This spot needs a road connecting ${dirText}.`,
    hint: `Find the tile connecting ${dirText}, and keep the rescue truck rolling!`,
    wrongDirs,
    neededDirs,
  };
}
