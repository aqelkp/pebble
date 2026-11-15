import { useState } from 'react';
import { PebbleMark } from '../components/BrandLogo';
import type { LetterId } from '../data/wordBank';
import { ALL_LETTERS } from '../games/letter-train/letterData';
import { GAME_REGISTRY, type GameRegistryEntry } from '../games/registry';
import {
  ACTIVITIES_PER_CHAPTER,
  TOTAL_ACTIVITIES,
  TOTAL_CHAPTERS,
  type FunBreakPacingMode,
  type JourneyActivity,
  type JourneyProgressState,
  type JourneySettings,
  type LettersPerLesson,
} from '../journey/journeyTypes';
import { assetUrl } from '../utils/assets';

interface ParentJourneySettingsPageProps {
  journeyState: JourneyProgressState;
  curriculum: JourneyActivity[];
  onUpdateSettings: (patch: Partial<JourneySettings>) => void;
  onJumpToActivityIndex: (index: number) => void;
  onResetJourney: () => void;
  onTestIndividualGame: (gameId: GameRegistryEntry['id']) => void;
  onOpenFreePlayHub: () => void;
  onOpenParentInsights: () => void;
  onOpenProfiles: () => void;
  onBack: () => void;
}

const LETTERS_PER_LESSON_OPTIONS: readonly LettersPerLesson[] = [3, 4, 5];

const FUN_BREAK_PACING_OPTIONS: readonly {
  id: FunBreakPacingMode;
  label: string;
}[] = [
  { id: 'balanced', label: 'Balanced (Equal Mix)' },
  { id: 'every-2', label: 'Every 2nd' },
  { id: 'every-3', label: 'Every 3rd' },
  { id: 'off', label: 'Standard Mix' },
];

export function ParentJourneySettingsPage({
  journeyState,
  curriculum,
  onUpdateSettings,
  onJumpToActivityIndex,
  onResetJourney,
  onTestIndividualGame,
  onOpenFreePlayHub,
  onOpenParentInsights,
  onOpenProfiles,
  onBack,
}: ParentJourneySettingsPageProps) {
  const { settings } = journeyState;
  const [confirmReset, setConfirmReset] = useState(false);

  const currentAct =
    curriculum[journeyState.currentActivityIndex] ?? curriculum[0];

  const handleToggleLetter = (letter: LetterId) => {
    const isSelected = settings.selectedLetters.includes(letter);
    if (isSelected) {
      if (settings.selectedLetters.length <= 3) return;
      onUpdateSettings({
        selectedLetters: settings.selectedLetters.filter((item) => item !== letter),
      });
      return;
    }
    const merged = new Set([...settings.selectedLetters, letter]);
    onUpdateSettings({
      selectedLetters: ALL_LETTERS.filter((item) => merged.has(item)),
    });
  };

  const handleToggleGame = (gameId: GameRegistryEntry['id']) => {
    const isEnabled = settings.enabledGames.includes(gameId);
    if (isEnabled) {
      if (settings.enabledGames.length <= 1) return;
      onUpdateSettings({
        enabledGames: settings.enabledGames.filter((id) => id !== gameId),
      });
      return;
    }
    const merged = new Set([...settings.enabledGames, gameId]);
    onUpdateSettings({
      enabledGames: GAME_REGISTRY.map((g) => g.id).filter((id) => merged.has(id)),
    });
  };

  return (
    <div className="pjs-shell">
      <header className="top-bar">
        <button type="button" className="icon-pill-btn" onClick={onBack}>
          <span aria-hidden="true">←</span>
          <span>{settings.guidedModeEnabled ? 'Activity Book' : 'Game Hub'}</span>
        </button>

        <div className="pjs-topbar-title">
          <PebbleMark size={30} />
          <h1>Parent Journey Settings</h1>
        </div>

        <span className="badge-pill badge-pill--indigo">Grown-Ups Only</span>
      </header>

      <div className="pjs-grid">
        <section className="pjs-card" aria-labelledby="pjs-mode-title">
          <div className="pjs-card__head">
            <div>
              <h2 id="pjs-mode-title">Guided Activity Book Mode</h2>
              <p>
                Lock the child into a calm, linear 400-activity path with pre-selected mini-lessons
                or switch to Free Play Hub.
              </p>
            </div>
            <span
              className={`badge-pill ${
                settings.guidedModeEnabled ? 'badge-pill--mint' : 'badge-pill--muted'
              }`}
            >
              {settings.guidedModeEnabled ? 'Active' : 'Free Play'}
            </span>
          </div>

          <div className="pjs-pill-group">
            <button
              type="button"
              className={`pjs-pill ${settings.guidedModeEnabled ? 'pjs-pill--active' : ''}`}
              onClick={() => onUpdateSettings({ guidedModeEnabled: true })}
            >
              ON • Guided Activity Book
            </button>
            <button
              type="button"
              className={`pjs-pill ${!settings.guidedModeEnabled ? 'pjs-pill--active' : ''}`}
              onClick={() => onUpdateSettings({ guidedModeEnabled: false })}
            >
              OFF • Free Play Hub
            </button>
          </div>
        </section>

        <section className="pjs-card" aria-labelledby="pjs-pacing-title">
          <div className="pjs-card__head">
            <div>
              <h2 id="pjs-pacing-title">Lesson Pacing, Voice Intro &amp; Players</h2>
              <p>
                Keep mini-lessons short so your child rotates through fresh skills without fatigue.
              </p>
            </div>
          </div>

          <div className="pjs-rows">
            <div className="pjs-row">
              <div className="pjs-row__label">
                <strong>Letters per Phonics Lesson</strong>
                <span>Sliced cleanly across chapters for 100% alphabet coverage</span>
              </div>
              <div className="pjs-pill-group">
                {LETTERS_PER_LESSON_OPTIONS.map((count) => (
                  <button
                    key={count}
                    type="button"
                    className={`pjs-pill ${
                      settings.lettersPerLesson === count ? 'pjs-pill--active' : ''
                    }`}
                    onClick={() => onUpdateSettings({ lettersPerLesson: count })}
                  >
                    {count} Letters
                  </button>
                ))}
              </div>
            </div>

            <div className="pjs-row">
              <div className="pjs-row__label">
                <strong>Activity Duration</strong>
                <span>Controls puzzle size and word/stop count per lesson</span>
              </div>
              <div className="pjs-pill-group">
                <button
                  type="button"
                  className={`pjs-pill ${
                    settings.durationMode === 'short' ? 'pjs-pill--active' : ''
                  }`}
                  onClick={() => onUpdateSettings({ durationMode: 'short' })}
                >
                  Short (~2 min)
                </button>
                <button
                  type="button"
                  className={`pjs-pill ${
                    settings.durationMode === 'standard' ? 'pjs-pill--active' : ''
                  }`}
                  onClick={() => onUpdateSettings({ durationMode: 'standard' })}
                >
                  Standard (~4 min)
                </button>
              </div>
            </div>

            <div className="pjs-row">
              <div className="pjs-row__label">
                <strong>Pre-Activity Voice Intro</strong>
                <span>Brief spoken preview with word highlighting before play starts</span>
              </div>
              <div className="pjs-pill-group">
                <button
                  type="button"
                  className={`pjs-pill ${settings.waitForVoiceIntro ? 'pjs-pill--active' : ''}`}
                  onClick={() => onUpdateSettings({ waitForVoiceIntro: true })}
                >
                  Wait for Voice
                </button>
                <button
                  type="button"
                  className={`pjs-pill ${!settings.waitForVoiceIntro ? 'pjs-pill--active' : ''}`}
                  onClick={() => onUpdateSettings({ waitForVoiceIntro: false })}
                >
                  Allow Skip
                </button>
              </div>
            </div>

            <div className="pjs-row">
              <div className="pjs-row__label">
                <strong>Fun Break Pacing</strong>
                <span>
                  Weaves fun reward games at equal frequency with learning lessons across 400
                  activities
                </span>
              </div>
              <div className="pjs-pill-group">
                {FUN_BREAK_PACING_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`pjs-pill ${
                      settings.funBreakPacing === opt.id ? 'pjs-pill--active' : ''
                    }`}
                    onClick={() => onUpdateSettings({ funBreakPacing: opt.id })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pjs-row">
              <div className="pjs-row__label">
                <strong>Default Players</strong>
                <span>Switch between independent play and turn-taking together</span>
              </div>
              <div className="pjs-pill-group">
                <button
                  type="button"
                  className={`pjs-pill ${settings.playerMode === 'solo' ? 'pjs-pill--active' : ''}`}
                  onClick={() => onUpdateSettings({ playerMode: 'solo' })}
                >
                  Solo Child (1P)
                </button>
                <button
                  type="button"
                  className={`pjs-pill ${
                    settings.playerMode === 'two-player' ? 'pjs-pill--active' : ''
                  }`}
                  onClick={() => onUpdateSettings({ playerMode: 'two-player' })}
                >
                  With Parent (2P)
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="pjs-card" aria-labelledby="pjs-letters-title">
          <div className="pjs-card__head">
            <div>
              <h2 id="pjs-letters-title">
                Selected Letters ({settings.selectedLetters.length} / 26 Active)
              </h2>
              <p>
                All 26 letters are active by default. Tap any letter to customize focus (minimum 3
                required). Letters practiced so far: {journeyState.coveredLetters.length} / 26.
              </p>
            </div>

            {settings.selectedLetters.length < ALL_LETTERS.length && (
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.88rem' }}
                onClick={() => onUpdateSettings({ selectedLetters: [...ALL_LETTERS] })}
              >
                Select All A–Z
              </button>
            )}
          </div>

          <div className="pjs-letters-grid">
            {ALL_LETTERS.map((letter) => {
              const isSelected = settings.selectedLetters.includes(letter);
              const isCovered = journeyState.coveredLetters.includes(letter);
              return (
                <button
                  key={letter}
                  type="button"
                  className={`pjs-letter-chip ${isSelected ? 'pjs-letter-chip--on' : ''} ${
                    isCovered ? 'pjs-letter-chip--covered' : ''
                  }`}
                  aria-pressed={isSelected}
                  onClick={() => handleToggleLetter(letter)}
                >
                  <span>{letter}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="pjs-card" aria-labelledby="pjs-games-title">
          <div className="pjs-card__head">
            <div>
              <h2 id="pjs-games-title">
                Games Included in Mix ({settings.enabledGames.length} / {GAME_REGISTRY.length})
              </h2>
              <p>No two consecutive activities ever repeat the same game when multiple are active.</p>
            </div>
          </div>

          <div className="pjs-games-grid">
            {GAME_REGISTRY.map((game) => {
              const isEnabled = settings.enabledGames.includes(game.id);
              return (
                <button
                  key={game.id}
                  type="button"
                  className={`pjs-game-toggle ${isEnabled ? 'pjs-game-toggle--on' : ''}`}
                  aria-pressed={isEnabled}
                  onClick={() => handleToggleGame(game.id)}
                >
                  <img src={assetUrl(game.artPath)} alt="" />
                  <div className="pjs-game-toggle__meta">
                    <strong>{game.title}</strong>
                    <span>{game.learningIntent.conceptUnitLabel}</span>
                  </div>
                  <span className="pjs-game-toggle__check" aria-hidden="true">
                    {isEnabled ? '✓' : '+'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="pjs-card" aria-labelledby="pjs-position-title">
          <div className="pjs-card__head">
            <div>
              <h2 id="pjs-position-title">Journey Position &amp; Reset</h2>
              <p>
                Activity #{currentAct?.activityNumber ?? 1} of {TOTAL_ACTIVITIES} • Chapter{' '}
                {currentAct?.chapterNumber ?? 1} ({currentAct?.title})
              </p>
            </div>
            <span className="badge-pill badge-pill--honey">
              {journeyState.completedActivityIndices.length} Completed
            </span>
          </div>

          <div className="pjs-position-controls">
            <button
              type="button"
              className="btn-secondary"
              disabled={journeyState.currentActivityIndex <= 0}
              onClick={() =>
                onJumpToActivityIndex(Math.max(0, journeyState.currentActivityIndex - 1))
              }
            >
              ← Prev Activity
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={journeyState.currentActivityIndex >= TOTAL_ACTIVITIES - 1}
              onClick={() =>
                onJumpToActivityIndex(
                  Math.min(TOTAL_ACTIVITIES - 1, journeyState.currentActivityIndex + 1),
                )
              }
            >
              Next Activity →
            </button>

            {!confirmReset ? (
              <button
                type="button"
                className="btn-secondary pjs-reset-btn"
                onClick={() => setConfirmReset(true)}
              >
                Reset Progress
              </button>
            ) : (
              <div className="pjs-reset-confirm">
                <button
                  type="button"
                  className="btn-primary pjs-reset-confirm__btn"
                  onClick={() => {
                    setConfirmReset(false);
                    onResetJourney();
                  }}
                >
                  Confirm Reset to #1
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setConfirmReset(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="pjs-chapter-jump" aria-label="Jump to chapter">
            {Array.from({ length: TOTAL_CHAPTERS }, (_, idx) => {
              const chapterNum = idx + 1;
              const startIndex = idx * ACTIVITIES_PER_CHAPTER;
              const isActiveChapter = (currentAct?.chapterNumber ?? 1) === chapterNum;
              return (
                <button
                  key={chapterNum}
                  type="button"
                  className={`pjs-chapter-btn ${
                    isActiveChapter ? 'pjs-chapter-btn--active' : ''
                  }`}
                  onClick={() => onJumpToActivityIndex(startIndex)}
                >
                  Ch.{chapterNum}
                </button>
              );
            })}
          </div>
        </section>

        <section className="pjs-card" aria-labelledby="pjs-test-title">
          <div className="pjs-card__head">
            <div>
              <h2 id="pjs-test-title">Test Individual Games &amp; Parent Tools</h2>
              <p>
                Open any game&apos;s standalone Setup screen for testing or manual configuration
                without turning off Guided Mode.
              </p>
            </div>
          </div>

          <div className="pjs-test-grid">
            {GAME_REGISTRY.map((game) => (
              <button
                key={game.id}
                type="button"
                className="pjs-test-game-btn"
                data-testid={`test-game-${game.id}`}
                onClick={() => onTestIndividualGame(game.id)}
              >
                <img src={assetUrl(game.artPath)} alt="" />
                <span>{game.title}</span>
              </button>
            ))}
          </div>

          <div className="pjs-tools-row">
            <button type="button" className="btn-secondary" onClick={onOpenFreePlayHub}>
              Open Free Play Hub
            </button>
            <button type="button" className="btn-secondary" onClick={onOpenParentInsights}>
              Parent Insights
            </button>
            <button type="button" className="btn-secondary" onClick={onOpenProfiles}>
              Edit Family Names
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
