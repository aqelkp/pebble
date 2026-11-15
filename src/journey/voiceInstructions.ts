import rawAudioCatalog from './journeyAudioCatalog.json';
import { assetUrl } from '../utils/assets';
import { preloadAudioPaths } from '../utils/wordAudio';
import type { JourneyVoiceClipId } from './journeyTypes';

export interface JourneyWordTiming {
  word: string;
  startMs: number;
  endMs: number;
}

export interface JourneyVoiceClipSpec {
  id: JourneyVoiceClipId;
  text: string;
  audioPath: string;
  durationMs: number;
  words: JourneyWordTiming[];
}

interface RawJourneyCatalog {
  clips: Record<JourneyVoiceClipId, JourneyVoiceClipSpec>;
}

const CATALOG = rawAudioCatalog as RawJourneyCatalog;

export const ALL_JOURNEY_VOICE_CLIP_IDS: readonly JourneyVoiceClipId[] = [
  'memory-match',
  'letter-train',
  'letter-trace',
  'letter-river',
  'picture-sudoku',
  'word-fun',
  'number-safari-count',
  'number-safari-add',
  'rescue-road',
  'sticker-jigsaw',
  'sticker-scene',
  'spot-the-twin',
  'dot-to-dot',
  'word-peekaboo',
  'compare-quest',
  'word-trace',
];

const warmedVoiceElements = new Map<JourneyVoiceClipId, HTMLAudioElement>();

export function getJourneyVoiceSpec(clipId: JourneyVoiceClipId): JourneyVoiceClipSpec {
  return CATALOG.clips[clipId] ?? CATALOG.clips['memory-match'];
}

/**
 * Pre-warms HTTP cache AND decoded HTMLAudioElement metadata for a voice clip
 * strictly using 'self' URLs (matching index.html media-src 'self' CSP).
 */
export function preloadJourneyVoiceClip(clipId: JourneyVoiceClipId): void {
  const spec = getJourneyVoiceSpec(clipId);
  preloadAudioPaths([spec.audioPath]);
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
  if (warmedVoiceElements.has(clipId)) return;
  try {
    const audio = new Audio(assetUrl(spec.audioPath));
    audio.preload = 'auto';
    audio.load();
    warmedVoiceElements.set(clipId, audio);
  } catch {
    // Ignore audio pre-warm errors in restricted environments
  }
}

export function preloadAllJourneyVoiceClips(): void {
  for (const clipId of ALL_JOURNEY_VOICE_CLIP_IDS) {
    preloadJourneyVoiceClip(clipId);
  }
}
