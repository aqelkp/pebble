import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ActivityCompleteModal } from './components/ActivityCompleteModal';
import { ActivityIntroModal } from './components/ActivityIntroModal';
import { DailyTimeOverScreen } from './components/DailyTimeOverScreen';
import { GameLoadingFallback } from './components/GameLoadingFallback';
import { LeaveGameModal } from './components/LeaveGameModal';
import { ParentGateModal } from './components/ParentGateModal';
import { FamilyProfilesProvider, useFamilyProfiles } from './context/FamilyProfilesContext';
import {
  DAILY_LIMIT_STORAGE_KEY,
  getLocalDateKey,
  isDailyLimitReached,
  loadDailyPlayLimitState,
  sanitizeLimitMinutes,
  saveDailyPlayLimitState,
  type DailyPlayLimitState,
} from './utils/dailyPlayLimit';
import { preloadDailyTimeOverVoice, stopAllSpokenAudio } from './utils/wordAudio';
import { isValidGameConfig, type GameConfigMap, type SavedGameConfigs } from './games/gameConfigs';
import {
  clearAllSavedGames,
  clearSavedGameById,
  getGamePlugin,
  preloadGamePlugin,
  renderPluginBoard,
  renderPluginSetup,
  scheduleIdleGamePreload,
} from './games/plugins';
import { isValidGameId, type GameId } from './games/registry';
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
import { GameHubPage } from './pages/GameHubPage';

const FamilyProfilesPage = lazy(() =>
  import('./pages/FamilyProfilesPage').then((m) => ({ default: m.FamilyProfilesPage })),
);
const ParentInsightsPage = lazy(() =>
  import('./pages/ParentInsightsPage').then((m) => ({ default: m.ParentInsightsPage })),
);
const ParentJourneySettingsPage = lazy(() =>
  import('./pages/ParentJourneySettingsPage').then((m) => ({
    default: m.ParentJourneySettingsPage,
  })),
);

// TODO(security): Pebble runs 100% locally in the browser with no backend server, authentication,
// or database. Navigation state and last game configurations restored from sessionStorage are
// treated as untrusted input, validated against strict allow-lists and integer bounds, and fail
// closed back to { view: 'hub' } if malformed.

type ProfilesReturnTarget =
  | { view: 'hub' }
  | { view: 'free-play-hub' }
  | { view: 'parent-settings' }
  | { view: 'game-setup'; gameId: GameId };

type Screen =
  | { view: 'hub' }
  | { view: 'free-play-hub' }
  | { view: 'parent-settings' }
  | { view: 'parent-insights' }
  | { view: 'journey-play'; activityIndex: number; gameKey: number }
  | { view: 'profiles'; returnTo: ProfilesReturnTarget }
  | { view: 'game-setup'; gameId: GameId }
  | { view: 'game-play'; gameId: GameId; gameKey: number };

const NAV_STORAGE_KEY = 'pebble.nav.v1';

interface SavedNavState {
  screen: Screen;
  gameConfigs: SavedGameConfigs;
}

const LEGACY_SETUP_VIEW_TO_GAME: Record<string, GameId> = {
  'memory-setup': 'memory-match',
  'letter-train-setup': 'letter-train',
  'letter-river-setup': 'letter-river',
  'safari-setup': 'number-safari',
  'word-setup': 'word-fun',
  'sudoku-setup': 'picture-sudoku',
};

const LEGACY_PLAY_VIEW_TO_GAME: Record<string, GameId> = {
  'memory-play': 'memory-match',
  'letter-train-play': 'letter-train',
  'letter-river-play': 'letter-river',
  'safari-play': 'number-safari',
  'word-play': 'word-fun',
  'sudoku-play': 'picture-sudoku',
};

const LEGACY_CONFIG_KEYS: ReadonlyArray<readonly [string, GameId]> = [
  ['lastMemoryConfig', 'memory-match'],
  ['lastLetterTrainConfig', 'letter-train'],
  ['lastLetterRiverConfig', 'letter-river'],
  ['lastSafariConfig', 'number-safari'],
  ['lastWordConfig', 'word-fun'],
  ['lastSudokuConfig', 'picture-sudoku'],
];

function isPlayScreen(screen: Screen): boolean {
  return screen.view === 'journey-play' || screen.view === 'game-play';
}

function parseProfilesReturnTarget(raw: unknown): ProfilesReturnTarget | null {
  if (typeof raw === 'string') {
    if (raw === 'hub' || raw === 'free-play-hub' || raw === 'parent-settings') {
      return { view: raw };
    }
    const legacyGameId = LEGACY_SETUP_VIEW_TO_GAME[raw];
    if (legacyGameId) {
      return { view: 'game-setup', gameId: legacyGameId };
    }
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const candidate = raw as { view?: unknown; gameId?: unknown };
  if (
    candidate.view === 'hub' ||
    candidate.view === 'free-play-hub' ||
    candidate.view === 'parent-settings'
  ) {
    return { view: candidate.view };
  }
  if (candidate.view === 'game-setup' && isValidGameId(candidate.gameId)) {
    return { view: 'game-setup', gameId: candidate.gameId };
  }
  return null;
}

function parseScreen(value: unknown): Screen | null {
  if (typeof value !== 'object' || value === null) return null;
  const candidate = value as {
    view?: unknown;
    gameId?: unknown;
    gameKey?: unknown;
    activityIndex?: unknown;
    returnTo?: unknown;
  };

  if (
    candidate.view === 'hub' ||
    candidate.view === 'free-play-hub' ||
    candidate.view === 'parent-settings' ||
    candidate.view === 'parent-insights'
  ) {
    return { view: candidate.view };
  }

  if (
    candidate.view === 'journey-play' &&
    typeof candidate.activityIndex === 'number' &&
    Number.isInteger(candidate.activityIndex) &&
    candidate.activityIndex >= 0 &&
    candidate.activityIndex < TOTAL_ACTIVITIES &&
    typeof candidate.gameKey === 'number' &&
    Number.isFinite(candidate.gameKey)
  ) {
    return {
      view: 'journey-play',
      activityIndex: candidate.activityIndex,
      gameKey: candidate.gameKey,
    };
  }

  if (candidate.view === 'profiles') {
    const returnTo = parseProfilesReturnTarget(candidate.returnTo);
    if (returnTo) {
      return { view: 'profiles', returnTo };
    }
    return null;
  }

  if (candidate.view === 'game-setup' && isValidGameId(candidate.gameId)) {
    return { view: 'game-setup', gameId: candidate.gameId };
  }

  if (
    candidate.view === 'game-play' &&
    isValidGameId(candidate.gameId) &&
    typeof candidate.gameKey === 'number' &&
    Number.isFinite(candidate.gameKey)
  ) {
    return {
      view: 'game-play',
      gameId: candidate.gameId,
      gameKey: candidate.gameKey,
    };
  }

  if (typeof candidate.view === 'string') {
    const legacySetupId = LEGACY_SETUP_VIEW_TO_GAME[candidate.view];
    if (legacySetupId) {
      return { view: 'game-setup', gameId: legacySetupId };
    }
    const legacyPlayId = LEGACY_PLAY_VIEW_TO_GAME[candidate.view];
    if (
      legacyPlayId &&
      typeof candidate.gameKey === 'number' &&
      Number.isFinite(candidate.gameKey)
    ) {
      return { view: 'game-play', gameId: legacyPlayId, gameKey: candidate.gameKey };
    }
  }

  return null;
}

function setSavedConfig<K extends GameId>(
  configs: SavedGameConfigs,
  gameId: K,
  value: GameConfigMap[K],
): void {
  configs[gameId] = value;
}

function parseSavedConfigs(candidate: Record<string, unknown>): SavedGameConfigs {
  const result: SavedGameConfigs = {};

  if (typeof candidate.gameConfigs === 'object' && candidate.gameConfigs !== null) {
    const rawMap = candidate.gameConfigs as Record<string, unknown>;
    for (const [key, rawCfg] of Object.entries(rawMap)) {
      if (isValidGameId(key) && isValidGameConfig(key, rawCfg)) {
        setSavedConfig(result, key, rawCfg);
      }
    }
  }

  for (const [legacyKey, gameId] of LEGACY_CONFIG_KEYS) {
    if (!result[gameId] && isValidGameConfig(gameId, candidate[legacyKey])) {
      setSavedConfig(result, gameId, candidate[legacyKey]);
    }
  }

  return result;
}

function loadSavedNavState(): SavedNavState {
  const emptyState: SavedNavState = {
    screen: { view: 'hub' },
    gameConfigs: {},
  };
  try {
    const raw = window.sessionStorage.getItem(NAV_STORAGE_KEY);
    if (!raw) return emptyState;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return emptyState;
    }

    const candidate = parsed as Record<string, unknown>;
    const gameConfigs = parseSavedConfigs(candidate);
    let screen = parseScreen(candidate.screen) ?? { view: 'hub' };

    if (screen.view === 'game-play' && !gameConfigs[screen.gameId]) {
      screen = { view: 'hub' };
    }

    return { screen, gameConfigs };
  } catch {
    return emptyState;
  }
}

function PebbleRouter() {
  const { profiles, soundEnabled, toggleSound, updateProfile } = useFamilyProfiles();
  const [initialNav] = useState<SavedNavState>(() => loadSavedNavState());
  const [screen, setScreen] = useState<Screen>(initialNav.screen);
  const [gameConfigs, setGameConfigs] = useState<SavedGameConfigs>(initialNav.gameConfigs);
  const [journeyState, setJourneyState] = useState<JourneyProgressState>(() => loadJourneyState());
  const [dailyLimit, setDailyLimit] = useState<DailyPlayLimitState>(() =>
    loadDailyPlayLimitState(),
  );
  const [parentGateTarget, setParentGateTarget] = useState<
    'parent-settings' | 'parent-insights' | null
  >(null);
  const showParentGate = parentGateTarget !== null;
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

  // Gently pre-warm lazy game bundles and daily wind-down voice during idle time after initial paint
  useEffect(() => {
    preloadDailyTimeOverVoice();
    return scheduleIdleGamePreload();
  }, []);

  useEffect(() => {
    saveDailyPlayLimitState(dailyLimit);
  }, [dailyLimit]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== DAILY_LIMIT_STORAGE_KEY) return;
      setDailyLimit(loadDailyPlayLimitState());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Pre-warm the selected activity's chunk while the intro modal is open
  useEffect(() => {
    if (introActivity) {
      preloadGamePlugin(introActivity.gameId);
    }
  }, [introActivity]);

  const screenRef = useRef<Screen>(screen);
  screenRef.current = screen;
  const isGameActiveRef = useRef(false);
  const historyDepthRef = useRef(0);
  const bypassGuardRef = useRef(false);
  const lastInteractionMsRef = useRef<number>(Date.now());

  const isGrownUpScreen =
    screen.view === 'parent-settings' ||
    screen.view === 'parent-insights' ||
    screen.view === 'profiles';
  const isGrownUpScreenRef = useRef(isGrownUpScreen);
  isGrownUpScreenRef.current = isGrownUpScreen;
  const showParentGateRef = useRef(showParentGate);
  showParentGateRef.current = showParentGate;
  const isTimeOverToday = isDailyLimitReached(dailyLimit);

  useEffect(() => {
    lastInteractionMsRef.current = Date.now();
  }, [screen]);

  // Silently accumulate active child play seconds and automatically reset at local midnight
  useEffect(() => {
    const markInteraction = () => {
      lastInteractionMsRef.current = Date.now();
    };

    const syncDayRollover = () => {
      const todayKey = getLocalDateKey();
      setDailyLimit((prev) => {
        if (prev.dateKey === todayKey) return prev;
        return { ...prev, dateKey: todayKey, usedSeconds: 0 };
      });
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        lastInteractionMsRef.current = Date.now();
      }
      syncDayRollover();
    };

    window.addEventListener('pointerdown', markInteraction, { passive: true });
    window.addEventListener('touchstart', markInteraction, { passive: true });
    window.addEventListener('keydown', markInteraction);
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    const intervalId = window.setInterval(() => {
      const nowMs = Date.now();
      const todayKey = getLocalDateKey(new Date(nowMs));
      setDailyLimit((prev) => {
        if (prev.dateKey !== todayKey) {
          return { ...prev, dateKey: todayKey, usedSeconds: 0 };
        }
        if (prev.limitMinutes <= 0 || isDailyLimitReached(prev)) {
          return prev;
        }
        if (isGrownUpScreenRef.current || showParentGateRef.current) {
          return prev;
        }
        if (document.visibilityState !== 'visible') {
          return prev;
        }
        if (nowMs - lastInteractionMsRef.current > 90_000) {
          return prev;
        }
        return {
          ...prev,
          usedSeconds: prev.usedSeconds + 1,
        };
      });
    }, 1000);

    return () => {
      window.removeEventListener('pointerdown', markInteraction);
      window.removeEventListener('touchstart', markInteraction);
      window.removeEventListener('keydown', markInteraction);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.clearInterval(intervalId);
    };
  }, []);

  // When the daily limit is reached, cleanly exit any active child session
  const wasTimeOverRef = useRef(isTimeOverToday);
  useEffect(() => {
    const justReachedLimit = isTimeOverToday && !wasTimeOverRef.current;
    wasTimeOverRef.current = isTimeOverToday;
    if (!justReachedLimit) return;

    stopAllSpokenAudio();
    clearAllSavedGames();
    isGameActiveRef.current = false;
    setIntroActivity(null);
    setCompletedActivity(null);
    setShowLeaveConfirm(false);

    if (!isGrownUpScreenRef.current && screenRef.current.view !== 'hub') {
      historyDepthRef.current = 0;
      window.history.replaceState({ pebbleScreen: { view: 'hub' } }, '');
      setScreen({ view: 'hub' });
    }
  }, [isTimeOverToday]);

  // Persist current screen & configs in sessionStorage so PWA reloads restore mid-session state
  useEffect(() => {
    try {
      const payload: SavedNavState = {
        screen,
        gameConfigs,
      };
      window.sessionStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [gameConfigs, screen]);

  // Reset scroll offset on top-level view transitions so long pages never strand the next screen scrolled down
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  // Sync in-app navigation with browser history so Android Back navigates within Pebble
  // instead of exiting the installed PWA, and guards active games from accidental exits.
  useEffect(() => {
    const currentHistoryScreen = parseScreen(window.history.state?.pebbleScreen);
    if (!currentHistoryScreen) {
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
      const targetScreen = parseScreen(stateObj?.pebbleScreen) ?? { view: 'hub' as const };
      const prevScreen = screenRef.current;

      if (prevScreen.view === 'journey-play' && targetScreen.view !== 'journey-play') {
        clearAllSavedGames();
        isGameActiveRef.current = false;
        setCompletedActivity(null);
        setIntroActivity(null);
      }

      if (
        prevScreen.view === 'game-play' &&
        (targetScreen.view !== 'game-play' || targetScreen.gameId !== prevScreen.gameId)
      ) {
        clearSavedGameById(prevScreen.gameId);
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
    if (fallbackScreen.view === 'game-play') {
      const current = screenRef.current;
      if (current.view === 'game-play' && current.gameId !== fallbackScreen.gameId) {
        clearSavedGameById(current.gameId);
      }
    } else if (fallbackScreen.view !== 'journey-play') {
      clearAllSavedGames();
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

  const leaveToHub = useCallback((skipGuard: boolean) => {
    if (!skipGuard && isPlayScreen(screenRef.current) && isGameActiveRef.current) {
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

  const navigateToHub = useCallback(() => leaveToHub(false), [leaveToHub]);
  const forceLeaveToHub = useCallback(() => leaveToHub(true), [leaveToHub]);

  const handleGameActiveChange = useCallback((active: boolean) => {
    isGameActiveRef.current = active;
  }, []);

  const handleOpenGame = useCallback(
    (gameId: GameId) => {
      preloadGamePlugin(gameId);
      navigateTo({ view: 'game-setup', gameId });
    },
    [navigateTo],
  );

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

  const handleChangeDailyLimitMinutes = useCallback((limitMinutes: number) => {
    setDailyLimit((prev) => ({
      ...prev,
      dateKey: getLocalDateKey(),
      limitMinutes: sanitizeLimitMinutes(limitMinutes),
    }));
  }, []);

  const handleResetDailyTimeToday = useCallback(() => {
    setDailyLimit((prev) => ({
      ...prev,
      dateKey: getLocalDateKey(),
      usedSeconds: 0,
    }));
  }, []);

  const renderScreen = (): ReactNode => {
    if (isTimeOverToday && !isGrownUpScreen) {
      return (
        <DailyTimeOverScreen
          childProfile={profiles[0]}
          soundEnabled={soundEnabled}
          onOpenParentGate={() => setParentGateTarget('parent-settings')}
        />
      );
    }

    if (screen.view === 'profiles') {
      return <FamilyProfilesPage onBack={() => navigateBack(screen.returnTo)} />;
    }

    if (screen.view === 'parent-settings') {
      return (
        <ParentJourneySettingsPage
          journeyState={journeyState}
          curriculum={curriculum}
          dailyLimit={dailyLimit}
          onChangeDailyLimitMinutes={handleChangeDailyLimitMinutes}
          onResetDailyTimeToday={handleResetDailyTimeToday}
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
          onOpenProfiles={() =>
            navigateTo({ view: 'profiles', returnTo: { view: 'parent-settings' } })
          }
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
          onOpenProfiles={() =>
            navigateTo({ view: 'profiles', returnTo: { view: 'free-play-hub' } })
          }
          onOpenParentInsights={() => navigateTo({ view: 'parent-insights' })}
        />
      );
    }

    if (screen.view === 'parent-insights') {
      return (
        <ParentInsightsPage
          profiles={profiles}
          dailyLimit={dailyLimit}
          onChangeDailyLimitMinutes={handleChangeDailyLimitMinutes}
          onResetDailyTimeToday={handleResetDailyTimeToday}
          onOpenJourneySettings={() => navigateTo({ view: 'parent-settings' })}
          onUpdateProfile={updateProfile}
          onOpenGame={handleOpenGame}
          onBackToHub={() => navigateBack({ view: 'hub' })}
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

      return renderPluginBoard(activeActivity.gameId, activeActivity.payload.config, {
        gameKey: screen.gameKey,
        profiles,
        soundEnabled,
        onToggleSound: toggleSound,
        onChangeSetup: () => undefined,
        onBackToHub: navigateToHub,
        onGameActiveChange: handleGameActiveChange,
        journeyContext,
      });
    }

    if (screen.view === 'game-setup') {
      const { gameId } = screen;
      return renderPluginSetup(gameId, {
        profiles,
        initialConfig: gameConfigs[gameId] ?? null,
        onBackToHub: () => navigateBack({ view: 'hub' }),
        onEditProfiles: () =>
          navigateTo({ view: 'profiles', returnTo: { view: 'game-setup', gameId } }),
        onStartGame: (config) => {
          clearSavedGameById(gameId);
          setGameConfigs((prev) => {
            const next: SavedGameConfigs = { ...prev };
            if (isValidGameConfig(gameId, config)) {
              setSavedConfig(next, gameId, config);
            }
            return next;
          });
          navigateTo({ view: 'game-play', gameId, gameKey: Date.now() });
        },
      });
    }

    if (screen.view === 'game-play') {
      const { gameId, gameKey } = screen;
      return renderPluginBoard(gameId, gameConfigs[gameId], {
        gameKey,
        profiles,
        soundEnabled,
        onToggleSound: toggleSound,
        onChangeSetup: () => navigateBack({ view: 'game-setup', gameId }, true),
        onBackToHub: navigateToHub,
        onGameActiveChange: handleGameActiveChange,
      });
    }

    if (journeyState.settings.guidedModeEnabled) {
      return (
        <ActivityBookPage
          childProfile={profiles[0]}
          curriculum={curriculum}
          journeyState={journeyState}
          onStartActivity={(act) => setIntroActivity(act)}
          onOpenParentGate={() => setParentGateTarget('parent-settings')}
        />
      );
    }

    return (
      <GameHubPage
        profiles={profiles}
        onOpenGame={handleOpenGame}
        onOpenProfiles={() => navigateTo({ view: 'profiles', returnTo: { view: 'hub' } })}
        onOpenParentInsights={() => setParentGateTarget('parent-insights')}
        onOpenJourneySettings={() => setParentGateTarget('parent-settings')}
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

  const leaveModalCopy =
    screen.view === 'journey-play'
      ? {
          headline: 'Leave current activity?',
          subtitle: 'Your current activity progress will reset so you can start fresh next time.',
          keepPlayingLabel: 'Keep Playing',
          leaveLabel: 'Back to Activity Book',
        }
      : screen.view === 'game-play'
        ? {
            ...getGamePlugin(screen.gameId).leaveCopy,
            leaveLabel: 'Back to Games',
          }
        : null;

  return (
    <>
      <Suspense fallback={<GameLoadingFallback />}>{renderScreen()}</Suspense>

      {leaveModalCopy && (
        <LeaveGameModal
          open={showLeaveConfirm}
          headline={leaveModalCopy.headline}
          subtitle={leaveModalCopy.subtitle}
          keepPlayingLabel={leaveModalCopy.keepPlayingLabel}
          leaveLabel={leaveModalCopy.leaveLabel}
          onKeepPlaying={() => setShowLeaveConfirm(false)}
          onConfirmLeave={forceLeaveToHub}
        />
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

      {parentGateTarget && (
        <ParentGateModal
          onSuccess={() => {
            const target = parentGateTarget;
            setParentGateTarget(null);
            navigateTo({ view: target });
          }}
          onCancel={() => setParentGateTarget(null)}
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
