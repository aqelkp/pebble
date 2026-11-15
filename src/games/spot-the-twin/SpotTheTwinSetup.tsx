import { useState } from 'react';
import { BrandLogo } from '../../components/BrandLogo';
import {
  TWIN_DIFFICULTY_OPTIONS,
  TWIN_ROUND_OPTIONS,
  type SpotTheTwinConfig,
  type TwinDifficulty,
  type TwinRoundSize,
} from './twinEngine';

interface SpotTheTwinSetupProps {
  onBackToHub: () => void;
  onStartGame: (config: SpotTheTwinConfig) => void;
  initialConfig?: SpotTheTwinConfig;
}

export function SpotTheTwinSetup({
  onBackToHub,
  onStartGame,
  initialConfig,
}: SpotTheTwinSetupProps) {
  const [difficulty, setDifficulty] = useState<TwinDifficulty>(
    initialConfig?.difficulty ?? 'easy-4',
  );
  const [roundSize, setRoundSize] = useState<TwinRoundSize>(
    initialConfig?.roundSize ?? '5-cards',
  );

  const selectedDiff =
    TWIN_DIFFICULTY_OPTIONS.find((d) => d.id === difficulty) ?? TWIN_DIFFICULTY_OPTIONS[0];
  const selectedRound =
    TWIN_ROUND_OPTIONS.find((r) => r.id === roundSize) ?? TWIN_ROUND_OPTIONS[0];

  return (
    <div className="setup-screen">
      <div className="setup-topbar">
        <button type="button" className="btn-secondary" onClick={onBackToHub}>
          ← Games
        </button>
        <BrandLogo size="md" subtitle="Spot the Twin Setup" />
      </div>

      <section className="setup-card-section" aria-labelledby="stt-diff-heading">
        <div className="setup-section-header">
          <h2 id="stt-diff-heading">1. Pictures on Each Card</h2>
        </div>

        <div className="board-size-grid">
          {TWIN_DIFFICULTY_OPTIONS.map((opt) => {
            const active = difficulty === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`size-option-btn ${active ? 'size-option-btn--selected' : ''}`}
                onClick={() => setDifficulty(opt.id)}
                aria-pressed={active}
              >
                <div className="size-option-btn__top">
                  <span className="size-option-btn__dims">{opt.label}</span>
                  {opt.isDefault && (
                    <span className="badge-pill badge-pill--indigo">Default</span>
                  )}
                </div>
                <span className="size-option-btn__meta">{opt.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="setup-card-section" aria-labelledby="stt-round-heading">
        <div className="setup-section-header">
          <h2 id="stt-round-heading">2. Round Length</h2>
        </div>

        <div className="board-size-grid">
          {TWIN_ROUND_OPTIONS.map((opt) => {
            const active = roundSize === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`size-option-btn ${active ? 'size-option-btn--selected' : ''}`}
                onClick={() => setRoundSize(opt.id)}
                aria-pressed={active}
              >
                <div className="size-option-btn__top">
                  <span className="size-option-btn__dims">{opt.label}</span>
                  {opt.isDefault && (
                    <span className="badge-pill badge-pill--indigo">Default</span>
                  )}
                </div>
                <span className="size-option-btn__meta">{opt.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="setup-cta-bar">
        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%' }}
          onClick={() => onStartGame({ difficulty, roundSize })}
        >
          Start {selectedDiff.label} · {selectedRound.label}
        </button>
      </div>
    </div>
  );
}
