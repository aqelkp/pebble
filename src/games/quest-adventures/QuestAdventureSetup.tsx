import { useEffect, useState } from 'react';
import { BrandLogo } from '../../components/BrandLogo';
import type { FamilyProfile } from '../../context/FamilyProfilesContext';
import { QuestArt } from '../../curriculum/questEngine/QuestArt';
import { preloadQuestVoiceClips } from '../../curriculum/questEngine/questSounds';
import {
  QUEST_PACK_SPECS,
  type AdventureSkinId,
  type QuestGameConfig,
  type QuestPackId,
  type QuestRoundLength,
} from '../../curriculum/questEngine/questTypes';
import { assetUrl } from '../../utils/assets';
import { ADVENTURE_SKIN_META } from './AdventureWorldBanner';
import './QuestAdventures.css';

interface QuestAdventureSetupProps {
  skinId: AdventureSkinId;
  childProfile?: FamilyProfile;
  initialConfig: QuestGameConfig;
  onBackToHub: () => void;
  onStartGame: (config: QuestGameConfig) => void;
}

const SKIN_DESCRIPTIONS: Record<AdventureSkinId, { hubArt: string; tagline: string; ctaLabel: string }> = {
  'mystery-express': {
    hubArt: 'hub/mystery-express.png',
    tagline: 'Solve each railway gate puzzle to raise the barrier and chug the train across 5 stations!',
    ctaLabel: 'All Aboard!',
  },
  'pebble-creek': {
    hubArt: 'hub/pebble-creek.png',
    tagline: 'Splash smooth river stepping stones into the stream to help our friendly fox cross!',
    ctaLabel: 'Cross the Creek!',
  },
  'cloud-balloon': {
    hubArt: 'hub/cloud-balloon.png',
    tagline: 'Solve sky puzzles to float your cozy hot-air balloon from sunny meadows up to the stars!',
    ctaLabel: 'Lift Off!',
  },
  'treasure-keys': {
    hubArt: 'hub/treasure-keys.png',
    tagline: 'Unlock 5 colorful golden keyholes one by one to pop open the wooden discovery chest!',
    ctaLabel: 'Unlock the Chest!',
  },
};

export function QuestAdventureSetup({
  skinId,
  childProfile,
  initialConfig,
  onBackToHub,
  onStartGame,
}: QuestAdventureSetupProps) {
  const [packId, setPackId] = useState<QuestPackId>(initialConfig.packId);
  const [roundLength, setRoundLength] = useState<QuestRoundLength>(initialConfig.roundLength);
  const [rotateWorlds, setRotateWorlds] = useState<boolean>(initialConfig.rotateWorlds);

  const meta = ADVENTURE_SKIN_META[skinId];
  const skinDesc = SKIN_DESCRIPTIONS[skinId];
  const isCustomName = childProfile && childProfile.name.trim().toLowerCase() !== 'child';

  useEffect(() => {
    preloadQuestVoiceClips([
      'lit-read-phrase-generic',
      'num-read-word-generic',
      'pv-build-tens-ones',
      'pattern-what-next',
    ]);
  }, []);

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar__left">
          <button type="button" className="icon-pill-btn" onClick={onBackToHub}>
            <span aria-hidden="true">←</span>
            <span>All Games</span>
          </button>
          <BrandLogo size="sm" />
        </div>
      </header>

      <section
        className="setup-card"
        style={{
          maxWidth: 700,
          margin: '8px auto 24px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img
            src={assetUrl(skinDesc.hubArt)}
            alt={meta.title}
            width={84}
            height={84}
            style={{ borderRadius: 20, objectFit: 'cover', flexShrink: 0 }}
          />
          <div>
            <span className="badge-pill badge-pill--mint" style={{ marginBottom: 6 }}>
              KLAY K1 Syllabus • {meta.worldBadge}
            </span>
            <h1 className="font-display" style={{ margin: '2px 0 4px', fontSize: '1.65rem' }}>
              {meta.title}
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              {skinDesc.tagline}
            </p>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2 className="font-display" style={{ margin: 0, fontSize: '1.08rem' }}>
              Choose K1 Learning Pack
            </h2>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Same rich questions power every world!
            </span>
          </div>

          <div className="quest-pack-grid">
            {QUEST_PACK_SPECS.map((spec) => {
              const active = packId === spec.id;
              return (
                <button
                  key={spec.id}
                  type="button"
                  aria-pressed={active}
                  data-testid={`quest-pack-${spec.id}`}
                  className={`quest-pack-tile ${active ? 'quest-pack-tile--active' : ''}`}
                  onClick={() => setPackId(spec.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <QuestArt spec={{ kind: 'quest-icon', id: spec.iconArtId }} size={34} />
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 999,
                        background: active ? '#ECEBFF' : '#F4F2EC',
                        color: active ? '#5B5BD6' : '#5C6478',
                      }}
                    >
                      {spec.syllabusBadge}
                    </span>
                  </div>
                  <strong className="font-display" style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {spec.shortTitle}
                  </strong>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.25 }}>
                    {spec.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="font-display" style={{ fontWeight: 600, fontSize: '0.94rem' }}>
              Journey Length:
            </span>
            {([5, 8] as const).map((len) => (
              <button
                key={len}
                type="button"
                className={roundLength === len ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '7px 14px', fontSize: '0.88rem' }}
                onClick={() => setRoundLength(len)}
              >
                {len} {meta.stepNoun}s
              </button>
            ))}
          </div>

          <button
            type="button"
            aria-pressed={rotateWorlds}
            className={rotateWorlds ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '7px 14px', fontSize: '0.86rem' }}
            onClick={() => setRotateWorlds((v) => !v)}
          >
            {rotateWorlds ? 'Rotating Worlds: ON' : 'Rotate Worlds Every Stop'}
          </button>
        </div>

        <button
          type="button"
          className="btn-primary"
          data-testid="start-quest-adventure-btn"
          style={{ width: '100%', padding: '14px 22px', fontSize: '1.12rem' }}
          onClick={() => onStartGame({ packId, roundLength, rotateWorlds })}
        >
          {isCustomName ? `${skinDesc.ctaLabel} (${childProfile.name})` : skinDesc.ctaLabel}
        </button>
      </section>
    </div>
  );
}

export function MysteryExpressSetup(props: Omit<QuestAdventureSetupProps, 'skinId'>) {
  return <QuestAdventureSetup skinId="mystery-express" {...props} />;
}

export function PebbleCreekSetup(props: Omit<QuestAdventureSetupProps, 'skinId'>) {
  return <QuestAdventureSetup skinId="pebble-creek" {...props} />;
}

export function CloudBalloonSetup(props: Omit<QuestAdventureSetupProps, 'skinId'>) {
  return <QuestAdventureSetup skinId="cloud-balloon" {...props} />;
}

export function TreasureKeysSetup(props: Omit<QuestAdventureSetupProps, 'skinId'>) {
  return <QuestAdventureSetup skinId="treasure-keys" {...props} />;
}
