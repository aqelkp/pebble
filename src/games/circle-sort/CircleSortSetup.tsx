import { useEffect, useMemo, useState } from 'react';
import { BrandLogo } from '../../components/BrandLogo';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import { assetUrl } from '../../utils/assets';
import { preloadAudioPaths } from '../../utils/wordAudio';
import { CircleSortItemIllustration } from './CircleSortArt';
import {
  CIRCLE_SORT_PACKS,
  getCircleSortPackSpec,
  getDefaultCircleSortConfig,
  getPackMasteryProgress,
  loadCircleSortMastery,
  type CircleSortConfig,
  type CircleSortGridMode,
  type CircleSortPackId,
  type CircleSortRoundLength,
} from './circleSortData';
import { getCircleSortPromptAudioPath } from './circleSortSounds';
import './CircleSort.css';

interface CircleSortSetupProps {
  childProfile: FamilyProfile;
  initialConfig?: CircleSortConfig | null;
  onBackToHub: () => void;
  onEditProfiles: () => void;
  onStartGame: (config: CircleSortConfig) => void;
}

export function CircleSortSetup({
  childProfile,
  initialConfig,
  onBackToHub,
  onEditProfiles,
  onStartGame,
}: CircleSortSetupProps) {
  const defaults = getDefaultCircleSortConfig();
  const [packId, setPackId] = useState<CircleSortPackId>(initialConfig?.packId ?? defaults.packId);
  const [gridMode, setGridMode] = useState<CircleSortGridMode>(
    initialConfig?.gridMode ?? defaults.gridMode,
  );
  const [roundLength, setRoundLength] = useState<CircleSortRoundLength>(
    initialConfig?.roundLength ?? defaults.roundLength,
  );

  const mastery = useMemo(() => loadCircleSortMastery(), []);
  const selectedPack = getCircleSortPackSpec(packId);

  useEffect(() => {
    const sampleCount = gridMode === '2x3' ? 3 : 4;
    const promptClips = selectedPack.questIds
      .slice(0, 4)
      .map((qId) => getCircleSortPromptAudioPath(qId, sampleCount));
    preloadAudioPaths(promptClips);
  }, [gridMode, selectedPack.questIds]);

  const handleStart = () => {
    onStartGame({
      packId,
      gridMode,
      roundLength,
    });
  };

  return (
    <div className="app-shell">
      <header className="top-bar" style={{ marginBottom: 10 }}>
        <div className="top-bar__left">
          <button
            type="button"
            className="icon-pill-btn"
            onClick={onBackToHub}
            data-testid="circle-sort-setup-back-btn"
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

      <section className="setup-card-section cs-setup-hero">
        <div className="cs-setup-hero__art">
          <img src={assetUrl('hub/circle-sort.png')} alt="" />
        </div>
        <div className="cs-setup-hero__copy">
          <h1>Circle &amp; Sort</h1>
          <p>
            Listen to each K1 workbook mission, then tap OR draw a circle with your finger around
            every picture that belongs!
          </p>
        </div>
      </section>

      <section className="setup-card-section" aria-labelledby="cs-pack-heading">
        <div className="setup-section-header">
          <h2 id="cs-pack-heading">1. Choose K1 Discovery Pack</h2>
          <span className="section-pill">{selectedPack.questIds.length} quests</span>
        </div>

        <div className="cs-pack-grid" role="radiogroup" aria-label="K1 discovery pack">
          {CIRCLE_SORT_PACKS.map((pack) => {
            const selected = pack.id === packId;
            const progress = getPackMasteryProgress(pack.id, mastery);
            const isMix = pack.id === 'mix';

            return (
              <button
                key={pack.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`cs-pack-card ${isMix ? 'cs-pack-card--wide' : ''} ${
                  selected ? 'is-selected' : ''
                }`}
                data-testid={`circle-sort-pack-${pack.id}`}
                onClick={() => setPackId(pack.id)}
              >
                <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                  <div className="cs-pack-card__head">
                    <span className="cs-pack-badge">{pack.badge}</span>
                    <span className="cs-pack-progress">
                      {progress.mastered}/{progress.total} solved
                    </span>
                  </div>
                  <div className="cs-pack-title-row" style={{ marginTop: 6 }}>
                    <span className="cs-pack-thumb" aria-hidden="true">
                      <CircleSortItemIllustration itemId={pack.previewItemId} size={30} />
                    </span>
                    <div>
                      <strong className="cs-pack-card__title">{pack.title}</strong>
                      <div className="cs-pack-card__sub">{pack.subtitle}</div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="setup-card-section" aria-labelledby="cs-page-options-heading">
        <div className="setup-section-header">
          <h2 id="cs-page-options-heading">2. Workbook Page &amp; Round Size</h2>
          <span className="section-pill">
            {gridMode === '3x3' ? '3 × 3 (9 items)' : '2 × 3 (6 items)'}
          </span>
        </div>

        <div className="cs-options-dual-row">
          <div className="cs-option-box">
            <span className="cs-option-label">Pictures per Page</span>
            <div className="cs-pill-group" role="radiogroup" aria-label="Workbook grid size">
              <button
                type="button"
                role="radio"
                aria-checked={gridMode === '3x3'}
                className={`cs-pill-btn ${gridMode === '3x3' ? 'is-selected' : ''}`}
                data-testid="circle-sort-grid-3x3"
                onClick={() => setGridMode('3x3')}
              >
                <span>3 × 3 Page</span>
                <small>9 pictures (Default)</small>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={gridMode === '2x3'}
                className={`cs-pill-btn ${gridMode === '2x3' ? 'is-selected' : ''}`}
                data-testid="circle-sort-grid-2x3"
                onClick={() => setGridMode('2x3')}
              >
                <span>2 × 3 Gentle</span>
                <small>6 pictures</small>
              </button>
            </div>
          </div>

          <div className="cs-option-box">
            <span className="cs-option-label">Workbook Pages</span>
            <div className="cs-pill-group" role="radiogroup" aria-label="Pages per round">
              {([1, 3, 5] as const).map((len) => (
                <button
                  key={len}
                  type="button"
                  role="radio"
                  aria-checked={roundLength === len}
                  className={`cs-pill-btn ${roundLength === len ? 'is-selected' : ''}`}
                  data-testid={`circle-sort-len-${len}`}
                  onClick={() => setRoundLength(len)}
                >
                  <span>{len === 1 ? '1 Page' : `${len} Pages`}</span>
                  <small>{len === 1 ? 'Quick' : len === 3 ? 'Standard' : 'Deep'}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="setup-launch-bar">
        <div className="setup-launch-summary">
          <strong>
            {selectedPack.title} • {roundLength === 1 ? '1 Page' : `${roundLength} Pages`}
          </strong>
          <span>
            {gridMode === '3x3' ? '9 pictures per workbook page' : '6 pictures per gentle page'} •
            Tap or Finger-Circle
          </span>
        </div>
        <button
          type="button"
          className="btn-primary"
          data-testid="start-circle-sort-btn"
          onClick={handleStart}
        >
          Open Workbook!
        </button>
      </footer>
    </div>
  );
}
