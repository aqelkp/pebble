import { lazy, type ReactNode } from 'react';
import type { FamilyProfile } from '../context/FamilyProfilesContext';
import type { JourneyBoardContext } from '../journey/journeyTypes';
import {
  getDefaultGameConfig,
  isValidGameConfig,
  type GameConfigMap,
} from './gameConfigs';
import { VALID_GAME_IDS, type GameId } from './registry';

const MemorySetup = lazy(() =>
  import('./memory-match/MemorySetup').then((m) => ({ default: m.MemorySetup })),
);
const MemoryBoard = lazy(() =>
  import('./memory-match/MemoryBoard').then((m) => ({ default: m.MemoryBoard })),
);

const LetterTrainSetup = lazy(() =>
  import('./letter-train/LetterTrainSetup').then((m) => ({ default: m.LetterTrainSetup })),
);
const LetterTrainBoard = lazy(() =>
  import('./letter-train/LetterTrainBoard').then((m) => ({ default: m.LetterTrainBoard })),
);

const LetterRiverSetup = lazy(() =>
  import('./letter-river/LetterRiverSetup').then((m) => ({ default: m.LetterRiverSetup })),
);
const LetterRiverBoard = lazy(() =>
  import('./letter-river/LetterRiverBoard').then((m) => ({ default: m.LetterRiverBoard })),
);

const PictureSudokuSetup = lazy(() =>
  import('./picture-sudoku/PictureSudokuSetup').then((m) => ({
    default: m.PictureSudokuSetup,
  })),
);
const PictureSudokuBoard = lazy(() =>
  import('./picture-sudoku/PictureSudokuBoard').then((m) => ({
    default: m.PictureSudokuBoard,
  })),
);

const WordFunSetup = lazy(() =>
  import('./word-fun/WordFunSetup').then((m) => ({ default: m.WordFunSetup })),
);
const WordFunBoard = lazy(() =>
  import('./word-fun/WordFunBoard').then((m) => ({ default: m.WordFunBoard })),
);

const SafariSetup = lazy(() =>
  import('./number-safari/SafariSetup').then((m) => ({ default: m.SafariSetup })),
);
const SafariBoard = lazy(() =>
  import('./number-safari/SafariBoard').then((m) => ({ default: m.SafariBoard })),
);

export interface LeaveGameCopy {
  headline: string;
  subtitle: string;
  keepPlayingLabel: string;
}

export interface PluginSetupRenderProps<K extends GameId> {
  profiles: FamilyProfile[];
  initialConfig: GameConfigMap[K] | null;
  onBackToHub: () => void;
  onEditProfiles: () => void;
  onStartGame: (config: GameConfigMap[K]) => void;
}

export interface PluginBoardRenderProps<K extends GameId> {
  gameKey: number;
  config: GameConfigMap[K];
  profiles: FamilyProfile[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onChangeSetup: () => void;
  onBackToHub: () => void;
  onGameActiveChange: (active: boolean) => void;
  journeyContext?: JourneyBoardContext;
}

export interface PluginSetupHostProps {
  profiles: FamilyProfile[];
  initialConfig: unknown;
  onBackToHub: () => void;
  onEditProfiles: () => void;
  onStartGame: (config: GameConfigMap[GameId]) => void;
}

export interface PluginBoardHostProps {
  gameKey: number;
  profiles: FamilyProfile[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onChangeSetup: () => void;
  onBackToHub: () => void;
  onGameActiveChange: (active: boolean) => void;
  journeyContext?: JourneyBoardContext;
}

export interface GamePlugin<K extends GameId> {
  id: K;
  activeSessionStorageKey: string;
  leaveCopy: LeaveGameCopy;
  isValidConfig: (value: unknown) => value is GameConfigMap[K];
  getDefaultConfig: (profiles: readonly FamilyProfile[]) => GameConfigMap[K];
  preloadChunks: () => Promise<unknown>;
  renderSetup: (props: PluginSetupRenderProps<K>) => ReactNode;
  renderBoard: (props: PluginBoardRenderProps<K>) => ReactNode;
}

type GamePluginRegistry = {
  [K in GameId]: GamePlugin<K>;
};

function makeConfigAccessors<K extends GameId>(gameId: K) {
  return {
    isValidConfig: (value: unknown): value is GameConfigMap[K] =>
      isValidGameConfig(gameId, value),
    getDefaultConfig: (profiles: readonly FamilyProfile[]): GameConfigMap[K] =>
      getDefaultGameConfig(gameId, profiles),
  };
}

const GAME_PLUGINS: GamePluginRegistry = {
  'memory-match': {
    id: 'memory-match',
    activeSessionStorageKey: 'pebble.memory.active.v1',
    leaveCopy: {
      headline: 'Leave current game?',
      subtitle: 'Your current match progress and scores will be lost.',
      keepPlayingLabel: 'Keep Playing',
    },
    ...makeConfigAccessors('memory-match'),
    preloadChunks: () =>
      Promise.all([
        import('./memory-match/MemorySetup'),
        import('./memory-match/MemoryBoard'),
      ]),
    renderSetup: ({ profiles, initialConfig, onBackToHub, onEditProfiles, onStartGame }) => (
      <MemorySetup
        profiles={profiles}
        initialConfig={initialConfig}
        onBackToHub={onBackToHub}
        onEditProfiles={onEditProfiles}
        onStartGame={onStartGame}
      />
    ),
    renderBoard: ({
      gameKey,
      config,
      profiles,
      soundEnabled,
      onToggleSound,
      onChangeSetup,
      onBackToHub,
      onGameActiveChange,
      journeyContext,
    }) => (
      <MemoryBoard
        key={gameKey}
        gameKey={gameKey}
        config={config}
        profiles={profiles}
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
        onChangeSetup={onChangeSetup}
        onBackToHub={onBackToHub}
        onGameActiveChange={onGameActiveChange}
        journeyContext={journeyContext}
      />
    ),
  },

  'letter-train': {
    id: 'letter-train',
    activeSessionStorageKey: 'pebble.letter-train.active.v2',
    leaveCopy: {
      headline: 'Leave the Letter Train?',
      subtitle: 'Mastered A–Z badges are saved, but your current trip score will reset.',
      keepPlayingLabel: 'Keep Riding',
    },
    ...makeConfigAccessors('letter-train'),
    preloadChunks: () =>
      Promise.all([
        import('./letter-train/LetterTrainSetup'),
        import('./letter-train/LetterTrainBoard'),
      ]),
    renderSetup: ({ profiles, initialConfig, onBackToHub, onEditProfiles, onStartGame }) => (
      <LetterTrainSetup
        childProfile={profiles[0]}
        initialConfig={initialConfig ?? getDefaultGameConfig('letter-train', profiles)}
        onBackToHub={onBackToHub}
        onEditProfiles={onEditProfiles}
        onStartGame={onStartGame}
      />
    ),
    renderBoard: ({
      gameKey,
      config,
      profiles,
      soundEnabled,
      onToggleSound,
      onChangeSetup,
      onBackToHub,
      onGameActiveChange,
      journeyContext,
    }) => (
      <LetterTrainBoard
        key={gameKey}
        gameKey={gameKey}
        config={config}
        childProfile={profiles[0]}
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
        onChangeSetup={onChangeSetup}
        onBackToHub={onBackToHub}
        onGameActiveChange={onGameActiveChange}
        journeyContext={journeyContext}
      />
    ),
  },

  'letter-river': {
    id: 'letter-river',
    activeSessionStorageKey: 'pebble.letter-river.active.v1',
    leaveCopy: {
      headline: 'Leave Letter River?',
      subtitle: 'Earned A–Z river badges are saved, but your current catch score will reset.',
      keepPlayingLabel: 'Keep Fishing',
    },
    ...makeConfigAccessors('letter-river'),
    preloadChunks: () =>
      Promise.all([
        import('./letter-river/LetterRiverSetup'),
        import('./letter-river/LetterRiverBoard'),
      ]),
    renderSetup: ({ profiles, initialConfig, onBackToHub, onEditProfiles, onStartGame }) => (
      <LetterRiverSetup
        childProfile={profiles[0]}
        initialConfig={initialConfig ?? getDefaultGameConfig('letter-river', profiles)}
        onBackToHub={onBackToHub}
        onEditProfiles={onEditProfiles}
        onStartGame={onStartGame}
      />
    ),
    renderBoard: ({
      gameKey,
      config,
      profiles,
      soundEnabled,
      onToggleSound,
      onChangeSetup,
      onBackToHub,
      onGameActiveChange,
      journeyContext,
    }) => (
      <LetterRiverBoard
        key={gameKey}
        gameKey={gameKey}
        config={config}
        childProfile={profiles[0]}
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
        onChangeSetup={onChangeSetup}
        onBackToHub={onBackToHub}
        onGameActiveChange={onGameActiveChange}
        journeyContext={journeyContext}
      />
    ),
  },

  'picture-sudoku': {
    id: 'picture-sudoku',
    activeSessionStorageKey: 'pebble.sudoku.v1',
    leaveCopy: {
      headline: 'Leave this puzzle?',
      subtitle: 'Your current Picture Sudoku progress will be cleared.',
      keepPlayingLabel: 'Keep Solving',
    },
    ...makeConfigAccessors('picture-sudoku'),
    preloadChunks: () =>
      Promise.all([
        import('./picture-sudoku/PictureSudokuSetup'),
        import('./picture-sudoku/PictureSudokuBoard'),
      ]),
    renderSetup: ({ profiles, initialConfig, onBackToHub, onEditProfiles, onStartGame }) => (
      <PictureSudokuSetup
        childProfile={profiles[0]}
        initialConfig={initialConfig ?? getDefaultGameConfig('picture-sudoku', profiles)}
        onBackToHub={onBackToHub}
        onEditProfiles={onEditProfiles}
        onStartGame={onStartGame}
      />
    ),
    renderBoard: ({
      gameKey,
      config,
      profiles,
      soundEnabled,
      onToggleSound,
      onChangeSetup,
      onBackToHub,
      onGameActiveChange,
      journeyContext,
    }) => (
      <PictureSudokuBoard
        key={gameKey}
        gameKey={gameKey}
        config={config}
        childProfile={profiles[0]}
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
        onChangeSetup={onChangeSetup}
        onBackToHub={onBackToHub}
        onGameActiveChange={onGameActiveChange}
        journeyContext={journeyContext}
      />
    ),
  },

  'word-fun': {
    id: 'word-fun',
    activeSessionStorageKey: 'pebble.wordfun.active.v1',
    leaveCopy: {
      headline: 'Leave Word Fun?',
      subtitle: 'Your current word progress and scores will be lost.',
      keepPlayingLabel: 'Keep Playing',
    },
    ...makeConfigAccessors('word-fun'),
    preloadChunks: () =>
      Promise.all([import('./word-fun/WordFunSetup'), import('./word-fun/WordFunBoard')]),
    renderSetup: ({ profiles, initialConfig, onBackToHub, onEditProfiles, onStartGame }) => (
      <WordFunSetup
        profiles={profiles}
        initialConfig={initialConfig}
        onBackToHub={onBackToHub}
        onEditProfiles={onEditProfiles}
        onStartGame={onStartGame}
      />
    ),
    renderBoard: ({
      gameKey,
      config,
      profiles,
      soundEnabled,
      onToggleSound,
      onChangeSetup,
      onBackToHub,
      onGameActiveChange,
      journeyContext,
    }) => (
      <WordFunBoard
        key={gameKey}
        gameKey={gameKey}
        config={config}
        profiles={profiles}
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
        onChangeSetup={onChangeSetup}
        onBackToHub={onBackToHub}
        onGameActiveChange={onGameActiveChange}
        journeyContext={journeyContext}
      />
    ),
  },

  'number-safari': {
    id: 'number-safari',
    activeSessionStorageKey: 'pebble.safari.active.v1',
    leaveCopy: {
      headline: 'Leave current safari?',
      subtitle: 'Your current safari progress and scores will be lost.',
      keepPlayingLabel: 'Keep Playing',
    },
    ...makeConfigAccessors('number-safari'),
    preloadChunks: () =>
      Promise.all([import('./number-safari/SafariSetup'), import('./number-safari/SafariBoard')]),
    renderSetup: ({ profiles, initialConfig, onBackToHub, onEditProfiles, onStartGame }) => (
      <SafariSetup
        profiles={profiles}
        initialConfig={initialConfig}
        onBackToHub={onBackToHub}
        onEditProfiles={onEditProfiles}
        onStartGame={onStartGame}
      />
    ),
    renderBoard: ({
      gameKey,
      config,
      profiles,
      soundEnabled,
      onToggleSound,
      onChangeSetup,
      onBackToHub,
      onGameActiveChange,
      journeyContext,
    }) => (
      <SafariBoard
        key={gameKey}
        gameKey={gameKey}
        config={config}
        profiles={profiles}
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
        onChangeSetup={onChangeSetup}
        onBackToHub={onBackToHub}
        onGameActiveChange={onGameActiveChange}
        journeyContext={journeyContext}
      />
    ),
  },
};

const preloadedPlugins = new Set<GameId>();

export function getGamePlugin<K extends GameId>(gameId: K): GamePlugin<K> {
  return GAME_PLUGINS[gameId];
}

export function clearSavedGameById(gameId: GameId): void {
  try {
    window.sessionStorage.removeItem(GAME_PLUGINS[gameId].activeSessionStorageKey);
  } catch {
    // Ignore storage errors in restricted environments
  }
}

export function clearAllSavedGames(): void {
  for (const gameId of VALID_GAME_IDS) {
    clearSavedGameById(gameId);
  }
}

export function preloadGamePlugin(gameId: GameId): void {
  if (preloadedPlugins.has(gameId)) return;
  preloadedPlugins.add(gameId);
  void GAME_PLUGINS[gameId].preloadChunks().catch(() => {
    preloadedPlugins.delete(gameId);
  });
}

/**
 * Gently warm all lazy game chunks during browser idle time after initial paint
 * so offline PWA service-worker caching covers every game and taps open instantaneously.
 */
export function scheduleIdleGamePreload(): () => void {
  let cancelled = false;
  let idleHandle: number | null = null;
  let timerHandle: number | null = null;

  const warmNext = (index: number) => {
    if (cancelled || index >= VALID_GAME_IDS.length) return;
    preloadGamePlugin(VALID_GAME_IDS[index]);
    timerHandle = window.setTimeout(() => warmNext(index + 1), 180);
  };

  const startWarmup = () => {
    if (!cancelled) {
      warmNext(0);
    }
  };

  const win = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  if (typeof win.requestIdleCallback === 'function') {
    idleHandle = win.requestIdleCallback(startWarmup, { timeout: 2000 });
  } else {
    timerHandle = window.setTimeout(startWarmup, 1500);
  }

  return () => {
    cancelled = true;
    if (idleHandle !== null && typeof win.cancelIdleCallback === 'function') {
      win.cancelIdleCallback(idleHandle);
    }
    if (timerHandle !== null) {
      window.clearTimeout(timerHandle);
    }
  };
}

export function renderPluginSetup<K extends GameId>(
  gameId: K,
  hostProps: PluginSetupHostProps,
): ReactNode {
  return renderTypedSetup(getGamePlugin(gameId), hostProps);
}

function renderTypedSetup<K extends GameId>(
  plugin: GamePlugin<K>,
  hostProps: PluginSetupHostProps,
): ReactNode {
  const validConfig = plugin.isValidConfig(hostProps.initialConfig)
    ? hostProps.initialConfig
    : null;

  return plugin.renderSetup({
    profiles: hostProps.profiles,
    initialConfig: validConfig,
    onBackToHub: hostProps.onBackToHub,
    onEditProfiles: hostProps.onEditProfiles,
    onStartGame: (config) => hostProps.onStartGame(config),
  });
}

export function renderPluginBoard<K extends GameId>(
  gameId: K,
  rawConfig: unknown,
  hostProps: PluginBoardHostProps,
): ReactNode {
  return renderTypedBoard(getGamePlugin(gameId), rawConfig, hostProps);
}

function renderTypedBoard<K extends GameId>(
  plugin: GamePlugin<K>,
  rawConfig: unknown,
  hostProps: PluginBoardHostProps,
): ReactNode {
  const resolvedConfig = plugin.isValidConfig(rawConfig)
    ? rawConfig
    : plugin.getDefaultConfig(hostProps.profiles);

  return plugin.renderBoard({
    gameKey: hostProps.gameKey,
    config: resolvedConfig,
    profiles: hostProps.profiles,
    soundEnabled: hostProps.soundEnabled,
    onToggleSound: hostProps.onToggleSound,
    onChangeSetup: hostProps.onChangeSetup,
    onBackToHub: hostProps.onBackToHub,
    onGameActiveChange: hostProps.onGameActiveChange,
    journeyContext: hostProps.journeyContext,
  });
}
