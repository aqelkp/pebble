import { useEffect, useState } from 'react';
import { BrandLogo } from '../../components/BrandLogo';
import { WordSoundButton } from '../../components/WordSoundButton';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import { assetUrl } from '../../utils/assets';
import { preloadAudioPaths, preloadImages } from '../../utils/wordAudio';
import { CARD_THEMES, type ThemeId } from '../memory-match/themes';
import {
  getDefaultDotToDotConfig,
  getThemeLabel,
  type DotCountId,
  type DotRoundLengthId,
  type DotSequenceMode,
  type DotToDotConfig,
} from './dotEngine';
import './DotToDot.css';

interface DotToDotSetupProps {
  childProfile: FamilyProfile;
  initialConfig?: DotToDotConfig | null;
  onBackToHub: () => void;
  onEditProfiles: () => void;
  onStartGame: (config: DotToDotConfig) => void;
}

export function DotToDotSetup({
  childProfile,
  initialConfig,
  onBackToHub,
  onEditProfiles,
  onStartGame,
}: DotToDotSetupProps) {
  const defaults = getDefaultDotToDotConfig();
  const [sequenceMode, setSequenceMode] = useState<DotSequenceMode>(
    initialConfig?.sequenceMode ?? defaults.sequenceMode,
  );
  const [dotCount, setDotCount] = useState<DotCountId>(
    initialConfig?.dotCount ?? defaults.dotCount,
  );
  const [roundLength, setRoundLength] = useState<DotRoundLengthId>(
    initialConfig?.roundLength ?? defaults.roundLength,
  );
  const [themeId, setThemeId] = useState<ThemeId | 'all'>(
    initialConfig?.themeId ?? defaults.themeId,
  );

  useEffect(() => {
    preloadAudioPaths([
      'audio/numbers/1.mp3',
      'audio/numbers/2.mp3',
      'audio/numbers/3.mp3',
      'audio/ui/mistake-find-next.mp3',
    ]);
    const previewThemes =
      themeId === 'all' ? CARD_THEMES.slice(0, 3) : CARD_THEMES.filter((t) => t.id === themeId);
    preloadImages(previewThemes.flatMap((t) => t.characters.slice(0, 2).map((c) => c.imagePath)));
  }, [themeId]);

  const handleStart = () => {
    onStartGame({
      themeId,
      sequenceMode,
      dotCount,
      roundLength,
    });
  };

  const modeSummary =
    sequenceMode === 'numbers'
      ? `Numbers 1–${dotCount}`
      : sequenceMode === 'countdown'
        ? `Countdown ${dotCount}→0`
        : sequenceMode === 'letters'
          ? `Letters A–${String.fromCharCode(64 + dotCount)}`
          : `Mix (${dotCount} dots)`;

  return (
    <div className="app-shell">
      <header className="top-bar" style={{ marginBottom: 12 }}>
        <div className="top-bar__left">
          <button
            type="button"
            className="icon-pill-btn"
            onClick={onBackToHub}
            data-testid="dot-setup-back-btn"
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
            aria-label={`Playing as ${childProfile.name}. Tap to edit profile`}
          >
            <img src={getAvatarSrc(childProfile.avatar)} alt="" />
            <span>{childProfile.name}</span>
          </button>
        </div>
      </header>

      <section className="setup-card dtd-setup-hero">
        <div className="dtd-setup-hero__art">
          <img src={assetUrl('hub/dot-to-dot.png')} alt="" />
        </div>
        <div className="dtd-setup-hero__copy">
          <h1>Dot-to-Dot</h1>
          <p>
            Drag or tap the numbered pebbles in order around each mystery shadow to watch full color bloom!
          </p>
        </div>
      </section>

      <section className="setup-card" style={{ marginBottom: 14 }}>
        <h2 className="setup-section-title" style={{ marginBottom: 10 }}>
          1. Counting &amp; Alphabet Path
        </h2>

        <div className="dtd-mode-grid" role="radiogroup" aria-label="Sequence type">
          <button
            type="button"
            role="radio"
            aria-checked={sequenceMode === 'numbers'}
            className={`dtd-mode-card ${sequenceMode === 'numbers' ? 'is-selected' : ''}`}
            data-testid="dot-mode-numbers"
            onClick={() => setSequenceMode('numbers')}
          >
            <span className="dtd-mode-card__pill">1 → {dotCount}</span>
            <strong>Numbers</strong>
            <small>Count forward 1 to {dotCount}</small>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={sequenceMode === 'countdown'}
            className={`dtd-mode-card ${sequenceMode === 'countdown' ? 'is-selected' : ''}`}
            data-testid="dot-mode-countdown"
            onClick={() => setSequenceMode('countdown')}
          >
            <span className="dtd-mode-card__pill">{dotCount} → 0</span>
            <strong>Countdown</strong>
            <small>Count backward down to Zero</small>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={sequenceMode === 'letters'}
            className={`dtd-mode-card ${sequenceMode === 'letters' ? 'is-selected' : ''}`}
            data-testid="dot-mode-letters"
            onClick={() => setSequenceMode('letters')}
          >
            <span className="dtd-mode-card__pill">
              A → {String.fromCharCode(64 + dotCount)}
            </span>
            <strong>Letters</strong>
            <small>Alphabetical order A, B, C...</small>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={sequenceMode === 'mix'}
            className={`dtd-mode-card ${sequenceMode === 'mix' ? 'is-selected' : ''}`}
            data-testid="dot-mode-mix"
            onClick={() => setSequenceMode('mix')}
          >
            <span className="dtd-mode-card__pill">1 + 0 + A</span>
            <strong>Surprise Mix</strong>
            <small>Forward, countdown &amp; letters</small>
          </button>
        </div>

        <div className="dtd-split-row">
          <div>
            <span className="dtd-sub-label">Dots per Picture</span>
            <div className="dtd-seg-row" role="group" aria-label="Dots per picture">
              {([6, 8, 10, 15, 20] as const).map((count) => (
                <button
                  key={count}
                  type="button"
                  className={`dtd-seg-btn ${dotCount === count ? 'is-selected' : ''}`}
                  data-testid={`dot-count-${count}`}
                  onClick={() => setDotCount(count)}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="dtd-sub-label">Pictures to Reveal</span>
            <div className="dtd-seg-row" role="group" aria-label="Round length">
              {([3, 5] as const).map((len) => (
                <button
                  key={len}
                  type="button"
                  className={`dtd-seg-btn ${roundLength === len ? 'is-selected' : ''}`}
                  data-testid={`dot-round-${len}`}
                  onClick={() => setRoundLength(len)}
                >
                  {len} Pictures
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="setup-card" style={{ marginBottom: 14 }}>
        <h2 className="setup-section-title" style={{ marginBottom: 10 }}>
          2. Choose Picture World
        </h2>
        <div className="dtd-world-grid" role="radiogroup" aria-label="Picture world theme">
          <div
            role="radio"
            tabIndex={0}
            aria-checked={themeId === 'all'}
            className={`dtd-world-chip ${themeId === 'all' ? 'is-selected' : ''}`}
            data-testid="dot-theme-all"
            onClick={() => setThemeId('all')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setThemeId('all');
              }
            }}
          >
            <WordSoundButton text="All Worlds" size="xs" variant="ghost" className="dtd-world-chip__sound" />
            <span className="dtd-world-chip__thumb">
              <img src={assetUrl('hub/dot-to-dot.png')} alt="" />
            </span>
            <span className="dtd-world-chip__label">All Worlds</span>
          </div>

          {CARD_THEMES.map((theme) => (
            <div
              key={theme.id}
              role="radio"
              tabIndex={0}
              aria-checked={themeId === theme.id}
              className={`dtd-world-chip ${themeId === theme.id ? 'is-selected' : ''}`}
              data-testid={`dot-theme-${theme.id}`}
              onClick={() => setThemeId(theme.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setThemeId(theme.id);
                }
              }}
            >
              <WordSoundButton text={theme.title} size="xs" variant="ghost" className="dtd-world-chip__sound" />
              <span className="dtd-world-chip__thumb">
                <img src={assetUrl(theme.previewPaths[0])} alt="" />
              </span>
              <span className="dtd-world-chip__label">{theme.title}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="setup-launch-bar">
        <div className="setup-launch-summary">
          <strong>{roundLength} Mystery Pictures</strong>
          <span>
            {modeSummary} • {getThemeLabel(themeId)}
          </span>
        </div>
        <button
          type="button"
          className="btn-primary"
          data-testid="start-dot-to-dot-btn"
          onClick={handleStart}
        >
          Start Connecting!
        </button>
      </footer>
    </div>
  );
}
