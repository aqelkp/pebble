import { useEffect, useState } from 'react';
import type { FamilyProfile } from '../context/FamilyProfilesContext';
import { playDailyTimeOverChime } from '../utils/dailyPlayLimit';
import { playDailyTimeOverVoice, stopAllSpokenAudio } from '../utils/wordAudio';
import { BrandLogo } from './BrandLogo';

interface DailyTimeOverScreenProps {
  childProfile?: FamilyProfile;
  soundEnabled: boolean;
  onOpenParentGate: () => void;
}

/**
 * Peaceful evening illustration using only rounded pebbles, soft clouds,
 * a crescent moon, and circular firefly dots (zero 4-point stars or forbidden marks).
 */
function RestingPebblesScene() {
  return (
    <svg
      viewBox="0 0 280 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="daily-over-art"
      aria-hidden="true"
    >
      {/* Soft evening sky arch */}
      <circle cx="140" cy="108" r="88" fill="#ECEBFF" />
      <ellipse cx="140" cy="166" rx="112" ry="18" fill="#EFEAE0" />

      {/* Warm honey crescent moon */}
      <path
        d="M84 44C74.5 50 70.5 62.5 75.5 73C80.5 83.5 92.8 88 103.5 83.5C94.5 84.5 86 79 83.2 70C80.4 61 83.5 51.2 91 45.8C88.7 44.6 86.3 44 84 44Z"
        fill="#F2B84B"
      />
      <circle cx="88" cy="64" r="24" fill="#F2B84B" fillOpacity="0.14" />

      {/* Soft rounded clouds */}
      <path
        d="M170 64C170 57.5 175.5 52.5 182 53C184.5 47 190.5 43 197.5 43C206.5 43 213.8 50 214.2 58.8C219.5 59.8 223.5 64.4 223.5 70C223.5 76.2 218.5 81 212.2 81H178.5C173.8 81 170 77.2 170 72.5V64Z"
        fill="#FFFFFF"
        fillOpacity="0.92"
      />
      <path
        d="M44 96C44 91.5 47.8 88 52.2 88.2C54.2 84.2 58.2 81.5 63 81.5C69.2 81.5 74.2 86.2 74.6 92.2C78.2 93 81 96.2 81 100C81 104.2 77.5 107.6 73.2 107.6H50C46.7 107.6 44 104.9 44 101.6V96Z"
        fill="#FFFFFF"
        fillOpacity="0.75"
      />

      {/* Soft circular fireflies */}
      <circle cx="136" cy="48" r="3.5" fill="#F2B84B" fillOpacity="0.8" />
      <circle cx="204" cy="112" r="4" fill="#3BA99C" fillOpacity="0.45" />
      <circle cx="62" cy="134" r="3" fill="#F27A5E" fillOpacity="0.45" />
      <circle cx="222" cy="140" r="2.8" fill="#5B5BD6" fillOpacity="0.35" />

      {/* Warm sage meadow cushion */}
      <path
        d="M64 162C64 150 96 142 140 142C184 142 216 150 216 162C216 171 182 176 140 176C98 176 64 171 64 162Z"
        fill="#E4F6F3"
      />

      {/* Resting stacked Pebble stones */}
      {/* Bottom large indigo stone */}
      <path
        d="M84 146C83 132 103 122 141 122.5C180 123 198 133 197 146.5C196 160 174 167 140 167C106 167 85 159.5 84 146Z"
        fill="#5B5BD6"
      />
      <ellipse cx="122" cy="135" rx="18" ry="4.5" fill="#FFFFFF" fillOpacity="0.18" />

      {/* Middle warm coral pebble */}
      <path
        d="M99 114C98 102 115 94 141 94.5C167 95 182 103 181 114.5C180 126 162 131.5 140 131.5C118 131.5 100 125.5 99 114Z"
        fill="#F27A5E"
      />
      <ellipse cx="126" cy="105" rx="13" ry="3.5" fill="#FFFFFF" fillOpacity="0.22" />

      {/* Top calm sage mint pebble with peaceful closed eyes */}
      <path
        d="M113 83.5C113 73.5 124.5 67 140.5 67C156.5 67 167 74 166.5 84C166 94 154 99 139.5 99C125 99 113 93 113 83.5Z"
        fill="#3BA99C"
      />
      <ellipse cx="131" cy="76" rx="9" ry="2.8" fill="#FFFFFF" fillOpacity="0.22" />

      {/* Calm sleeping eyes & gentle smile on top pebble */}
      <path
        d="M126 83.5C127.8 85.8 131.2 85.8 133 83.5"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M147 83.5C148.8 85.8 152.2 85.8 154 83.5"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M136.5 89.2C138.8 91.2 141.8 91.2 144 89.2"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DailyTimeOverScreen({
  childProfile,
  soundEnabled,
  onOpenParentGate,
}: DailyTimeOverScreenProps) {
  const [needsGestureReplay, setNeedsGestureReplay] = useState(false);

  const trimmedName = childProfile?.name.trim() ?? '';
  const hasCustomName = trimmedName.length > 0 && trimmedName.toLowerCase() !== 'child';
  const seeYouTomorrowLine = hasCustomName
    ? `See you tomorrow, ${trimmedName}!`
    : 'See you tomorrow!';

  useEffect(() => {
    if (!soundEnabled) {
      setNeedsGestureReplay(false);
      return;
    }

    playDailyTimeOverChime(true);
    const voiceTimer = window.setTimeout(() => {
      playDailyTimeOverVoice(true, () => {
        setNeedsGestureReplay(true);
      });
    }, 280);

    return () => {
      window.clearTimeout(voiceTimer);
      stopAllSpokenAudio();
    };
  }, [soundEnabled]);

  useEffect(() => {
    if (!needsGestureReplay || !soundEnabled) return;

    const handleFirstGesture = () => {
      setNeedsGestureReplay(false);
      playDailyTimeOverVoice(true);
    };

    window.addEventListener('pointerdown', handleFirstGesture, { once: true, passive: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [needsGestureReplay, soundEnabled]);

  const handleHearMessage = () => {
    setNeedsGestureReplay(false);
    playDailyTimeOverVoice(true);
  };

  return (
    <div className="daily-over-shell">
      <header className="top-bar">
        <BrandLogo size="md" subtitle="Rest & recharge" />

        <button
          type="button"
          className="icon-pill-btn"
          onClick={onOpenParentGate}
          aria-label="Open Parent Settings"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="4" y="11" width="16" height="10" rx="2.5" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          <span>Parent</span>
        </button>
      </header>

      <main className="daily-over-stage">
        <section className="daily-over-card" aria-labelledby="daily-over-title">
          <span className="badge-pill badge-pill--mint">All Done for Today</span>

          <RestingPebblesScene />

          <h1 id="daily-over-title" className="font-display">
            Time is over for today!
          </h1>
          <h2 className="daily-over-subtitle font-display">{seeYouTomorrowLine}</h2>
          <p className="daily-over-desc">
            Wonderful playing today! Rest your eyes and have fun offline — Pebble will be ready
            for more adventures tomorrow.
          </p>

          <div className="daily-over-actions">
            <button type="button" className="btn-primary" onClick={handleHearMessage}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
              <span>Hear Message</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
