import { useCallback, useEffect, useRef, useState } from 'react';
import { FamilyProfilesProvider, useFamilyProfiles } from './context/FamilyProfilesContext';
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
import { FamilyProfilesPage } from './pages/FamilyProfilesPage';
import { GameHubPage } from './pages/GameHubPage';

type Screen =
  | { view: 'hub' }
  | {
      view: 'profiles';
      returnTo: 'hub' | 'memory-setup' | 'letter-train-setup' | 'sudoku-setup';
    }
  | { view: 'memory-setup' }
  | { view: 'memory-play'; gameKey: number }
  | { view: 'letter-train-setup' }
  | { view: 'letter-train-play'; gameKey: number }
  | { view: 'sudoku-setup' }
  | { view: 'sudoku-play'; gameKey: number };

const NAV_STORAGE_KEY = 'pebble.nav.v1';

interface SavedNavState {
  screen: Screen;
  lastMemoryConfig: MemoryGameConfig | null;
  lastLetterTrainConfig: LetterTrainConfig | null;
  lastSudokuConfig: PictureSudokuConfig | null;
}

function isPlayScreen(screen: Screen): boolean {
  return (
    screen.view === 'memory-play' ||
    screen.view === 'letter-train-play' ||
    screen.view === 'sudoku-play'
  );
}

function isValidScreen(value: unknown): value is Screen {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Screen> & { returnTo?: unknown; gameKey?: unknown };
  if (
    candidate.view === 'hub' ||
    candidate.view === 'memory-setup' ||
    candidate.view === 'letter-train-setup' ||
    candidate.view === 'sudoku-setup'
  ) {
    return true;
  }
  if (
    candidate.view === 'profiles' &&
    (candidate.returnTo === 'hub' ||
      candidate.returnTo === 'memory-setup' ||
      candidate.returnTo === 'letter-train-setup' ||
      candidate.returnTo === 'sudoku-setup')
  ) {
    return true;
  }
  if (
    (candidate.view === 'memory-play' ||
      candidate.view === 'letter-train-play' ||
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

function loadSavedNavState(): SavedNavState {
  const emptyState: SavedNavState = {
    screen: { view: 'hub' },
    lastMemoryConfig: null,
    lastLetterTrainConfig: null,
    lastSudokuConfig: null,
  };
  try {
    const raw = window.sessionStorage.getItem(NAV_STORAGE_KEY);
    if (!raw) return emptyState;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return emptyState;
    const candidate = parsed as {
      screen?: unknown;
      lastMemoryConfig?: unknown;
      lastLetterTrainConfig?: unknown;
      lastSudokuConfig?: unknown;
    };
    const lastMemoryConfig = isValidMemoryConfig(candidate.lastMemoryConfig)
      ? candidate.lastMemoryConfig
      : null;
    const lastLetterTrainConfig = isValidLetterTrainConfig(candidate.lastLetterTrainConfig)
      ? candidate.lastLetterTrainConfig
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
    if (screen.view === 'sudoku-play' && !lastSudokuConfig) {
      screen = { view: 'hub' };
    }
    return { screen, lastMemoryConfig, lastLetterTrainConfig, lastSudokuConfig };
  } catch {
    return emptyState;
  }
}

function PebbleRouter() {
  const { profiles, soundEnabled, toggleSound } = useFamilyProfiles();
  const [initialNav] = useState<SavedNavState>(() => loadSavedNavState());
  const [screen, setScreen] = useState<Screen>(initialNav.screen);
  const [lastMemoryConfig, setLastMemoryConfig] = useState<MemoryGameConfig | null>(
    initialNav.lastMemoryConfig,
  );
  const [lastLetterTrainConfig, setLastLetterTrainConfig] = useState<LetterTrainConfig | null>(
    initialNav.lastLetterTrainConfig,
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
        lastSudokuConfig,
      };
      window.sessionStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [lastLetterTrainConfig, lastMemoryConfig, lastSudokuConfig, screen]);

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
        screenRef.current.view === 'sudoku-play' &&
        targetScreen.view !== 'sudoku-play'
      ) {
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
          : screen.returnTo === 'sudoku-setup'
            ? { view: 'sudoku-setup' }
            : { view: 'hub' };
    return <FamilyProfilesPage onBack={() => navigateBack(fallback)} />;
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
