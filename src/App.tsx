import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityCompleteModal } from './components/ActivityCompleteModal';
import { ActivityIntroModal } from './components/ActivityIntroModal';
import { ParentGateModal } from './components/ParentGateModal';
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
import {
  clearSavedRescueRoadGame,
  RescueRoadBoard,
} from './games/rescue-road/RescueRoadBoard';
import { RescueRoadSetup } from './games/rescue-road/RescueRoadSetup';
import {
  getDefaultRescueRoadConfig,
  isValidRescueRoadConfig,
  type RescueRoadConfig,
} from './games/rescue-road/roadEngine';
import {
  clearSavedStickerJigsawGame,
  StickerJigsawBoard,
} from './games/sticker-jigsaw/StickerJigsawBoard';
import { StickerJigsawSetup } from './games/sticker-jigsaw/StickerJigsawSetup';
import {
  getDefaultStickerJigsawConfig,
  isValidStickerJigsawConfig,
  type StickerJigsawConfig,
} from './games/sticker-jigsaw/jigsawEngine';
import { clearSavedWordGame, WordFunBoard } from './games/word-fun/WordFunBoard';
import {
  isValidWordGameConfig,
  WordFunSetup,
  type WordGameConfig,
} from './games/word-fun/WordFunSetup';
import { buildJourneyCurriculum } from './journey/curriculum';
import {
  getDefaultJourneyState,
  loadJourneyState,
  markJourneyActivityCompleted,
  saveJourneyState,
} from './journey/journeyStorage';
import {
  ACTIVITIES_PER_CHAPTER,
  TOTAL_ACTIVITIES,
  type JourneyActivity,
  type JourneyBoardContext,
  type JourneyProgressState,
  type JourneySettings,
} from './journey/journeyTypes';
import { ActivityBookPage } from './pages/ActivityBookPage';
import { FamilyProfilesPage } from './pages/FamilyProfilesPage';
import { GameHubPage } from './pages/GameHubPage';
import { ParentInsightsPage } from './pages/ParentInsightsPage';
import { ParentJourneySettingsPage } from './pages/ParentJourneySettingsPage';

type Screen =
  | { view: 'hub' }
  | { view: 'free-play-hub' }
  | { view: 'parent-settings' }
  | { view: 'parent-insights' }
  | { view: 'journey-play'; activityIndex: number; gameKey: number }
  | {
      view: 'profiles';
      returnTo:
        | 'hub'
        | 'free-play-hub'
        | 'parent-settings'
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
  | { view: 'sudoku-play'; gameKey: number }
  | { view: 'rescue-road-setup' }
  | { view: 'rescue-road-play'; gameKey: number }
  | { view: 'sticker-jigsaw-setup' }
  | { view: 'sticker-jigsaw-play'; gameKey: number };

const NAV_STORAGE_KEY = 'pebble.nav.v1';

interface SavedNavState {
  screen: Screen;
  lastMemoryConfig: MemoryGameConfig | null;
  lastLetterTrainConfig: LetterTrainConfig | null;
  lastLetterRiverConfig: LetterRiverConfig | null;
  lastSafariConfig: SafariGameConfig | null;
  lastWordConfig: WordGameConfig | null;
  lastSudokuConfig: PictureSudokuConfig | null;
  lastRescueRoadConfig: RescueRoadConfig | null;
  lastStickerJigsawConfig: StickerJigsawConfig | null;
}

function isPlayScreen(screen: Screen): boolean {
  return (
    screen.view === 'journey-play' ||
    screen.view === 'memory-play' ||
    screen.view === 'letter-train-play' ||
    screen.view === 'letter-river-play' ||
    screen.view === 'safari-play' ||
    screen.view === 'word-play' ||
    screen.view === 'sudoku-play' ||
    screen.view === 'rescue-road-play' ||
    screen.view === 'sticker-jigsaw-play'
  );
}

function clearAllSavedGames() {
  clearSavedMemoryGame();
  clearSavedLetterTrainGame();
  clearSavedLetterRiverGame();
  clearSavedSafariGame();
  clearSavedWordGame();
  clearSavedSudokuGame();
  clearSavedRescueRoadGame();
  clearSavedStickerJigsawGame();
}

function clearSavedGameById(gameId: GameRegistryEntry['id']) {
  if (gameId === 'memory-match') clearSavedMemoryGame();
  else if (gameId === 'letter-train') clearSavedLetterTrainGame();
  else if (gameId === 'letter-river') clearSavedLetterRiverGame();
  else if (gameId === 'number-safari') clearSavedSafariGame();
  else if (gameId === 'word-fun') clearSavedWordGame();
  else if (gameId === 'picture-sudoku') clearSavedSudokuGame();
  else if (gameId === 'rescue-road') clearSavedRescueRoadGame();
  else if (gameId === 'sticker-jigsaw') clearSavedStickerJigsawGame();
}

function isValidScreen(value: unknown): value is Screen {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Screen> & {
    returnTo?: unknown;
    gameKey?: unknown;
    activityIndex?: unknown;
  };
  if (
    candidate.view === 'hub' ||
    candidate.view === 'free-play-hub' ||
    candidate.view === 'parent-settings' ||
    candidate.view === 'parent-insights' ||
    candidate.view === 'memory-setup' ||
    candidate.view === 'letter-train-setup' ||
    candidate.view === 'letter-river-setup' ||
    candidate.view === 'safari-setup' ||
    candidate.view === 'word-setup' ||
    candidate.view === 'sudoku-setup' ||
    candidate.view === 'rescue-road-setup' ||
    candidate.view === 'sticker-jigsaw-setup'
  ) {
    return true;
  }
  if (
    candidate.view === 'journey-play' &&
    typeof candidate.activityIndex === 'number' &&
    Number.isInteger(candidate.activityIndex) &&
    candidate.activityIndex >= 0 &&
    candidate.activityIndex < TOTAL_ACTIVITIES &&
    typeof candidate.gameKey === 'number'
  ) {
    return true;
  }
  if (
    candidate.view === 'profiles' &&
    (candidate.returnTo === 'hub' ||
      candidate.returnTo === 'free-play-hub' ||
      candidate.returnTo === 'parent-settings' ||
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
      candidate.view === 'sudoku-play' ||
      candidate.view === 'rescue-road-play' ||
      candidate.view === 'sticker-jigsaw-play') &&
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
    lastRescueRoadConfig: null,
    lastStickerJigsawConfig: null,
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
      lastRescueRoadConfig?: unknown;
      lastStickerJigsawConfig?: unknown;
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
    const lastRescueRoadConfig = isValidRescueRoadConfig(candidate.lastRescueRoadConfig)
      ? candidate.lastRescueRoadConfig
      : null;
    const lastStickerJigsawConfig = isValidStickerJigsawConfig(candidate.lastStickerJigsawConfig)
      ? candidate.lastStickerJigsawConfig
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
    if (screen.view === 'rescue-road-play' && !lastRescueRoadConfig) {
      screen = { view: 'hub' };
    }
    if (screen.view === 'sticker-jigsaw-play' && !lastStickerJigsawConfig) {
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
      lastRescueRoadConfig,
      lastStickerJigsawConfig,
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
  const [lastRescueRoadConfig, setLastRescueRoadConfig] = useState<RescueRoadConfig | null>(
    initialNav.lastRescueRoadConfig,
  );
  const [lastStickerJigsawConfig, setLastStickerJigsawConfig] = useState<StickerJigsawConfig | null>(
    initialNav.lastStickerJigsawConfig,
  );
  const [journeyState, setJourneyState] = useState<JourneyProgressState>(() => loadJourneyState());
  const [showParentGate, setShowParentGate] = useState(false);
  const [introActivity, setIntroActivity] = useState<JourneyActivity | null>(null);
  const [completedActivity, setCompletedActivity] = useState<JourneyActivity | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const curriculum = useMemo(
    () => buildJourneyCurriculum(journeyState.settings, profiles),
    [journeyState.settings, profiles],
  );

  useEffect(() => {
    saveJourneyState(journeyState);
  }, [journeyState]);

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
        lastRescueRoadConfig,
        lastStickerJigsawConfig,
      };
      window.sessionStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [
    lastLetterRiverConfig,
    lastLetterTrainConfig,
    lastMemoryConfig,
    lastRescueRoadConfig,
    lastSafariConfig,
    lastStickerJigsawConfig,
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

      if (screenRef.current.view === 'journey-play' && targetScreen.view !== 'journey-play') {
        clearAllSavedGames();
        isGameActiveRef.current = false;
        setCompletedActivity(null);
        setIntroActivity(null);
      }
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
      if (
        screenRef.current.view === 'rescue-road-play' &&
        targetScreen.view !== 'rescue-road-play'
      ) {
        clearSavedRescueRoadGame();
        isGameActiveRef.current = false;
      }
      if (
        screenRef.current.view === 'sticker-jigsaw-play' &&
        targetScreen.view !== 'sticker-jigsaw-play'
      ) {
        clearSavedStickerJigsawGame();
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
    if (fallbackScreen.view !== 'journey-play') {
      if (fallbackScreen.view !== 'memory-play') clearSavedMemoryGame();
      if (fallbackScreen.view !== 'letter-train-play') clearSavedLetterTrainGame();
      if (fallbackScreen.view !== 'letter-river-play') clearSavedLetterRiverGame();
      if (fallbackScreen.view !== 'safari-play') clearSavedSafariGame();
      if (fallbackScreen.view !== 'word-play') clearSavedWordGame();
      if (fallbackScreen.view !== 'sudoku-play') clearSavedSudokuGame();
      if (fallbackScreen.view !== 'rescue-road-play') clearSavedRescueRoadGame();
      if (fallbackScreen.view !== 'sticker-jigsaw-play') clearSavedStickerJigsawGame();
    }
    if (!isPlayScreen(fallbackScreen)) {
      isGameActiveRef.current = false;
      setCompletedActivity(null);
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
    clearAllSavedGames();
    isGameActiveRef.current = false;
    setCompletedActivity(null);
    setIntroActivity(null);
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
    clearAllSavedGames();
    isGameActiveRef.current = false;
    setCompletedActivity(null);
    setIntroActivity(null);
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
    } else if (gameId === 'rescue-road') {
      navigateTo({ view: 'rescue-road-setup' });
    } else if (gameId === 'sticker-jigsaw') {
      navigateTo({ view: 'sticker-jigsaw-setup' });
    }
  };

  const handleUpdateJourneySettings = useCallback((patch: Partial<JourneySettings>) => {
    setJourneyState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...patch,
      },
    }));
  }, []);

  const handleConfirmStartActivity = useCallback(
    (activity: JourneyActivity) => {
      clearSavedGameById(activity.gameId);
      setIntroActivity(null);
      setCompletedActivity(null);
      const nextScreen: Screen = {
        view: 'journey-play',
        activityIndex: activity.index,
        gameKey: Date.now(),
      };
      if (screenRef.current.view === 'journey-play') {
        window.history.replaceState({ pebbleScreen: nextScreen }, '');
        setScreen(nextScreen);
        return;
      }
      navigateTo(nextScreen);
    },
    [navigateTo],
  );

  const renderScreen = (): ReactNode => {
    if (screen.view === 'profiles') {
      const fallback: Screen =
        screen.returnTo === 'free-play-hub'
          ? { view: 'free-play-hub' }
          : screen.returnTo === 'parent-settings'
            ? { view: 'parent-settings' }
            : screen.returnTo === 'memory-setup'
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

    if (screen.view === 'parent-settings') {
      return (
        <ParentJourneySettingsPage
          journeyState={journeyState}
          curriculum={curriculum}
          onUpdateSettings={handleUpdateJourneySettings}
          onJumpToActivityIndex={(idx) =>
            setJourneyState((prev) => ({
              ...prev,
              currentActivityIndex: Math.max(0, Math.min(TOTAL_ACTIVITIES - 1, idx)),
            }))
          }
          onResetJourney={() => {
            setJourneyState((prev) => ({
              ...getDefaultJourneyState(),
              settings: prev.settings,
            }));
          }}
          onTestIndividualGame={handleOpenGame}
          onOpenFreePlayHub={() => navigateTo({ view: 'free-play-hub' })}
          onOpenParentInsights={() => navigateTo({ view: 'parent-insights' })}
          onOpenProfiles={() => navigateTo({ view: 'profiles', returnTo: 'parent-settings' })}
          onBack={navigateToHub}
        />
      );
    }

    if (screen.view === 'free-play-hub') {
      return (
        <GameHubPage
          profiles={profiles}
          isFreePlayPreview
          onBackToActivityBook={navigateToHub}
          onOpenGame={handleOpenGame}
          onOpenProfiles={() => navigateTo({ view: 'profiles', returnTo: 'free-play-hub' })}
          onOpenParentInsights={() => navigateTo({ view: 'parent-insights' })}
        />
      );
    }

    if (screen.view === 'journey-play') {
      const activeActivity = curriculum[screen.activityIndex] ?? curriculum[0];
      const journeyContext: JourneyBoardContext = {
        chapterNumber: activeActivity.chapterNumber,
        activityNumberInChapter: activeActivity.numberInChapter,
        totalInChapter: ACTIVITIES_PER_CHAPTER,
        globalActivityNumber: activeActivity.activityNumber,
        onActivityComplete: () => {
          isGameActiveRef.current = false;
          clearSavedGameById(activeActivity.gameId);
          setJourneyState((prev) => markJourneyActivityCompleted(prev, activeActivity));
          setCompletedActivity(activeActivity);
        },
      };

      const { payload } = activeActivity;
      if (payload.gameId === 'memory-match') {
        return (
          <MemoryBoard
            key={screen.gameKey}
            gameKey={screen.gameKey}
            config={payload.config}
            profiles={profiles}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            onChangeSetup={() => undefined}
            onBackToHub={navigateToHub}
            onGameActiveChange={handleGameActiveChange}
            journeyContext={journeyContext}
          />
        );
      }
      if (payload.gameId === 'letter-train') {
        return (
          <LetterTrainBoard
            key={screen.gameKey}
            gameKey={screen.gameKey}
            config={payload.config}
            childProfile={profiles[0]}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            onChangeSetup={() => undefined}
            onBackToHub={navigateToHub}
            onGameActiveChange={handleGameActiveChange}
            journeyContext={journeyContext}
          />
        );
      }
      if (payload.gameId === 'letter-river') {
        return (
          <LetterRiverBoard
            key={screen.gameKey}
            gameKey={screen.gameKey}
            config={payload.config}
            childProfile={profiles[0]}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            onChangeSetup={() => undefined}
            onBackToHub={navigateToHub}
            onGameActiveChange={handleGameActiveChange}
            journeyContext={journeyContext}
          />
        );
      }
      if (payload.gameId === 'picture-sudoku') {
        return (
          <PictureSudokuBoard
            key={screen.gameKey}
            gameKey={screen.gameKey}
            config={payload.config}
            childProfile={profiles[0]}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            onChangeSetup={() => undefined}
            onBackToHub={navigateToHub}
            onGameActiveChange={handleGameActiveChange}
            journeyContext={journeyContext}
          />
        );
      }
      if (payload.gameId === 'word-fun') {
        return (
          <WordFunBoard
            key={screen.gameKey}
            gameKey={screen.gameKey}
            config={payload.config}
            profiles={profiles}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            onChangeSetup={() => undefined}
            onBackToHub={navigateToHub}
            onGameActiveChange={handleGameActiveChange}
            journeyContext={journeyContext}
          />
        );
      }
      if (payload.gameId === 'rescue-road') {
        return (
          <RescueRoadBoard
            key={screen.gameKey}
            gameKey={screen.gameKey}
            config={payload.config}
            childProfile={profiles[0]}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            onChangeSetup={() => undefined}
            onBackToHub={navigateToHub}
            onGameActiveChange={handleGameActiveChange}
            journeyContext={journeyContext}
          />
        );
      }
      if (payload.gameId === 'sticker-jigsaw') {
        return (
          <StickerJigsawBoard
            key={screen.gameKey}
            gameKey={screen.gameKey}
            config={payload.config}
            childProfile={profiles[0]}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            onChangeSetup={() => undefined}
            onBackToHub={navigateToHub}
            onGameActiveChange={handleGameActiveChange}
            journeyContext={journeyContext}
          />
        );
      }
      return (
        <SafariBoard
          key={screen.gameKey}
          gameKey={screen.gameKey}
          config={payload.config}
          profiles={profiles}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onChangeSetup={() => undefined}
          onBackToHub={navigateToHub}
          onGameActiveChange={handleGameActiveChange}
          journeyContext={journeyContext}
        />
      );
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

  if (screen.view === 'rescue-road-setup') {
    return (
      <RescueRoadSetup
        initialConfig={lastRescueRoadConfig ?? getDefaultRescueRoadConfig()}
        onBackToHub={() => navigateBack({ view: 'hub' })}
        onStartGame={(config) => {
          clearSavedRescueRoadGame();
          setLastRescueRoadConfig(config);
          navigateTo({ view: 'rescue-road-play', gameKey: Date.now() });
        }}
      />
    );
  }

  if (screen.view === 'rescue-road-play') {
    const activeRescueRoadConfig = lastRescueRoadConfig ?? getDefaultRescueRoadConfig();
    return (
      <>
        <RescueRoadBoard
          key={screen.gameKey}
          gameKey={screen.gameKey}
          config={activeRescueRoadConfig}
          childProfile={profiles[0]}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onChangeSetup={() => navigateBack({ view: 'rescue-road-setup' }, true)}
          onBackToHub={navigateToHub}
          onGameActiveChange={handleGameActiveChange}
        />

        {showLeaveConfirm && (
          <div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-rr-headline"
          >
            <div className="winner-modal">
              <h2 id="leave-rr-headline">Leave this road?</h2>
              <p className="winner-subtitle">
                Your current Rescue Road progress will be cleared.
              </p>
              <div className="winner-actions">
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => setShowLeaveConfirm(false)}
                >
                  Keep Building
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

  if (screen.view === 'sticker-jigsaw-setup') {
    return (
      <StickerJigsawSetup
        initialConfig={lastStickerJigsawConfig ?? getDefaultStickerJigsawConfig()}
        onBackToHub={() => navigateBack({ view: 'hub' })}
        onStartGame={(config) => {
          clearSavedStickerJigsawGame();
          setLastStickerJigsawConfig(config);
          navigateTo({ view: 'sticker-jigsaw-play', gameKey: Date.now() });
        }}
      />
    );
  }

  if (screen.view === 'sticker-jigsaw-play') {
    const activeJigsawConfig = lastStickerJigsawConfig ?? getDefaultStickerJigsawConfig();
    return (
      <>
        <StickerJigsawBoard
          key={screen.gameKey}
          gameKey={screen.gameKey}
          config={activeJigsawConfig}
          childProfile={profiles[0]}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onChangeSetup={() => navigateBack({ view: 'sticker-jigsaw-setup' }, true)}
          onBackToHub={navigateToHub}
          onGameActiveChange={handleGameActiveChange}
        />

        {showLeaveConfirm && (
          <div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-sj-headline"
          >
            <div className="winner-modal">
              <h2 id="leave-sj-headline">Leave this sticker?</h2>
              <p className="winner-subtitle">
                Your current Sticker Jigsaw progress will be cleared.
              </p>
              <div className="winner-actions">
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => setShowLeaveConfirm(false)}
                >
                  Keep Building
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

    if (journeyState.settings.guidedModeEnabled) {
      return (
        <ActivityBookPage
          childProfile={profiles[0]}
          curriculum={curriculum}
          journeyState={journeyState}
          onStartActivity={(act) => setIntroActivity(act)}
          onOpenParentGate={() => setShowParentGate(true)}
        />
      );
    }

    return (
      <GameHubPage
        profiles={profiles}
        onOpenGame={handleOpenGame}
        onOpenProfiles={() => navigateTo({ view: 'profiles', returnTo: 'hub' })}
        onOpenParentInsights={() => navigateTo({ view: 'parent-insights' })}
        onOpenJourneySettings={() => setShowParentGate(true)}
      />
    );
  };

  const nextCompletedActivity =
    completedActivity && completedActivity.index + 1 < curriculum.length
      ? curriculum[completedActivity.index + 1]
      : null;

  const completedInChapterCount = completedActivity
    ? journeyState.completedActivityIndices.filter(
        (idx) => Math.floor(idx / ACTIVITIES_PER_CHAPTER) + 1 === completedActivity.chapterNumber,
      ).length
    : 0;

  return (
    <>
      {renderScreen()}

      {showLeaveConfirm && screen.view === 'journey-play' && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-journey-headline"
        >
          <div className="winner-modal">
            <h2 id="leave-journey-headline">Leave current activity?</h2>
            <p className="winner-subtitle">
              Your current activity progress will reset so you can start fresh next time.
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
                Back to Activity Book
              </button>
            </div>
          </div>
        </div>
      )}

      {completedActivity && screen.view === 'journey-play' && (
        <ActivityCompleteModal
          activity={completedActivity}
          nextActivity={nextCompletedActivity}
          completedInChapter={completedInChapterCount}
          childProfile={profiles[0]}
          onNextActivity={() => {
            setCompletedActivity(null);
            if (nextCompletedActivity) {
              setIntroActivity(nextCompletedActivity);
            }
          }}
          onBackToBook={() => {
            setCompletedActivity(null);
            forceLeaveToHub();
          }}
        />
      )}

      {introActivity && (
        <ActivityIntroModal
          key={introActivity.index}
          activity={introActivity}
          soundEnabled={soundEnabled}
          waitForVoiceIntro={journeyState.settings.waitForVoiceIntro}
          onConfirmStart={() => handleConfirmStartActivity(introActivity)}
          onCancel={() => {
            setIntroActivity(null);
            if (screenRef.current.view === 'journey-play') {
              forceLeaveToHub();
            }
          }}
        />
      )}

      {showParentGate && (
        <ParentGateModal
          onSuccess={() => {
            setShowParentGate(false);
            navigateTo({ view: 'parent-settings' });
          }}
          onCancel={() => setShowParentGate(false)}
        />
      )}
    </>
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
