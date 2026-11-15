import { useEffect, useState, type ChangeEvent } from 'react';
import {
  DAILY_LIMIT_PRESETS,
  DEFAULT_DAILY_LIMIT_MINUTES,
  MAX_DAILY_LIMIT_MINUTES,
  MIN_DAILY_LIMIT_MINUTES,
  formatDailyUsageLabel,
  type DailyPlayLimitState,
} from '../utils/dailyPlayLimit';

export interface DailyLimitParentControlProps {
  dailyLimit: DailyPlayLimitState;
  onChangeDailyLimitMinutes: (minutes: number) => void;
  onResetDailyTimeToday: () => void;
}

/**
 * Grown-Ups Only card allowing parents to set any custom daily screen-time
 * cap (1–180 min or Off) via presets, steppers, or direct numeric input,
 * and reset today's accumulated play time.
 */
export function DailyLimitParentControl({
  dailyLimit,
  onChangeDailyLimitMinutes,
  onResetDailyTimeToday,
}: DailyLimitParentControlProps) {
  const [draftMinutes, setDraftMinutes] = useState<string>(() =>
    String(dailyLimit.limitMinutes),
  );

  useEffect(() => {
    setDraftMinutes((prev) => {
      const nextStr = String(dailyLimit.limitMinutes);
      if (prev === '' && dailyLimit.limitMinutes === 0) return '';
      return nextStr;
    });
  }, [dailyLimit.limitMinutes]);

  const baseForStep =
    dailyLimit.limitMinutes > 0 ? dailyLimit.limitMinutes : DEFAULT_DAILY_LIMIT_MINUTES;

  const handleStep = (delta: number) => {
    const next = Math.min(
      MAX_DAILY_LIMIT_MINUTES,
      Math.max(MIN_DAILY_LIMIT_MINUTES, baseForStep + delta),
    );
    setDraftMinutes(String(next));
    onChangeDailyLimitMinutes(next);
  };

  const handlePresetClick = (minutes: number) => {
    setDraftMinutes(String(minutes));
    onChangeDailyLimitMinutes(minutes);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 3);
    if (digitsOnly === '') {
      setDraftMinutes('');
      return;
    }
    if (digitsOnly === '0') {
      setDraftMinutes('0');
      onChangeDailyLimitMinutes(0);
      return;
    }
    const parsed = Number.parseInt(digitsOnly, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setDraftMinutes('0');
      onChangeDailyLimitMinutes(0);
      return;
    }
    const clamped = Math.min(
      MAX_DAILY_LIMIT_MINUTES,
      Math.max(MIN_DAILY_LIMIT_MINUTES, parsed),
    );
    setDraftMinutes(String(clamped));
    onChangeDailyLimitMinutes(clamped);
  };

  const handleInputBlur = () => {
    setDraftMinutes(String(dailyLimit.limitMinutes));
  };

  return (
    <section
      className="pjs-card daily-limit-card"
      aria-labelledby="pjs-daily-limit-title"
    >
      <div className="pjs-card__head">
        <div>
          <h2 id="pjs-daily-limit-title">Daily Screen Time Limit</h2>
          <p>
            Quietly caps daily play with no distracting timer on your child&apos;s screen, then
            speaks &ldquo;Time is over for today! See you tomorrow!&rdquo;
          </p>
        </div>
        <span
          className={`badge-pill ${
            dailyLimit.limitMinutes > 0 ? 'badge-pill--mint' : 'badge-pill--muted'
          }`}
        >
          {dailyLimit.limitMinutes > 0 ? `${dailyLimit.limitMinutes} min / day` : 'Off'}
        </span>
      </div>

      <div className="pjs-pill-group" role="group" aria-label="Daily screen time presets">
        {DAILY_LIMIT_PRESETS.map((minutes) => (
          <button
            key={minutes}
            type="button"
            className={`pjs-pill ${
              dailyLimit.limitMinutes === minutes ? 'pjs-pill--active' : ''
            }`}
            aria-pressed={dailyLimit.limitMinutes === minutes}
            onClick={() => handlePresetClick(minutes)}
          >
            {minutes === 0 ? 'Off' : `${minutes} min`}
          </button>
        ))}
      </div>

      <div className="daily-limit-custom-row">
        <div className="pjs-daily-usage-meta">
          <strong>Custom Minutes (1–180 min)</strong>
          <span>Tap − / + or type any exact daily limit in minutes</span>
        </div>

        <div className="daily-limit-stepper">
          <button
            type="button"
            className="daily-limit-step-btn"
            aria-label="Decrease daily limit by 5 minutes"
            onClick={() => handleStep(-5)}
          >
            −5
          </button>
          <button
            type="button"
            className="daily-limit-step-btn"
            aria-label="Decrease daily limit by 1 minute"
            onClick={() => handleStep(-1)}
          >
            −1
          </button>

          <label className="daily-limit-input-wrap">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={3}
              className="daily-limit-input"
              aria-label="Custom daily limit minutes"
              placeholder="Off"
              value={draftMinutes}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
            />
            <span className="daily-limit-input-unit">min</span>
          </label>

          <button
            type="button"
            className="daily-limit-step-btn"
            aria-label="Increase daily limit by 1 minute"
            onClick={() => handleStep(1)}
          >
            +1
          </button>
          <button
            type="button"
            className="daily-limit-step-btn"
            aria-label="Increase daily limit by 5 minutes"
            onClick={() => handleStep(5)}
          >
            +5
          </button>
        </div>
      </div>

      <div className="pjs-daily-usage-row">
        <div className="pjs-daily-usage-meta">
          <strong>Today&apos;s Active Play</strong>
          <span>{formatDailyUsageLabel(dailyLimit)}</span>
        </div>
        <button
          type="button"
          className="btn-secondary"
          disabled={dailyLimit.usedSeconds === 0}
          onClick={onResetDailyTimeToday}
        >
          Reset Today&apos;s Time
        </button>
      </div>
    </section>
  );
}
