import { useCallback, useEffect, useRef, useState } from 'react';
import { FamilyProfilesProvider, useFamilyProfiles } from './context/FamilyProfilesContext';
import {
  clearSavedLetterRiverGame,
  LetterRiverBoard,
} from './games/letter-river/LetterRiverBoard';
import {
  getDefaultLetterRiverConfig,
  isValidLetterRiverConfig,
  LetterRiverSetup,
  type LetterRiverConfig,
} from './games/letter-river/LetterRiverSetup';
import {
  clearSavedLetterTrainGame,
  LetterTrainBoard,
} from './games/letter-train/LetterTrainBoard';
import {
  getDefaultLetterTrainConfig,
  isValidLetterTrainConfig,
  LetterTrainSetup,
  type LetterTrainConfig,
} from './games/letter-train/LetterTrainSetup';
import { clearSavedMemoryGame, MemoryBoard } from './games/memory-match/MemoryBoard';
import { MemorySetup, type MemoryGameConfig } from './games/memory-match/MemorySetup';
import { clearSavedSafariGame, SafariBoard } from './games/number-safari/SafariBoard';
import {
  isValidSafariLengthId,
  isValidSafariModeId,
} from './games/number-safari/safariData';
import { SafariSetup, type SafariGameConfig } from './games/number-safari/SafariSetup';
import {
  clearSavedSudokuGame,
  PictureSudokuBoard,
} from './games/picture-sudoku/PictureSudokuBoard';
import {
  getDefaultPictureSudokuConfig,
  isValidPictureSudokuConfig,
  PictureSudokuSetup,
  type PictureSudokuConfig,
} from './games/picture-sudoku/PictureSudokuSetup';
import type { GameRegistryEntry } from './games/registry';
import { clearSavedWordGame, WordFunBoard } from './games/word-fun/WordFunBoard';
import {
  isValidWordGameConfig,
  WordFunSetup,
  type WordGameConfig,
} from './games/word-fun/WordFunSetup';
import { FamilyProfilesPage } from './pages/FamilyProfilesPage';
import { GameHubPage } from './pages/GameHubPage';
import { ParentInsightsPage } from './pages/ParentInsightsPage';

type Screen =
  | { view: 'hub' }
  | { view: 'parent-insights' }
  | {
      view: 'profiles';
      returnTo:
        | 'hub'
        | 'memory-setup'
        | 'letter-train-setup'
        | 'letter-river-setup'
        | 'safari-setup'
        | 'word-setup'
        | 'sudoku-setup';
    }
  | { view: 'memory-setup' }
  | { view: 'memory-play'; gameKey: number }
  | { view: 'letter-train-setup' }
  | { view: 'letter-train-play'; gameKey: number }
  | { view: 'letter-river-setup' }
  | { view: 'letter-river-play'; gameKey: number }
  | { view: 'safari-setup' }
  | { view: 'safari-play'; gameKey: number }
  | { view: 'word-setup' }
  | { view: 'word-play'; gameKey: number }
  | { view: 'sudoku-setup' }
  | { view: 'sudoku-play'; gameKey: number };

const NAV_STORAGE_KEY = 'pebble.nav.v1';

interface SavedNavState {
  screen: Screen;
  lastMemoryConfig: MemoryGameConfig | null;
  lastLetterTrainConfig: LetterTrainConfig | null;
  lastLetterRiverConfig: LetterRiverConfig | null;
  lastSafariConfig: SafariGameConfig | null;
  lastWordConfig: WordGameConfig | null;
  lastSudokuConfig: PictureSudokuConfig | null;
}

function isPlayScreen(screen: Screen): boolean {
  return (
    screen.view === 'memory-play' ||
    screen.view === 'letter-train-play' ||
    screen.view === 'letter-river-play' ||
    screen.view === 'safari-play' ||
    screen.view === 'word-play' ||
    screen.view === 'sudoku-play'
  );
}

function isValidScreen(value: unknown): value is Screen {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Screen> & { returnTo?: unknown; gameKey?: unknown };
  if (
    candidate.view === 'hub' ||
    candidate.view === 'parent-insights' ||
    candidate.view === 'memory-setup' ||
    candidate.view === 'letter-train-setup' ||
    candidate.view === 'letter-river-setup' ||
    candidate.view === 'safari-setup' ||
    candidate.view === 'word-setup' ||
    candidate.view === 'sudoku-setup'
  ) {
    return true;
  }
  if (
    candidate.view === 'profiles' &&
    (candidate.returnTo === 'hub' ||
      candidate.returnTo === 'memory-setup' ||
      candidate.returnTo === 'letter-train-setup' ||
      candidate.returnTo === 'letter-river-setup' ||
      candidate.returnTo === 'safari-setup' ||
      candidate.returnTo === 'word-setup' ||
      candidate.returnTo === 'sudoku-setup')
  ) {
    return true;
  }
  if (
    (candidate.view === 'memory-play' ||
      candidate.view === 'letter-train-play' ||
      candidate.view === 'letter-river-play' ||
      candidate.view === 'safari-play' ||
      candidate.view === 'word-play' ||
      candidate.view === 'sudoku-play') &&
    typeof candidate.gameKey === 'number'
  ) {
    return true;
  }
  return false;
}

function isValidMemoryConfig(value: unknown): value is MemoryGameConfig {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<MemoryGameConfig>;
  return (
    typeof c.themeId === 'string' &&
    typeof c.boardSizeId === 'string' &&
    Array.isArray(c.playerIds) &&
    c.playerIds.every((id) => typeof id === 'string')
  );
}

function isValidSafariConfig(value: unknown): value is SafariGameConfig {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<SafariGameConfig>;
  return (
    isValidSafariModeId(c.modeId) &&
    isValidSafariLengthId(c.lengthId) &&
    Array.isArray(c.playerIds) &&
    c.playerIds.length <= 6 &&
    c.playerIds.every((id) => typeof id === 'string')
  );
}

function loadSavedNavState(): SavedNavState {
  const emptyState: SavedNavState = {
    screen: { view: 'hub' },
    lastMemoryConfig: null,
    lastLetterTrainConfig: null,
    lastLetterRiverConfig: null,
    lastSafariConfig: null,
    lastWordConfig: null,
    lastSudokuConfig: null,
  };
  try {
    const raw = window.sessionStorage.getItem(NAV_STORAGE_KEY);
    if (!raw) {
      return emptyState;
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return emptyState;
    }
    const candidate = parsed as {
      screen?: unknown;
      lastMemoryConfig?: unknown;
      lastLetterTrainConfig?: unknown;
      lastLetterRiverConfig?: unknown;
      lastSafariConfig?: unknown;
      lastWordConfig?: unknown;
      lastSudokuConfig?: unknown;
    };
    const lastMemoryConfig = isValidMemoryConfig(candidate.lastMemoryConfig)
      ? candidate.lastMemoryConfig
      : null;
    const lastLetterTrainConfig = isValidLetterTrainConfig(candidate.lastLetterTrainConfig)
      ? candidate.lastLetterTrainConfig
      : null;
    const lastLetterRiverConfig = isValidLetterRiverConfig(candidate.lastLetterRiverConfig)
      ? candidate.lastLetterRiverConfig
      : null;
    const lastSafariConfig = isValidSafariConfig(candidate.lastSafariConfig)
      ? candidate.lastSafariConfig
      : null;
    const lastWordConfig = isValidWordGameConfig(candidate.lastWordConfig)
      ? candidate.lastWordConfig
      : null;
    const lastSudokuConfig = isValidPictureSudokuConfig(candidate.lastSudokuConfig)
      ? candidate.lastSudokuConfig
      : null;
    let screen: Screen = isValidScreen(candidate.screen) ? candidate.screen : { view: 'hub' };
    if (screen.view === 'memory-play' && !lastMemoryConfig) {
      screen = { view: 'hub' };
    }
    if (screen.view === 'letter-train-play' && !lastLetterTrainConfig) {
      screen = { view: 'hub' };
    }
    if (screen.view === 'letter-river-play' && !lastLetterRiverConfig) {
      screen = { view: 'hub' };
    }
    if (screen.view === 'safari-play' && !lastSafariConfig) {
      screen = { view: 'hub' };
    }
    if (screen.view === 'word-play' && !lastWordConfig) {
      screen = { view: 'hub' };
    }
    if (screen.view === 'sudoku-play' && !lastSudokuConfig) {
      screen = { view: 'hub' };
    }
    return {
      screen,
      lastMemoryConfig,
      lastLetterTrainConfig,
      lastLetterRiverConfig,
      lastSafariConfig,
      lastWordConfig,
      lastSudokuConfig,
    };
  } catch {
    return emptyState;
  }
}

function PebbleRouter() {
  const { profiles, soundEnabled, toggleSound, updateProfile } = useFamilyProfiles();
  const [initialNav] = useState<SavedNavState>(() => loadSavedNavState());
  const [screen, setScreen] = useState<Screen>(initialNav.screen);
  const [lastMemoryConfig, setLastMemoryConfig] = useState<MemoryGameConfig | null>(
    initialNav.lastMemoryConfig,
  );
  const [lastLetterTrainConfig, setLastLetterTrainConfig] = useState<LetterTrainConfig | null>(
    initialNav.lastLetterTrainConfig,
  );
  const [lastLetterRiverConfig, setLastLetterRiverConfig] = useState<LetterRiverConfig | null>(
    initialNav.lastLetterRiverConfig,
  );
  const [lastSafariConfig, setLastSafariConfig] = useState<SafariGameConfig | null>(
    initialNav.lastSafariConfig,
  );
  const [lastWordConfig, setLastWordConfig] = useState<WordGameConfig | null>(
    initialNav.lastWordConfig,
  );
  const [lastSudokuConfig, setLastSudokuConfig] = useState<PictureSudokuConfig | null>(
    initialNav.lastSudokuConfig,
  );
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const screenRef = useRef<Screen>(screen);
  screenRef.current = screen;
  const isGameActiveRef = useRef(false);
  const historyDepthRef = useRef(0);
  const bypassGuardRef = useRef(false);

  // Persist current screen & config in sessionStorage so PWA reloads restore mid-session state
  useEffect(() => {
    try {
      const payload: SavedNavState = {
        screen,
        lastMemoryConfig,
        lastLetterTrainConfig,
        lastLetterRiverConfig,
        lastSafariConfig,
        lastWordConfig,
        lastSudokuConfig,
      };
      window.sessionStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [
    lastLetterRiverConfig,
    lastLetterTrainConfig,
    lastMemoryConfig,
    lastSafariConfig,
    lastSudokuConfig,
    lastWordConfig,
    screen,
  ]);

  // Sync in-app navigation with browser history so Android Back navigates within Pebble
  // instead of exiting the installed PWA, and guards active games from accidental exits.
  useEffect(() => {
    if (!isValidScreen(window.history.state?.pebbleScreen)) {
      window.history.replaceState({ pebbleScreen: screenRef.current }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      historyDepthRef.current = Math.max(0, historyDepthRef.current - 1);

      if (
        isPlayScreen(screenRef.current) &&
        isGameActiveRef.current &&
        !bypassGuardRef.current
      ) {
        historyDepthRef.current += 1;
        window.history.pushState({ pebbleScreen: screenRef.current }, '');
        setShowLeaveConfirm(true);
        return;
      }

      bypassGuardRef.current = false;
      setShowLeaveConfirm(false);

      const stateObj = event.state as { pebbleScreen?: unknown } | null;
      const targetScreen = isValidScreen(stateObj?.pebbleScreen)
        ? stateObj.pebbleScreen
        : { view: 'hub' as const };

      if (screenRef.current.view === 'memory-play' && targetScreen.view !== 'memory-play') {
        clearSavedMemoryGame();
        isGameActiveRef.current = false;
      }
      if (
        screenRef.current.view === 'letter-train-play' &&
        targetScreen.view !== 'letter-train-play'
      ) {
        clearSavedLetterTrainGame();
        isGameActiveRef.current = false;
      }
      if (
        screenRef.current.view === 'letter-river-play' &&
        targetScreen.view !== 'letter-river-play'
      ) {
        clearSavedLetterRiverGame();
        isGameActiveRef.current = false;
      }
      if (screenRef.current.view === 'safari-play' && targetScreen.view !== 'safari-play') {
        clearSavedSafariGame();
        isGameActiveRef.current = false;
      }
      if (screenRef.current.view === 'word-play' && targetScreen.view !== 'word-play') {
        clearSavedWordGame();
        isGameActiveRef.current = false;
      }
      if (screenRef.current.view === 'sudoku-play' && targetScreen.view !== 'sudoku-play') {
        clearSavedSudokuGame();
        isGameActiveRef.current = false;
      }
      setScreen(targetScreen);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = useCallback((nextScreen: Screen) => {
    historyDepthRef.current += 1;
    window.history.pushState({ pebbleScreen: nextScreen }, '');
    setScreen(nextScreen);
  }, []);

  const navigateBack = useCallback((fallbackScreen: Screen, bypassGameGuard = false) => {
    if (fallbackScreen.view !== 'memory-play') {
      clearSavedMemoryGame();
    }
    if (fallbackScreen.view !== 'letter-train-play') {
      clearSavedLetterTrainGame();
    }
    if (fallbackScreen.view !== 'letter-river-play') {
      clearSavedLetterRiverGame();
    }
    if (fallbackScreen.view !== 'safari-play') {
      clearSavedSafariGame();
    }
    if (fallbackScreen.view !== 'word-play') {
      clearSavedWordGame();
    }
    if (fallbackScreen.view !== 'sudoku-play') {
      clearSavedSudokuGame();
    }
    if (!isPlayScreen(fallbackScreen)) {
      isGameActiveRef.current = false;
    }
    if (historyDepthRef.current > 0) {
      if (bypassGameGuard) {
        bypassGuardRef.current = true;
      }
      window.history.back();
      return;
    }
    window.history.replaceState({ pebbleScreen: fallbackScreen }, '');
    setScreen(fallbackScreen);
  }, []);

  const navigateToHub = useCallback(() => {
    if (isPlayScreen(screenRef.current) && isGameActiveRef.current) {
      setShowLeaveConfirm(true);
      return;
    }
    clearSavedMemoryGame();
    clearSavedLetterTrainGame();
    clearSavedLetterRiverGame();
    clearSavedSafariGame();
    clearSavedWordGame();
    clearSavedSudokuGame();
    isGameActiveRef.current = false;
    setShowLeaveConfirm(false);
    if (historyDepthRef.current > 0) {
      bypassGuardRef.current = true;
      const steps = historyDepthRef.current;
      historyDepthRef.current = 0;
      window.history.go(-steps);
      return;
    }
    window.history.replaceState({ pebbleScreen: { view: 'hub' } }, '');
    setScreen({ view: 'hub' });
  }, []);

  const forceLeaveToHub = useCallback(() => {
    clearSavedMemoryGame();
    clearSavedLetterTrainGame();
    clearSavedLetterRiverGame();
    clearSavedSafariGame();
    clearSavedWordGame();
    clearSavedSudokuGame();
    isGameActiveRef.current = false;
    setShowLeaveConfirm(false);
    if (historyDepthRef.current > 0) {
      bypassGuardRef.current = true;
      const steps = historyDepthRef.current;
      historyDepthRef.current = 0;
      window.history.go(-steps);
      return;
    }
    window.history.replaceState({ pebbleScreen: { view: 'hub' } }, '');
    setScreen({ view: 'hub' });
  }, []);

  const handleGameActiveChange = useCallback((active: boolean) => {
    isGameActiveRef.current = active;
  }, []);

  const handleOpenGame = (gameId: GameRegistryEntry['id']) => {
    if (gameId === 'memory-match') {
      navigateTo({ view: 'memory-setup' });
    } else if (gameId === 'letter-train') {
      navigateTo({ view: 'letter-train-setup' });
    } else if (gameId === 'letter-river') {
      navigateTo({ view: 'letter-river-setup' });
    } else if (gameId === 'number-safari') {
      navigateTo({ view: 'safari-setup' });
    } else if (gameId === 'word-fun') {
      navigateTo({ view: 'word-setup' });
    } else if (gameId === 'picture-sudoku') {
      navigateTo({ view: 'sudoku-setup' });
    }
  };

  if (screen.view === 'profiles') {
    const fallback: Screen =
      screen.returnTo === 'memory-setup'
        ? { view: 'memory-setup' }
        : screen.returnTo === 'letter-train-setup'
          ? { view: 'letter-train-setup' }
          : screen.returnTo === 'letter-river-setup'
            ? { view: 'letter-river-setup' }
            : screen.returnTo === 'safari-setup'
              ? { view: 'safari-setup' }
              : screen.returnTo === 'word-setup'
                ? { view: 'word-setup' }
                : screen.returnTo === 'sudoku-setup'
                  ? { view: 'sudoku-setup' }
                  : { view: 'hub' };
    return <FamilyProfilesPage onBack={() => navigateBack(fallback)} />;
  }

  if (screen.view === 'parent-insights') {
    return (
      <ParentInsightsPage
        profiles={profiles}
        onUpdateProfile={updateProfile}
        onOpenGame={handleOpenGame}
        onBackToHub={() => navigateBack({ view: 'hub' })}
      />
    );
  }

  if (screen.view === 'memory-setup') {
    return (
      <MemorySetup
        profiles={profiles}
        initialConfig={lastMemoryConfig}
        onBackToHub={() => navigateBack({ view: 'hub' })}
        onEditProfiles={() => navigateTo({ view: 'profiles', returnTo: 'memory-setup' })}
        onStartGame={(config) => {
          clearSavedMemoryGame();
          setLastMemoryConfig(config);
          navigateTo({ view: 'memory-play', gameKey: Date.now() });
        }}
      />
    );
  }

  if (screen.view === 'letter-train-setup') {
    const childProfile = profiles[0];
    return (
      <LetterTrainSetup
        childProfile={childProfile}
        initialConfig={lastLetterTrainConfig ?? getDefaultLetterTrainConfig()}
        onBackToHub={() => navigateBack({ view: 'hub' })}
        onEditProfiles={() => navigateTo({ view: 'profiles', returnTo: 'letter-train-setup' })}
        onStartGame={(config) => {
          clearSavedLetterTrainGame();
          setLastLetterTrainConfig(config);
          navigateTo({ view: 'letter-train-play', gameKey: Date.now() });
        }}
      />
    );
  }

  if (screen.view === 'letter-river-setup') {
    const childProfile = profiles[0];
    return (
      <LetterRiverSetup
        childProfile={childProfile}
        initialConfig={lastLetterRiverConfig ?? getDefaultLetterRiverConfig()}
        onBackToHub={() => navigateBack({ view: 'hub' })}
        onEditProfiles={() => navigateTo({ view: 'profiles', returnTo: 'letter-river-setup' })}
        onStartGame={(config) => {
          clearSavedLetterRiverGame();
          setLastLetterRiverConfig(config);
          navigateTo({ view: 'letter-river-play', gameKey: Date.now() });
        }}
      />
    );
  }

  if (screen.view === 'safari-setup') {
    return (
      <SafariSetup
        profiles={profiles}
        initialConfig={lastSafariConfig}
        onBackToHub={() => navigateBack({ view: 'hub' })}
        onEditProfiles={() => navigateTo({ view: 'profiles', returnTo: 'safari-setup' })}
        onStartGame={(config) => {
          clearSavedSafariGame();
          setLastSafariConfig(config);
          navigateTo({ view: 'safari-play', gameKey: Date.now() });
        }}
      />
    );
  }

  if (screen.view === 'word-setup') {
    return (
      <WordFunSetup
        profiles={profiles}
        initialConfig={lastWordConfig}
        onBackToHub={() => navigateBack({ view: 'hub' })}
        onEditProfiles={() => navigateTo({ view: 'profiles', returnTo: 'word-setup' })}
        onStartGame={(config) => {
          clearSavedWordGame();
          setLastWordConfig(config);
          navigateTo({ view: 'word-play', gameKey: Date.now() });
        }}
      />
    );
  }

  if (screen.view === 'memory-play' && lastMemoryConfig) {
    return (
      <>
        <MemoryBoard
          key={screen.gameKey}
          gameKey={screen.gameKey}
          config={lastMemoryConfig}
          profiles={profiles}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onChangeSetup={() => navigateBack({ view: 'memory-setup' }, true)}
          onBackToHub={navigateToHub}
          onGameActiveChange={handleGameActiveChange}
        />

        {showLeaveConfirm && (
          <div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-game-headline"
          >
            <div className="winner-modal">
              <h2 id="leave-game-headline">Leave current game?</h2>
              <p className="winner-subtitle">
                Your current match progress and scores will be lost.
              </p>
              <div className="winner-actions">
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => setShowLeaveConfirm(false)}
                >
                  Keep Playing
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: '100%' }}
                  onClick={forceLeaveToHub}
                >
                  Back to Games
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (screen.view === 'letter-train-play') {
    const activeTrainConfig = lastLetterTrainConfig ?? getDefaultLetterTrainConfig();
    return (
      <>
        <LetterTrainBoard
          key={screen.gameKey}
          gameKey={screen.gameKey}
          config={activeTrainConfig}
          childProfile={profiles[0]}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onChangeSetup={() => navigateBack({ view: 'letter-train-setup' }, true)}
          onBackToHub={navigateToHub}
          onGameActiveChange={handleGameActiveChange}
        />

        {showLeaveConfirm && (
          <div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-train-headline"
          >
            <div className="winner-modal">
              <h2 id="leave-train-headline">Leave the Letter Train?</h2>
              <p className="winner-subtitle">
                Mastered A–Z badges are saved, but your current trip score will reset.
              </p>
              <div className="winner-actions">
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => setShowLeaveConfirm(false)}
                >
                  Keep Riding
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: '100%' }}
                  onClick={forceLeaveToHub}
                >
                  Back to Games
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (screen.view === 'letter-river-play') {
    const activeRiverConfig = lastLetterRiverConfig ?? getDefaultLetterRiverConfig();
    return (
      <>
        <LetterRiverBoard
          key={screen.gameKey}
          gameKey={screen.gameKey}
          config={activeRiverConfig}
          childProfile={profiles[0]}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onChangeSetup={() => navigateBack({ view: 'letter-river-setup' }, true)}
          onBackToHub={navigateToHub}
          onGameActiveChange={handleGameActiveChange}
        />

        {showLeaveConfirm && (
          <div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-river-headline"
          >
            <div className="winner-modal">
              <h2 id="leave-river-headline">Leave Letter River?</h2>
              <p className="winner-subtitle">
                Earned A–Z river badges are saved, but your current catch score will reset.
              </p>
              <div className="winner-actions">
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => setShowLeaveConfirm(false)}
                >
                  Keep Fishing
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: '100%' }}
                  onClick={forceLeaveToHub}
                >
                  Back to Games
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (screen.view === 'safari-play' && lastSafariConfig) {
    return (
      <>
        <SafariBoard
          key={screen.gameKey}
          gameKey={screen.gameKey}
          config={lastSafariConfig}
          profiles={profiles}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onChangeSetup={() => navigateBack({ view: 'safari-setup' }, true)}
          onBackToHub={navigateToHub}
          onGameActiveChange={handleGameActiveChange}
        />

        {showLeaveConfirm && (
          <div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-safari-headline"
          >
            <div className="winner-modal">
              <h2 id="leave-safari-headline">Leave current safari?</h2>
              <p className="winner-subtitle">
                Your current safari progress and scores will be lost.
              </p>
              <div className="winner-actions">
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => setShowLeaveConfirm(false)}
                >
                  Keep Playing
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: '100%' }}
                  onClick={forceLeaveToHub}
                >
                  Back to Games
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (screen.view === 'word-play' && lastWordConfig) {
    return (
      <>
        <WordFunBoard
          key={screen.gameKey}
          gameKey={screen.gameKey}
          config={lastWordConfig}
          profiles={profiles}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onChangeSetup={() => navigateBack({ view: 'word-setup' }, true)}
          onBackToHub={navigateToHub}
          onGameActiveChange={handleGameActiveChange}
        />

        {showLeaveConfirm && (
          <div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-word-headline"
          >
            <div className="winner-modal">
              <h2 id="leave-word-headline">Leave Word Fun?</h2>
              <p className="winner-subtitle">
                Your current word progress and scores will be lost.
              </p>
              <div className="winner-actions">
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => setShowLeaveConfirm(false)}
                >
                  Keep Playing
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: '100%' }}
                  onClick={forceLeaveToHub}
                >
                  Back to Games
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (screen.view === 'sudoku-setup') {
    const childProfile = profiles[0];
    return (
      <PictureSudokuSetup
        childProfile={childProfile}
        initialConfig={lastSudokuConfig ?? getDefaultPictureSudokuConfig()}
        onBackToHub={() => navigateBack({ view: 'hub' })}
        onEditProfiles={() => navigateTo({ view: 'profiles', returnTo: 'sudoku-setup' })}
        onStartGame={(config) => {
          clearSavedSudokuGame();
          setLastSudokuConfig(config);
          navigateTo({ view: 'sudoku-play', gameKey: Date.now() });
        }}
      />
    );
  }

  if (screen.view === 'sudoku-play') {
    const activeSudokuConfig = lastSudokuConfig ?? getDefaultPictureSudokuConfig();
    return (
      <>
        <PictureSudokuBoard
          key={screen.gameKey}
          gameKey={screen.gameKey}
          config={activeSudokuConfig}
          childProfile={profiles[0]}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onChangeSetup={() => navigateBack({ view: 'sudoku-setup' }, true)}
          onBackToHub={navigateToHub}
          onGameActiveChange={handleGameActiveChange}
        />

        {showLeaveConfirm && (
          <div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-sudoku-headline"
          >
            <div className="winner-modal">
              <h2 id="leave-sudoku-headline">Leave this puzzle?</h2>
              <p className="winner-subtitle">
                Your current Picture Sudoku progress will be cleared.
              </p>
              <div className="winner-actions">
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => setShowLeaveConfirm(false)}
                >
                  Keep Solving
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: '100%' }}
                  onClick={forceLeaveToHub}
                >
                  Back to Games
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <GameHubPage
      profiles={profiles}
      onOpenGame={handleOpenGame}
      onOpenProfiles={() => navigateTo({ view: 'profiles', returnTo: 'hub' })}
      onOpenParentInsights={() => navigateTo({ view: 'parent-insights' })}
    />
  );
}

export function App() {
  return (
    <FamilyProfilesProvider>
      <PebbleRouter />
    </FamilyProfilesProvider>
  );
}

export default App;
