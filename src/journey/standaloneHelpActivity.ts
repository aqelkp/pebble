import type { FamilyProfile } from '../context/FamilyProfilesContext';
import { getCircleSortPackSpec } from '../games/circle-sort/circleSortData';
import { getThemeLabel } from '../games/dot-to-dot/dotEngine';
import { getDefaultGameConfig, isValidGameConfig, type GameConfigMap } from '../games/gameConfigs';
import { getThemeSpec } from '../games/memory-match/themes';
import { getSafariModeSpec } from '../games/number-safari/safariData';
import type { GameId } from '../games/registry';
import { getVehicleSpec } from '../games/rescue-road/roadEngine';
import { getTwinItemsPerCard } from '../games/spot-the-twin/twinEngine';
import { getWordPackSpec } from '../games/word-fun/wordBank';
import { getPeekabooPackSpec, getPeekabooWorldSpec } from '../games/word-peekaboo/peekabooData';
import { getCompareModeSpec } from '../games/compare-quest/compareData';
import { getWordTracePackSpec } from '../games/word-trace/wordTraceEngine';
import { getQuestPackSpec } from '../curriculum/questEngine/questTypes';
import type { JourneyActivity } from './journeyTypes';

function resolveConfig<K extends GameId>(
  gameId: K,
  rawConfig: unknown,
  profiles: readonly FamilyProfile[],
): GameConfigMap[K] {
  if (isValidGameConfig(gameId, rawConfig)) {
    return rawConfig;
  }
  return getDefaultGameConfig(gameId, profiles);
}

/**
 * Builds an accurate ActivityIntroModal descriptor for standalone Free Play / Parent Test
 * sessions so the in-game Help button speaks and animates the active game's instructions.
 */
export function buildStandaloneHelpActivity(
  gameId: GameId,
  rawConfig: unknown,
  profiles: readonly FamilyProfile[],
): JourneyActivity {
  const base = {
    index: 0,
    activityNumber: 1,
    chapterNumber: 1,
    numberInChapter: 1,
    gameOrdinal: 0,
  };

  switch (gameId) {
    case 'memory-match': {
      const cfg = resolveConfig('memory-match', rawConfig, profiles);
      const theme = getThemeSpec(cfg.themeId);
      return {
        ...base,
        gameId,
        title: 'Memory Match',
        subtitle: theme.title,
        detailLine: 'Flip 2 cards at a time and remember where matching pictures hide!',
        artPath: 'hub/memory-match.png',
        voiceClipId: 'memory-match',
        previewThemeId: cfg.themeId,
        payload: { gameId, config: cfg },
      };
    }

    case 'letter-train': {
      const cfg = resolveConfig('letter-train', rawConfig, profiles);
      return {
        ...base,
        gameId,
        title: 'Letter Train',
        subtitle: 'Beginning Letter Sounds',
        detailLine: 'Tap the pictures that start with the train car letter sound!',
        artPath: 'hub/letter-train.png',
        voiceClipId: 'letter-train',
        lettersCovered: cfg.selectedLetters.slice(0, 5),
        payload: { gameId, config: cfg },
      };
    }

    case 'letter-trace': {
      const cfg = resolveConfig('letter-trace', rawConfig, profiles);
      const traceMode = cfg.traceMode ?? 'letters';
      const voiceClipId =
        traceMode === 'numbers'
          ? 'letter-trace-numbers'
          : traceMode === 'shapes'
            ? 'letter-trace-shapes'
            : 'letter-trace';
      const subtitle =
        traceMode === 'numbers'
          ? `Numbers (${cfg.numberRange ?? '0-50'})`
          : traceMode === 'shapes'
            ? '2D Shape Strokes'
            : 'Capital & Small Stroke Order';
      return {
        ...base,
        gameId,
        title: 'Letter Trace',
        subtitle,
        detailLine: 'Start at Circle 1 and trace each stroke in strict order along the arrows!',
        artPath: 'hub/letter-trace.png',
        voiceClipId,
        lettersCovered: traceMode === 'letters' ? cfg.selectedLetters.slice(0, 5) : undefined,
        payload: { gameId, config: cfg },
      };
    }

    case 'letter-river': {
      const cfg = resolveConfig('letter-river', rawConfig, profiles);
      return {
        ...base,
        gameId,
        title: 'Letter River',
        subtitle: 'Catch Matching Letter Fish',
        detailLine: 'Drag or tap swimming fish into the matching letter bucket!',
        artPath: 'hub/letter-river.png',
        voiceClipId: 'letter-river',
        lettersCovered: cfg.selectedLetters.slice(0, 5),
        payload: { gameId, config: cfg },
      };
    }

    case 'picture-sudoku': {
      const cfg = resolveConfig('picture-sudoku', rawConfig, profiles);
      return {
        ...base,
        gameId,
        title: 'Picture Sudoku',
        subtitle: `${cfg.size} × ${cfg.size} Logic Grid`,
        detailLine: 'Place each picture once in every row and column!',
        artPath: 'hub/picture-sudoku.png',
        voiceClipId: 'picture-sudoku',
        previewThemeId: cfg.themeId,
        payload: { gameId, config: cfg },
      };
    }

    case 'word-fun': {
      const cfg = resolveConfig('word-fun', rawConfig, profiles);
      const pack = getWordPackSpec(cfg.packId);
      return {
        ...base,
        gameId,
        title: 'Word Fun',
        subtitle: pack.title,
        detailLine: 'Listen to the word and tap the 3 letters in order!',
        artPath: 'hub/word-fun.png',
        voiceClipId: 'word-fun',
        payload: { gameId, config: cfg },
      };
    }

    case 'number-safari': {
      const cfg = resolveConfig('number-safari', rawConfig, profiles);
      const mode = getSafariModeSpec(cfg.modeId);
      return {
        ...base,
        gameId,
        title: 'Number Safari',
        subtitle: mode.title,
        detailLine: mode.subtitle,
        artPath: 'hub/number-safari.png',
        voiceClipId: cfg.modeId === 'add-10' ? 'number-safari-add' : 'number-safari-count',
        payload: { gameId, config: cfg },
      };
    }

    case 'rescue-road': {
      const cfg = resolveConfig('rescue-road', rawConfig, profiles);
      const vehicle = getVehicleSpec(cfg.vehicleId);
      return {
        ...base,
        gameId,
        isFunBreak: true,
        title: 'Rescue Road',
        subtitle: vehicle.label,
        detailLine: 'Connect the road tiles from Start to the flag so the vehicle can drive across!',
        artPath: 'hub/rescue-road.png',
        voiceClipId: 'rescue-road',
        payload: { gameId, config: cfg },
      };
    }

    case 'sticker-jigsaw': {
      const cfg = resolveConfig('sticker-jigsaw', rawConfig, profiles);
      const theme = getThemeSpec(cfg.themeId);
      return {
        ...base,
        gameId,
        isFunBreak: true,
        title: 'Sticker Jigsaw',
        subtitle: theme.title,
        detailLine: 'Snap each puzzle piece into its matching spot to build the picture!',
        artPath: 'hub/sticker-jigsaw.png',
        voiceClipId: 'sticker-jigsaw',
        previewThemeId: cfg.themeId,
        payload: { gameId, config: cfg },
      };
    }

    case 'sticker-scene': {
      const cfg = resolveConfig('sticker-scene', rawConfig, profiles);
      const theme = getThemeSpec(cfg.themeId);
      return {
        ...base,
        gameId,
        isFunBreak: true,
        title: 'Sticker Scene',
        subtitle: theme.title,
        detailLine: 'Place each colorful sticker onto its matching shadow in the scene!',
        artPath: 'hub/sticker-scene.png',
        voiceClipId: 'sticker-scene',
        previewThemeId: cfg.themeId,
        payload: { gameId, config: cfg },
      };
    }

    case 'spot-the-twin': {
      const cfg = resolveConfig('spot-the-twin', rawConfig, profiles);
      const count = getTwinItemsPerCard(cfg.difficulty);
      return {
        ...base,
        gameId,
        isFunBreak: true,
        title: 'Spot the Twin',
        subtitle: `${count} Pictures per Card`,
        detailLine: 'Compare both round cards and tap the ONE picture that matches!',
        artPath: 'hub/spot-the-twin.png',
        voiceClipId: 'spot-the-twin',
        payload: { gameId, config: cfg },
      };
    }

    case 'dot-to-dot': {
      const cfg = resolveConfig('dot-to-dot', rawConfig, profiles);
      const seqLabel =
        cfg.sequenceMode === 'numbers'
          ? `1–${cfg.dotCount}`
          : cfg.sequenceMode === 'countdown'
            ? `${cfg.dotCount}→0 Countdown`
            : cfg.sequenceMode === 'letters'
              ? `A–${String.fromCharCode(64 + cfg.dotCount)}`
              : `1–${cfg.dotCount}, ${cfg.dotCount}→0 & Letters`;
      return {
        ...base,
        gameId,
        title: 'Dot-to-Dot',
        subtitle: `${getThemeLabel(cfg.themeId)} • ${seqLabel}`,
        detailLine: 'Connect the dots in order around the shadow to watch full color bloom!',
        artPath: 'hub/dot-to-dot.png',
        voiceClipId: cfg.sequenceMode === 'countdown' ? 'dot-to-dot-countdown' : 'dot-to-dot',
        payload: { gameId, config: cfg },
      };
    }

    case 'word-peekaboo': {
      const cfg = resolveConfig('word-peekaboo', rawConfig, profiles);
      const pack = getPeekabooPackSpec(cfg.packId);
      const world = getPeekabooWorldSpec(cfg.worldId);
      return {
        ...base,
        gameId,
        title: 'Word Peekaboo',
        subtitle: `${pack.title} • ${world.title}`,
        detailLine:
          'Listen closely for the one spoken word, tap it to peel a tile, and uncover the hidden friend!',
        artPath: 'hub/word-peekaboo.png',
        voiceClipId: 'word-peekaboo',
        payload: { gameId, config: cfg },
      };
    }

    case 'compare-quest': {
      const cfg = resolveConfig('compare-quest', rawConfig, profiles);
      const mode = getCompareModeSpec(cfg.modeId);
      return {
        ...base,
        gameId,
        title: 'Compare Quest',
        subtitle: `${mode.title} (${mode.rangeBadge})`,
        detailLine:
          'Compare both sides — tap, drag, or write >, =, or < in the center box (wide side points to bigger)!',
        artPath: 'hub/compare-quest.png',
        voiceClipId: 'compare-quest',
        payload: { gameId, config: cfg },
      };
    }

    case 'word-trace': {
      const cfg = resolveConfig('word-trace', rawConfig, profiles);
      const pack = getWordTracePackSpec(cfg.packId);
      return {
        ...base,
        gameId,
        title: 'Word Trace',
        subtitle: `${pack.title} • 4-Line Notebook`,
        detailLine:
          'Listen to the prompt and trace each stroke from left to right starting at Circle 1!',
        artPath: 'hub/word-trace.png',
        voiceClipId: cfg.packId === 'numbers' ? 'word-trace-numbers' : 'word-trace',
        payload: { gameId, config: cfg },
      };
    }

    case 'mystery-express':
    case 'pebble-creek':
    case 'cloud-balloon':
    case 'treasure-keys': {
      const cfg = resolveConfig(gameId, rawConfig, profiles);
      const pack = getQuestPackSpec(cfg.packId);
      const skinTitles = {
        'mystery-express': 'Mystery Express',
        'pebble-creek': 'Pebble Creek Bridge',
        'cloud-balloon': 'Cloud Balloon Quest',
        'treasure-keys': '5-Key Treasure Chest',
      } as const;
      return {
        ...base,
        gameId,
        title: skinTitles[gameId],
        subtitle: `${pack.title} • ${cfg.roundLength} stops`,
        detailLine: pack.subtitle,
        artPath: `hub/${gameId}.png`,
        voiceClipId: gameId,
        payload: { gameId, config: cfg },
      };
    }

    case 'circle-sort': {
      const cfg = resolveConfig('circle-sort', rawConfig, profiles);
      const pack = getCircleSortPackSpec(cfg.packId);
      return {
        ...base,
        gameId,
        title: 'Circle & Sort',
        subtitle: `${pack.title} • ${cfg.gridMode === '2x3' ? '2×3' : '3×3'}`,
        detailLine:
          'Listen to the group clue, then tap or draw a circle around every picture that belongs!',
        artPath: 'hub/circle-sort.png',
        voiceClipId: 'circle-sort',
        payload: { gameId, config: cfg },
      };
    }
  }
}
