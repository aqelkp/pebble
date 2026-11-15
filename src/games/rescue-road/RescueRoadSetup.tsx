import { useState } from 'react';
import { BrandLogo } from '../../components/BrandLogo';
import { CARD_THEMES, DEFAULT_THEME_ID, type ThemeId } from '../memory-match/themes';
import { assetUrl } from '../../utils/assets';
import {
  RESCUE_VEHICLES,
  ROAD_ROUND_OPTIONS,
  ROAD_SIZE_SPECS,
  type RescueRoadConfig,
  type RoadBoardSize,
  type RoadRoundSize,
  type VehicleId,
} from './roadEngine';

interface RescueRoadSetupProps {
  onBackToHub: () => void;
  onStartGame: (config: RescueRoadConfig) => void;
  initialConfig?: RescueRoadConfig;
}

export function RescueRoadSetup({
  onBackToHub,
  onStartGame,
  initialConfig,
}: RescueRoadSetupProps) {
  const [size, setSize] = useState<RoadBoardSize>(initialConfig?.size ?? '3x3');
  const [roundSize, setRoundSize] = useState<RoadRoundSize>(
    initialConfig?.roundSize ?? '3-roads',
  );
  const [vehicleId, setVehicleId] = useState<VehicleId>(
    initialConfig?.vehicleId ?? 'fire-truck',
  );
  const [themeId, setThemeId] = useState<ThemeId>(initialConfig?.themeId ?? DEFAULT_THEME_ID);

  const selectedVehicle =
    RESCUE_VEHICLES.find((v) => v.id === vehicleId) ?? RESCUE_VEHICLES[0];
  const selectedRound =
    ROAD_ROUND_OPTIONS.find((r) => r.id === roundSize) ?? ROAD_ROUND_OPTIONS[1];

  return (
    <div className="setup-screen">
      <div className="setup-topbar">
        <button type="button" className="btn-secondary" onClick={onBackToHub}>
          ← Games
        </button>
        <BrandLogo size="md" subtitle="Rescue Road Setup" />
      </div>

      <section className="setup-card-section" aria-labelledby="rr-size-heading">
        <div className="setup-section-header">
          <h2 id="rr-size-heading">1. Road Map Size</h2>
        </div>

        <div className="board-size-grid">
          {ROAD_SIZE_SPECS.map((spec) => {
            const active = size === spec.id;
            return (
              <button
                key={spec.id}
                type="button"
                className={`size-option-btn ${active ? 'size-option-btn--selected' : ''}`}
                onClick={() => setSize(spec.id)}
                aria-pressed={active}
              >
                <div className="size-option-btn__top">
                  <span className="size-option-btn__dims">{spec.label}</span>
                  {spec.isDefault && (
                    <span className="badge-pill badge-pill--indigo">Default</span>
                  )}
                </div>
                <span className="size-option-btn__meta">{spec.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="setup-card-section" aria-labelledby="rr-round-heading">
        <div className="setup-section-header">
          <h2 id="rr-round-heading">2. Rescue Trips</h2>
        </div>

        <div className="board-size-grid">
          {ROAD_ROUND_OPTIONS.map((opt) => {
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

      <section className="setup-card-section" aria-labelledby="rr-vehicle-heading">
        <div className="setup-section-header">
          <h2 id="rr-vehicle-heading">3. Pick Your Rescue Truck</h2>
        </div>

        <div className="board-size-grid">
          {RESCUE_VEHICLES.map((veh) => {
            const active = vehicleId === veh.id;
            return (
              <button
                key={veh.id}
                type="button"
                className={`size-option-btn ${active ? 'size-option-btn--selected' : ''}`}
                onClick={() => setVehicleId(veh.id)}
                aria-pressed={active}
              >
                <div className="size-option-btn__top">
                  <span className="size-option-btn__dims">{veh.label}</span>
                  <span
                    className="rr-vehicle-swatch"
                    style={{ background: veh.bodyColor, borderColor: veh.roofColor }}
                    aria-hidden="true"
                  />
                </div>
                <span className="size-option-btn__meta">
                  Honks &amp; drives to the finish flag
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="setup-card-section" aria-labelledby="rr-friend-heading">
        <div className="setup-section-header">
          <h2 id="rr-friend-heading">4. Finish Line Friend</h2>
        </div>

        <div className="theme-selector-grid">
          {CARD_THEMES.map((theme) => {
            const selected = theme.id === themeId;
            return (
              <button
                key={theme.id}
                type="button"
                className={`theme-option-card ${selected ? 'theme-option-card--selected' : ''}`}
                onClick={() => setThemeId(theme.id)}
                aria-pressed={selected}
              >
                <div className="theme-preview-pair">
                  <img src={assetUrl(theme.previewPaths[0])} alt="" />
                  <img src={assetUrl(theme.previewPaths[1])} alt="" />
                </div>
                <span className="theme-option-card__title">{theme.title}</span>
                <span className="theme-option-card__sub">{theme.subtitle}</span>
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
          onClick={() => onStartGame({ size, roundSize, vehicleId, themeId })}
        >
          Start {selectedVehicle.label} · {selectedRound.label}
        </button>
      </div>
    </div>
  );
}
