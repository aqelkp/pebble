import { useState } from 'react';
import { assetUrl } from '../../utils/assets';
import { STORY_BOOKS } from './storyBooks';
import {
  STORY_COMPLEXITY_META,
  type StoryBookId,
  type StoryTimeConfig,
} from './storyTypes';
import './StoryTimeBoard.css';

interface StoryTimeSetupProps {
  initialConfig: StoryTimeConfig;
  onBackToHub: () => void;
  onStartGame: (config: StoryTimeConfig) => void;
}

export function StoryTimeSetup({
  initialConfig,
  onBackToHub,
  onStartGame,
}: StoryTimeSetupProps) {
  const [storyId, setStoryId] = useState<StoryBookId>(initialConfig.storyId);
  const [autoPlayNarration, setAutoPlayNarration] = useState<boolean>(
    initialConfig.autoPlayNarration,
  );

  const selectedBook = STORY_BOOKS.find((b) => b.id === storyId) ?? STORY_BOOKS[0];
  const tierMeta = STORY_COMPLEXITY_META[selectedBook.complexityTier];

  return (
    <div className="setup-page story-setup-page" data-testid="story-time-setup">
      <header className="top-bar">
        <button
          type="button"
          className="icon-pill-btn"
          data-testid="story-setup-back"
          onClick={onBackToHub}
        >
          <span aria-hidden="true">←</span>
          <span>Games</span>
        </button>

        <span className="badge-pill badge-pill--mint">{tierMeta.label}</span>

        <span className="badge-pill badge-pill--indigo">{STORY_BOOKS.length} Books</span>
      </header>

      <main className="story-setup-main">
        <div className="story-setup-hero">
          <h1 className="story-setup-title">Story Time</h1>
          <p className="story-setup-subtitle">
            Pick a picture book! Follow each glowing word as it reads aloud, or tap any word to hear it again.
          </p>
        </div>

        <section className="story-shelf-grid" aria-label="Choose a storybook">
          {STORY_BOOKS.map((book) => {
            const isSelected = book.id === storyId;
            return (
              <button
                key={book.id}
                type="button"
                data-testid={`story-book-card-${book.id}`}
                className={`story-book-card ${isSelected ? 'is-selected' : ''}`}
                style={{ '--book-accent': book.accentColor } as React.CSSProperties}
                onClick={() => setStoryId(book.id)}
              >
                <div className="story-book-card__art">
                  <img src={assetUrl(book.coverImagePath)} alt={book.title} loading="lazy" />
                  <span className="story-book-card__pages">{book.pages.length} Pages</span>
                </div>
                <div className="story-book-card__body">
                  <h2 className="story-book-card__title">{book.title}</h2>
                  <p className="story-book-card__sub">{book.subtitle}</p>
                </div>
              </button>
            );
          })}
        </section>

        <section className="story-setup-footer-card">
          <label className="story-autoplay-toggle">
            <input
              type="checkbox"
              checked={autoPlayNarration}
              onChange={(e) => setAutoPlayNarration(e.target.checked)}
            />
            <span>Read each page aloud automatically</span>
          </label>

          <button
            type="button"
            className="btn-primary story-start-cta"
            data-testid="story-start-btn"
            onClick={() => onStartGame({ storyId, autoPlayNarration })}
          >
            Read “{selectedBook.title}” →
          </button>
        </section>
      </main>
    </div>
  );
}
