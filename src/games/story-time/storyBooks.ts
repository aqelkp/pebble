import rawAudioCatalog from './storyAudioCatalog.json';
import type { ReadAlongWordTiming } from '../../components/SynchronizedReadAlong';
import type { StoryBook, StoryBookId, StoryPage } from './storyTypes';

interface RawStoryPageAudio {
  audioPath: string;
  durationMs: number;
  words: ReadAlongWordTiming[];
}

interface RawStoryAudioCatalog {
  pages: Record<string, RawStoryPageAudio>;
  wordSlugs: string[];
}

const AUDIO_CATALOG = rawAudioCatalog as RawStoryAudioCatalog;
const STORY_WORD_SLUG_SET = new Set<string>(AUDIO_CATALOG.wordSlugs ?? []);
const SAFE_WORD_SLUG_RE = /^[a-z]+$/;

export function resolveStoryWordAudioPath(cleanWord: string): string | null {
  const slug = cleanWord.trim().toLowerCase();
  if (!slug || !SAFE_WORD_SLUG_RE.test(slug)) return null;
  if (!STORY_WORD_SLUG_SET.has(slug)) return null;
  return `audio/stories/words/${slug}.mp3`;
}

function buildStoryPages(storyId: StoryBookId, texts: readonly string[]): readonly StoryPage[] {
  return texts.map((text, idx) => {
    const pageNumber = idx + 1;
    const key = `${storyId}/page-${pageNumber}`;
    const audioMeta = AUDIO_CATALOG.pages[key];
    const fallbackWords: ReadAlongWordTiming[] = text
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word, wIdx, arr) => {
        const slice = Math.round(2800 / Math.max(1, arr.length));
        return { word, startMs: wIdx * slice, endMs: (wIdx + 1) * slice };
      });

    return {
      pageNumber,
      text,
      imagePath: `stories/${storyId}/page-${pageNumber}.jpg`,
      audioPath: audioMeta?.audioPath ?? `audio/stories/${storyId}/page-${pageNumber}.mp3`,
      durationMs: audioMeta?.durationMs ?? 2800,
      words: audioMeta?.words?.length ? audioMeta.words : fallbackWords,
    };
  });
}

export const STORY_BOOKS: readonly StoryBook[] = [
  {
    id: 'sam-and-the-mud',
    title: 'Sam and the Mud',
    subtitle: 'Sam the ant, Pip the pig, and a sunny mud puddle!',
    complexityTier: 'k1-3letter',
    maxWordLength: 3,
    accentColor: '#3BA99C',
    coverImagePath: 'stories/sam-and-the-mud/page-1.jpg',
    badgeText: 'K1 • 3-Letter Words',
    pages: buildStoryPages('sam-and-the-mud', [
      'Sam is an ant. Pip is a pig.',
      'Sam met Pip in his sty.',
      'Oh no! The sty got wet.',
      'Pip is sad. He can not nap.',
      'Sam and Pip hop in the mud.',
      'Pip has fun! Mud is on his hat.',
      'Rob is an owl. Rob can fly up.',
      'The sun is out! Pip and Sam hug.',
    ]),
  },
  {
    id: 'kit-and-the-bug',
    title: 'Kit and the Bug',
    subtitle: 'Fluffy tabby Kit meets a zippy red ladybug!',
    complexityTier: 'k1-3letter',
    maxWordLength: 3,
    accentColor: '#F27A5E',
    coverImagePath: 'stories/kit-and-the-bug/page-1.jpg',
    badgeText: 'K1 • 3-Letter Words',
    pages: buildStoryPages('kit-and-the-bug', [
      'Kit is a fat cat.',
      'Kit sat on a red mat.',
      'A red bug hid by a cup.',
      'Kit ran! The bug can zip.',
      'The bug sat on a big box.',
      'Kit did a big hop up.',
      'Kit did not nip the bug.',
      'Now Kit and the bug nap.',
    ]),
  },
  {
    id: 'max-on-the-bus',
    title: 'Max on the Bus',
    subtitle: 'Puppy Max hops on Ben’s big country bus!',
    complexityTier: 'k1-3letter',
    maxWordLength: 3,
    accentColor: '#5B5BD6',
    coverImagePath: 'stories/max-on-the-bus/page-3.jpg',
    badgeText: 'K1 • 3-Letter Words',
    pages: buildStoryPages('max-on-the-bus', [
      'Max is a fun pup.',
      'Max has a red cap.',
      'A big bus is at the lot.',
      'Ben is in the bus. Hop on, Max!',
      'The bus can go so far.',
      'Max saw a cow and a yak.',
      'Oh! A hen sat in the way.',
      'Ben let the hen go. Yay, Ben!',
    ]),
  },
  {
    id: 'gus-and-the-jam',
    title: 'Gus and the Jam',
    subtitle: 'Bear cub Gus and hen Pam cook sweet fig jam!',
    complexityTier: 'k1-3letter',
    maxWordLength: 3,
    accentColor: '#D96B43',
    coverImagePath: 'stories/gus-and-the-jam/page-8.jpg',
    badgeText: 'K1 • 3-Letter Words',
    pages: buildStoryPages('gus-and-the-jam', [
      'Gus is a cub. Gus is big.',
      'Gus has a red pot and a pan.',
      'Pam is a hen. Pam has a fig.',
      'Gus put the fig in the pot.',
      'Mix, mix, mix! The pot is hot.',
      'Yum! It is red fig jam.',
      'Gus put jam on a bun.',
      'Gus and Pam eat the bun. Yum!',
    ]),
  },
  {
    id: 'zoe-and-the-bee',
    title: 'Zoe and the Bee',
    subtitle: 'Little red fox Zoe watches a dancing garden bee!',
    complexityTier: 'k1-3letter',
    maxWordLength: 3,
    accentColor: '#E09F2D',
    coverImagePath: 'stories/zoe-and-the-bee/page-1.jpg',
    badgeText: 'K1 • 3-Letter Words',
    pages: buildStoryPages('zoe-and-the-bee', [
      'Zoe is a red fox.',
      'Zoe sat by a big bud.',
      'A bee can hum and fly.',
      'The bee sat on the bud.',
      'Zoe ran to see the bee.',
      'The bee did a zig and a zag!',
      'Zoe sat on a log to see.',
      'The bee is a fun pal.',
    ]),
  },
  {
    id: 'bob-in-the-tub',
    title: 'Bob in the Tub',
    subtitle: 'Muddy puppy Bob leaps into Mia’s bubbly wash tub!',
    complexityTier: 'k1-3letter',
    maxWordLength: 3,
    accentColor: '#3D84D6',
    coverImagePath: 'stories/bob-in-the-tub/page-5.jpg',
    badgeText: 'K1 • 3-Letter Words',
    pages: buildStoryPages('bob-in-the-tub', [
      'Bob is a dog. Mia is his pal.',
      'Bob dug in a mud pit.',
      'Oh no! Mud is on his ear and paw.',
      'Mia got a big tub and a mop.',
      'Bob did a hop in the tub.',
      'Rub, rub, rub! The mud is off.',
      'Bob is out! He can wag and dry.',
      'Mia and Bob hug. Fun day!',
    ]),
  },
];

export function getStoryBook(id: StoryBookId): StoryBook {
  return STORY_BOOKS.find((b) => b.id === id) ?? STORY_BOOKS[0];
}

export function getNextStoryBook(currentId: StoryBookId): StoryBook {
  const idx = STORY_BOOKS.findIndex((b) => b.id === currentId);
  if (idx < 0) return STORY_BOOKS[0];
  return STORY_BOOKS[(idx + 1) % STORY_BOOKS.length];
}
