import { useEffect, useMemo, useState } from 'react';
import { BrandLogo } from '../../components/BrandLogo';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import { assetUrl } from '../../utils/assets';
import { preloadAudioPaths, preloadImages } from '../../utils/wordAudio';
import {
  PEEKABOO_CHARACTERS,
  PEEKABOO_PACKS,
  PEEKABOO_WORLDS,
  getDefaultWordPeekabooConfig,
  getPackReadProgress,
  getPeekabooPackSpec,
  getPeekabooWorldSpec,
  loadPeekabooMastery,
  type PeekabooPackId,
  type PeekabooRoundLength,
  type PeekabooWorldId,
  type WordPeekabooConfig,
} from './peekabooData';
import { getPeekabooIntroAudioPath, getPeekabooWordAudioPath } from './peekabooSounds';
import './WordPeekaboo.css';

interface WordPeekabooSetupProps {
  childProfile: FamilyProfile;
  initialConfig?: WordPeekabooConfig | null;
  onBackToHub: () => void;
  onEditProfiles: () => void;
  onStartGame: (config: WordPeekabooConfig) => void;
}

export function WordPeekabooSetup({
  childProfile,
  initialConfig,
  onBackToHub,
  onEditProfiles,
  onStartGame,
}: WordPeekabooSetupProps) {
  const defaults = getDefaultWordPeekabooConfig();
  const [packId, setPackId] = useState<PeekabooPackId>(initialConfig?.packId ?? defaults.packId);
  const [worldId, setWorldId] = useState<PeekabooWorldId>(initialConfig?.worldId ?? defaults.worldId);
  const [roundLength, setRoundLength] = useState<PeekabooRoundLength>(
    initialConfig?.roundLength ?? defaults.roundLength,
  );

  const mastery = useMemo(() => loadPeekabooMastery(), []);

  useEffect(() => {
    const pack = getPeekabooPackSpec(packId);
    const wordPaths = pack.wordIds.slice(0, 10).map((id) => getPeekabooWordAudioPath(id));
    const sampleChars =
      worldId === 'all-stories'
        ? PEEKABOO_CHARACTERS.filter((c) => c.pairId.endsWith('-01'))
        : PEEKABOO_CHARACTERS.filter((c) => c.themeId === worldId).slice(0, 4);

    preloadAudioPaths([
      ...wordPaths,
      ...sampleChars.map((c) => getPeekabooIntroAudioPath(c.pairId)),
    ]);
    preloadImages(sampleChars.map((c) => c.imagePath));
  }, [packId, worldId]);

  const selectedPack = getPeekabooPackSpec(packId);
  const selectedWorld = getPeekabooWorldSpec(worldId);

  const handleStart = () => {
    onStartGame({
      packId,
      worldId,
      roundLength,
    });
  };

  return (
    <div className="app-shell">
      <header className="top-bar" style={{ marginBottom: 12 }}>
        <div className="top-bar__left">
          <button
            type="button"
            className="icon-pill-btn"
            onClick={onBackToHub}
            data-testid="peekaboo-setup-back-btn"
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

      <section className="setup-card-section wpk-setup-hero">
        <div className="wpk-setup-hero__art">
          <img src={assetUrl('hub/word-peekaboo.png')} alt="" />
        </div>
        <div className="wpk-setup-hero__copy">
          <h1>Word Peekaboo</h1>
          <p>
            Listen to each sight word or 3-letter word and tap it on the grid to peel back tiles
            and discover a hidden friend!
          </p>
        </div>
      </section>

      <section className="setup-card-section" aria-labelledby="wpk-packs-heading">
        <div className="setup-section-header">
          <h2 id="wpk-packs-heading">1. Choose KLAY Word Pack</h2>
          <span className="section-pill">{selectedPack.wordIds.length} words</span>
        </div>

        <div className="wpk-pack-grid" role="radiogroup" aria-label="KLAY word pack">
          {PEEKABOO_PACKS.map((pack) => {
            const progress = getPackReadProgress(pack.id, mastery);
            const selected = packId === pack.id;
            return (
              <button
                key={pack.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`wpk-pack-card ${selected ? 'is-selected' : ''}`}
                data-testid={`peekaboo-pack-${pack.id}`}
                onClick={() => setPackId(pack.id)}
              >
                <div className="wpk-pack-card__top">
                  <span className="wpk-pack-badge">{pack.pageBadge}</span>
                  <span className="wpk-pack-progress">
                    {progress.readCount} / {progress.total} read
                  </span>
                </div>
                <strong className="wpk-pack-card__title">{pack.title}</strong>
                <span className="wpk-pack-card__sub">{pack.subtitle}</span>
                <div className="wpk-pack-samples" aria-hidden="true">
                  {pack.sampleWords.map((word) => (
                    <span key={word} className="wpk-pack-sample-chip">
                      {word}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="setup-card-section" aria-labelledby="wpk-worlds-heading">
        <div className="setup-section-header">
          <h2 id="wpk-worlds-heading">2. Hidden Friends &amp; Round Length</h2>
          <span className="section-pill">{selectedWorld.title}</span>
        </div>

        <div className="wpk-world-grid" role="radiogroup" aria-label="Hidden friend theme">
          {PEEKABOO_WORLDS.map((world) => {
            const selected = worldId === world.id;
            return (
              <button
                key={world.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`wpk-world-chip ${selected ? 'is-selected' : ''}`}
                data-testid={`peekaboo-world-${world.id}`}
                onClick={() => setWorldId(world.id)}
              >
                <span className="wpk-world-chip__thumb">
                  <img src={assetUrl(world.previewPath)} alt="" />
                </span>
                <span className="wpk-world-chip__label">{world.title}</span>
              </button>
            );
          })}
        </div>

        <div className="wpk-len-wrap">
          <span className="wpk-len-label">Friends to Discover:</span>
          <div className="wpk-len-row" role="group" aria-label="Round length">
            {([1, 3, 5] as const).map((len) => (
              <button
                key={len}
                type="button"
                className={`wpk-len-btn ${roundLength === len ? 'is-selected' : ''}`}
                data-testid={`peekaboo-len-${len}`}
                onClick={() => setRoundLength(len)}
              >
                {len === 1 ? '1 Friend' : `${len} Friends`}
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer className="setup-launch-bar">
        <div className="setup-launch-summary">
          <strong>
            {roundLength === 1 ? '1 Hidden Friend' : `${roundLength} Hidden Friends`}
          </strong>
          <span>
            {selectedPack.title} ({selectedPack.pageBadge}) • {selectedWorld.title}
          </span>
        </div>
        <button
          type="button"
          className="btn-primary"
          data-testid="start-word-peekaboo-btn"
          onClick={handleStart}
        >
          Start Discovering!
        </button>
      </footer>
    </div>
  );
}
