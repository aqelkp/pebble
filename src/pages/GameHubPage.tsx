import { useMemo, useState } from 'react';
import { BrandLogo } from '../components/BrandLogo';
import { getAvatarSrc, type FamilyProfile } from '../context/FamilyProfilesContext';
import { preloadGamePlugin } from '../games/plugins';
import {
  GAME_REGISTRY,
  HUB_SHELVES,
  type GameRegistryEntry,
  type HubShelfId,
} from '../games/registry';
import { assetUrl } from '../utils/assets';

interface GameHubPageProps {
  profiles: FamilyProfile[];
  onOpenGame: (gameId: GameRegistryEntry['id']) => void;
  onOpenProfiles: () => void;
  onOpenParentInsights: () => void;
  isFreePlayPreview?: boolean;
  onBackToActivityBook?: () => void;
  onOpenJourneySettings?: () => void;
}

export function GameHubPage({
  profiles,
  onOpenGame,
  onOpenProfiles,
  onOpenParentInsights,
  isFreePlayPreview = false,
  onBackToActivityBook,
  onOpenJourneySettings,
}: GameHubPageProps) {
  const [activeShelf, setActiveShelf] = useState<'all' | HubShelfId>('all');

  const populatedShelves = useMemo(
    () =>
      HUB_SHELVES.map((shelf) => ({
        ...shelf,
        count: GAME_REGISTRY.filter((game) => game.shelf === shelf.id).length,
      })).filter((shelf) => shelf.count > 0),
    [],
  );

  const visibleGames = useMemo(
    () =>
      activeShelf === 'all'
        ? GAME_REGISTRY
        : GAME_REGISTRY.filter((game) => game.shelf === activeShelf),
    [activeShelf],
  );

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {isFreePlayPreview && onBackToActivityBook ? (
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.88rem' }}
              onClick={onBackToActivityBook}
            >
              ← Activity Book
            </button>
          ) : (
            onOpenJourneySettings && (
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.88rem' }}
                onClick={onOpenJourneySettings}
              >
                Activity Book
              </button>
            )
          )}
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

      <nav className="hub-shelf-bar" aria-label="Game categories">
        <button
          type="button"
          className={`hub-shelf-pill ${activeShelf === 'all' ? 'hub-shelf-pill--active' : ''}`}
          aria-pressed={activeShelf === 'all'}
          onClick={() => setActiveShelf('all')}
        >
          <span>All Games</span>
          <span className="hub-shelf-pill__count">{GAME_REGISTRY.length}</span>
        </button>

        {populatedShelves.map((shelf) => {
          const isActive = activeShelf === shelf.id;
          return (
            <button
              key={shelf.id}
              type="button"
              className={`hub-shelf-pill ${isActive ? 'hub-shelf-pill--active' : ''}`}
              aria-pressed={isActive}
              onClick={() => setActiveShelf(shelf.id)}
            >
              <span>{shelf.label}</span>
              <span className="hub-shelf-pill__count">{shelf.count}</span>
            </button>
          );
        })}
      </nav>

      <main className="hub-grid">
        {visibleGames.map((game) => {
          const isAvailable = game.status === 'available';
          const showFeatured = Boolean(
            game.featured && (activeShelf === 'all' || visibleGames.length === 1),
          );

          return (
            <article
              key={game.id}
              className={`game-card ${showFeatured ? 'game-card--featured' : ''} ${
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
                      !isAvailable
                        ? 'badge-pill--muted'
                        : game.activityRole === 'reward'
                          ? 'badge-pill--coral'
                          : 'badge-pill--mint'
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
                      onPointerEnter={() => preloadGamePlugin(game.id)}
                      onFocus={() => preloadGamePlugin(game.id)}
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
