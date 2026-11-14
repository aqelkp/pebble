import { useState } from 'react';
import { BrandLogo } from '../../components/BrandLogo';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import {
  ALL_LETTERS,
  RIVER_LEARNING_HYPOTHESIS,
  TRICKY_PAIR_LETTERS,
  VOWEL_LETTERS,
  isValidLetterId,
  loadRiverMasteredLetters,
  type LetterId,
} from './riverData';

export type BucketOrderMode = 'alphabetical' | 'shuffle';
export type RiverWordLabelMode = 'after-drop' | 'always';

export interface LetterRiverConfig {
  selectedLetters: LetterId[];
  orderMode: BucketOrderMode;
  wordLabelMode: RiverWordLabelMode;
}

export function isValidLetterRiverConfig(value: unknown): value is LetterRiverConfig {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<LetterRiverConfig>;
  if (
    !Array.isArray(candidate.selectedLetters) ||
    candidate.selectedLetters.length === 0 ||
    candidate.selectedLetters.length > 26 ||
    !candidate.selectedLetters.every((item) => isValidLetterId(item))
  ) {
    return false;
  }
  if (candidate.orderMode !== 'alphabetical' && candidate.orderMode !== 'shuffle') {
    return false;
  }
  if (candidate.wordLabelMode !== 'after-drop' && candidate.wordLabelMode !== 'always') {
    return false;
  }
  return true;
}

export function getDefaultLetterRiverConfig(): LetterRiverConfig {
  return {
    selectedLetters: [...ALL_LETTERS],
    orderMode: 'alphabetical',
    wordLabelMode: 'after-drop',
  };
}

function setsEqual(selected: readonly LetterId[], target: readonly LetterId[]): boolean {
  if (selected.length !== target.length) return false;
  const set = new Set<LetterId>(selected);
  return target.every((item) => set.has(item));
}

interface LetterRiverSetupProps {
  childProfile: FamilyProfile;
  initialConfig?: LetterRiverConfig | null;
  onBackToHub: () => void;
  onEditProfiles: () => void;
  onStartGame: (config: LetterRiverConfig) => void;
}

export function LetterRiverSetup({
  childProfile,
  initialConfig,
  onBackToHub,
  onEditProfiles,
  onStartGame,
}: LetterRiverSetupProps) {
  const [selectedLetters, setSelectedLetters] = useState<LetterId[]>(() =>
    initialConfig && initialConfig.selectedLetters.length > 0
      ? ALL_LETTERS.filter((l) => initialConfig.selectedLetters.includes(l))
      : [...ALL_LETTERS],
  );
  const [orderMode, setOrderMode] = useState<BucketOrderMode>(
    initialConfig?.orderMode ?? 'alphabetical',
  );
  const [wordLabelMode, setWordLabelMode] = useState<RiverWordLabelMode>(
    initialConfig?.wordLabelMode ?? 'after-drop',
  );
  const [masteredLetters] = useState<LetterId[]>(() => loadRiverMasteredLetters());
  const [letterHint, setLetterHint] = useState<string | null>(null);

  const masteredSet = new Set<LetterId>(masteredLetters);
  const selectedSet = new Set<LetterId>(selectedLetters);
  const allSelected = setsEqual(selectedLetters, ALL_LETTERS);
  const trickySelected = setsEqual(selectedLetters, TRICKY_PAIR_LETTERS);
  const vowelsSelected = setsEqual(selectedLetters, VOWEL_LETTERS);
  const unmasteredLetters = ALL_LETTERS.filter((l) => !masteredSet.has(l));

  const toggleLetter = (letter: LetterId) => {
    setLetterHint(null);
    setSelectedLetters((prev) => {
      if (prev.includes(letter)) {
        if (prev.length === 1) {
          setLetterHint('Keep at least 1 letter selected so there is a bucket on the dock!');
          return prev;
        }
        return prev.filter((item) => item !== letter);
      }
      const nextSet = new Set<LetterId>([...prev, letter]);
      return ALL_LETTERS.filter((l) => nextSet.has(l));
    });
  };

  const applyPreset = (letters: readonly LetterId[]) => {
    setLetterHint(null);
    setSelectedLetters(ALL_LETTERS.filter((l) => letters.includes(l)));
  };

  const handleStart = () => {
    const cleanLetters = ALL_LETTERS.filter((l) => selectedSet.has(l));
    onStartGame({
      selectedLetters: cleanLetters.length > 0 ? cleanLetters : [...ALL_LETTERS],
      orderMode,
      wordLabelMode,
    });
  };

  return (
    <div className="app-shell">
      <header className="top-bar" style={{ marginBottom: 10 }}>
        <div className="top-bar__left">
          <button type="button" className="icon-pill-btn" onClick={onBackToHub}>
            <span aria-hidden="true">←</span>
            <span>Games</span>
          </button>
        </div>
        <BrandLogo size="sm" />
        <div className="top-bar__right">
          <button
            type="button"
            className="lt-solo-conductor-chip"
            onClick={onEditProfiles}
            aria-label={`Playing as ${childProfile.name}. Tap to edit name or avatar`}
          >
            <img src={getAvatarSrc(childProfile.avatar)} alt="" />
            <span>{childProfile.name}</span>
          </button>
        </div>
      </header>

      <div className="page-title-block" style={{ marginTop: 2, marginBottom: 10 }}>
        <h1>Letter River</h1>
        <p>
          Scoop swimming picture fish into matching letter buckets—fill 3 catches to pop a bucket
          and welcome the next letter!
        </p>
      </div>

      {/* Pedagogical Hypothesis Card */}
      <aside className="lr-hypothesis-card" aria-label="Learning hypothesis">
        <div className="lr-hypothesis-card__badge">{RIVER_LEARNING_HYPOTHESIS.skill}</div>
        <strong>{RIVER_LEARNING_HYPOTHESIS.headline}</strong>
        <p>{RIVER_LEARNING_HYPOTHESIS.detail}</p>
      </aside>

      {/* 1. A-Z River Letters Picker */}
      <section className="setup-card-section" aria-labelledby="lr-letters-heading">
        <div className="setup-section-header">
          <div>
            <h2 id="lr-letters-heading">1. River Letters ({selectedLetters.length} of 26)</h2>
            <span className="lt-mastery-caption">
              {masteredLetters.length} / 26 river badges caught
            </span>
          </div>
          <div className="category-filter-pills" role="group" aria-label="Quick letter presets">
            <button
              type="button"
              className={`category-pill-btn ${allSelected ? 'category-pill-btn--active' : ''}`}
              aria-pressed={allSelected}
              onClick={() => applyPreset(ALL_LETTERS)}
            >
              All A–Z (26)
            </button>
            <button
              type="button"
              className={`category-pill-btn ${trickySelected ? 'category-pill-btn--active' : ''}`}
              aria-pressed={trickySelected}
              onClick={() => applyPreset(TRICKY_PAIR_LETTERS)}
            >
              Tricky Pairs (6)
            </button>
            <button
              type="button"
              className={`category-pill-btn ${vowelsSelected ? 'category-pill-btn--active' : ''}`}
              aria-pressed={vowelsSelected}
              onClick={() => applyPreset(VOWEL_LETTERS)}
            >
              Vowels (5)
            </button>
            {unmasteredLetters.length > 0 && unmasteredLetters.length < 26 && (
              <button
                type="button"
                className="category-pill-btn"
                onClick={() => applyPreset(unmasteredLetters)}
              >
                New ({unmasteredLetters.length})
              </button>
            )}
          </div>
        </div>

        <div className="lt-letter-grid" role="group" aria-label="Toggle letters A through Z">
          {ALL_LETTERS.map((letter) => {
            const isSelected = selectedSet.has(letter);
            const isMastered = masteredSet.has(letter);
            return (
              <button
                key={letter}
                type="button"
                className={`lt-letter-tile ${isSelected ? 'lt-letter-tile--selected' : ''}`}
                aria-pressed={isSelected}
                onClick={() => toggleLetter(letter)}
              >
                <span className="lt-letter-tile__upper">{letter}</span>
                <span className="lt-letter-tile__lower">{letter.toLowerCase()}</span>
                {isMastered && (
                  <span className="lt-letter-tile__badge" title="Caught!" aria-label="Caught">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {letterHint && (
          <p className="lt-setup-hint" role="status">
            {letterHint}
          </p>
        )}
      </section>

      {/* 2. Fishing Style Options */}
      <section className="setup-card-section" aria-labelledby="lr-options-heading">
        <div className="setup-section-header" style={{ marginBottom: 10 }}>
          <h2 id="lr-options-heading">2. Fishing Style</h2>
        </div>

        <div className="lt-options-grid">
          <div className="lt-option-group">
            <span className="lt-option-group__label">Bucket Order</span>
            <div className="lt-toggle-pills">
              <button
                type="button"
                className={`lt-toggle-pill ${orderMode === 'alphabetical' ? 'lt-toggle-pill--active' : ''}`}
                aria-pressed={orderMode === 'alphabetical'}
                onClick={() => setOrderMode('alphabetical')}
              >
                <strong>A → Z Stream</strong>
                <span>Classic alphabet flow</span>
              </button>
              <button
                type="button"
                className={`lt-toggle-pill ${orderMode === 'shuffle' ? 'lt-toggle-pill--active' : ''}`}
                aria-pressed={orderMode === 'shuffle'}
                onClick={() => setOrderMode('shuffle')}
              >
                <strong>Surprise Current</strong>
                <span>Mixed bucket order</span>
              </button>
            </div>
          </div>

          <div className="lt-option-group">
            <span className="lt-option-group__label">Fish Clue Style</span>
            <div className="lt-toggle-pills">
              <button
                type="button"
                className={`lt-toggle-pill ${wordLabelMode === 'after-drop' ? 'lt-toggle-pill--active' : ''}`}
                aria-pressed={wordLabelMode === 'after-drop'}
                onClick={() => setWordLabelMode('after-drop')}
              >
                <strong>Sound First</strong>
                <span>Picture on fish; speaks on grab, spells in bucket</span>
              </button>
              <button
                type="button"
                className={`lt-toggle-pill ${wordLabelMode === 'always' ? 'lt-toggle-pill--active' : ''}`}
                aria-pressed={wordLabelMode === 'always'}
                onClick={() => setWordLabelMode('always')}
              >
                <strong>Show Words</strong>
                <span>Print word on swimming fish too</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="setup-launch-bar">
        <div className="setup-launch-summary">
          <strong>
            {selectedLetters.length} {selectedLetters.length === 1 ? 'Bucket' : 'Buckets'} Ready
          </strong>
          <span>
            {orderMode === 'alphabetical' ? 'A → Z order' : 'Mixed currents'} •{' '}
            {wordLabelMode === 'after-drop' ? 'Sound First' : 'Words visible'} • Angler:{' '}
            {childProfile.name}
          </span>
        </div>
        <button type="button" className="btn-primary" onClick={handleStart}>
          Start Fishing!
        </button>
      </footer>
    </div>
  );
}
