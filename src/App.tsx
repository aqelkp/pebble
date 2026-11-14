import { useCallback, useEffect, useRef, useState } from 'react';
import { FamilyProfilesProvider, useFamilyProfiles } from './context/FamilyProfilesContext';
import { clearSavedMemoryGame, MemoryBoard } from './games/memory-match/MemoryBoard';
import { MemorySetup, type MemoryGameConfig } from './games/memory-match/MemorySetup';
import type { GameRegistryEntry } from './games/registry';
import { FamilyProfilesPage } from './pages/FamilyProfilesPage';
import { GameHubPage } from './pages/GameHubPage';

type Screen =
  | { view: 'hub' }
  | { view: 'profiles'; returnTo: 'hub' | 'memory-setup' }
  | { view: 'memory-setup' }
  | { view: 'memory-play'; gameKey: number };

const NAV_STORAGE_KEY = 'pebble.nav.v1';

interface SavedNavState {
  screen: Screen;
  lastMemoryConfig: MemoryGameConfig | null;
}

function isValidScreen(value: unknown): value is Screen {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Screen> & { returnTo?: unknown; gameKey?: unknown };
  if (candidate.view === 'hub' || candidate.view === 'memory-setup') return true;
  if (
    candidate.view === 'profiles' &&
    (candidate.returnTo === 'hub' || candidate.returnTo === 'memory-setup')
  ) {
    return true;
  }
  if (candidate.view === 'memory-play' && typeof candidate.gameKey === 'number') {
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
  try {
    const raw = window.sessionStorage.getItem(NAV_STORAGE_KEY);
    if (!raw) return { screen: { view: 'hub' }, lastMemoryConfig: null };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return { screen: { view: 'hub' }, lastMemoryConfig: null };
    }
    const candidate = parsed as { screen?: unknown; lastMemoryConfig?: unknown };
    const lastMemoryConfig = isValidMemoryConfig(candidate.lastMemoryConfig)
      ? candidate.lastMemoryConfig
      : null;
    let screen: Screen = isValidScreen(candidate.screen) ? candidate.screen : { view: 'hub' };
    if (screen.view === 'memory-play' && !lastMemoryConfig) {
      screen = { view: 'hub' };
    }
    return { screen, lastMemoryConfig };
  } catch {
    return { screen: { view: 'hub' }, lastMemoryConfig: null };
  }
}

function PebbleRouter() {
  const { profiles, soundEnabled, toggleSound } = useFamilyProfiles();
  const [initialNav] = useState<SavedNavState>(() => loadSavedNavState());
  const [screen, setScreen] = useState<Screen>(initialNav.screen);
  const [lastMemoryConfig, setLastMemoryConfig] = useState<MemoryGameConfig | null>(
    initialNav.lastMemoryConfig,
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
      const payload: SavedNavState = { screen, lastMemoryConfig };
      window.sessionStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [lastMemoryConfig, screen]);

  // Sync in-app navigation with browser history so Android Back navigates within Pebble
  // instead of exiting the installed PWA, and guards active games from accidental exits.
  useEffect(() => {
    if (!isValidScreen(window.history.state?.pebbleScreen)) {
      window.history.replaceState({ pebbleScreen: screenRef.current }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      historyDepthRef.current = Math.max(0, historyDepthRef.current - 1);

      if (
        screenRef.current.view === 'memory-play' &&
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
    clearSavedMemoryGame();
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
    }
  };

  if (screen.view === 'profiles') {
    return (
      <FamilyProfilesPage
        onBack={() =>
          navigateBack(screen.returnTo === 'memory-setup' ? { view: 'memory-setup' } : { view: 'hub' })
        }
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
                  onClick={() => {
                    setShowLeaveConfirm(false);
                    navigateBack({ view: 'memory-setup' }, true);
                  }}
                >
                  Leave Game
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
