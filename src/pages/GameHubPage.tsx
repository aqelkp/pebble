import { BrandLogo } from '../components/BrandLogo';
import { getAvatarSrc, type FamilyProfile } from '../context/FamilyProfilesContext';
import { GAME_REGISTRY, type GameRegistryEntry } from '../games/registry';
import { assetUrl } from '../utils/assets';

interface GameHubPageProps {
  profiles: FamilyProfile[];
  onOpenGame: (gameId: GameRegistryEntry['id']) => void;
  onOpenProfiles: () => void;
  onOpenParentInsights: () => void;
}

export function GameHubPage({
  profiles,
  onOpenGame,
  onOpenProfiles,
  onOpenParentInsights,
}: GameHubPageProps) {
  const primaryChild = profiles[0];
  const isCustomChildName =
    primaryChild && primaryChild.name.trim().toLowerCase() !== 'child';
  const greetingHeading = isCustomChildName
    ? `Welcome, ${primaryChild.name}!`
    : 'Welcome to Pebble!';

  return (
    <div className="app-shell">
      <header className="hub-header">
        <BrandLogo size="lg" subtitle="Family learning games" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.88rem' }}
            onClick={onOpenParentInsights}
          >
            Parent Insights
          </button>
          <button
            type="button"
            className="hub-hero__profiles-chip"
            onClick={onOpenProfiles}
            aria-label="Manage Family Profiles"
          >
          <div className="avatar-stack" aria-hidden="true">
            {profiles.slice(0, 4).map((profile) => (
              <img
                key={profile.id}
                className="avatar-stack__img"
                src={getAvatarSrc(profile.avatar)}
                alt=""
              />
            ))}
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.94rem' }}>Family</span>
          </button>
        </div>
      </header>

      <section className="hub-hero" aria-label="Welcome banner">
        <div className="hub-hero__text">
          <h1>{greetingHeading}</h1>
          <p>Calm, screen-safe games designed to play together on your tablet.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={onOpenProfiles}>
          Edit Names
        </button>
      </section>

      <div className="section-heading">
        <h2>Choose a Game</h2>
        <span className="section-pill">Portrait Tablet Ready</span>
      </div>

      <main className="hub-grid">
        {GAME_REGISTRY.map((game) => {
          const isAvailable = game.status === 'available';

          return (
            <article
              key={game.id}
              className={`game-card ${game.featured ? 'game-card--featured' : ''} ${
                isAvailable ? 'game-card--interactive' : 'game-card--coming-soon'
              }`}
            >
              <div className="game-card__art">
                <img src={assetUrl(game.artPath)} alt={game.title} />
              </div>

              <div className="game-card__body">
                <div className="game-card__badge-row">
                  <span
                    className={`badge-pill ${
                      isAvailable ? 'badge-pill--mint' : 'badge-pill--muted'
                    }`}
                  >
                    {game.badgeText}
                  </span>
                  <span className="badge-pill badge-pill--indigo">{game.ageHint}</span>
                </div>

                <h3 className="game-card__title">{game.title}</h3>
                <p className="game-card__desc">{game.description}</p>

                {isAvailable && (
                  <div className="game-card__cta">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => onOpenGame(game.id)}
                    >
                      Play {game.title}
                    </button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </main>
    </div>
  );
}
