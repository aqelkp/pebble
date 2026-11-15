import type { LetterWordArtId } from '../../../data/wordBank';
import type { ChoiceQuestPrompt, QuestIconId, QuestPrompt } from '../questTypes';
import { shuffleItems } from './mathPacks';

interface PhraseSceneSpec {
  id: string;
  phrase: string;
  sceneIcon: QuestIconId;
  summary: string;
}

const PHRASE_SCENES: readonly PhraseSceneSpec[] = [
  { id: 'cat-mat', phrase: 'A cat on a mat', sceneIcon: 'scene-cat-on-mat', summary: 'a cat sitting on a mat' },
  { id: 'dog-box', phrase: 'A dog in a box', sceneIcon: 'scene-dog-in-box', summary: 'a dog sitting inside a box' },
  { id: 'bug-log', phrase: 'A bug on a log', sceneIcon: 'scene-bug-on-log', summary: 'a red bug on a wooden log' },
  { id: 'pig-mud', phrase: 'A pig in the mud', sceneIcon: 'scene-pig-in-mud', summary: 'a pink pig in brown mud' },
  { id: 'hen-pen', phrase: 'A hen in a pen', sceneIcon: 'scene-hen-in-pen', summary: 'a white hen behind a wooden pen' },
  { id: 'red-bus', phrase: 'I see a red bus', sceneIcon: 'scene-red-bus', summary: 'a bright red bus' },
  { id: 'fox-den', phrase: 'The fox is in a den', sceneIcon: 'scene-fox-in-den', summary: 'a fox peeking from a rocky den' },
  { id: 'cup-bed', phrase: 'My cup on the bed', sceneIcon: 'scene-cup-on-bed', summary: 'a yellow cup on a cozy bed' },
  { id: 'fish-net', phrase: 'A fish in a net', sceneIcon: 'scene-fish-in-net', summary: 'an orange fish inside a net' },
  { id: 'frog-pad', phrase: 'The frog on a pad', sceneIcon: 'scene-frog-on-pad', summary: 'a green frog on a lily pad' },
];

export function buildShortPhraseReadingPrompt(): ChoiceQuestPrompt {
  const target = PHRASE_SCENES[Math.floor(Math.random() * PHRASE_SCENES.length)];
  const distractors = shuffleItems(PHRASE_SCENES.filter((s) => s.id !== target.id)).slice(0, 2);
  const all = shuffleItems([target, ...distractors]);

  return {
    uid: `phrase-${target.id}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'choice',
    packId: 'reading-phrases',
    conceptId: `phrase:${target.id}`,
    conceptLabel: `Phrase: "${target.phrase}"`,
    skillType: 'phrase_reading',
    promptText: 'Read the short sentence and tap the matching picture!',
    promptBadge: 'READ SHORT PHRASE',
    promptArt: { kind: 'word-card', text: target.phrase, accent: '#5B5BD6' },
    voiceClipId: 'lit-read-phrase-generic',
    voiceFallbackText: 'Read the short sentence in the box and tap the picture that matches!',
    silentRead: true,
    solvedVoiceClipId: `phrase-${target.id}`,
    solvedVoiceText: target.phrase,
    choices: all.map((s) => ({
      id: `ph-${s.id}`,
      art: { kind: 'quest-icon', id: s.sceneIcon },
      isCorrect: s.id === target.id,
      wrongExplanation: `That picture shows ${s.summary}. Sound out "${target.phrase}"!`,
    })),
  };
}

interface CvcSoundSpec {
  word: string;
  artId: LetterWordArtId;
  vowel: string;
  ending: string;
}

const CVC_WORDS: readonly CvcSoundSpec[] = [
  { word: 'cat', artId: 'cat', vowel: 'a', ending: 't' },
  { word: 'hat', artId: 'hat', vowel: 'a', ending: 't' },
  { word: 'van', artId: 'van', vowel: 'a', ending: 'n' },
  { word: 'jam', artId: 'jam', vowel: 'a', ending: 'm' },
  { word: 'net', artId: 'net', vowel: 'e', ending: 't' },
  { word: 'jet', artId: 'jet', vowel: 'e', ending: 't' },
  { word: 'pig', artId: 'pig', vowel: 'i', ending: 'g' },
  { word: 'dog', artId: 'dog', vowel: 'o', ending: 'g' },
  { word: 'fox', artId: 'fox', vowel: 'o', ending: 'x' },
  { word: 'bus', artId: 'bus', vowel: 'u', ending: 's' },
  { word: 'cup', artId: 'cup', vowel: 'u', ending: 'p' },
  { word: 'sun', artId: 'sun', vowel: 'u', ending: 'n' },
  { word: 'nut', artId: 'nut', vowel: 'u', ending: 't' },
];

export function buildCvcMiddleVowelPrompt(): ChoiceQuestPrompt {
  const item = CVC_WORDS[Math.floor(Math.random() * CVC_WORDS.length)];
  const allVowels = ['a', 'e', 'i', 'o', 'u'];
  const wrongVowels = shuffleItems(allVowels.filter((v) => v !== item.vowel)).slice(0, 2);
  const masked = `${item.word[0]} _ ${item.word[2]}`;

  return {
    uid: `cvc-mid-${item.word}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'choice',
    packId: 'reading-phrases',
    conceptId: `word:${item.artId}`,
    conceptLabel: `Middle vowel in "${item.word}"`,
    skillType: 'phrase_reading',
    promptText: `Say "${item.word}" slowly (${masked}). Which vowel sound is in the MIDDLE?`,
    promptBadge: 'CVC MIDDLE SOUND',
    promptArt: { kind: 'word-art', id: item.artId },
    voiceClipId: `cvc-mid-${item.word}`,
    voiceFallbackText: `Listen to the word ${item.word}! Which vowel sound is in the middle?`,
    choices: shuffleItems([item.vowel, ...wrongVowels]).map((v) => ({
      id: `v-${v}`,
      largeText: v,
      isCorrect: v === item.vowel,
      wrongExplanation: `Stretch out "${item.word}" — ${item.word[0]}-${item.vowel}-${item.word[2]} has "${item.vowel}" in the middle!`,
    })),
  };
}

export function buildCvcEndingSoundPrompt(): ChoiceQuestPrompt {
  const item = CVC_WORDS[Math.floor(Math.random() * CVC_WORDS.length)];
  const endings = ['t', 'g', 'n', 'p', 'x', 'm', 's'];
  const wrongEnds = shuffleItems(endings.filter((e) => e !== item.ending)).slice(0, 2);
  const masked = `${item.word[0]}${item.word[1]}_`;

  return {
    uid: `cvc-end-${item.word}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'choice',
    packId: 'reading-phrases',
    conceptId: `word:${item.artId}`,
    conceptLabel: `Ending sound in "${item.word}"`,
    skillType: 'phrase_reading',
    promptText: `Listen to the LAST sound in "${item.word}" (${masked}) — which letter ends it?`,
    promptBadge: 'CVC ENDING SOUND',
    promptArt: { kind: 'word-art', id: item.artId },
    voiceClipId: `cvc-end-${item.word}`,
    voiceFallbackText: `Listen to the word ${item.word}! Which letter sound comes at the very end?`,
    choices: shuffleItems([item.ending, ...wrongEnds]).map((ch) => ({
      id: `e-${ch}`,
      largeText: ch,
      isCorrect: ch === item.ending,
      wrongExplanation: `"${item.word}" ends with the /${item.ending}/ sound (${item.word[0]}-${item.word[1]}-${item.ending})!`,
    })),
  };
}

export function buildCvcSilentBlendPrompt(): ChoiceQuestPrompt {
  const item = CVC_WORDS[Math.floor(Math.random() * CVC_WORDS.length)];
  const distractors = shuffleItems(CVC_WORDS.filter((w) => w.word !== item.word)).slice(0, 3);

  return {
    uid: `cvc-blend-${item.word}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'choice',
    packId: 'reading-phrases',
    conceptId: `word:${item.artId}`,
    conceptLabel: `Blend CVC "${item.word}"`,
    skillType: 'phrase_reading',
    promptText: 'Blend the 3 letter sounds together and tap the matching picture!',
    promptBadge: 'BLEND & READ CVC',
    promptArt: { kind: 'word-card', text: item.word, accent: '#F27A5E' },
    voiceClipId: 'lit-blend-cvc-generic',
    voiceFallbackText: 'Sound out the three letters in the box and tap the matching picture!',
    silentRead: true,
    solvedVoiceClipId: `cvc-word-${item.word}`,
    solvedVoiceText: item.word,
    choices: shuffleItems([item, ...distractors]).map((w) => ({
      id: `bl-${w.word}`,
      art: { kind: 'word-art', id: w.artId },
      isCorrect: w.word === item.word,
      wrongExplanation: `That picture is "${w.word}". Blend ${item.word[0]}-${item.word[1]}-${item.word[2]} to find "${item.word}"!`,
    })),
  };
}

const SIGHT_WORDS_LIST = [
  'the', 'see', 'can', 'my', 'we', 'you', 'are', 'was', 'she', 'he', 'go', 'all',
] as const;

export function buildSightWordListenPrompt(): ChoiceQuestPrompt {
  const target = SIGHT_WORDS_LIST[Math.floor(Math.random() * SIGHT_WORDS_LIST.length)];
  const wrongs = shuffleItems(SIGHT_WORDS_LIST.filter((w) => w !== target)).slice(0, 3);
  return {
    uid: `sight-${target}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'choice',
    packId: 'reading-phrases',
    conceptId: `sight:${target}`,
    conceptLabel: `Sight word "${target}"`,
    skillType: 'sight_word_reading',
    promptText: 'Listen for the sight word and tap it!',
    promptBadge: 'SIGHT WORDS',
    voiceClipId: `sight-find-${target}`,
    voiceFallbackText: `Find the sight word "${target}"!`,
    choices: shuffleItems([target, ...wrongs]).map((w) => ({
      id: `sw-${w}`,
      largeText: w,
      isCorrect: w === target,
      wrongExplanation: `You tapped "${w}". Look at the letters for "${target}"!`,
    })),
  };
}

export function buildReadingPhrasesPackPool(): QuestPrompt[] {
  return [
    buildShortPhraseReadingPrompt(),
    buildShortPhraseReadingPrompt(),
    buildCvcMiddleVowelPrompt(),
    buildCvcEndingSoundPrompt(),
    buildCvcSilentBlendPrompt(),
    buildSightWordListenPrompt(),
  ];
}
