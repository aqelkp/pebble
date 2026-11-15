import { useState } from 'react';
import { BrandLogo } from '../components/BrandLogo';
import { normalizeSpokenName, speakChildNamePhrase } from '../utils/childNameTts';
import {
  ACCENT_COLORS,
  AVATAR_OPTIONS,
  getAvatarSrc,
  sanitizeDisplayName,
  useFamilyProfiles,
  type AccentColor,
  type AvatarId,
} from '../context/FamilyProfilesContext';

interface FamilyProfilesPageProps {
  onBack: () => void;
}

export function FamilyProfilesPage({ onBack }: FamilyProfilesPageProps) {
  const {
    profiles,
    updateProfile,
    addProfile,
    removeProfile,
    resetProfiles,
  } = useFamilyProfiles();

  const [draftNames, setDraftNames] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const profile of profiles) {
      initial[profile.id] = profile.name;
    }
    return initial;
  });
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const commitName = (id: string, fallback: string) => {
    const raw = draftNames[id] ?? fallback;
    const sanitized = sanitizeDisplayName(raw, fallback);
    updateProfile(id, { name: sanitized });
    setDraftNames((prev) => ({ ...prev, [id]: sanitized }));
  };

  const handleSaveAndDone = () => {
    for (const profile of profiles) {
      const raw = draftNames[profile.id];
      if (raw !== undefined) {
        updateProfile(profile.id, { name: sanitizeDisplayName(raw, profile.name) });
      }
    }
    onBack();
  };

  const handleAddMember = () => {
    const ok = addProfile(`Player ${profiles.length + 1}`, 'girl');
    if (ok) {
      setStatusMessage('Added a new family player card.');
    }
  };

  const handleReset = () => {
    if (!confirmingReset) {
      setConfirmingReset(true);
      return;
    }
    resetProfiles();
    setDraftNames({});
    setConfirmingReset(false);
    setStatusMessage('Restored default generic player names.');
  };

  return (
    <div className="app-shell">
      <header className="top-bar" style={{ marginBottom: 10 }}>
        <div className="top-bar__left">
          <button type="button" className="icon-pill-btn" onClick={handleSaveAndDone}>
            <span aria-hidden="true">←</span>
            <span>Save & Back</span>
          </button>
        </div>
        <BrandLogo size="sm" />
        <div className="top-bar__right">
          {confirmingReset ? (
            <>
              <button
                type="button"
                className="icon-pill-btn"
                style={{ borderColor: 'var(--coral-accent)', color: '#a13a23' }}
                onClick={handleReset}
              >
                Confirm Reset
              </button>
              <button
                type="button"
                className="icon-pill-btn"
                onClick={() => setConfirmingReset(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button type="button" className="icon-pill-btn" onClick={handleReset}>
              Reset Defaults
            </button>
          )}
        </div>
      </header>

      <div className="page-title-block">
        <h1>Family Profiles</h1>
        <p>
          Personalize names and avatars for everyone playing. Everything saves right on this
          device.
        </p>
      </div>

      <main className="profiles-grid">
        {profiles.map((profile, idx) => {
          const inputValue = draftNames[profile.id] ?? profile.name;

          return (
            <section
              key={profile.id}
              className="profile-editor-card"
              aria-label={`Profile ${idx + 1}: ${profile.name}`}
            >
              <div className="profile-editor-card__top">
                <div
                  className="profile-avatar-ring"
                  style={{ borderColor: profile.accentColor }}
                >
                  <img src={getAvatarSrc(profile.avatar)} alt={profile.name} />
                </div>

                <div className="profile-input-wrap">
                  <div className="profile-input-label">
                    <label htmlFor={`name-input-${profile.id}`}>
                      {idx === 0 ? 'Child / Player 1' : `Player ${idx + 1}`}
                    </label>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <button
                        type="button"
                        className="profile-hear-btn"
                        data-testid={`hear-name-btn-${idx}`}
                        onClick={() => {
                          const spoken =
                            normalizeSpokenName(inputValue, { allowGenericDefault: true }) ??
                            (idx === 0 ? 'Child' : `Player ${idx + 1}`);
                          speakChildNamePhrase(`Hello, ${spoken}!`, {
                            enabled: true,
                            soundEnabled: true,
                          });
                        }}
                      >
                        <span aria-hidden="true">🔊</span>
                        <span>Hear Name</span>
                      </button>
                      {profiles.length > 2 && idx >= 2 && (
                        <button
                          type="button"
                          style={{ color: '#a13a23', fontSize: '0.78rem', fontWeight: 600 }}
                          onClick={() => removeProfile(profile.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    id={`name-input-${profile.id}`}
                    className="profile-name-input"
                    type="text"
                    maxLength={24}
                    value={inputValue}
                    placeholder={idx === 0 ? 'Child' : `Player ${idx + 1}`}
                    onChange={(event) => {
                      const cleanDraft = event.target.value.replace(/[\u0000-\u001F\u007F]/g, '');
                      setDraftNames((prev) => ({ ...prev, [profile.id]: cleanDraft }));
                      setStatusMessage(null);
                    }}
                    onBlur={() => commitName(profile.id, profile.name)}
                  />
                </div>
              </div>

              <div>
                <div className="profile-input-label" style={{ marginBottom: 6 }}>
                  <span>Choose Avatar</span>
                </div>
                <div className="avatar-picker-row">
                  {AVATAR_OPTIONS.map((option) => {
                    const isSelected = profile.avatar === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={`avatar-choice-btn ${
                          isSelected ? 'avatar-choice-btn--active' : ''
                        }`}
                        aria-label={`Select ${option.label} avatar for ${profile.name}`}
                        aria-pressed={isSelected}
                        onClick={() => updateProfile(profile.id, { avatar: option.id as AvatarId })}
                      >
                        <img src={getAvatarSrc(option.id)} alt={option.label} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="color-swatch-row">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: 4 }}>
                  Ring Color
                </span>
                {ACCENT_COLORS.map((color) => {
                  const isActive = profile.accentColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      className={`color-swatch-btn ${isActive ? 'color-swatch-btn--active' : ''}`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select ring color ${color} for ${profile.name}`}
                      aria-pressed={isActive}
                      onClick={() => updateProfile(profile.id, { accentColor: color as AccentColor })}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      {statusMessage && <div className="inline-feedback-banner">{statusMessage}</div>}

      <div
        style={{
          marginTop: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {profiles.length < 6 ? (
          <button type="button" className="btn-secondary" onClick={handleAddMember}>
            + Add Family Player
          </button>
        ) : (
          <span className="section-pill">Maximum 6 profiles reached</span>
        )}

        <button type="button" className="btn-primary" onClick={handleSaveAndDone}>
          Done
        </button>
      </div>
    </div>
  );
}
