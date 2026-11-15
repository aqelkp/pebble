import rawAudioCatalog from './journeyAudioCatalog.json';
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

export function getJourneyVoiceSpec(clipId: JourneyVoiceClipId): JourneyVoiceClipSpec {
  return CATALOG.clips[clipId] ?? CATALOG.clips['memory-match'];
}
