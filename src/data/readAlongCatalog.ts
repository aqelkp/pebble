import rawCatalog from './readAlongCatalog.json';

export interface ThemeCharacterAudioSpec {
  pairId: string;
  label: string;
  speechName: string;
  talkText: string;
}

export interface ReadAlongClipSpec {
  slug: string;
  text: string;
}

export const THEME_CHARACTER_AUDIO_LIST: readonly ThemeCharacterAudioSpec[] =
  rawCatalog.themeCharacters as readonly ThemeCharacterAudioSpec[];

export const READ_ALONG_CLIPS: readonly ReadAlongClipSpec[] =
  rawCatalog.readAlongClips as readonly ReadAlongClipSpec[];

export const THEME_CHARACTER_AUDIO_BY_PAIR_ID = new Map<string, ThemeCharacterAudioSpec>(
  THEME_CHARACTER_AUDIO_LIST.map((entry) => [entry.pairId, entry]),
);

export const READ_ALONG_CLIP_SLUGS = new Set<string>(
  READ_ALONG_CLIPS.map((entry) => entry.slug),
);
