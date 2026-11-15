import type {
  ChoiceQuestPrompt,
  MiniSortQuestPrompt,
  PatternTokenSpec,
  QuestIconId,
  QuestPrompt,
  SequenceQuestPrompt,
  VisualStripQuestPrompt,
} from '../questTypes';
import { shuffleItems } from './mathPacks';

interface ShapeDef {
  id: string;
  name: string;
  dim: '2D' | '3D';
  iconId: QuestIconId;
  hint: string;
  everydayName: string;
  everydayIcon: QuestIconId;
}

const SHAPES_CATALOG: readonly ShapeDef[] = [
  {
    id: 'circle',
    name: 'Circle',
    dim: '2D',
    iconId: 'shape-circle',
    hint: 'round and flat with zero corners',
    everydayName: 'Wall Clock',
    everydayIcon: 'obj-clock',
  },
  {
    id: 'square',
    name: 'Square',
    dim: '2D',
    iconId: 'shape-square',
    hint: 'flat with 4 equal sides',
    everydayName: 'Square Window',
    everydayIcon: 'obj-window',
  },
  {
    id: 'rectangle',
    name: 'Rectangle',
    dim: '2D',
    iconId: 'shape-rectangle',
    hint: 'flat with 2 long sides and 2 short sides',
    everydayName: 'Wooden Door',
    everydayIcon: 'obj-door',
  },
  {
    id: 'triangle',
    name: 'Triangle',
    dim: '2D',
    iconId: 'shape-triangle',
    hint: 'flat with 3 straight sides and 3 corners',
    everydayName: 'Pizza Slice',
    everydayIcon: 'obj-pizza-slice',
  },
  {
    id: 'sphere',
    name: 'Sphere',
    dim: '3D',
    iconId: 'shape-sphere',
    hint: 'a 3D solid ball that rolls in every direction',
    everydayName: 'Basketball',
    everydayIcon: 'obj-basketball',
  },
  {
    id: 'cube',
    name: 'Cube',
    dim: '3D',
    iconId: 'shape-cube',
    hint: 'a 3D solid box with 6 square faces',
    everydayName: 'Number Dice',
    everydayIcon: 'obj-dice',
  },
  {
    id: 'cone',
    name: 'Cone',
    dim: '3D',
    iconId: 'shape-cone',
    hint: 'a 3D shape with a flat circle base and one pointy tip',
    everydayName: 'Party Hat',
    everydayIcon: 'obj-party-hat',
  },
  {
    id: 'cylinder',
    name: 'Cylinder',
    dim: '3D',
    iconId: 'shape-cylinder',
    hint: 'a 3D tube with 2 flat circle ends',
    everydayName: 'Soup Can',
    everydayIcon: 'obj-soup-can',
  },
];

export function buildShapeIdentificationPrompt(): ChoiceQuestPrompt {
  const target = SHAPES_CATALOG[Math.floor(Math.random() * SHAPES_CATALOG.length)];
  const distractors = shuffleItems(SHAPES_CATALOG.filter((s) => s.id !== target.id)).slice(0, 3);
  return {
    uid: `shape-id-${target.id}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'choice',
    packId: 'shapes-patterns',
    conceptId: `shape:${target.id}`,
    conceptLabel: `${target.dim} Shape: ${target.name}`,
    skillType: 'shapes_premath',
    promptText: `Find the ${target.name.toUpperCase()} (${target.dim} shape)!`,
    promptSubtext: `Clue: ${target.hint}.`,
    promptBadge: `${target.dim} SHAPES`,
    voiceClipId: `shape-find-${target.id}`,
    voiceFallbackText: `Tap the ${target.name}!`,
    choices: shuffleItems([target, ...distractors]).map((s) => ({
      id: `sh-${s.id}`,
      label: s.name,
      sublabel: s.dim,
      art: { kind: 'quest-icon', id: s.iconId },
      isCorrect: s.id === target.id,
      wrongExplanation: `You picked ${s.name} (${s.hint}). Look for ${target.name} — ${target.hint}!`,
    })),
  };
}

export function buildShapeEverydayObjectPrompt(): ChoiceQuestPrompt {
  const target = SHAPES_CATALOG[Math.floor(Math.random() * SHAPES_CATALOG.length)];
  const distractors = shuffleItems(SHAPES_CATALOG.filter((s) => s.id !== target.id)).slice(0, 3);
  return {
    uid: `shape-obj-${target.id}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'choice',
    packId: 'shapes-patterns',
    conceptId: `shape:${target.id}`,
    conceptLabel: `Everyday ${target.name}`,
    skillType: 'shapes_premath',
    promptText: `Which everyday object is shaped like a ${target.name.toUpperCase()}?`,
    promptBadge: 'SHAPES AROUND US',
    promptArt: { kind: 'quest-icon', id: target.iconId },
    voiceClipId: `shape-obj-${target.id}`,
    voiceFallbackText: `Which everyday object is shaped like a ${target.name}?`,
    choices: shuffleItems([target, ...distractors]).map((s) => ({
      id: `sobj-${s.id}`,
      label: s.everydayName,
      art: { kind: 'quest-icon', id: s.everydayIcon },
      isCorrect: s.id === target.id,
      wrongExplanation: `${s.everydayName} is shaped like a ${s.name}. ${target.everydayName} is shaped like a ${target.name}!`,
    })),
  };
}

export function buildShape2Dvs3DSortPrompt(): MiniSortQuestPrompt {
  const twoD = shuffleItems(SHAPES_CATALOG.filter((s) => s.dim === '2D')).slice(0, 2);
  const threeD = shuffleItems(SHAPES_CATALOG.filter((s) => s.dim === '3D')).slice(0, 2);
  return {
    uid: `sort-2d3d-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'mini-sort',
    packId: 'shapes-patterns',
    conceptId: 'shape:sort-2d-3d',
    conceptLabel: 'Sort 2D & 3D Shapes',
    skillType: 'shapes_premath',
    promptText: 'Sort each shape into Flat 2D Shapes or Solid 3D Shapes!',
    promptBadge: 'SORT SHAPES',
    voiceClipId: 'shape-sort-2d-3d',
    voiceFallbackText: 'Sort each shape into flat 2D shapes or solid 3D shapes!',
    baskets: [
      { id: '2D', label: '2D Flat Shapes', sublabel: 'Circle, Square…', accentColor: '#5B5BD6' },
      { id: '3D', label: '3D Solid Shapes', sublabel: 'Sphere, Cube…', accentColor: '#3BA99C' },
    ],
    items: shuffleItems([...twoD, ...threeD]).map((s) => ({
      id: `sitem-${s.id}`,
      label: s.name,
      targetBasketId: s.dim,
      art: { kind: 'quest-icon', id: s.iconId },
      wrongExplanation: `${s.name} is a ${s.dim === '2D' ? 'flat 2D' : 'solid 3D'} shape!`,
    })),
  };
}

export function buildPatternCompletionPrompt(): ChoiceQuestPrompt {
  const templates: readonly {
    name: string;
    tokens: readonly PatternTokenSpec[];
    answer: { shapeName: string; iconId: QuestIconId };
    wrongs: readonly { shapeName: string; iconId: QuestIconId }[];
  }[] = [
    {
      name: 'ABAB Pattern',
      tokens: [
        { shape: 'circle', color: '#3BA99C' },
        { shape: 'triangle', color: '#F2B84B' },
        { shape: 'circle', color: '#3BA99C' },
        { shape: 'triangle', color: '#F2B84B' },
      ],
      answer: { shapeName: 'Circle', iconId: 'shape-circle' },
      wrongs: [
        { shapeName: 'Triangle', iconId: 'shape-triangle' },
        { shapeName: 'Square', iconId: 'shape-square' },
      ],
    },
    {
      name: 'AAB Pattern',
      tokens: [
        { shape: 'square', color: '#5B5BD6' },
        { shape: 'square', color: '#5B5BD6' },
        { shape: 'circle', color: '#3BA99C' },
        { shape: 'square', color: '#5B5BD6' },
        { shape: 'square', color: '#5B5BD6' },
      ],
      answer: { shapeName: 'Circle', iconId: 'shape-circle' },
      wrongs: [
        { shapeName: 'Square', iconId: 'shape-square' },
        { shapeName: 'Triangle', iconId: 'shape-triangle' },
      ],
    },
    {
      name: 'ABC Pattern',
      tokens: [
        { shape: 'circle', color: '#3BA99C' },
        { shape: 'square', color: '#5B5BD6' },
        { shape: 'triangle', color: '#F2B84B' },
        { shape: 'circle', color: '#3BA99C' },
        { shape: 'square', color: '#5B5BD6' },
      ],
      answer: { shapeName: 'Triangle', iconId: 'shape-triangle' },
      wrongs: [
        { shapeName: 'Circle', iconId: 'shape-circle' },
        { shapeName: 'Square', iconId: 'shape-square' },
      ],
    },
  ];

  const tpl = templates[Math.floor(Math.random() * templates.length)];
  const allOpts = shuffleItems([
    { ...tpl.answer, isCorrect: true },
    ...tpl.wrongs.map((w) => ({ ...w, isCorrect: false })),
  ]);

  return {
    uid: `pat-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'choice',
    packId: 'shapes-patterns',
    conceptId: 'premath:patterns',
    conceptLabel: 'Simple Patterns',
    skillType: 'shapes_premath',
    promptText: 'Look at the repeating pattern — which shape comes NEXT?',
    promptBadge: tpl.name.toUpperCase(),
    promptArt: { kind: 'pattern-strip', tokens: tpl.tokens },
    voiceClipId: 'pattern-what-next',
    voiceFallbackText: 'Look at the pattern! Which shape comes next?',
    choices: allOpts.map((opt, idx) => ({
      id: `p-${idx}-${opt.shapeName}`,
      label: opt.shapeName,
      art: { kind: 'quest-icon', id: opt.iconId },
      isCorrect: opt.isCorrect,
      wrongExplanation: `Say the pattern out loud from left to right — ${tpl.answer.shapeName} comes next!`,
    })),
  };
}

export function buildVolumeComparisonPrompt(): ChoiceQuestPrompt {
  const levels: readonly {
    id: string;
    label: string;
    iconId: QuestIconId;
    voiceId: string;
  }[] = [
    { id: 'empty', label: 'Empty', iconId: 'beaker-empty', voiceId: 'cmp-beaker-empty' },
    { id: 'quarter', label: 'Quarter Full', iconId: 'beaker-quarter', voiceId: 'cmp-beaker-quarter' },
    { id: 'half', label: 'Half Full', iconId: 'beaker-half', voiceId: 'cmp-beaker-half' },
    { id: 'full', label: 'Full', iconId: 'beaker-full', voiceId: 'cmp-beaker-full' },
  ];
  const target = levels[Math.floor(Math.random() * levels.length)];
  return {
    uid: `vol-${target.id}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'choice',
    packId: 'pre-math',
    conceptId: `premath:volume-${target.id}`,
    conceptLabel: `Capacity: ${target.label}`,
    skillType: 'shapes_premath',
    promptText: `Tap the glass that is ${target.label.toUpperCase()}!`,
    promptBadge: 'EMPTY • QUARTER • HALF • FULL',
    voiceClipId: target.voiceId,
    voiceFallbackText: `Tap the glass that is ${target.label}!`,
    choices: shuffleItems(levels).map((lvl) => ({
      id: `vol-${lvl.id}`,
      label: lvl.label,
      art: { kind: 'quest-icon', id: lvl.iconId },
      isCorrect: lvl.id === target.id,
      wrongExplanation: `That glass is ${lvl.label}. Look at the water marks to find ${target.label}!`,
    })),
  };
}

export function buildSizeWeightTallComparisonPrompt(): ChoiceQuestPrompt {
  const prompts: readonly {
    id: string;
    label: string;
    question: string;
    voiceId: string;
    correct: { label: string; iconId: QuestIconId };
    wrong: { label: string; iconId: QuestIconId };
    explain: string;
  }[] = [
    {
      id: 'heavy',
      label: 'Heavy vs Light',
      question: 'Which one is HEAVIER?',
      voiceId: 'cmp-heavier',
      correct: { label: 'Big Stone', iconId: 'cmp-heavy-rock' },
      wrong: { label: 'Soft Feather', iconId: 'cmp-light-feather' },
      explain: 'A feather is very light! A big stone is much heavier.',
    },
    {
      id: 'light',
      label: 'Heavy vs Light',
      question: 'Which one is LIGHTER?',
      voiceId: 'cmp-lighter',
      correct: { label: 'Soft Feather', iconId: 'cmp-light-feather' },
      wrong: { label: 'Big Stone', iconId: 'cmp-heavy-rock' },
      explain: 'A big stone is heavy! A feather floats gently because it is lighter.',
    },
    {
      id: 'taller',
      label: 'Tall vs Short',
      question: 'Which plant is TALLER?',
      voiceId: 'cmp-taller',
      correct: { label: 'Pine Tree', iconId: 'cmp-tall-pine' },
      wrong: { label: 'Small Bush', iconId: 'cmp-short-bush' },
      explain: 'The small bush stays low to the ground — the pine tree grows much taller!',
    },
    {
      id: 'bigger',
      label: 'Big vs Small',
      question: 'Which fruit is BIGGER?',
      voiceId: 'cmp-bigger',
      correct: { label: 'Watermelon', iconId: 'cmp-big-melon' },
      wrong: { label: 'Little Berry', iconId: 'cmp-small-berry' },
      explain: 'A berry fits on one finger — a watermelon is much bigger!',
    },
  ];
  const p = prompts[Math.floor(Math.random() * prompts.length)];
  const opts = shuffleItems([
    { ...p.correct, isCorrect: true },
    { ...p.wrong, isCorrect: false },
  ]);
  return {
    uid: `cmp-${p.id}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'choice',
    packId: 'pre-math',
    conceptId: `premath:${p.id}`,
    conceptLabel: p.label,
    skillType: 'shapes_premath',
    promptText: p.question,
    promptBadge: 'COMPARISONS',
    voiceClipId: p.voiceId,
    voiceFallbackText: p.question,
    choices: opts.map((o, idx) => ({
      id: `c-${idx}`,
      label: o.label,
      art: { kind: 'quest-icon', id: o.iconId },
      isCorrect: o.isCorrect,
      wrongExplanation: p.explain,
    })),
  };
}

export function buildSpatialDirectionPrompt(): ChoiceQuestPrompt {
  const dirs: readonly { id: string; label: string; iconId: QuestIconId; voiceId: string }[] = [
    { id: 'left', label: 'Left', iconId: 'dir-left', voiceId: 'dir-left' },
    { id: 'right', label: 'Right', iconId: 'dir-right', voiceId: 'dir-right' },
    { id: 'up', label: 'Up', iconId: 'dir-up', voiceId: 'dir-up' },
    { id: 'down', label: 'Down', iconId: 'dir-down', voiceId: 'dir-down' },
  ];
  const target = dirs[Math.floor(Math.random() * dirs.length)];
  return {
    uid: `dir-${target.id}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'choice',
    packId: 'pre-math',
    conceptId: `premath:dir-${target.id}`,
    conceptLabel: `Direction: ${target.label}`,
    skillType: 'shapes_premath',
    promptText: `Tap the arrow pointing ${target.label.toUpperCase()}!`,
    promptBadge: '4 DIRECTIONS',
    voiceClipId: target.voiceId,
    voiceFallbackText: `Tap the arrow pointing ${target.label}!`,
    choices: shuffleItems(dirs).map((d) => ({
      id: `d-${d.id}`,
      label: d.label,
      art: { kind: 'quest-icon', id: d.iconId },
      isCorrect: d.id === target.id,
      wrongExplanation: `That arrow points ${d.label}. Find the arrow pointing ${target.label}!`,
    })),
  };
}

export function buildTimesOfDaySequencePrompt(): SequenceQuestPrompt {
  const steps = [
    { id: 'morning', label: 'Morning', iconId: 'time-morning' as const },
    { id: 'afternoon', label: 'Afternoon', iconId: 'time-afternoon' as const },
    { id: 'evening', label: 'Evening', iconId: 'time-evening' as const },
    { id: 'night', label: 'Night', iconId: 'time-night' as const },
  ];
  return {
    uid: `seq-time-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'sequence',
    packId: 'pre-math',
    conceptId: 'premath:times-of-day',
    conceptLabel: 'Times of the Day',
    skillType: 'sequence_order',
    promptText: 'Put the 4 times of the day in order from sunrise to bedtime!',
    promptBadge: 'TIMES OF THE DAY',
    voiceClipId: 'seq-times-of-day',
    voiceFallbackText: 'Put the four times of the day in order from morning sunrise to night!',
    steps: shuffleItems(
      steps.map((s, idx) => ({
        id: s.id,
        correctOrder: idx,
        label: s.label,
        art: { kind: 'quest-icon', id: s.iconId },
      })),
    ),
    orderedSummary: 'Morning → Afternoon → Evening → Night',
  };
}

export function buildInformalLengthPrompt(): VisualStripQuestPrompt {
  const objects = [
    { label: 'Coral Crayon', color: '#F27A5E' },
    { label: 'Mint Pencil', color: '#3BA99C' },
    { label: 'Indigo Paintbrush', color: '#5B5BD6' },
    { label: 'Golden Ruler Strip', color: '#E09F2D' },
  ];
  const obj = objects[Math.floor(Math.random() * objects.length)];
  const len = 3 + Math.floor(Math.random() * 5); // 3..7 blocks
  const opts = shuffleItems(
    Array.from(new Set([len, Math.max(1, len - 1), Math.min(8, len + 1), len >= 5 ? len - 2 : len + 2])).slice(0, 3),
  );
  return {
    uid: `len-${len}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'visual-strip',
    packId: 'pre-math',
    conceptId: 'premath:length-measure',
    conceptLabel: 'Informal Length Measurement',
    skillType: 'shapes_premath',
    promptText: `Count the wooden unit blocks underneath — how many blocks long is the ${obj.label}?`,
    promptBadge: 'INFORMAL MEASUREMENT (LENGTH)',
    voiceClipId: 'measure-how-many-blocks',
    voiceFallbackText: 'Count the wooden blocks underneath! How many blocks long is it?',
    strip: {
      subkind: 'length-measure',
      objectLabel: obj.label,
      objectColor: obj.color,
      unitBlocks: len,
      maxBlocks: 8,
    },
    choices: opts.map((v) => ({
      id: `len-${v}`,
      largeText: `${v}`,
      sublabel: 'blocks',
      isCorrect: v === len,
      wrongExplanation: `Count each block from the left end to the right tip — it is ${len} blocks long!`,
    })),
  };
}

export function buildBarGraphPrompt(): VisualStripQuestPrompt {
  const countSets: readonly [number, number, number][] = [
    [5, 2, 3],
    [2, 5, 4],
    [3, 1, 5],
    [4, 2, 1],
  ];
  const [c1, c2, c3] = countSets[Math.floor(Math.random() * countSets.length)];
  const columns = [
    { id: 'apples', label: 'Apples', count: c1, color: '#F27A5E', art: { kind: 'word-art' as const, id: 'apple' as const } },
    { id: 'bananas', label: 'Bananas', count: c2, color: '#F2B84B', art: { kind: 'word-art' as const, id: 'banana' as const } },
    { id: 'pears', label: 'Pears', count: c3, color: '#3BA99C', art: { kind: 'word-art' as const, id: 'pear' as const } },
  ];
  const askMost = Math.random() < 0.55;
  const sorted = [...columns].sort((a, b) => (askMost ? b.count - a.count : a.count - b.count));
  const winner = sorted[0];

  return {
    uid: `graph-${askMost ? 'most' : 'least'}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'visual-strip',
    packId: 'pre-math',
    conceptId: 'premath:bar-graph',
    conceptLabel: 'Data Handling (Bar Graph)',
    skillType: 'shapes_premath',
    promptText: askMost
      ? 'Look at the Bar Graph! Which fruit has the MOST?'
      : 'Look at the Bar Graph! Which fruit has the LEAST?',
    promptBadge: 'BAR GRAPH',
    voiceClipId: askMost ? 'graph-which-most' : 'graph-which-least',
    voiceFallbackText: askMost
      ? 'Look at the bar graph! Which fruit has the tallest bar with the most?'
      : 'Look at the bar graph! Which fruit has the shortest bar with the least?',
    strip: {
      subkind: 'bar-graph',
      columns,
      maxScale: 5,
    },
    choices: columns.map((col) => ({
      id: `g-${col.id}`,
      label: col.label,
      sublabel: `${col.count} blocks`,
      art: col.art,
      isCorrect: col.id === winner.id,
      wrongExplanation: `${col.label} has ${col.count}, while ${winner.label} has ${winner.count} (${askMost ? 'the most' : 'the least'})!`,
    })),
  };
}

export function buildShapesPatternsPackPool(): QuestPrompt[] {
  return [
    buildShapeIdentificationPrompt(),
    buildShapeIdentificationPrompt(),
    buildShapeEverydayObjectPrompt(),
    buildShapeEverydayObjectPrompt(),
    buildShape2Dvs3DSortPrompt(),
    buildPatternCompletionPrompt(),
    buildPatternCompletionPrompt(),
  ];
}

export function buildPreMathPackPool(): QuestPrompt[] {
  return [
    buildVolumeComparisonPrompt(),
    buildSizeWeightTallComparisonPrompt(),
    buildSpatialDirectionPrompt(),
    buildTimesOfDaySequencePrompt(),
    buildInformalLengthPrompt(),
    buildBarGraphPrompt(),
  ];
}
