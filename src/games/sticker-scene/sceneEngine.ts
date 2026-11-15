import {
  CARD_THEMES,
  DEFAULT_THEME_ID,
  getThemeSpec,
  type CharacterCardSpec,
  type ThemeId,
} from '../memory-match/themes';

export type StickerCountOption = 4 | 5;
export type StickerRoundSize = '2-scenes' | '3-scenes';
export type SceneBackdropId = 'sunny-meadow' | 'playful-park' | 'starry-camp' | 'cozy-harbor';

export interface StickerSceneConfig {
  stickerCount: StickerCountOption;
  roundSize: StickerRoundSize;
  themeId: ThemeId;
}

export interface StickerAnchor {
  xPct: number;
  yPct: number;
  scale: number;
}

export interface SceneBackdropSpec {
  id: SceneBackdropId;
  label: string;
  skyTop: string;
  skyBottom: string;
  groundMain: string;
  groundBack: string;
  anchors: readonly StickerAnchor[];
}

export interface StickerSceneSlot {
  slotUid: string;
  stickerId: string;
  label: string;
  imagePath: string;
  xPct: number;
  yPct: number;
  scale: number;
}

export interface StickerTrayItem {
  uid: string;
  stickerId: string;
  label: string;
  imagePath: string;
}

export interface StickerScenePuzzle {
  id: string;
  backdrop: SceneBackdropSpec;
  slots: StickerSceneSlot[];
  initialTray: StickerTrayItem[];
}

export const STICKER_COUNT_OPTIONS: readonly {
  count: StickerCountOption;
  label: string;
  description: string;
  isDefault?: boolean;
}[] = [
  {
    count: 4,
    label: '4 Stickers',
    description: 'Cozy first scenes · ages 3–4',
    isDefault: true,
  },
  {
    count: 5,
    label: '5 Stickers',
    description: 'More spots to fill · ages 4–7',
  },
];

export const STICKER_ROUND_OPTIONS: readonly {
  id: StickerRoundSize;
  label: string;
  scenesCount: number;
  description: string;
  isDefault?: boolean;
}[] = [
  {
    id: '2-scenes',
    label: '2 Scenes',
    scenesCount: 2,
    description: 'Quick fun break (~45 sec)',
    isDefault: true,
  },
  {
    id: '3-scenes',
    label: '3 Scenes',
    scenesCount: 3,
    description: 'Longer storybook adventure',
  },
];

export const SCENE_BACKDROPS: readonly SceneBackdropSpec[] = [
  {
    id: 'sunny-meadow',
    label: 'Sunny Meadow',
    skyTop: '#E7F5FF',
    skyBottom: '#FFF8E8',
    groundMain: '#B9E3C6',
    groundBack: '#9CD4AE',
    anchors: [
      { xPct: 22, yPct: 30, scale: 0.96 },
      { xPct: 76, yPct: 29, scale: 0.96 },
      { xPct: 49, yPct: 45, scale: 1.0 },
      { xPct: 24, yPct: 74, scale: 1.04 },
      { xPct: 75, yPct: 74, scale: 1.04 },
    ],
  },
  {
    id: 'playful-park',
    label: 'Playful Park',
    skyTop: '#EDE9FE',
    skyBottom: '#FDF4EB',
    groundMain: '#C7E7CC',
    groundBack: '#A7D8B0',
    anchors: [
      { xPct: 23, yPct: 31, scale: 0.96 },
      { xPct: 50, yPct: 26, scale: 0.94 },
      { xPct: 77, yPct: 34, scale: 0.98 },
      { xPct: 32, yPct: 74, scale: 1.05 },
      { xPct: 69, yPct: 74, scale: 1.04 },
    ],
  },
  {
    id: 'starry-camp',
    label: 'Twilight Camp',
    skyTop: '#DFE6FF',
    skyBottom: '#F5EFE9',
    groundMain: '#A6D6C7',
    groundBack: '#8AC2B1',
    anchors: [
      { xPct: 23, yPct: 29, scale: 0.95 },
      { xPct: 75, yPct: 30, scale: 0.96 },
      { xPct: 49, yPct: 56, scale: 1.02 },
      { xPct: 21, yPct: 76, scale: 1.03 },
      { xPct: 77, yPct: 75, scale: 1.03 },
    ],
  },
  {
    id: 'cozy-harbor',
    label: 'River Harbor',
    skyTop: '#E2F6F4',
    skyBottom: '#FAF4E8',
    groundMain: '#AEDFD6',
    groundBack: '#92CECA',
    anchors: [
      { xPct: 23, yPct: 29, scale: 0.96 },
      { xPct: 51, yPct: 32, scale: 0.96 },
      { xPct: 79, yPct: 29, scale: 0.96 },
      { xPct: 33, yPct: 74, scale: 1.04 },
      { xPct: 71, yPct: 74, scale: 1.04 },
    ],
  },
];

export function getScenesCount(roundSize: StickerRoundSize): number {
  return roundSize === '3-scenes' ? 3 : 2;
}

export function getDefaultStickerSceneConfig(): StickerSceneConfig {
  return {
    stickerCount: 4,
    roundSize: '2-scenes',
    themeId: DEFAULT_THEME_ID,
  };
}

export function isValidStickerSceneConfig(value: unknown): value is StickerSceneConfig {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<StickerSceneConfig>;
  return (
    (c.stickerCount === 4 || c.stickerCount === 5) &&
    (c.roundSize === '2-scenes' || c.roundSize === '3-scenes') &&
    typeof c.themeId === 'string' &&
    CARD_THEMES.some((theme) => theme.id === c.themeId)
  );
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

export function buildStickerSceneDeck(
  config: StickerSceneConfig,
  seedBase?: number,
): StickerScenePuzzle[] {
  const scenesCount = getScenesCount(config.roundSize);
  const theme = getThemeSpec(config.themeId);
  const fallbackChars: CharacterCardSpec[] = [];
  for (const ch of theme.characters) {
    fallbackChars.push(ch);
  }
  if (fallbackChars.length < config.stickerCount) {
    for (const extraTheme of CARD_THEMES) {
      if (extraTheme.id === theme.id) continue;
      for (const ch of extraTheme.characters) {
        if (!fallbackChars.some((existing) => existing.pairId === ch.pairId)) {
          fallbackChars.push(ch);
        }
        if (fallbackChars.length >= config.stickerCount * scenesCount) break;
      }
    }
  }

  const baseSeed = seedBase ?? Date.now();
  const baseRng = createMulberry32(baseSeed);
  const backdropOrder = shuffleWithRng(SCENE_BACKDROPS, baseRng);

  const puzzles: StickerScenePuzzle[] = [];
  for (let sceneIdx = 0; sceneIdx < scenesCount; sceneIdx += 1) {
    const sceneRng = createMulberry32((baseSeed ^ ((sceneIdx + 1) * 0x9e3779b1)) >>> 0);
    const backdrop = backdropOrder[sceneIdx % backdropOrder.length];
    const poolShuffled = shuffleWithRng(fallbackChars, sceneRng);
    const chosenChars = poolShuffled.slice(0, config.stickerCount);

    const anchorsToUse =
      config.stickerCount === 4
        ? [backdrop.anchors[0], backdrop.anchors[1], backdrop.anchors[3], backdrop.anchors[4]]
        : [...backdrop.anchors];

    const slots: StickerSceneSlot[] = chosenChars.map((ch, idx) => ({
      slotUid: `slot-${sceneIdx}-${idx}-${ch.pairId}`,
      stickerId: ch.pairId,
      label: ch.label,
      imagePath: ch.imagePath,
      xPct: anchorsToUse[idx].xPct,
      yPct: anchorsToUse[idx].yPct,
      scale: anchorsToUse[idx].scale,
    }));

    const trayItems: StickerTrayItem[] = shuffleWithRng(slots, sceneRng).map((slot, idx) => ({
      uid: `sticker-${sceneIdx}-${idx}-${slot.stickerId}`,
      stickerId: slot.stickerId,
      label: slot.label,
      imagePath: slot.imagePath,
    }));

    puzzles.push({
      id: `scene-${baseSeed}-${sceneIdx}`,
      backdrop,
      slots,
      initialTray: trayItems,
    });
  }

  return puzzles;
}

export function buildStickerSceneMismatchLesson(
  placedLabel: string,
  expectedLabel: string,
): {
  title: string;
  explanation: string;
  hint: string;
} {
  return {
    title: 'Check the Shadow Shape!',
    explanation: `Look closely: that sticker is ${placedLabel}, while this shadow matches ${expectedLabel}. Compare the ears and outline!`,
    hint: `Find the shadow that matches ${placedLabel}'s shape!`,
  };
}
