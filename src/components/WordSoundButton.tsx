import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type MouseEvent as ReactMouseEvent } from 'react';
import { playReadAlongText, playThemeCharacterWord } from '../utils/readAlongAudio';
import './WordSoundButton.css';

export function SoundWaveSpeakerIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M11 5L6 9H2v6h4l5 4V5z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.18"
      />
      <path
        d="M15.5 8.5a5 5 0 010 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M18.8 5.4a9.2 9.2 0 010 13.2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export interface WordSoundButtonProps {
  text: string;
  spokenText?: string;
  pairId?: string;
  voiceClipPath?: string;
  phraseWord?: boolean;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'soft' | 'mint' | 'solid' | 'ghost';
  className?: string;
  buttonText?: string;
  label?: string;
  testId?: string;
}

export function WordSoundButton({
  text,
  spokenText,
  pairId,
  voiceClipPath,
  phraseWord,
  size = 'xs',
  variant = 'soft',
  className = '',
  buttonText,
  label,
  testId,
}: WordSoundButtonProps) {
  const [speaking, setSpeaking] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const stopEventOnly = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
  };

  const handleClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (pairId && !voiceClipPath && !spokenText) {
      playThemeCharacterWord(pairId, text, true);
    } else {
      playReadAlongText(text, {
        spokenText,
        pairId,
        voiceClipPath,
        phraseWord,
        enabled: true,
      });
    }
    setSpeaking(true);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setSpeaking(false), 680);
  };

  const iconSize = size === 'xs' ? 14 : size === 'sm' ? 16 : 18;

  return (
    <button
      type="button"
      data-sound-btn="true"
      data-testid={testId}
      aria-label={label ?? `Hear "${text}"`}
      title={`Hear "${text}"`}
      className={`wsb-btn wsb-btn--${size} wsb-btn--${variant} ${
        buttonText ? 'wsb-btn--has-text' : ''
      } ${speaking ? 'is-speaking' : ''} ${className}`.trim()}
      onPointerDown={stopEventOnly}
      onPointerMove={stopEventOnly}
      onPointerUp={stopEventOnly}
      onClick={handleClick}
    >
      <SoundWaveSpeakerIcon size={iconSize} />
      {buttonText ? <span>{buttonText}</span> : null}
    </button>
  );
}

export interface ReadAlongWordPillProps {
  text: string;
  pairId?: string;
  voiceClipPath?: string;
  highlightFirstLetter?: boolean;
  className?: string;
  testId?: string;
}

export function ReadAlongWordPill({
  text,
  pairId,
  voiceClipPath,
  highlightFirstLetter = false,
  className = '',
  testId,
}: ReadAlongWordPillProps) {
  const [speaking, setSpeaking] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (pairId && !voiceClipPath) {
      playThemeCharacterWord(pairId, text, true);
    } else {
      playReadAlongText(text, { pairId, voiceClipPath, enabled: true });
    }
    setSpeaking(true);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setSpeaking(false), 700);
  };

  const first = text.slice(0, 1);
  const rest = text.slice(1);

  return (
    <button
      type="button"
      data-sound-btn="true"
      data-testid={testId}
      className={`ra-word-pill ${speaking ? 'is-speaking' : ''} ${className}`.trim()}
      aria-label={`Hear "${text}"`}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={handleClick}
    >
      <span>
        {highlightFirstLetter && first ? (
          <>
            <strong style={{ color: '#5B5BD6' }}>{first}</strong>
            {rest}
          </>
        ) : (
          text
        )}
      </span>
      <span className="ra-word-pill__icon" aria-hidden="true">
        <SoundWaveSpeakerIcon size={15} />
      </span>
    </button>
  );
}

export interface TappableReadAlongPhraseProps {
  phrase: string;
  solvedClipId?: string;
  accent?: string;
  highlightIndex?: number;
}

export function TappableReadAlongPhrase({
  phrase,
  solvedClipId,
  accent = '#5B5BD6',
}: TappableReadAlongPhraseProps) {
  const [activeWordIdx, setActiveWordIdx] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const words = phrase.trim().split(/\s+/).filter(Boolean);
  const phraseClipPath = solvedClipId ? `audio/quest/${solvedClipId}.mp3` : undefined;

  return (
    <div
      className="ra-phrase-box"
      style={{ borderColor: accent }}
      data-testid="read-along-phrase-box"
    >
      <div className="ra-phrase-words" role="group" aria-label="Tap any word to hear it">
        {words.map((word, idx) => (
          <button
            key={`${idx}-${word}`}
            type="button"
            data-sound-btn="true"
            data-testid={`read-along-phrase-word-${idx}`}
            className={`ra-phrase-word ${activeWordIdx === idx ? 'is-active' : ''}`}
            aria-label={`Hear word "${word}"`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              playReadAlongText(word, { phraseWord: true, enabled: true });
              setActiveWordIdx(idx);
              if (timerRef.current !== null) window.clearTimeout(timerRef.current);
              timerRef.current = window.setTimeout(() => setActiveWordIdx(null), 650);
            }}
          >
            {word}
          </button>
        ))}
      </div>

      <WordSoundButton
        text={phrase}
        voiceClipPath={phraseClipPath}
        size="sm"
        variant="soft"
        label={`Hear full phrase: ${phrase}`}
        testId="read-along-phrase-full-sound"
      />
    </div>
  );
}
