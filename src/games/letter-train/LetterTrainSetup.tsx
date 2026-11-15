import { useEffect, useState } from 'react';
import { BrandLogo, CrownIcon } from '../../components/BrandLogo';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import { preloadLettersAudio, preloadWordsAudio } from '../../utils/wordAudio';
import {
  ALL_LETTERS,
  VOWEL_LETTERS,
  getStationSpec,
  isValidLetterId,
  loadMasteredLetters,
  loadPerfectLetters,
  type LetterId,
} from './letterData';

export type StationOrderMode = 'alphabetical' | 'shuffle';
export type WordLabelMode = 'after-drop' | 'always';

export interface LetterTrainConfig {
  selectedLetters: LetterId[];
  orderMode: StationOrderMode;
  wordLabelMode: WordLabelMode;
}

export function isValidLetterTrainConfig(value: unknown): value is LetterTrainConfig {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<LetterTrainConfig>;
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

export function getDefaultLetterTrainConfig(): LetterTrainConfig {
  return {
    selectedLetters: [...ALL_LETTERS],
    orderMode: 'alphabetical',
    wordLabelMode: 'after-drop',
  };
}

interface LetterTrainSetupProps {
  childProfile: FamilyProfile;
  initialConfig?: LetterTrainConfig | null;
  onBackToHub: () => void;
  onEditProfiles: () => void;
  onStartGame: (config: LetterTrainConfig) => void;
}

export function LetterTrainSetup({
  childProfile,
  initialConfig,
  onBackToHub,
  onEditProfiles,
  onStartGame,
}: LetterTrainSetupProps) {
  const [selectedLetters, setSelectedLetters] = useState<LetterId[]>(() =>
    initialConfig && initialConfig.selectedLetters.length > 0
      ? ALL_LETTERS.filter((l) => initialConfig.selectedLetters.includes(l))
      : [...ALL_LETTERS],
  );

  // Silently warm up audio clips for the first 4 selected stations before Start
  useEffect(() => {
    const initialLetters = selectedLetters.slice(0, 4);
    if (initialLetters.length === 0) return;
    preloadLettersAudio(initialLetters);
    preloadWordsAudio(initialLetters.flatMap((letter) => getStationSpec(letter).words.map((w) => w.id)));
  }, [selectedLetters]);
  const [orderMode, setOrderMode] = useState<StationOrderMode>(
    initialConfig?.orderMode ?? 'alphabetical',
  );
  const [wordLabelMode, setWordLabelMode] = useState<WordLabelMode>(
    initialConfig?.wordLabelMode ?? 'after-drop',
  );
  const [masteredLetters] = useState<LetterId[]>(() => loadMasteredLetters());
  const [perfectLetters] = useState<LetterId[]>(() => loadPerfectLetters());
  const [letterHint, setLetterHint] = useState<string | null>(null);

  const masteredSet = new Set<LetterId>(masteredLetters);
  const perfectSet = new Set<LetterId>(perfectLetters);
  const selectedSet = new Set<LetterId>(selectedLetters);
  const allSelected = selectedLetters.length === ALL_LETTERS.length;
  const vowelsSelected =
    selectedLetters.length === VOWEL_LETTERS.length &&
    VOWEL_LETTERS.every((v) => selectedSet.has(v));
  const unmasteredLetters = ALL_LETTERS.filter((l) => !perfectSet.has(l));

  const toggleLetter = (letter: LetterId) => {
    setLetterHint(null);
    setSelectedLetters((prev) => {
      if (prev.includes(letter)) {
        if (prev.length === 1) {
          setLetterHint('Keep at least 1 letter selected so the train has a station to visit.');
          return prev;
        }
        return prev.filter((item) => item !== letter);
      }
      const nextSet = new Set<LetterId>([...prev, letter]);
      return ALL_LETTERS.filter((l) => nextSet.has(l));
    });
  };

  const selectAll = () => {
    setLetterHint(null);
    setSelectedLetters([...ALL_LETTERS]);
  };

  const selectVowels = () => {
    setLetterHint(null);
    setSelectedLetters([...VOWEL_LETTERS]);
  };

  const selectNeedCrown = () => {
    setLetterHint(null);
    if (unmasteredLetters.length > 0) {
      setSelectedLetters([...unmasteredLetters]);
    } else {
      setSelectedLetters([...ALL_LETTERS]);
    }
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
        <h1>Letter Train</h1>
        <p>
          Pick all 3 matching words with <strong>zero mistakes</strong> to win a Golden Crown and
          cheering applause! New words appear every trip.
        </p>
      </div>

      {/* 1. A-Z Station Picker (All 26 selected by default) */}
      <section className="setup-card-section" aria-labelledby="lt-letters-heading">
        <div className="setup-section-header">
          <div>
            <h2 id="lt-letters-heading">1. Station Letters ({selectedLetters.length} of 26)</h2>
            <span className="lt-mastery-caption">
              {perfectLetters.length} / 26 Golden Crowns • {masteredLetters.length} / 26 Cleared
            </span>
          </div>
          <div className="category-filter-pills" role="group" aria-label="Quick letter presets">
            <button
              type="button"
              className={`category-pill-btn ${allSelected ? 'category-pill-btn--active' : ''}`}
              aria-pressed={allSelected}
              onClick={selectAll}
            >
              All A–Z (26)
            </button>
            <button
              type="button"
              className={`category-pill-btn ${vowelsSelected ? 'category-pill-btn--active' : ''}`}
              aria-pressed={vowelsSelected}
              onClick={selectVowels}
            >
              Vowels (5)
            </button>
            {unmasteredLetters.length > 0 && unmasteredLetters.length < 26 && (
              <button
                type="button"
                className="category-pill-btn"
                onClick={selectNeedCrown}
              >
                Need Crown ({unmasteredLetters.length})
              </button>
            )}
          </div>
        </div>

        <div className="lt-letter-grid" role="group" aria-label="Toggle letters A through Z">
          {ALL_LETTERS.map((letter) => {
            const isSelected = selectedSet.has(letter);
            const isPerfect = perfectSet.has(letter);
            const isMastered = masteredSet.has(letter);
            return (
              <button
                key={letter}
                type="button"
                className={`lt-letter-tile ${isSelected ? 'lt-letter-tile--selected' : ''} ${
                  isPerfect ? 'lt-letter-tile--perfect' : ''
                }`}
                aria-pressed={isSelected}
                onClick={() => toggleLetter(letter)}
              >
                <span className="lt-letter-tile__upper">{letter}</span>
                <span className="lt-letter-tile__lower">{letter.toLowerCase()}</span>
                {isPerfect ? (
                  <span
                    className="lt-letter-tile__badge lt-letter-tile__badge--gold"
                    title="Perfect Golden Crown!"
                    aria-label="Perfect Golden Crown"
                  >
                    <CrownIcon size={11} />
                  </span>
                ) : isMastered ? (
                  <span className="lt-letter-tile__badge" title="Cleared" aria-label="Cleared">
                    ✓
                  </span>
                ) : null}
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

      {/* 2. Train Journey Options */}
      <section className="setup-card-section" aria-labelledby="lt-options-heading">
        <div className="setup-section-header" style={{ marginBottom: 10 }}>
          <h2 id="lt-options-heading">2. Trip Style</h2>
        </div>

        <div className="lt-options-grid">
          <div className="lt-option-group">
            <span className="lt-option-group__label">Station Order</span>
            <div className="lt-toggle-pills">
              <button
                type="button"
                className={`lt-toggle-pill ${orderMode === 'alphabetical' ? 'lt-toggle-pill--active' : ''}`}
                aria-pressed={orderMode === 'alphabetical'}
                onClick={() => setOrderMode('alphabetical')}
              >
                <strong>A → Z Order</strong>
                <span>Classic alphabet trip</span>
              </button>
              <button
                type="button"
                className={`lt-toggle-pill ${orderMode === 'shuffle' ? 'lt-toggle-pill--active' : ''}`}
                aria-pressed={orderMode === 'shuffle'}
                onClick={() => setOrderMode('shuffle')}
              >
                <strong>Surprise Mix</strong>
                <span>Random station order</span>
              </button>
            </div>
          </div>

          <div className="lt-option-group">
            <span className="lt-option-group__label">Word Spelling Hint</span>
            <div className="lt-toggle-pills">
              <button
                type="button"
                className={`lt-toggle-pill ${wordLabelMode === 'after-drop' ? 'lt-toggle-pill--active' : ''}`}
                aria-pressed={wordLabelMode === 'after-drop'}
                onClick={() => setWordLabelMode('after-drop')}
              >
                <strong>Sound First</strong>
                <span>Speak on touch, spell on drop</span>
              </button>
              <button
                type="button"
                className={`lt-toggle-pill ${wordLabelMode === 'always' ? 'lt-toggle-pill--active' : ''}`}
                aria-pressed={wordLabelMode === 'always'}
                onClick={() => setWordLabelMode('always')}
              >
                <strong>Show Spelling</strong>
                <span>Print word under pictures</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="setup-launch-bar">
        <div className="setup-launch-summary">
          <strong>
            {selectedLetters.length} {selectedLetters.length === 1 ? 'Station' : 'Stations'} • Fresh
            Words Every Game
          </strong>
          <span>
            {orderMode === 'alphabetical' ? 'A → Z in order' : 'Shuffled stations'} • Conductor:{' '}
            {childProfile.name}
          </span>
        </div>
        <button type="button" className="btn-primary" onClick={handleStart}>
          All Aboard! Start Train
        </button>
      </footer>
    </div>
  );
}
