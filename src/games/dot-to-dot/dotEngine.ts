import { CANONICAL_WORDS } from '../../data/wordBank';
import { assetUrl } from '../../utils/assets';
import { ALL_LETTERS } from '../letter-train/letterData';
import { CARD_THEMES, type ThemeId } from '../memory-match/themes';

export type DotSequenceMode = 'numbers' | 'countdown' | 'letters' | 'mix';
export type DotCountId = 6 | 8 | 10 | 15 | 20;
export type DotRoundLengthId = 3 | 5;

export interface DotToDotConfig {
  themeId: ThemeId | 'all';
  sequenceMode: DotSequenceMode;
  dotCount: DotCountId;
  roundLength: DotRoundLengthId;
}

export interface DotPoint {
  index: number;
  label: string;
  x: number;
  y: number;
  isLetter: boolean;
}

export type ResolvedDotKind = 'numbers' | 'countdown' | 'letters';

export interface DotPuzzleItem {
  id: string;
  pairId: string;
  word: string;
  imagePath: string;
  themeId: ThemeId;
  themeTitle: string;
  canonicalWordId: string | null;
  sequenceKind: ResolvedDotKind;
  dots: DotPoint[];
}

export const LOGICAL_CANVAS_SIZE = 520;
// Silhouette box inset & size inside the 520x520 artboard (16.15%..83.85%)
export const ART_BOX_INSET = 84;
export const ART_BOX_SIZE = LOGICAL_CANVAS_SIZE - ART_BOX_INSET * 2; // 352

const VALID_THEME_IDS = new Set<string>(['all', ...CARD_THEMES.map((t) => t.id)]);
const VALID_MODES = new Set<DotSequenceMode>(['numbers', 'countdown', 'letters', 'mix']);
const VALID_DOT_COUNTS = new Set<DotCountId>([6, 8, 10, 15, 20]);
const VALID_ROUND_LENGTHS = new Set<DotRoundLengthId>([3, 5]);

const WORD_ID_SET = new Set<string>(CANONICAL_WORDS.map((w) => w.id));
const WORD_LABEL_MAP = new Map<string, string>(
  CANONICAL_WORDS.map((w) => [w.word.toLowerCase(), w.id]),
);

export function getDefaultDotToDotConfig(): DotToDotConfig {
  return {
    themeId: 'all',
    sequenceMode: 'numbers',
    dotCount: 8,
    roundLength: 5,
  };
}

export function isValidDotToDotConfig(value: unknown): value is DotToDotConfig {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.themeId === 'string' &&
    VALID_THEME_IDS.has(v.themeId) &&
    typeof v.sequenceMode === 'string' &&
    VALID_MODES.has(v.sequenceMode as DotSequenceMode) &&
    typeof v.dotCount === 'number' &&
    VALID_DOT_COUNTS.has(v.dotCount as DotCountId) &&
    typeof v.roundLength === 'number' &&
    VALID_ROUND_LENGTHS.has(v.roundLength as DotRoundLengthId)
  );
}

export function resolveCanonicalWordId(rawId: string, label: string): string | null {
  const cleanRaw = rawId.trim().toLowerCase();
  if (WORD_ID_SET.has(cleanRaw)) return cleanRaw;

  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  if (WORD_ID_SET.has(slug)) return slug;

  const byWord = WORD_LABEL_MAP.get(label.trim().toLowerCase());
  return byWord ?? null;
}

function shuffleArray<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

export function makeDotLabels(dotCount: number, kind: ResolvedDotKind | boolean): string[] {
  const resolvedKind: ResolvedDotKind =
    typeof kind === 'boolean' ? (kind ? 'letters' : 'numbers') : kind;
  if (resolvedKind === 'countdown') {
    const startVal = Math.min(20, Math.max(5, Math.round(dotCount)));
    // e.g. 10 -> 0 (11 pebbles ending on Zero!)
    return Array.from({ length: startVal + 1 }, (_, idx) => String(startVal - idx));
  }
  const safeCount = Math.min(20, Math.max(4, Math.round(dotCount)));
  if (resolvedKind === 'letters') {
    return ALL_LETTERS.slice(0, safeCount);
  }
  return Array.from({ length: safeCount }, (_, idx) => String(idx + 1));
}

export function createFallbackDots(
  dotCount: number,
  kind: ResolvedDotKind | boolean,
  seedIndex = 0,
): DotPoint[] {
  const resolvedKind: ResolvedDotKind =
    typeof kind === 'boolean' ? (kind ? 'letters' : 'numbers') : kind;
  const isLetter = resolvedKind === 'letters';
  const labels = makeDotLabels(dotCount, resolvedKind);
  const cx = LOGICAL_CANVAS_SIZE / 2;
  const cy = LOGICAL_CANVAS_SIZE / 2;
  const baseRadius = 192;
  const startAngle = (-125 * Math.PI) / 180;
  const phase = (seedIndex % 5) * 0.45;

  return labels.map((label, idx) => {
    const t = idx / labels.length;
    const angle = startAngle + t * Math.PI * 2;
    const wobble = 1 + 0.08 * Math.cos(3 * angle + phase);
    const rx = baseRadius * wobble;
    const ry = baseRadius * (1 + 0.06 * Math.sin(2 * angle + phase));
    return {
      index: idx,
      label,
      x: Math.round(Math.min(476, Math.max(44, cx + Math.cos(angle) * rx))),
      y: Math.round(Math.min(476, Math.max(44, cy + Math.sin(angle) * ry))),
      isLetter,
    };
  });
}

function relaxDotSpacing(
  pts: Array<{ x: number; y: number }>,
  minDist: number,
  minBound = 42,
  maxBound = LOGICAL_CANVAS_SIZE - 42,
): void {
  const n = pts.length;
  for (let pass = 0; pass < 5; pass += 1) {
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const dx = pts[j].x - pts[i].x;
        const dy = pts[j].y - pts[i].y;
        const dist = Math.hypot(dx, dy);
        if (dist < minDist) {
          const push = (minDist - dist) * 0.52;
          const angle = dist > 0.001 ? Math.atan2(dy, dx) : (i * 0.7);
          const ox = Math.cos(angle) * push;
          const oy = Math.sin(angle) * push;
          pts[i].x -= ox;
          pts[i].y -= oy;
          pts[j].x += ox;
          pts[j].y += oy;
        }
      }
    }
    for (let i = 0; i < n; i += 1) {
      pts[i].x = Math.min(maxBound, Math.max(minBound, pts[i].x));
      pts[i].y = Math.min(maxBound, Math.max(minBound, pts[i].y));
    }
  }
}

/**
 * Flood-fills exterior white/transparent background from canvas borders, finds the
 * outer radial silhouette envelope, smooths it, and samples evenly spaced points
 * around the perimeter in clockwise order starting near upper-left.
 */
export function computeContourDotsFromImageData(
  imageData: ImageData,
  dotCount: number,
  kind: ResolvedDotKind | boolean,
): DotPoint[] {
  const resolvedKind: ResolvedDotKind =
    typeof kind === 'boolean' ? (kind ? 'letters' : 'numbers') : kind;
  const isLetter = resolvedKind === 'letters';
  const { width, height, data } = imageData;
  const total = width * height;
  if (total === 0) return createFallbackDots(dotCount, resolvedKind);

  const visited = new Uint8Array(total);
  const bg = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const isBgPixel = (idx: number): boolean => {
    const p = idx * 4;
    const a = data[p + 3];
    if (a < 28) return true;
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const maxC = r > g ? (r > b ? r : b) : g > b ? g : b;
    const minC = r < g ? (r < b ? r : b) : g < b ? g : b;
    return r >= 234 && g >= 234 && b >= 234 && maxC - minC <= 22;
  };

  const enqueue = (idx: number) => {
    if (visited[idx] || !isBgPixel(idx)) return;
    visited[idx] = 1;
    bg[idx] = 1;
    queue[tail++] = idx;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(y * width);
    enqueue(y * width + (width - 1));
  }

  while (head < tail) {
    const cur = queue[head++];
    const x = cur % width;
    const y = (cur - x) / width;
    if (x > 0) enqueue(cur - 1);
    if (x < width - 1) enqueue(cur + 1);
    if (y > 0) enqueue(cur - width);
    if (y < height - 1) enqueue(cur + width);
  }

  let fgCount = 0;
  let sumX = 0;
  let sumY = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      if (bg[idx]) continue;
      fgCount += 1;
      sumX += x;
      sumY += y;
    }
  }

  if (fgCount < 25) {
    return createFallbackDots(dotCount, resolvedKind);
  }

  const cxNorm = sumX / fgCount / width;
  const cyNorm = sumY / fgCount / height;
  const cxLogical = ART_BOX_INSET + cxNorm * ART_BOX_SIZE;
  const cyLogical = ART_BOX_INSET + cyNorm * ART_BOX_SIZE;

  // Sweep 120 rays around centroid to record outermost foreground pixel per angle
  const RAYS = 120;
  const radii = new Float64Array(RAYS);
  radii.fill(90);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      if (bg[idx]) continue;
      const lx = ART_BOX_INSET + (x / width) * ART_BOX_SIZE;
      const ly = ART_BOX_INSET + (y / height) * ART_BOX_SIZE;
      const dx = lx - cxLogical;
      const dy = ly - cyLogical;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) continue;
      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += Math.PI * 2;
      const bin = Math.min(RAYS - 1, Math.floor((angle / (Math.PI * 2)) * RAYS));
      if (dist > radii[bin]) {
        radii[bin] = dist;
      }
    }
  }

  // Push outward comfortably beyond foreground edge so dots hug the contour cleanly
  const marginPx = 34;
  for (let i = 0; i < RAYS; i += 1) {
    radii[i] = Math.min(228, Math.max(108, radii[i] + marginPx));
  }

  // Smooth radii circularly twice to remove sharp narrow spikes
  let smoothed = Array.from(radii);
  for (let pass = 0; pass < 3; pass += 1) {
    const next = new Array<number>(RAYS);
    for (let i = 0; i < RAYS; i += 1) {
      const m2 = smoothed[(i - 2 + RAYS) % RAYS];
      const m1 = smoothed[(i - 1 + RAYS) % RAYS];
      const c0 = smoothed[i];
      const p1 = smoothed[(i + 1) % RAYS];
      const p2 = smoothed[(i + 2) % RAYS];
      next[i] = (m2 + 2 * m1 + 3 * c0 + 2 * p1 + p2) / 9;
    }
    smoothed = next;
  }

  // Rotate starting bin to ~ -125deg (upper-left clockwise)
  const startBin = Math.floor((((235 / 360) * RAYS) % RAYS + RAYS) % RAYS);
  const loopPts: Array<{ x: number; y: number }> = [];
  for (let k = 0; k < RAYS; k += 1) {
    const bin = (startBin + k) % RAYS;
    const angle = (bin / RAYS) * Math.PI * 2;
    const x = Math.min(476, Math.max(44, cxLogical + Math.cos(angle) * smoothed[bin]));
    const y = Math.min(476, Math.max(44, cyLogical + Math.sin(angle) * smoothed[bin]));
    loopPts.push({ x, y });
  }

  // Sample equally along perimeter arc length
  const cumLen = new Float64Array(RAYS + 1);
  for (let k = 0; k < RAYS; k += 1) {
    const a = loopPts[k];
    const b = loopPts[(k + 1) % RAYS];
    cumLen[k + 1] = cumLen[k] + Math.hypot(b.x - a.x, b.y - a.y);
  }
  const totalPerimeter = cumLen[RAYS] || 1;

  const labels = makeDotLabels(dotCount, resolvedKind);
  const sampleCount = labels.length;
  const sampled: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < sampleCount; i += 1) {
    const targetLen = (i / sampleCount) * totalPerimeter;
    let segIdx = 0;
    while (segIdx < RAYS - 1 && cumLen[segIdx + 1] < targetLen) {
      segIdx += 1;
    }
    const segStart = cumLen[segIdx];
    const segEnd = cumLen[segIdx + 1];
    const frac = segEnd > segStart ? (targetLen - segStart) / (segEnd - segStart) : 0;
    const a = loopPts[segIdx];
    const b = loopPts[(segIdx + 1) % RAYS];
    sampled.push({
      x: a.x + (b.x - a.x) * frac,
      y: a.y + (b.y - a.y) * frac,
    });
  }

  const minDist =
    sampleCount >= 18 ? 38 : sampleCount >= 14 ? 46 : sampleCount >= 10 ? 60 : sampleCount >= 8 ? 72 : 84;
  relaxDotSpacing(sampled, minDist);

  return labels.map((label, index) => ({
    index,
    label,
    x: Math.round(sampled[index].x),
    y: Math.round(sampled[index].y),
    isLetter,
  }));
}

const contourCache = new Map<string, DotPoint[]>();
const CONTOUR_SAMPLE_RES = 128;

export async function extractContourDotsForImage(
  imagePath: string,
  dotCount: DotCountId,
  kind: ResolvedDotKind | boolean,
  seedIndex = 0,
): Promise<DotPoint[]> {
  const resolvedKind: ResolvedDotKind =
    typeof kind === 'boolean' ? (kind ? 'letters' : 'numbers') : kind;
  const cacheKey = `${imagePath}:${dotCount}:${resolvedKind}`;
  const cached = contourCache.get(cacheKey);
  if (cached) {
    return cached.map((pt) => ({ ...pt }));
  }

  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return createFallbackDots(dotCount, resolvedKind, seedIndex);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = CONTOUR_SAMPLE_RES;
        canvas.height = CONTOUR_SAMPLE_RES;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(createFallbackDots(dotCount, resolvedKind, seedIndex));
          return;
        }
        ctx.drawImage(img, 0, 0, CONTOUR_SAMPLE_RES, CONTOUR_SAMPLE_RES);
        const imageData = ctx.getImageData(0, 0, CONTOUR_SAMPLE_RES, CONTOUR_SAMPLE_RES);
        const computed = computeContourDotsFromImageData(imageData, dotCount, resolvedKind);
        contourCache.set(cacheKey, computed);
        resolve(computed.map((pt) => ({ ...pt })));
      } catch {
        resolve(createFallbackDots(dotCount, resolvedKind, seedIndex));
      }
    };

    img.onerror = () => {
      resolve(createFallbackDots(dotCount, resolvedKind, seedIndex));
    };

    img.src = assetUrl(imagePath);
  });
}

export function buildDotPuzzleDeck(config: DotToDotConfig): DotPuzzleItem[] {
  const pool: Array<{
    id: string;
    rawPairId: string;
    word: string;
    imagePath: string;
    themeId: ThemeId;
    themeTitle: string;
  }> = [];

  if (config.themeId === 'all') {
    for (const theme of CARD_THEMES) {
      for (const card of theme.characters) {
        pool.push({
          id: `${theme.id}:${card.pairId}`,
          rawPairId: card.pairId,
          word: card.label,
          imagePath: card.imagePath,
          themeId: theme.id,
          themeTitle: theme.title,
        });
      }
    }
  } else {
    const found = CARD_THEMES.find((t) => t.id === config.themeId) ?? CARD_THEMES[0];
    for (const card of found.characters) {
      pool.push({
        id: `${found.id}:${card.pairId}`,
        rawPairId: card.pairId,
        word: card.label,
        imagePath: card.imagePath,
        themeId: found.id,
        themeTitle: found.title,
      });
    }
  }

  const chosen = shuffleArray(pool).slice(0, config.roundLength);
  return chosen.map((entry, idx) => {
    const sequenceKind: ResolvedDotKind =
      config.sequenceMode === 'letters'
        ? 'letters'
        : config.sequenceMode === 'countdown'
          ? 'countdown'
          : config.sequenceMode === 'numbers'
            ? 'numbers'
            : idx % 3 === 1
              ? 'letters'
              : idx % 3 === 2
                ? 'countdown'
                : 'numbers';

    return {
      id: entry.id,
      pairId: entry.rawPairId,
      word: entry.word,
      imagePath: entry.imagePath,
      themeId: entry.themeId,
      themeTitle: entry.themeTitle,
      canonicalWordId: resolveCanonicalWordId(entry.rawPairId, entry.word),
      sequenceKind,
      dots: createFallbackDots(config.dotCount, sequenceKind, idx),
    };
  });
}

export function buildSmoothPathFromDots(dots: readonly DotPoint[], closed = false): string {
  if (dots.length === 0) return '';
  if (dots.length === 1) return `M ${dots[0].x} ${dots[0].y}`;
  let d = `M ${dots[0].x} ${dots[0].y}`;
  for (let i = 1; i < dots.length; i += 1) {
    d += ` L ${dots[i].x} ${dots[i].y}`;
  }
  if (closed && dots.length > 2) {
    d += ` L ${dots[0].x} ${dots[0].y}`;
  }
  return d;
}

export function getThemeLabel(themeId: ThemeId | 'all'): string {
  if (themeId === 'all') return 'All Worlds';
  return CARD_THEMES.find((t) => t.id === themeId)?.title ?? 'All Worlds';
}
