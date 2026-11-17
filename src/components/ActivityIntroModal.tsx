import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getStationSpec } from '../games/letter-train/letterData';
import { WordIllustration } from '../games/letter-train/WordIllustration';
import { getThemeSpec } from '../games/memory-match/themes';
import { WordFunArt } from '../games/word-fun/WordFunArt';
import { ACTIVITIES_PER_CHAPTER, type JourneyActivity } from '../journey/journeyTypes';
import { getJourneyVoiceSpec } from '../journey/voiceInstructions';
import { assetUrl } from '../utils/assets';
import { normalizeSpokenName, speakChildNamePhrase, stopChildNameTts } from '../utils/childNameTts';
import { stopAllSpokenAudio } from '../utils/wordAudio';
import { PebbleMark } from './BrandLogo';

interface ActivityIntroModalProps {
  activity: JourneyActivity;
  soundEnabled: boolean;
  waitForVoiceIntro: boolean;
  mode?: 'intro' | 'help';
  childName?: string;
  speakChildName?: boolean;
  onConfirmStart: () => void;
  onCancel: () => void;
}

const MAX_WAIT_SAFETY_MS = 6500;
const AUDIO_START_TIMEOUT_MS = 2400;

function ReplayVoiceIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="10 6 5.5 9.5 2.5 9.5 2.5 14.5 5.5 14.5 10 18 10 6" fill="currentColor" fillOpacity="0.18" />
      <polygon points="10 6 5.5 9.5 2.5 9.5 2.5 14.5 5.5 14.5 10 18 10 6" />
      <path d="M14.5 8.5a5 5 0 0 1 7 3.5 5 5 0 0 1-5 5 4.8 4.8 0 0 1-3.3-1.3" />
      <polyline points="14 6 14.5 9.2 17.7 8.7" />
    </svg>
  );
}

function ActivityPreviewStage({ activity }: { activity: JourneyActivity }) {
  if (activity.gameId === 'memory-match') {
    const theme = getThemeSpec(activity.previewThemeId ?? 'paw-patrol');
    const sampleChar = theme.characters[0];
    return (
      <div className="intro-demo-stage intro-demo-stage--memory" aria-hidden="true">
        <div className="intro-demo-card intro-demo-card--a">
          <div className="intro-demo-card__back">
            <PebbleMark size={30} />
          </div>
          <div className="intro-demo-card__front">
            <img src={assetUrl(sampleChar.imagePath)} alt="" />
          </div>
        </div>
        <div className="intro-demo-match-pill">Match!</div>
        <div className="intro-demo-card intro-demo-card--b">
          <div className="intro-demo-card__back">
            <PebbleMark size={30} />
          </div>
          <div className="intro-demo-card__front">
            <img src={assetUrl(sampleChar.imagePath)} alt="" />
          </div>
        </div>
      </div>
    );
  }

  if (activity.gameId === 'letter-train') {
    const letter = activity.lettersCovered?.[0] ?? 'A';
    const station = getStationSpec(letter);
    const sampleWord = station.words[0];
    return (
      <div className="intro-demo-stage intro-demo-stage--train" aria-hidden="true">
        <div className="intro-demo-word-chip">
          <WordIllustration id={sampleWord.id} size={64} />
          <span>{sampleWord.word}</span>
        </div>
        <span className="intro-demo-arrow">→</span>
        <div className="intro-demo-train-car">
          <span className="intro-demo-train-car__letter">{letter}</span>
          <span className="intro-demo-train-car__sub">Train Car</span>
        </div>
      </div>
    );
  }

  if (activity.gameId === 'letter-trace') {
    const traceMode =
      activity.payload.gameId === 'letter-trace'
        ? (activity.payload.config.traceMode ?? 'letters')
        : 'letters';

    if (traceMode === 'shapes') {
      return (
        <div className="intro-demo-stage intro-demo-stage--trace" aria-hidden="true">
          <div className="intro-demo-trace-card">
            <svg viewBox="0 0 220 118" className="intro-demo-trace-svg">
              <circle
                cx="66"
                cy="60"
                r="34"
                fill="none"
                stroke="#5B5BD6"
                strokeWidth="7"
              />
              <polygon
                points="158,24 194,92 122,92"
                fill="none"
                stroke="#D8D3EE"
                strokeWidth="7"
                strokeLinejoin="round"
              />
              <circle cx="66" cy="26" r="11" fill="#5B5BD6" stroke="#FFFFFF" strokeWidth="2.5" />
              <text
                x="66"
                y="30"
                textAnchor="middle"
                fontFamily="Fredoka, sans-serif"
                fontSize="12"
                fontWeight="700"
                fill="#FFFFFF"
              >
                1
              </text>
              <circle cx="34" cy="60" r="7" fill="#F2B84B" className="intro-demo-trace-pebble" />
            </svg>
          </div>
        </div>
      );
    }

    const leftGlyph = traceMode === 'numbers' ? '1' : (activity.lettersCovered?.[0] ?? 'A');
    const rightGlyph = traceMode === 'numbers' ? '2' : leftGlyph.toLowerCase();
    return (
      <div className="intro-demo-stage intro-demo-stage--trace" aria-hidden="true">
        <div className="intro-demo-trace-card">
          <svg viewBox="0 0 220 118" className="intro-demo-trace-svg">
            <line x1="12" y1="22" x2="208" y2="22" stroke="#BFD7F5" strokeWidth="2" />
            <line
              x1="12"
              y1="56"
              x2="208"
              y2="56"
              stroke="#C7CDD8"
              strokeWidth="2"
              strokeDasharray="6 6"
            />
            <line x1="12" y1="94" x2="208" y2="94" stroke="#8FD3C8" strokeWidth="2.5" />
            <text
              x="64"
              y="91"
              textAnchor="middle"
              fontFamily="Fredoka, sans-serif"
              fontSize="74"
              fontWeight="700"
              fill="#5B5BD6"
            >
              {leftGlyph}
            </text>
            <text
              x="156"
              y="91"
              textAnchor="middle"
              fontFamily="Fredoka, sans-serif"
              fontSize="66"
              fontWeight="700"
              fill="#E5E0D5"
            >
              {rightGlyph}
            </text>
            <circle cx="64" cy="24" r="11" fill="#5B5BD6" stroke="#FFFFFF" strokeWidth="2.5" />
            <text
              x="64"
              y="28"
              textAnchor="middle"
              fontFamily="Fredoka, sans-serif"
              fontSize="12"
              fontWeight="700"
              fill="#FFFFFF"
            >
              1
            </text>
            <circle cx="48" cy="60" r="7" fill="#F2B84B" className="intro-demo-trace-pebble" />
          </svg>
        </div>
      </div>
    );
  }

  if (activity.gameId === 'letter-river') {
    const letter = activity.lettersCovered?.[0] ?? 'E';
    const station = getStationSpec(letter);
    const sampleWord = station.words[0];
    return (
      <div className="intro-demo-stage intro-demo-stage--river" aria-hidden="true">
        <div className="intro-demo-fish-chip">
          <WordIllustration id={sampleWord.id} size={64} />
          <span>{sampleWord.word}</span>
        </div>
        <span className="intro-demo-arrow">→</span>
        <div className="intro-demo-bucket">
          <span className="intro-demo-bucket__letter">{letter}</span>
          <span className="intro-demo-bucket__sub">Bucket</span>
        </div>
      </div>
    );
  }

  if (activity.gameId === 'picture-sudoku') {
    const theme = getThemeSpec(activity.previewThemeId ?? 'toy-story');
    const c1 = theme.characters[0];
    const c2 = theme.characters[1];
    return (
      <div className="intro-demo-stage intro-demo-stage--sudoku" aria-hidden="true">
        <div className="intro-demo-sudoku-grid">
          <div className="intro-demo-sudoku-cell">
            <img src={assetUrl(c1.imagePath)} alt="" />
          </div>
          <div className="intro-demo-sudoku-cell">
            <img src={assetUrl(c2.imagePath)} alt="" />
          </div>
          <div className="intro-demo-sudoku-cell">
            <img src={assetUrl(c2.imagePath)} alt="" />
          </div>
          <div className="intro-demo-sudoku-cell intro-demo-sudoku-cell--target">
            <img className="intro-demo-sudoku-drop" src={assetUrl(c1.imagePath)} alt="" />
          </div>
        </div>
      </div>
    );
  }

  if (activity.gameId === 'word-fun') {
    return (
      <div className="intro-demo-stage intro-demo-stage--word" aria-hidden="true">
        <WordFunArt id="cat" size={102} />
        <div className="intro-demo-word-tiles">
          <span className="intro-demo-tile intro-demo-tile--1">C</span>
          <span className="intro-demo-tile intro-demo-tile--2">A</span>
          <span className="intro-demo-tile intro-demo-tile--3">T</span>
        </div>
      </div>
    );
  }

  if (activity.gameId === 'rescue-road') {
    return (
      <div className="intro-demo-stage intro-demo-stage--road" aria-hidden="true">
        <div className="intro-demo-road-strip">
          <span className="intro-demo-road-end">Garage</span>
          <div className="intro-demo-road-slot">
            <svg viewBox="0 0 100 100" className="intro-demo-road-drop">
              <rect x="4" y="4" width="92" height="92" rx="16" fill="#EAF5EF" />
              <path d="M 0 50 L 100 50" stroke="#D5C39D" strokeWidth="46" fill="none" />
              <path d="M 0 50 L 100 50" stroke="#4C556A" strokeWidth="36" fill="none" />
              <path
                d="M 8 50 L 92 50"
                stroke="#FFF8EA"
                strokeWidth="5"
                strokeDasharray="10 10"
                fill="none"
              />
            </svg>
          </div>
          <span className="intro-demo-road-end intro-demo-road-end--finish">Finish</span>
        </div>
      </div>
    );
  }

  if (activity.gameId === 'sticker-jigsaw') {
    const theme = getThemeSpec(activity.previewThemeId ?? 'lion-king');
    const char = theme.characters[0];
    return (
      <div className="intro-demo-stage intro-demo-stage--jigsaw" aria-hidden="true">
        <div className="intro-demo-jigsaw-grid">
          {[0, 1, 2, 3].map((idx) => {
            const r = Math.floor(idx / 2);
            const c = idx % 2;
            const isTarget = idx === 3;
            return (
              <div
                key={idx}
                className={`intro-demo-jigsaw-cell ${isTarget ? 'intro-demo-jigsaw-cell--target' : ''}`}
              >
                <div className={`sj-crop-box ${isTarget ? 'intro-demo-sudoku-drop' : ''}`}>
                  <img
                    src={assetUrl(char.imagePath)}
                    alt=""
                    style={{
                      width: '200%',
                      height: '200%',
                      left: `${-c * 100}%`,
                      top: `${-r * 100}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activity.gameId === 'sticker-scene') {
    const theme = getThemeSpec(activity.previewThemeId ?? 'lion-king');
    const stickerChar = theme.characters[0];
    return (
      <div className="intro-demo-stage intro-demo-stage--scene" aria-hidden="true">
        <div className="intro-demo-scene-card">
          <div className="intro-demo-scene-shadow">
            <img src={assetUrl(stickerChar.imagePath)} alt="" />
          </div>
          <div className="intro-demo-scene-drop">
            <img src={assetUrl(stickerChar.imagePath)} alt="" />
          </div>
        </div>
        <span className="intro-demo-match-pill">Match Shadow!</span>
      </div>
    );
  }

  if (activity.gameId === 'spot-the-twin') {
    return (
      <div className="intro-demo-stage intro-demo-stage--twin" aria-hidden="true">
        <div className="intro-demo-twin-card">
          <WordIllustration id="duck" size={44} />
          <WordIllustration id="apple" size={40} />
          <div className="intro-demo-twin-highlight">
            <WordIllustration id="sun" size={44} />
          </div>
        </div>
        <div className="intro-demo-match-pill">Twin!</div>
        <div className="intro-demo-twin-card">
          <WordIllustration id="ball" size={42} />
          <div className="intro-demo-twin-highlight">
            <WordIllustration id="sun" size={44} />
          </div>
          <WordIllustration id="frog" size={42} />
        </div>
        <span className="intro-demo-twin-caption">Find the ONE picture hiding on both cards!</span>
      </div>
    );
  }

  if (activity.gameId === 'dot-to-dot') {
    const seqMode =
      activity.payload.gameId === 'dot-to-dot' ? activity.payload.config.sequenceMode : 'numbers';
    const startDot =
      activity.payload.gameId === 'dot-to-dot' ? activity.payload.config.dotCount : 10;
    const labels =
      seqMode === 'letters'
        ? ['A', 'B', 'C', 'D', 'E']
        : seqMode === 'countdown'
          ? [0, 1, 2, 3, 4].map((offset) => String(startDot - offset))
          : ['1', '2', '3', '4', '5'];
    return (
      <div className="intro-demo-stage intro-demo-stage--dots" aria-hidden="true">
        <svg viewBox="0 0 240 120" className="intro-demo-dots-svg">
          <path
            d="M 42 84 L 74 36 L 122 26 L 170 40 L 196 84"
            fill="none"
            stroke="#5B5BD6"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="intro-demo-dots-line"
          />
          {[
            { x: 42, y: 84, label: labels[0] },
            { x: 74, y: 36, label: labels[1] },
            { x: 122, y: 26, label: labels[2] },
            { x: 170, y: 40, label: labels[3] },
            { x: 196, y: 84, label: labels[4] },
          ].map((pt, idx) => (
            <g key={pt.label} transform={`translate(${pt.x}, ${pt.y})`}>
              <circle
                r="14"
                fill={idx === 0 ? '#5B5BD6' : '#3BA99C'}
                stroke="#FFFFFF"
                strokeWidth="2.5"
              />
              <text
                x="0"
                y="1"
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="Fredoka, sans-serif"
                fontSize="13"
                fontWeight="700"
                fill="#FFFFFF"
              >
                {pt.label}
              </text>
            </g>
          ))}
        </svg>
        <span className="intro-demo-twin-caption">
          {seqMode === 'countdown'
            ? `Count backward from ${startDot} down to 0 to reveal color!`
            : 'Drag or tap dots in order to reveal color!'}
        </span>
      </div>
    );
  }

  if (activity.gameId === 'word-peekaboo') {
    return (
      <div className="intro-demo-stage intro-demo-stage--peekaboo" aria-hidden="true">
        <div className="intro-demo-peekaboo-frame">
          <img
            src={assetUrl('themes/cars/01-mcqueen.png')}
            alt=""
            className="intro-demo-peekaboo-art"
          />
          <div className="intro-demo-peekaboo-grid">
            <span className="intro-demo-peekaboo-tile is-peeled">was</span>
            <span className="intro-demo-peekaboo-tile is-target">the</span>
            <span className="intro-demo-peekaboo-tile">she</span>
            <span className="intro-demo-peekaboo-tile">jet</span>
          </div>
        </div>
        <span className="intro-demo-twin-caption">
          Listen for one word &amp; peel tiles to discover friends!
        </span>
      </div>
    );
  }

  if (
    activity.gameId === 'mystery-express' ||
    activity.gameId === 'pebble-creek' ||
    activity.gameId === 'cloud-balloon' ||
    activity.gameId === 'treasure-keys'
  ) {
    const questCount =
      activity.payload.gameId === activity.gameId ? activity.payload.config.roundLength : 5;
    const questUnit = activity.gameId === 'treasure-keys' ? 'Keys' : 'Quests';
    return (
      <div className="intro-demo-stage intro-demo-stage--train" aria-hidden="true">
        <img
          src={assetUrl(activity.artPath)}
          alt=""
          style={{
            width: 88,
            height: 88,
            borderRadius: 20,
            objectFit: 'cover',
            boxShadow: '0 6px 16px rgba(30, 36, 51, 0.14)',
          }}
        />
        <span className="intro-demo-arrow">→</span>
        <div className="intro-demo-train-car">
          <span className="intro-demo-train-car__letter">{questCount}</span>
          <span className="intro-demo-train-car__sub">{questUnit}</span>
        </div>
      </div>
    );
  }

  if (activity.gameId === 'compare-quest') {
    return (
      <div
        className="intro-demo-stage"
        aria-hidden="true"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              background: '#FAF6EC',
              border: '2px solid #DFC9A3',
              borderRadius: 16,
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', gap: 4 }}>
              <img src={assetUrl('themes/fruits/01-apple.png')} alt="" width={28} height={28} />
              <img src={assetUrl('themes/fruits/01-apple.png')} alt="" width={28} height={28} />
              <img src={assetUrl('themes/fruits/01-apple.png')} alt="" width={28} height={28} />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <img src={assetUrl('themes/fruits/01-apple.png')} alt="" width={28} height={28} />
              <img src={assetUrl('themes/fruits/01-apple.png')} alt="" width={28} height={28} />
            </div>
            <strong style={{ fontFamily: 'var(--font-display)', color: '#4949C0', fontSize: '1.1rem' }}>
              5
            </strong>
          </div>

          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: '#E4F6F3',
              border: '3px solid #3BA99C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: '2.2rem',
              fontWeight: 700,
              color: '#1F786D',
            }}
          >
            &gt;
          </div>

          <div
            style={{
              background: '#FAF6EC',
              border: '2px solid #DFC9A3',
              borderRadius: 16,
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', gap: 4 }}>
              <img src={assetUrl('themes/fruits/01-apple.png')} alt="" width={28} height={28} />
              <img src={assetUrl('themes/fruits/01-apple.png')} alt="" width={28} height={28} />
              <img src={assetUrl('themes/fruits/01-apple.png')} alt="" width={28} height={28} />
            </div>
            <strong style={{ fontFamily: 'var(--font-display)', color: '#4949C0', fontSize: '1.1rem' }}>
              3
            </strong>
          </div>
        </div>
        <span className="intro-demo-twin-caption">
          Wide open side points to the bigger side — tap, drag, or write &gt;, =, or &lt;!
        </span>
      </div>
    );
  }

  if (activity.gameId === 'word-trace') {
    return (
      <div className="intro-demo-stage intro-demo-stage--word" aria-hidden="true">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '10px 16px',
            borderRadius: 18,
            background: '#FFFDF9',
            border: '2px solid #E5DECB',
          }}
        >
          <WordFunArt id="cat" size={68} />
          <svg width="146" height="74" viewBox="0 0 146 74">
            <line x1="6" y1="14" x2="140" y2="14" stroke="#E86F58" strokeWidth="1.8" />
            <line
              x1="6"
              y1="30"
              x2="140"
              y2="30"
              stroke="#6CA6E0"
              strokeWidth="1.6"
              strokeDasharray="6 5"
            />
            <line x1="6" y1="52" x2="140" y2="52" stroke="#4B8FD6" strokeWidth="2.2" />
            <line x1="6" y1="64" x2="140" y2="64" stroke="#E86F58" strokeWidth="1.8" />
            <text
              x="22"
              y="50"
              fontFamily="Fredoka, sans-serif"
              fontSize="36"
              fontWeight="700"
              fill="#5B5BD6"
            >
              ca
            </text>
            <text
              x="86"
              y="50"
              fontFamily="Fredoka, sans-serif"
              fontSize="36"
              fontWeight="700"
              fill="#D8D3EE"
            >
              t
            </text>
            <circle cx="94" cy="18" r="9.5" fill="#5B5BD6" stroke="#FFFFFF" strokeWidth="2" />
            <text
              x="94"
              y="21.5"
              textAnchor="middle"
              fontFamily="Fredoka, sans-serif"
              fontSize="11"
              fontWeight="700"
              fill="#FFFFFF"
            >
              1
            </text>
          </svg>
        </div>
        <span className="intro-demo-twin-caption">
          Write each letter left-to-right on the 4-line notebook!
        </span>
      </div>
    );
  }

  if (activity.gameId === 'circle-sort') {
    return (
      <div
        className="intro-demo-stage"
        aria-hidden="true"
        style={{ flexDirection: 'column', gap: 10 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            background: '#FFFDF8',
            border: '2px solid #E5DFD3',
            borderRadius: 20,
            padding: '12px 18px',
            boxShadow: '0 4px 12px rgba(30, 36, 51, 0.06)',
          }}
        >
          <div style={{ position: 'relative', padding: 6 }}>
            <WordIllustration id="lion" size={50} />
            <svg
              viewBox="0 0 80 80"
              style={{
                position: 'absolute',
                inset: -4,
                width: 'calc(100% + 8px)',
                height: 'calc(100% + 8px)',
                pointerEvents: 'none',
              }}
            >
              <path
                d="M 41 7 C 64 6, 75 21, 74 42 C 73 63, 57 75, 37 74 C 17 73, 6 58, 8 38 C 9 18, 25 8, 45 10"
                fill="rgba(59, 169, 156, 0.10)"
                stroke="#3BA99C"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div style={{ padding: 6, opacity: 0.78 }}>
            <WordIllustration id="cow" size={48} />
          </div>
          <div style={{ position: 'relative', padding: 6 }}>
            <WordIllustration id="tiger" size={50} />
            <svg
              viewBox="0 0 80 80"
              style={{
                position: 'absolute',
                inset: -4,
                width: 'calc(100% + 8px)',
                height: 'calc(100% + 8px)',
                pointerEvents: 'none',
              }}
            >
              <path
                d="M 39 8 C 62 7, 74 22, 73 41 C 72 62, 56 74, 36 73 C 16 72, 7 57, 9 37 C 11 18, 26 9, 44 11"
                fill="rgba(59, 169, 156, 0.10)"
                stroke="#3BA99C"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
        <span className="intro-demo-twin-caption">
          Tap or draw a circle around every picture that belongs!
        </span>
      </div>
    );
  }

  return (
    <div className="intro-demo-stage intro-demo-stage--safari" aria-hidden="true">
      <div className="intro-demo-safari-animals">
        <div className="intro-demo-animal intro-demo-animal--1">
          <img src={assetUrl('themes/lion-king/01-simba.png')} alt="" />
          <span>1</span>
        </div>
        <div className="intro-demo-animal intro-demo-animal--2">
          <img src={assetUrl('themes/lion-king/01-simba.png')} alt="" />
          <span>2</span>
        </div>
        <div className="intro-demo-animal intro-demo-animal--3">
          <img src={assetUrl('themes/lion-king/01-simba.png')} alt="" />
          <span>3</span>
        </div>
      </div>
      <span className="intro-demo-arrow">→</span>
      <div className="intro-demo-num-block">3</div>
    </div>
  );
}

export function ActivityIntroModal({
  activity,
  soundEnabled,
  waitForVoiceIntro,
  mode = 'intro',
  childName,
  speakChildName = true,
  onConfirmStart,
  onCancel,
}: ActivityIntroModalProps) {
  const isHelpMode = mode === 'help';
  const effectiveWait = !isHelpMode && (waitForVoiceIntro || Boolean(activity.isNewGameIntro));
  const voiceSpec = useMemo(() => getJourneyVoiceSpec(activity.voiceClipId), [activity.voiceClipId]);
  const customChildName = useMemo(() => normalizeSpokenName(childName), [childName]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWaitingAudio, setIsWaitingAudio] = useState(false);
  const [unlocked, setUnlocked] = useState(!effectiveWait);
  const [replayNonce, setReplayNonce] = useState(0);
  const shouldPlayAudio = soundEnabled || replayNonce > 0 || isHelpMode;

  useEffect(() => {
    setUnlocked(!effectiveWait);
  }, [activity.index, effectiveWait]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopPlayback = useCallback(() => {
    stopChildNameTts();
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      } catch {
        // Ignore audio cleanup errors
      }
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsWaitingAudio(false);
  }, []);

  useEffect(() => {
    stopAllSpokenAudio();
    stopPlayback();

    const shouldSpeakNameFirst =
      !isHelpMode && speakChildName !== false && Boolean(customChildName) && shouldPlayAudio && replayNonce === 0;
    const targetDurationMs = Math.min(
      MAX_WAIT_SAFETY_MS + (shouldSpeakNameFirst ? 1200 : 0),
      Math.max(1200, voiceSpec.durationMs + (shouldPlayAudio ? 2200 : 200)),
    );
    let cancelled = false;
    let cancelNameSpeech: (() => void) | null = null;
    let clockMode: 'waiting-for-audio' | 'audio-playing' | 'fallback-timer' =
      shouldPlayAudio && typeof Audio !== 'undefined' ? 'waiting-for-audio' : 'fallback-timer';
    let fallbackStartedAt: number | null =
      clockMode === 'fallback-timer' ? performance.now() : null;
    let audioStartTimeout: number | null = null;

    setElapsedMs(0);
    setIsPlaying(true);
    setIsWaitingAudio(clockMode === 'waiting-for-audio');

    const switchToFallbackClock = () => {
      if (cancelled || clockMode === 'fallback-timer') return;
      if (audioStartTimeout !== null) {
        window.clearTimeout(audioStartTimeout);
        audioStartTimeout = null;
      }
      // Destroy pending audio so delayed network bytes never play out-of-sync later
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.removeAttribute('src');
          audioRef.current.load();
        } catch {
          // Ignore cleanup errors
        }
        audioRef.current = null;
      }
      clockMode = 'fallback-timer';
      fallbackStartedAt = performance.now();
      setIsWaitingAudio(false);
    };

    const safetyUnlockTimer = window.setTimeout(() => {
      if (!cancelled) {
        setUnlocked(true);
      }
    }, targetDurationMs);

    const tick = () => {
      if (cancelled) return;
      const el = audioRef.current;

      if (clockMode === 'waiting-for-audio') {
        if (el && !el.paused && el.currentTime > 0) {
          if (audioStartTimeout !== null) {
            window.clearTimeout(audioStartTimeout);
            audioStartTimeout = null;
          }
          clockMode = 'audio-playing';
          setIsWaitingAudio(false);
        } else {
          // Keep words in upcoming state while waiting for network/decode so text never leads audio
          setElapsedMs(0);
          rafRef.current = window.requestAnimationFrame(tick);
          return;
        }
      }

      if (clockMode === 'audio-playing') {
        if (!el) {
          switchToFallbackClock();
        } else {
          const rawMs = el.currentTime * 1000;
          const mediaDurationMs =
            Number.isFinite(el.duration) && el.duration > 0.2
              ? el.duration * 1000
              : voiceSpec.durationMs;
          const normalizedMs = Math.min(
            voiceSpec.durationMs,
            Math.max(0, (rawMs / mediaDurationMs) * voiceSpec.durationMs),
          );
          setElapsedMs(normalizedMs);
          if (el.ended) {
            setElapsedMs(voiceSpec.durationMs);
            setUnlocked(true);
            setIsPlaying(false);
            setIsWaitingAudio(false);
            return;
          }
          rafRef.current = window.requestAnimationFrame(tick);
          return;
        }
      }

      if (fallbackStartedAt === null) {
        fallbackStartedAt = performance.now();
      }
      const currentMs = performance.now() - fallbackStartedAt;
      setElapsedMs(currentMs);
      if (currentMs >= voiceSpec.durationMs) {
        setUnlocked(true);
        setIsPlaying(false);
        return;
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };

    const startAudioClip = () => {
      if (cancelled || clockMode !== 'waiting-for-audio') return;
      try {
        const audio = new Audio(assetUrl(voiceSpec.audioPath));
        audio.preload = 'auto';
        audio.volume = 0.95;
        audioRef.current = audio;

        const handleAudioStarted = () => {
          if (cancelled || clockMode === 'fallback-timer') return;
          if (audioStartTimeout !== null) {
            window.clearTimeout(audioStartTimeout);
            audioStartTimeout = null;
          }
          clockMode = 'audio-playing';
          setIsWaitingAudio(false);
        };

        audio.addEventListener('playing', handleAudioStarted);
        audio.addEventListener('timeupdate', () => {
          if (audio.currentTime > 0) {
            handleAudioStarted();
          }
        });
        audio.addEventListener('error', () => {
          switchToFallbackClock();
        });
        audio.addEventListener('ended', () => {
          if (cancelled || clockMode === 'fallback-timer') return;
          if (audioStartTimeout !== null) {
            window.clearTimeout(audioStartTimeout);
            audioStartTimeout = null;
          }
          setElapsedMs(voiceSpec.durationMs);
          setUnlocked(true);
          setIsPlaying(false);
          setIsWaitingAudio(false);
        });

        audioStartTimeout = window.setTimeout(() => {
          if (clockMode === 'waiting-for-audio') {
            switchToFallbackClock();
          }
        }, AUDIO_START_TIMEOUT_MS);

        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            switchToFallbackClock();
          });
        }
      } catch {
        switchToFallbackClock();
      }
    };

    if (clockMode === 'waiting-for-audio') {
      if (shouldSpeakNameFirst && customChildName) {
        cancelNameSpeech = speakChildNamePhrase(`Ready, ${customChildName}?`, {
          enabled: true,
          soundEnabled: true,
          onDone: startAudioClip,
        });
      } else {
        startAudioClip();
      }
    }

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelNameSpeech?.();
      window.clearTimeout(safetyUnlockTimer);
      if (audioStartTimeout !== null) {
        window.clearTimeout(audioStartTimeout);
      }
      stopPlayback();
    };
  }, [customChildName, isHelpMode, replayNonce, shouldPlayAudio, speakChildName, stopPlayback, voiceSpec]);

  const handleReplay = useCallback(() => {
    setReplayNonce((n) => n + 1);
  }, []);

  const remainingSeconds = Math.max(
    1,
    Math.ceil(Math.max(0, voiceSpec.durationMs - elapsedMs) / 1000),
  );

  return (
    <div
      className="intro-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-intro-title"
      data-testid="activity-intro-modal"
    >
      <div className="intro-shell">
        <header className="top-bar" style={{ minHeight: 42 }}>
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            data-testid="intro-back-btn"
            onClick={() => {
              stopPlayback();
              onCancel();
            }}
          >
            <span aria-hidden="true">←</span>
            <span>{isHelpMode ? 'Back to Game' : 'Activity Book'}</span>
          </button>

          <span className="badge-pill badge-pill--indigo">
            {isHelpMode
              ? 'How to Play'
              : `Chapter ${activity.chapterNumber} • Activity ${activity.numberInChapter} of ${ACTIVITIES_PER_CHAPTER}`}
          </span>

          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={handleReplay}
          >
            <ReplayVoiceIcon size={15} />
            <span>{isPlaying ? 'Replay' : 'Replay Voice'}</span>
          </button>
        </header>

        <main className="intro-card">
          <div className="intro-card__header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              {activity.isNewGameIntro && !isHelpMode && (
                <span className="badge-pill badge-pill--coral" data-testid="intro-new-game-badge">
                  New Game! • Welcome Lesson
                </span>
              )}
              <span className="badge-pill badge-pill--mint">
                {isHelpMode ? 'Game Guide • Watch & Listen' : 'Get Ready • Watch & Listen'}
              </span>
              {!isHelpMode && customChildName && (
                <span className="badge-pill badge-pill--honey" data-testid="intro-name-greeting">
                  Ready, {customChildName}!
                </span>
              )}
            </div>
            <h1 id="activity-intro-title">
              {activity.title}: {activity.subtitle}
            </h1>
            <p>{activity.detailLine}</p>
          </div>

          <ActivityPreviewStage activity={activity} />

          <section className="intro-karaoke-box" aria-label="Voice instruction captions">
            <div className="intro-karaoke-head">
              <span className="badge-pill badge-pill--honey">
                {isWaitingAudio
                  ? 'Loading Voice…'
                  : shouldPlayAudio
                    ? 'Listen & Read Along'
                    : 'Read Along • Tap Replay for Voice'}
              </span>
              <button
                type="button"
                className="intro-replay-chip"
                data-testid="intro-replay-chip"
                onClick={handleReplay}
                aria-label="Replay spoken instructions"
              >
                <ReplayVoiceIcon size={15} />
                <span>{isPlaying ? 'Restart Voice' : 'Read Again'}</span>
              </button>
            </div>
            <div className="intro-karaoke-words">
              {voiceSpec.words.map((item, idx) => {
                const isActive =
                  isPlaying && !isWaitingAudio && elapsedMs >= item.startMs && elapsedMs < item.endMs;
                const isSpoken = !isWaitingAudio && (elapsedMs >= item.endMs || !isPlaying);
                return (
                  <span
                    key={`${item.word}-${idx}`}
                    className={`intro-word ${
                      isActive
                        ? 'intro-word--active'
                        : isSpoken
                          ? 'intro-word--spoken'
                          : 'intro-word--upcoming'
                    }`}
                  >
                    {item.word}
                  </span>
                );
              })}
            </div>
          </section>

          <div className="intro-actions-row">
            <button
              type="button"
              className="btn-secondary intro-replay-main-btn"
              data-testid="intro-replay-btn"
              onClick={handleReplay}
              aria-label="Read instructions again"
            >
              <ReplayVoiceIcon size={20} />
              <span>Replay</span>
            </button>

            <button
              type="button"
              className={unlocked ? 'btn-primary intro-start-btn' : 'intro-wait-btn'}
              data-testid="intro-confirm-btn"
              disabled={!unlocked}
              onClick={() => {
                stopPlayback();
                onConfirmStart();
              }}
            >
              {unlocked ? (
                <span>{isHelpMode ? 'Keep Playing →' : "Let's Play! →"}</span>
              ) : (
                <>
                  <span className="intro-wait-ring" aria-hidden="true" />
                  <span>Listening… ({remainingSeconds}s)</span>
                </>
              )}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
