import { useEffect, useState } from 'react';
import { BrandLogo, CrownIcon } from '../../components/BrandLogo';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import { WordTraceCardArt } from './WordTraceCardArt';
import {
  ALL_WORD_TRACE_ITEMS,
  CVC_TRACE_ITEMS,
  NUMBER_TRACE_ITEMS,
  SIGHT_TRACE_ITEMS,
  WORD_TRACE_PACKS,
  getDefaultWordTraceConfig,
  getWordTraceItem,
  loadWordTraceMastery,
  type WordTraceCaseMode,
  type WordTraceConfig,
  type WordTracePackId,
  type WordTraceRoundSize,
} from './wordTraceEngine';
import { preloadWordTraceClips } from './wordTraceSounds';
import './WordTrace.css';

interface WordTraceSetupProps {
  childProfile: FamilyProfile;
  initialConfig?: WordTraceConfig | null;
  onBackToHub: () => void;
  onEditProfiles: () => void;
  onStartGame: (config: WordTraceConfig) => void;
}

const PACK_SAMPLE_ITEM_IDS: Record<WordTracePackId, string> = {
  'cvc-mix': 'cat',
  cvc: 'dog',
  sight: 'be',
  numbers: 'six',
};

export function WordTraceSetup({
  childProfile,
  initialConfig,
  onBackToHub,
  onEditProfiles,
  onStartGame,
}: WordTraceSetupProps) {
  const defaults = getDefaultWordTraceConfig();
  const [packId, setPackId] = useState<WordTracePackId>(
    initialConfig?.packId ?? defaults.packId,
  );
  const [caseMode, setCaseMode] = useState<WordTraceCaseMode>(
    initialConfig?.caseMode ?? defaults.caseMode,
  );
  const [roundSize, setRoundSize] = useState<WordTraceRoundSize>(
    initialConfig?.roundSize ?? defaults.roundSize,
  );
  const [mastery] = useState(() => loadWordTraceMastery());

  useEffect(() => {
    const previewPool =
      packId === 'cvc'
        ? CVC_TRACE_ITEMS.slice(0, 4)
        : packId === 'sight'
          ? SIGHT_TRACE_ITEMS.slice(0, 4)
          : packId === 'numbers'
            ? NUMBER_TRACE_ITEMS.slice(0, 4)
            : [CVC_TRACE_ITEMS[0], SIGHT_TRACE_ITEMS[1], NUMBER_TRACE_ITEMS[2]];
    preloadWordTraceClips(previewPool);
  }, [packId]);

  const handleStart = () => {
    onStartGame({
      packId,
      caseMode,
      roundSize,
    });
  };

  const activePack = WORD_TRACE_PACKS.find((p) => p.id === packId) ?? WORD_TRACE_PACKS[0];
  const caseSummary =
    caseMode === 'mix'
      ? 'abc & ABC Mix'
      : caseMode === 'lower'
        ? 'abc Small Only'
        : 'ABC Capitals Only';

  return (
    <div className="app-shell wt-setup-shell">
      <header className="top-bar" style={{ marginBottom: 12 }}>
        <div className="top-bar__left">
          <button
            type="button"
            className="icon-pill-btn"
            onClick={onBackToHub}
            data-testid="wt-setup-back-btn"
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

      <section className="setup-card wt-setup-hero">
        <div className="wt-setup-hero__notebook" aria-hidden="true">
          <span className="wt-setup-hero__rule wt-setup-hero__rule--sky" />
          <span className="wt-setup-hero__rule wt-setup-hero__rule--fence" />
          <span className="wt-setup-hero__rule wt-setup-hero__rule--grass" />
          <span className="wt-setup-hero__rule wt-setup-hero__rule--root" />
          <span className="wt-setup-hero__word">
            ca<em>t</em>
          </span>
          <span className="wt-setup-hero__badge">1</span>
        </div>
        <div className="wt-setup-hero__copy">
          <h1 className="wt-setup-hero__title">Word Trace</h1>
          <p className="wt-setup-hero__sub">
            Write CVC picture words, school sight words, and numbers left-to-right on 4-line
            notebook paper!
          </p>
        </div>
      </section>

      <section className="setup-card" style={{ marginBottom: 12 }}>
        <div className="wt-section-head">
          <div>
            <h2 className="setup-section-title" style={{ marginBottom: 2 }}>
              1. Writing Notebook Pack
            </h2>
            <p className="wt-section-sub">
              Pick a cozy word pack or trace a playful mix of picture words, sight words, and
              numbers.
            </p>
          </div>
          <div className="wt-mastery-row">
            <span className="wt-stat-chip wt-stat-chip--gold">
              <CrownIcon size={13} />
              <span>
                {mastery.crownedIds.length}/{ALL_WORD_TRACE_ITEMS.length} Crowned
              </span>
            </span>
            <span className="wt-stat-chip wt-stat-chip--mint">
              <span>
                {mastery.tracedIds.length}/{ALL_WORD_TRACE_ITEMS.length} Written
              </span>
            </span>
          </div>
        </div>

        <div className="wt-pack-grid" role="radiogroup" aria-label="Word Trace content pack">
          {WORD_TRACE_PACKS.map((pack) => {
            const isSelected = packId === pack.id;
            const sampleItem = getWordTraceItem(PACK_SAMPLE_ITEM_IDS[pack.id]);
            return (
              <button
                key={pack.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                data-testid={`wt-pack-${pack.id}`}
                className={`wt-pack-card ${isSelected ? 'is-selected' : ''}`}
                onClick={() => setPackId(pack.id)}
              >
                <div className="wt-pack-card__art">
                  <WordTraceCardArt art={sampleItem.art} size={46} />
                </div>
                <div className="wt-pack-card__body">
                  <div className="wt-pack-card__top">
                    <span className="wt-pack-card__title">{pack.title}</span>
                    <span className="wt-pack-card__badge">{pack.badge}</span>
                  </div>
                  <span className="wt-pack-card__sub">{pack.subtitle}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="setup-card" style={{ marginBottom: 14 }}>
        <h2 className="setup-section-title" style={{ marginBottom: 10 }}>
          2. Small &amp; Capital Letters
        </h2>

        <div className="wt-case-grid" role="radiogroup" aria-label="Letter case style">
          <button
            type="button"
            role="radio"
            aria-checked={caseMode === 'mix'}
            data-testid="wt-case-mix"
            className={`wt-case-pill ${caseMode === 'mix' ? 'is-selected' : ''}`}
            onClick={() => setCaseMode('mix')}
          >
            <span className="wt-case-pill__sample">cat • DOG</span>
            <strong>abc &amp; ABC Mix</strong>
            <small>Alternates small &amp; capital words</small>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={caseMode === 'lower'}
            data-testid="wt-case-lower"
            className={`wt-case-pill ${caseMode === 'lower' ? 'is-selected' : ''}`}
            onClick={() => setCaseMode('lower')}
          >
            <span className="wt-case-pill__sample">cat • be</span>
            <strong>abc Small Only</strong>
            <small>School notebook lowercase flow</small>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={caseMode === 'upper'}
            data-testid="wt-case-upper"
            className={`wt-case-pill ${caseMode === 'upper' ? 'is-selected' : ''}`}
            onClick={() => setCaseMode('upper')}
          >
            <span className="wt-case-pill__sample">CAT • BE</span>
            <strong>ABC Capitals Only</strong>
            <small>Big tall letters from Sky to Grass</small>
          </button>
        </div>

        <div className="wt-round-row">
          <span className="wt-round-label">Words per Notebook Page</span>
          <div className="wt-round-pills" role="group" aria-label="Words per round">
            {([4, 6, 8] as const).map((size) => (
              <button
                key={size}
                type="button"
                data-testid={`wt-round-${size}`}
                className={`wt-round-btn ${roundSize === size ? 'is-selected' : ''}`}
                onClick={() => setRoundSize(size)}
              >
                {size} Items
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer className="setup-launch-bar">
        <div className="setup-launch-summary">
          <strong>
            {roundSize} {packId === 'numbers' ? 'numbers & words' : 'notebook words'} ready
          </strong>
          <span>
            {activePack.title} • {caseSummary}
          </span>
        </div>
        <button
          type="button"
          className="btn-primary"
          data-testid="start-word-trace-btn"
          onClick={handleStart}
        >
          Start Writing!
        </button>
      </footer>
    </div>
  );
}
