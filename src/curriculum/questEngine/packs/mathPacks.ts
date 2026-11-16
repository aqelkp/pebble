import type {
  ChoiceQuestPrompt,
  QuestChoiceOption,
  QuestPrompt,
  SequenceQuestPrompt,
  TensOnesQuestPrompt,
  VisualStripQuestPrompt,
} from '../questTypes';

export function shuffleItems<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const NUMBER_WORDS_0_TO_10: readonly { n: number; word: string }[] = [
  { n: 0, word: 'zero' },
  { n: 1, word: 'one' },
  { n: 2, word: 'two' },
  { n: 3, word: 'three' },
  { n: 4, word: 'four' },
  { n: 5, word: 'five' },
  { n: 6, word: 'six' },
  { n: 7, word: 'seven' },
  { n: 8, word: 'eight' },
  { n: 9, word: 'nine' },
  { n: 10, word: 'ten' },
];

const ORDINALS_1_TO_10: readonly { pos: number; short: string; word: string }[] = [
  { pos: 1, short: '1st', word: 'first' },
  { pos: 2, short: '2nd', word: 'second' },
  { pos: 3, short: '3rd', word: 'third' },
  { pos: 4, short: '4th', word: 'fourth' },
  { pos: 5, short: '5th', word: 'fifth' },
  { pos: 6, short: '6th', word: 'sixth' },
  { pos: 7, short: '7th', word: 'seventh' },
  { pos: 8, short: '8th', word: 'eighth' },
  { pos: 9, short: '9th', word: 'ninth' },
  { pos: 10, short: '10th', word: 'tenth' },
];

const RACER_ANIMALS = [
  { name: 'Lion', wordId: 'lion' as const },
  { name: 'Rabbit', wordId: 'rabbit' as const },
  { name: 'Duck', wordId: 'duck' as const },
  { name: 'Turtle', wordId: 'turtle' as const },
  { name: 'Dog', wordId: 'dog' as const },
  { name: 'Cat', wordId: 'cat' as const },
  { name: 'Frog', wordId: 'frog' as const },
  { name: 'Fox', wordId: 'fox' as const },
  { name: 'Pig', wordId: 'pig' as const },
  { name: 'Bear', wordId: 'bear' as const },
];

function describeTensOnes(n: number): string {
  if (n === 0) return '0 means none at all (zero)';
  if (n < 10) return `${n} is ${n} single ones`;
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `${n} has ${tens} ten${tens === 1 ? '' : 's'} and ${ones} one${ones === 1 ? '' : 's'}`;
}

function buildNumberDistractors(target: number): number[] {
  const candidates = new Set<number>();
  // Reversal & teen/ty distractors so children genuinely read Tens & Ones!
  if (target >= 10) {
    const tens = Math.floor(target / 10);
    const ones = target % 10;
    const reversed = ones * 10 + tens;
    if (reversed <= 50 && reversed !== target) candidates.add(reversed);
    if (target >= 13 && target <= 19 && (target - 10) * 10 <= 50) {
      candidates.add((target - 10) * 10);
    }
    if (target % 10 === 0 && target >= 20) {
      candidates.add(10 + target / 10);
    }
  }
  for (const offset of [-10, 10, -1, 1, -2, 2, 5, -5]) {
    const v = target + offset;
    if (v >= 0 && v <= 50 && v !== target) candidates.add(v);
  }
  while (candidates.size < 6) {
    const rnd = Math.floor(Math.random() * 51);
    if (rnd !== target) candidates.add(rnd);
  }
  return shuffleItems(Array.from(candidates)).slice(0, 3);
}

const FEATURED_NUMBERS_0_50 = [
  0, 5, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 24, 27, 30, 32, 35, 38, 40, 42, 45, 48, 50,
] as const;

export function buildNumberRecognitionPrompt(target?: number): ChoiceQuestPrompt {
  const n =
    target ??
    FEATURED_NUMBERS_0_50[Math.floor(Math.random() * FEATURED_NUMBERS_0_50.length)];
  const distractors = buildNumberDistractors(n);
  const options: QuestChoiceOption[] = shuffleItems([n, ...distractors]).map((val) => ({
    id: `num-${val}`,
    largeText: String(val),
    isCorrect: val === n,
    wrongExplanation: `You picked ${val} (${describeTensOnes(val)}). Look for ${n} (${describeTensOnes(n)})!`,
  }));

  return {
    uid: `num-rec-${n}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'choice',
    packId: 'numbers-50',
    conceptId: `number:${n}`,
    conceptLabel: `Number ${n}`,
    skillType: 'number_sense_50',
    promptText: 'Listen closely and tap the spoken number!',
    promptSubtext: 'Look carefully at the tens place and the ones place.',
    promptBadge: 'LISTEN & PICK (0–50)',
    voiceClipId: `num-find-${n}`,
    voiceFallbackText: `Find the number ${n}!`,
    choices: options,
  };
}

export function buildNumberNameReadingPrompt(): ChoiceQuestPrompt {
  const entry =
    NUMBER_WORDS_0_TO_10[Math.floor(Math.random() * NUMBER_WORDS_0_TO_10.length)];
  const others = shuffleItems(
    NUMBER_WORDS_0_TO_10.filter((item) => item.n !== entry.n),
  ).slice(0, 3);

  const choices: QuestChoiceOption[] = shuffleItems([entry, ...others]).map((item) => ({
    id: `numword-${item.n}`,
    largeText: String(item.n),
    isCorrect: item.n === entry.n,
    wrongExplanation: `You picked ${item.n}, which is "${item.word}". Read the word "${entry.word}" and find ${entry.n}!`,
  }));

  return {
    uid: `num-name-${entry.word}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'choice',
    packId: 'numbers-50',
    conceptId: `number:${entry.n}`,
    conceptLabel: `Number word "${entry.word}"`,
    skillType: 'number_sense_50',
    promptText: 'Read the number word and tap the matching digit!',
    promptBadge: 'READ NUMBER WORD',
    promptArt: { kind: 'word-card', text: entry.word, accent: '#3BA99C' },
    voiceClipId: 'num-read-word-generic',
    voiceFallbackText: 'Read the number word in the box and tap its matching number!',
    silentRead: true,
    solvedVoiceClipId: `numword-${entry.n}`,
    solvedVoiceText: `${entry.word} is ${entry.n}!`,
    choices,
  };
}

export function buildBeforeAfterBetweenPrompt(): ChoiceQuestPrompt {
  const modeRoll = Math.random();
  if (modeRoll < 0.4) {
    // Between: [ n-1, ?, n+1 ]
    const mid = 2 + Math.floor(Math.random() * 48); // 2..49
    const distractors = buildNumberDistractors(mid);
    const choices: QuestChoiceOption[] = shuffleItems([mid, ...distractors]).map((v) => ({
      id: `btw-${v}`,
      largeText: String(v),
      isCorrect: v === mid,
      wrongExplanation: `Count forward from ${mid - 1}: ${mid - 1}, ${mid}, ${mid + 1}!`,
    }));
    return {
      uid: `num-between-${mid}-${Math.random().toString(36).slice(2, 6)}`,
      kind: 'choice',
      packId: 'numbers-50',
      conceptId: `number:${mid}`,
      conceptLabel: `Between ${mid - 1} & ${mid + 1}`,
      skillType: 'number_sense_50',
      promptText: `Which number goes IN BETWEEN ${mid - 1} and ${mid + 1}?`,
      promptBadge: 'IN BETWEEN',
      promptArt: { kind: 'number-train-gap', items: [mid - 1, '?', mid + 1] },
      voiceClipId: 'num-in-between',
      voiceFallbackText: 'Which number goes right in between on the number train?',
      choices,
    };
  }

  if (modeRoll < 0.7) {
    // After: [ n-1, n, ? ]
    const n = 5 + Math.floor(Math.random() * 44); // 5..48
    const ans = n + 1;
    const distractors = buildNumberDistractors(ans);
    return {
      uid: `num-after-${n}-${Math.random().toString(36).slice(2, 6)}`,
      kind: 'choice',
      packId: 'numbers-50',
      conceptId: `number:${ans}`,
      conceptLabel: `After ${n}`,
      skillType: 'number_sense_50',
      promptText: `What number comes right AFTER ${n}?`,
      promptBadge: 'AFTER NUMBER',
      promptArt: { kind: 'number-train-gap', items: [n - 1, n, '?'] },
      voiceClipId: 'num-comes-after',
      voiceFallbackText: 'What number comes right after on the number train?',
      choices: shuffleItems([ans, ...distractors]).map((v) => ({
        id: `aft-${v}`,
        largeText: String(v),
        isCorrect: v === ans,
        wrongExplanation: `You picked ${v}. Counting forward one step after ${n} gives ${ans}!`,
      })),
    };
  }

  // Before: [ ?, n, n+1 ]
  const n = 2 + Math.floor(Math.random() * 47); // 2..48
  const ans = n - 1;
  const distractors = buildNumberDistractors(ans);
  return {
    uid: `num-before-${n}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'choice',
    packId: 'numbers-50',
    conceptId: `number:${ans}`,
    conceptLabel: `Before ${n}`,
    skillType: 'number_sense_50',
    promptText: `What number comes right BEFORE ${n}?`,
    promptBadge: 'BEFORE NUMBER',
    promptArt: { kind: 'number-train-gap', items: ['?', n, n + 1] },
    voiceClipId: 'num-comes-before',
    voiceFallbackText: 'What number comes right before on the number train?',
    choices: shuffleItems([ans, ...distractors]).map((v) => ({
      id: `bef-${v}`,
      largeText: String(v),
      isCorrect: v === ans,
      wrongExplanation: `You picked ${v}. One step before ${n} is ${ans}!`,
    })),
  };
}

export function buildBackwardCountingSequencePrompt(): SequenceQuestPrompt {
  const starts = [10, 8, 6, 15, 20, 30, 5];
  const top = starts[Math.floor(Math.random() * starts.length)];
  const seq = [top, top - 1, top - 2, top - 3];
  return {
    uid: `seq-back-${top}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'sequence',
    packId: 'numbers-50',
    conceptId: `number:${top}`,
    conceptLabel: `Backward count from ${top}`,
    skillType: 'sequence_order',
    promptText: `Count BACKWARD from ${top}! Place the numbers in countdown order.`,
    promptBadge: 'BACKWARD COUNTING',
    voiceClipId: 'seq-count-backward',
    voiceFallbackText: 'Count backward step by step and place the numbers in countdown order!',
    steps: shuffleItems(
      seq.map((val, idx) => ({
        id: `back-${val}`,
        correctOrder: idx,
        label: String(val),
        largeBadge: String(val),
      })),
    ),
    orderedSummary: seq.join(' → '),
  };
}

export function buildTensOnesInteractivePrompt(): TensOnesQuestPrompt {
  const pool = [0, 10, 12, 14, 17, 20, 23, 25, 28, 30, 31, 34, 36, 40, 42, 45, 47, 50];
  const n = pool[Math.floor(Math.random() * pool.length)];
  return {
    uid: `tens-ones-${n}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'tens-ones',
    packId: 'place-value-lines',
    conceptId: `number:${n}`,
    conceptLabel: `Place Value ${n}`,
    skillType: 'number_sense_50',
    promptText:
      n === 0
        ? 'Show ZERO (0) in the tray — keep 0 Tens and 0 Ones, then tap Check!'
        : `Build ${n} using Tens bundles (10) and Ones pebbles (1)!`,
    promptSubtext: `${Math.floor(n / 10)} Tens and ${n % 10} Ones`,
    promptBadge: 'PLACE VALUE • TENS & ONES',
    voiceClipId: n === 0 ? 'pv-build-zero' : 'pv-build-tens-ones',
    voiceFallbackText:
      n === 0
        ? 'Show zero in the tray with zero tens and zero ones, then tap Check!'
        : `Use ten bundles and one pebbles to build ${n}!`,
    targetNumber: n,
    targetTens: Math.floor(n / 10),
    targetOnes: n % 10,
  };
}

export function buildCountTensOnesChoicePrompt(): ChoiceQuestPrompt {
  const pool = [11, 13, 16, 22, 24, 29, 33, 35, 41, 42, 46, 50];
  const n = pool[Math.floor(Math.random() * pool.length)];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const distractors = buildNumberDistractors(n);
  return {
    uid: `count-to-${n}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'choice',
    packId: 'place-value-lines',
    conceptId: `number:${n}`,
    conceptLabel: `Count Tens & Ones (${n})`,
    skillType: 'number_sense_50',
    promptText: 'Count the 10-bundles and single pebbles — what number do they make?',
    promptBadge: 'COUNT 0–50',
    promptArt: { kind: 'tens-ones-preview', tens, ones },
    voiceClipId: 'pv-count-bundles',
    voiceFallbackText: 'Count the bundles of ten and the single pebbles. What number do they make?',
    choices: shuffleItems([n, ...distractors]).map((v) => ({
      id: `cto-${v}`,
      largeText: String(v),
      isCorrect: v === n,
      wrongExplanation: `There are ${tens} tens (${tens * 10}) and ${ones} ones — together that makes ${n}, not ${v}!`,
    })),
  };
}

export function buildNumberLineHopPrompt(): VisualStripQuestPrompt {
  const delta: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
  const baseStart = 4 + Math.floor(Math.random() * 41); // 4..44
  const windowStart = Math.max(0, baseStart - 3);
  const numbers = Array.from({ length: 7 }, (_, idx) => windowStart + idx);
  const startNumber = numbers[3];
  const targetNumber = startNumber + delta;
  const distractors = shuffleItems(
    numbers.filter((v) => v !== targetNumber && v !== startNumber),
  ).slice(0, 2);
  const choiceNums = shuffleItems([targetNumber, startNumber - delta, distractors[0]]);

  return {
    uid: `numline-${startNumber}-${delta > 0 ? 'plus' : 'minus'}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'visual-strip',
    packId: 'place-value-lines',
    conceptId: `number:${targetNumber}`,
    conceptLabel: delta > 0 ? `Number Line +1 (${startNumber}+1)` : `Number Line -1 (${startNumber}-1)`,
    skillType: 'number_sense_50',
    promptText:
      delta > 0
        ? `The frog is on ${startNumber}. Hop 1 MORE (+1) forward — where does it land?`
        : `The frog is on ${startNumber}. Hop 1 LESS (-1) backward — where does it land?`,
    promptBadge: delta > 0 ? 'NUMBER LINE (+1 MORE)' : 'NUMBER LINE (-1 LESS)',
    voiceClipId: delta > 0 ? 'numline-one-more' : 'numline-one-less',
    voiceFallbackText:
      delta > 0
        ? 'Hop one more forward on the number line! Which number does the frog land on?'
        : 'Hop one less backward on the number line! Which number does the frog land on?',
    strip: {
      subkind: 'number-line',
      numbers,
      startNumber,
      delta,
      targetNumber,
    },
    choices: choiceNums.map((v) => ({
      id: `nl-${v}`,
      largeText: String(v),
      isCorrect: v === targetNumber,
      wrongExplanation:
        delta > 0
          ? `Starting at ${startNumber} and adding 1 more moves right to ${targetNumber}!`
          : `Starting at ${startNumber} and taking 1 less moves left to ${targetNumber}!`,
    })),
  };
}

export function buildOrdinalPrompt(): VisualStripQuestPrompt {
  const count = 10;
  const pickedAnimals = shuffleItems(RACER_ANIMALS).slice(0, count);
  const targetOrd = ORDINALS_1_TO_10[Math.floor(Math.random() * ORDINALS_1_TO_10.length)];
  const targetAnimal = pickedAnimals[targetOrd.pos - 1];

  const otherOrds = shuffleItems(
    ORDINALS_1_TO_10.filter((o) => o.pos !== targetOrd.pos),
  ).slice(0, 3);

  return {
    uid: `ord-${targetOrd.pos}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'visual-strip',
    packId: 'place-value-lines',
    conceptId: `ordinal:${targetOrd.short}`,
    conceptLabel: `Ordinal ${targetOrd.short} (${targetOrd.word})`,
    skillType: 'number_sense_50',
    promptText: `Count from the Finish Flag on the left! Which place is the ${targetAnimal.name} in?`,
    promptBadge: 'ORDINAL NUMBERS (1st–10th)',
    voiceClipId: 'ord-which-place',
    voiceFallbackText: 'Count from the finish flag on the left! Which place is that animal in?',
    strip: {
      subkind: 'ordinals',
      racers: pickedAnimals.map((a, idx) => ({
        position: idx + 1,
        ordinalLabel: ORDINALS_1_TO_10[idx].short,
        name: a.name,
        art: { kind: 'word-art', id: a.wordId },
      })),
      targetPosition: targetOrd.pos,
      askMode: 'pick-ordinal',
    },
    choices: shuffleItems([targetOrd, ...otherOrds]).map((ord) => ({
      id: `ord-${ord.pos}`,
      largeText: ord.short,
      sublabel: ord.word,
      isCorrect: ord.pos === targetOrd.pos,
      wrongExplanation: `Count from the flag: the ${targetAnimal.name} is in ${targetOrd.short} (${targetOrd.word}) place, not ${ord.short}!`,
    })),
  };
}

export function buildNumbers50PackPool(): QuestPrompt[] {
  return [
    buildNumberRecognitionPrompt(42),
    buildNumberRecognitionPrompt(0),
    buildNumberRecognitionPrompt(),
    buildNumberRecognitionPrompt(),
    buildNumberNameReadingPrompt(),
    buildNumberNameReadingPrompt(),
    buildBeforeAfterBetweenPrompt(),
    buildBeforeAfterBetweenPrompt(),
    buildBackwardCountingSequencePrompt(),
  ];
}

export function buildPlaceValueLinesPackPool(): QuestPrompt[] {
  return [
    buildTensOnesInteractivePrompt(),
    buildTensOnesInteractivePrompt(),
    buildCountTensOnesChoicePrompt(),
    buildNumberLineHopPrompt(),
    buildNumberLineHopPrompt(),
    buildOrdinalPrompt(),
    buildOrdinalPrompt(),
  ];
}
