import { useEffect, useState } from 'react';
import { BrandLogo, CrownIcon } from '../../components/BrandLogo';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import {
  preloadLettersAudio,
  preloadTraceOrderVoice,
  preloadWordsAudio,
} from '../../utils/wordAudio';
import { ALL_LETTERS, getStationSpec, type LetterId } from '../letter-train/letterData';
import {
  MAGIC_C_LETTERS,
  REVERSAL_GUARD_LETTERS,
  SLANT_LETTERS,
  STRAIGHT_LETTERS,
  getDefaultLetterTraceConfig,
  loadTraceMastery,
  type LetterTraceConfig,
  type TraceCaseMode,
  type TraceContentMode,
  type TraceNumberRange,
  type TraceOrderMode,
  type TraceRoundSize,
} from './traceData';
import { ALL_SHAPE_TRACE_IDS, TRACEABLE_WORDS, getNumbersForRange } from './k1ExtraTraces';

interface LetterTraceSetupProps {
  childProfile: FamilyProfile;
  initialConfig?: LetterTraceConfig | null;
  onBackToHub: () => void;
  onEditProfiles: () => void;
  onStartGame: (config: LetterTraceConfig) => void;
}

function matchesGroup(selected: readonly LetterId[], target: readonly LetterId[]): boolean {
  if (selected.length !== target.length) return false;
  const set = new Set<LetterId>(selected);
  return target.every((letter) => set.has(letter));
}

export function LetterTraceSetup({
  childProfile,
  initialConfig,
  onBackToHub,
  onEditProfiles,
  onStartGame,
}: LetterTraceSetupProps) {
  const defaults = getDefaultLetterTraceConfig();
  const [selectedLetters, setSelectedLetters] = useState<LetterId[]>(() =>
    initialConfig && initialConfig.selectedLetters.length > 0
      ? ALL_LETTERS.filter((l) => initialConfig.selectedLetters.includes(l))
      : [...defaults.selectedLetters],
  );
  const [caseMode, setCaseMode] = useState<TraceCaseMode>(
    initialConfig?.caseMode ?? defaults.caseMode,
  );
  const [roundSize, setRoundSize] = useState<TraceRoundSize>(
    initialConfig?.roundSize ?? defaults.roundSize,
  );
  const [orderMode, setOrderMode] = useState<TraceOrderMode>(
    initialConfig?.orderMode ?? defaults.orderMode,
  );
  const [traceMode, setTraceMode] = useState<TraceContentMode>(
    initialConfig?.traceMode ?? 'letters',
  );
  const [numberRange, setNumberRange] = useState<TraceNumberRange>(
    initialConfig?.numberRange ?? '0-50',
  );
  const [mastery] = useState(() => loadTraceMastery());
  const [letterHint, setLetterHint] = useState<string | null>(null);

  useEffect(() => {
    const previewLetters = selectedLetters.slice(0, 4);
    if (previewLetters.length > 0) {
      preloadLettersAudio(previewLetters);
      preloadWordsAudio(
        previewLetters.map((letter) => getStationSpec(letter).words[0]?.id).filter(Boolean),
      );
    }
    preloadTraceOrderVoice();
  }, [selectedLetters]);

  const tracedSet = new Set<LetterId>(mastery.tracedLetters);
  const crownedSet = new Set<LetterId>(mastery.crownedLetters);
  const selectedSet = new Set<LetterId>(selectedLetters);

  const applyPreset = (letters: readonly LetterId[]) => {
    setLetterHint(null);
    setSelectedLetters(ALL_LETTERS.filter((l) => letters.includes(l)));
  };

  const toggleLetter = (letter: LetterId) => {
    setLetterHint(null);
    setSelectedLetters((prev) => {
      if (prev.includes(letter)) {
        if (prev.length === 1) {
          setLetterHint('Keep at least 1 letter selected to practice.');
          return prev;
        }
        return prev.filter((l) => l !== letter);
      }
      const next = new Set<LetterId>([...prev, letter]);
      return ALL_LETTERS.filter((l) => next.has(l));
    });
  };

  const handleStart = () => {
    const cleanLetters = ALL_LETTERS.filter((l) => selectedSet.has(l));
    onStartGame({
      selectedLetters: cleanLetters.length > 0 ? cleanLetters : [...ALL_LETTERS],
      caseMode,
      roundSize,
      orderMode,
      traceMode,
      numberRange,
    });
  };

  const poolLength =
    traceMode === 'letters'
      ? selectedLetters.length
      : traceMode === 'shapes'
        ? ALL_SHAPE_TRACE_IDS.length
        : traceMode === 'words'
          ? TRACEABLE_WORDS.length
          : getNumbersForRange(numberRange).length;
  const effectiveCount = Math.min(roundSize, poolLength);
  const caseSummary =
    traceMode === 'numbers'
      ? `Numbers (${numberRange})`
      : traceMode === 'shapes'
        ? '2D Shapes'
        : traceMode === 'words'
          ? 'Sight & CVC Words'
          : caseMode === 'both'
            ? 'Both (A a)'
            : caseMode === 'upper'
              ? 'Capitals (A)'
              : 'Small (a)';

  return (
    <div className="app-shell">
      <header className="top-bar" style={{ marginBottom: 12 }}>
        <div className="top-bar__left">
          <button
            type="button"
            className="icon-pill-btn"
            onClick={onBackToHub}
            data-testid="trace-setup-back-btn"
          >
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

      <section className="setup-card tr-setup-hero">
        <div className="tr-setup-hero__badge" aria-hidden="true">
          <span className="tr-hero-cap">A</span>
          <span className="tr-hero-dot">1</span>
          <span className="tr-hero-low">a</span>
        </div>
        <div className="tr-setup-hero__copy">
          <h1 className="tr-setup-hero__title">Letter, Number &amp; Word Trace</h1>
          <p className="tr-setup-hero__sub">
            Follow the numbered circles and arrows in strict order — write A–Z, Numbers 0–50, 2D Shapes, or K1 Words!
          </p>
        </div>
      </section>

      <section className="setup-card" style={{ marginBottom: 14 }}>
        <h2 className="setup-section-title" style={{ marginBottom: 8 }}>
          What to Write Today
        </h2>
        <div className="tr-preset-row" role="radiogroup" aria-label="Writing topic">
          {(
            [
              ['letters', 'Letters A–Z'],
              ['numbers', 'Numbers 0–50'],
              ['words', 'Sight & CVC Words'],
              ['shapes', '2D Shapes'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={traceMode === id}
              className={`tr-preset-btn ${traceMode === id ? 'is-active' : ''}`}
              data-testid={`trace-mode-${id}`}
              onClick={() => setTraceMode(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {traceMode === 'numbers' && (
          <div style={{ marginTop: 12 }}>
            <span className="tr-sub-label">Number Range (0 to 50)</span>
            <div className="tr-preset-row" role="group" aria-label="Number range">
              {(
                [
                  ['0-50', 'All 0–50 Mix'],
                  ['0-9', 'Digits 0–9'],
                  ['10-20', 'Teens 10–20'],
                  ['21-50', 'Big Numbers 21–50'],
                ] as const
              ).map(([rangeId, label]) => (
                <button
                  key={rangeId}
                  type="button"
                  className={`tr-preset-btn ${numberRange === rangeId ? 'is-active' : ''}`}
                  data-testid={`trace-num-range-${rangeId}`}
                  onClick={() => setNumberRange(rangeId)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {traceMode === 'letters' && (
      <section className="setup-card" style={{ marginBottom: 14 }}>
        <div className="tr-section-header">
          <div>
            <h2 className="setup-section-title" style={{ marginBottom: 2 }}>
              1. Letters to Trace
            </h2>
            <p className="tr-section-sub">
              Choose all A–Z or focus on straight lines, slants, Magic C, or mirror pairs (b / d / p / q).
            </p>
          </div>
          <div className="tr-mastery-pills">
            <span className="tr-stat-pill tr-stat-pill--gold">
              <CrownIcon size={13} />
              <span>{mastery.crownedLetters.length}/26 Crowned</span>
            </span>
            <span className="tr-stat-pill tr-stat-pill--mint">
              <span>{mastery.tracedLetters.length}/26 Traced</span>
            </span>
          </div>
        </div>

        <div className="tr-preset-row" role="group" aria-label="Letter group presets">
          <button
            type="button"
            className={`tr-preset-btn ${matchesGroup(selectedLetters, ALL_LETTERS) ? 'is-active' : ''}`}
            data-testid="preset-all"
            onClick={() => applyPreset(ALL_LETTERS)}
          >
            All A–Z (26)
          </button>
          <button
            type="button"
            className={`tr-preset-btn ${matchesGroup(selectedLetters, STRAIGHT_LETTERS) ? 'is-active' : ''}`}
            data-testid="preset-straight"
            onClick={() => applyPreset(STRAIGHT_LETTERS)}
          >
            Straight Lines
          </button>
          <button
            type="button"
            className={`tr-preset-btn ${matchesGroup(selectedLetters, SLANT_LETTERS) ? 'is-active' : ''}`}
            data-testid="preset-slants"
            onClick={() => applyPreset(SLANT_LETTERS)}
          >
            Slants & Angles
          </button>
          <button
            type="button"
            className={`tr-preset-btn ${matchesGroup(selectedLetters, MAGIC_C_LETTERS) ? 'is-active' : ''}`}
            data-testid="preset-magic-c"
            onClick={() => applyPreset(MAGIC_C_LETTERS)}
          >
            Magic C Curves
          </button>
          <button
            type="button"
            className={`tr-preset-btn ${matchesGroup(selectedLetters, REVERSAL_GUARD_LETTERS) ? 'is-active' : ''}`}
            data-testid="preset-reversal"
            onClick={() => applyPreset(REVERSAL_GUARD_LETTERS)}
          >
            b / d / p / q Guard
          </button>
        </div>

        <div className="tr-letter-grid" role="group" aria-label="Choose individual letters">
          {ALL_LETTERS.map((letter) => {
            const isSelected = selectedSet.has(letter);
            const isCrowned = crownedSet.has(letter);
            const isTraced = tracedSet.has(letter);
            return (
              <button
                key={letter}
                type="button"
                className={`tr-letter-tile ${isSelected ? 'is-selected' : ''} ${
                  isCrowned ? 'is-crowned' : isTraced ? 'is-traced' : ''
                }`}
                data-testid={`trace-letter-tile-${letter}`}
                aria-pressed={isSelected}
                onClick={() => toggleLetter(letter)}
              >
                <span className="tr-letter-tile__glyphs">
                  {letter}
                  <small>{letter.toLowerCase()}</small>
                </span>
                {isCrowned ? (
                  <span className="tr-letter-tile__badge tr-letter-tile__badge--gold" aria-hidden="true">
                    <CrownIcon size={10} />
                  </span>
                ) : isTraced ? (
                  <span className="tr-letter-tile__badge tr-letter-tile__badge--mint" aria-hidden="true">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {letterHint && (
          <p className="tr-inline-hint" role="status">
            {letterHint}
          </p>
        )}
      </section>
      )}

      <section className="setup-card" style={{ marginBottom: 14 }}>
        <h2 className="setup-section-title" style={{ marginBottom: 10 }}>
          {traceMode === 'letters' ? '2. Tracing Style & Round' : 'Round Length & Order'}
        </h2>

        {traceMode === 'letters' && (
        <div className="tr-case-grid" role="radiogroup" aria-label="Case display mode">
          <button
            type="button"
            className={`tr-case-card ${caseMode === 'both' ? 'is-selected' : ''}`}
            data-testid="trace-case-both"
            role="radio"
            aria-checked={caseMode === 'both'}
            onClick={() => setCaseMode('both')}
          >
            <span className="tr-case-card__glyph">Aa</span>
            <strong>Both Together</strong>
            <small>Capital first (1–3), then Small right beside it</small>
            <span className="tr-case-card__tag">Recommended</span>
          </button>

          <button
            type="button"
            className={`tr-case-card ${caseMode === 'upper' ? 'is-selected' : ''}`}
            data-testid="trace-case-upper"
            role="radio"
            aria-checked={caseMode === 'upper'}
            onClick={() => setCaseMode('upper')}
          >
            <span className="tr-case-card__glyph">A</span>
            <strong>Capitals Only</strong>
            <small>Big tall letters from Sky to Grass line</small>
          </button>

          <button
            type="button"
            className={`tr-case-card ${caseMode === 'lower' ? 'is-selected' : ''}`}
            data-testid="trace-case-lower"
            role="radio"
            aria-checked={caseMode === 'lower'}
            onClick={() => setCaseMode('lower')}
          >
            <span className="tr-case-card__glyph">a</span>
            <strong>Small Only</strong>
            <small>Lowercase curves, fence tops &amp; root tails</small>
          </button>
        </div>
        )}

        <div className="tr-options-split">
          <div>
            <span className="tr-sub-label">Round Length</span>
            <div className="tr-seg-row" role="group" aria-label="Round length">
              {([4, 6, 10] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`tr-seg-btn ${roundSize === size ? 'is-selected' : ''}`}
                  data-testid={`trace-round-${size}`}
                  onClick={() => setRoundSize(size)}
                >
                  {size} {caseMode === 'both' ? 'Pairs' : 'Letters'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="tr-sub-label">Sequence</span>
            <div className="tr-seg-row" role="group" aria-label="Letter sequence">
              <button
                type="button"
                className={`tr-seg-btn ${orderMode === 'alphabetical' ? 'is-selected' : ''}`}
                data-testid="trace-order-alpha"
                onClick={() => setOrderMode('alphabetical')}
              >
                A → Z Order
              </button>
              <button
                type="button"
                className={`tr-seg-btn ${orderMode === 'shuffle' ? 'is-selected' : ''}`}
                data-testid="trace-order-shuffle"
                onClick={() => setOrderMode('shuffle')}
              >
                Surprise Mix
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="setup-launch-bar">
        <div className="setup-launch-summary">
          <strong>{effectiveCount} {caseMode === 'both' ? 'pairs' : 'letters'} ready</strong>
          <span>
            {caseSummary} • {orderMode === 'alphabetical' ? 'A → Z' : 'Surprise Mix'}
          </span>
        </div>
        <button
          type="button"
          className="btn-primary"
          data-testid="start-letter-trace-btn"
          onClick={handleStart}
        >
          Start Tracing!
        </button>
      </footer>
    </div>
  );
}
