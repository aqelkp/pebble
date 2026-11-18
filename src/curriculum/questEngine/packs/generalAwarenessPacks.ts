import type {
  ChoiceQuestPrompt,
  MiniSortQuestPrompt,
  QuestArtSpec,
  QuestPrompt,
  SequenceQuestPrompt,
} from '../questTypes';
import { shuffleItems } from './mathPacks';

/* ================= 1. ALL ABOUT ME & COMMUNITY HELPERS ================= */

export function buildFiveSensesPrompt(): ChoiceQuestPrompt {
  const senses = [
    {
      id: 'smell',
      question: 'Which body part helps us SMELL a sweet rose?',
      voiceId: 'ga-sense-smell',
      correctId: 'nose',
    },
    {
      id: 'hear',
      question: 'Which body part helps us HEAR music and drums?',
      voiceId: 'ga-sense-hear',
      correctId: 'ears',
    },
    {
      id: 'see',
      question: 'Which body part helps us SEE a colorful rainbow?',
      voiceId: 'ga-sense-see',
      correctId: 'eyes',
    },
    {
      id: 'taste',
      question: 'Which body part helps us TASTE sweet mango or sour lemon?',
      voiceId: 'ga-sense-taste',
      correctId: 'tongue',
    },
    {
      id: 'touch',
      question: 'Which body part helps us FEEL and TOUCH a soft teddy?',
      voiceId: 'ga-sense-touch',
      correctId: 'hands',
    },
  ] as const;

  const organs = [
    { id: 'eyes', label: 'Eyes', art: { kind: 'quest-icon' as const, id: 'sense-eyes' as const }, role: 'seeing' },
    { id: 'ears', label: 'Ears', art: { kind: 'quest-icon' as const, id: 'sense-ears' as const }, role: 'hearing' },
    { id: 'nose', label: 'Nose', art: { kind: 'quest-icon' as const, id: 'sense-nose' as const }, role: 'smelling' },
    { id: 'tongue', label: 'Tongue', art: { kind: 'quest-icon' as const, id: 'sense-tongue' as const }, role: 'tasting' },
    { id: 'hands', label: 'Hands / Skin', art: { kind: 'quest-icon' as const, id: 'sense-hands' as const }, role: 'touching' },
  ];

  const q = senses[Math.floor(Math.random() * senses.length)];
  const targetOrgan = organs.find((o) => o.id === q.correctId) ?? organs[0];
  const wrongs = shuffleItems(organs.filter((o) => o.id !== q.correctId)).slice(0, 2);

  return {
    uid: `sense-${q.id}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'choice',
    packId: 'about-me-helpers',
    conceptId: `ga:sense-${q.id}`,
    conceptLabel: `5 Senses: ${targetOrgan.label}`,
    skillType: 'general_awareness',
    promptText: q.question,
    promptBadge: 'OUR 5 SENSES',
    voiceClipId: q.voiceId,
    voiceFallbackText: q.question,
    choices: shuffleItems([targetOrgan, ...wrongs]).map((o) => ({
      id: `org-${o.id}`,
      label: o.label,
      art: o.art,
      isCorrect: o.id === targetOrgan.id,
      wrongExplanation: `Our ${o.label} are for ${o.role}. We use our ${targetOrgan.label} for ${targetOrgan.role}!`,
    })),
  };
}

export function buildBodyPartsAndHabitsPrompt(): ChoiceQuestPrompt {
  const items = [
    {
      id: 'knees',
      label: 'Parts of My Body',
      question: 'Which picture shows our KNEES that bend when we jump?',
      voiceId: 'ga-body-knees',
      correct: { label: 'Knees', art: { kind: 'quest-icon' as const, id: 'body-knees' as const } },
      wrongs: [
        { label: 'Shoulders', art: { kind: 'quest-icon' as const, id: 'body-shoulders' as const } },
        { label: 'Feet', art: { kind: 'quest-icon' as const, id: 'body-feet' as const } },
      ],
      explain: 'Knees are in the middle of our legs so our legs can bend!',
    },
    {
      id: 'wash-hands',
      label: 'Healthy Habits',
      question: 'What healthy habit should we do BEFORE eating meals?',
      voiceId: 'ga-habit-wash-hands',
      correct: { label: 'Wash Hands with Soap', art: { kind: 'quest-icon' as const, id: 'habit-wash-hands' as const } },
      wrongs: [
        { label: 'Eat Candy & Soda', art: { kind: 'quest-icon' as const, id: 'food-candy-soda' as const } },
        { label: 'Go to Sleep', art: { kind: 'quest-icon' as const, id: 'habit-sleep-well' as const } },
      ],
      explain: 'Washing hands with soap washes away germs before we eat!',
    },
    {
      id: 'brush-teeth',
      label: 'Healthy Habits',
      question: 'What keeps our teeth clean and strong morning and night?',
      voiceId: 'ga-habit-brush-teeth',
      correct: { label: 'Brushing Teeth', art: { kind: 'quest-icon' as const, id: 'habit-brush-teeth' as const } },
      wrongs: [
        { label: 'Sugary Soda', art: { kind: 'quest-icon' as const, id: 'food-candy-soda' as const } },
        { label: 'French Fries', art: { kind: 'quest-icon' as const, id: 'food-fries' as const } },
      ],
      explain: 'Brushing our teeth every morning and night keeps our smile healthy!',
    },
  ];

  const q = items[Math.floor(Math.random() * items.length)];
  const opts = shuffleItems([
    { ...q.correct, isCorrect: true },
    ...q.wrongs.map((w) => ({ ...w, isCorrect: false })),
  ]);

  return {
    uid: `body-${q.id}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'choice',
    packId: 'about-me-helpers',
    conceptId: `ga:${q.id}`,
    conceptLabel: q.label,
    skillType: 'general_awareness',
    promptText: q.question,
    promptBadge: 'ALL ABOUT ME',
    voiceClipId: q.voiceId,
    voiceFallbackText: q.question,
    choices: opts.map((o, idx) => ({
      id: `bh-${idx}`,
      label: o.label,
      art: o.art,
      isCorrect: o.isCorrect,
      wrongExplanation: q.explain,
    })),
  };
}

export function buildHumanGrowthStagesPrompt(): SequenceQuestPrompt {
  const stages = [
    { id: 'baby', label: 'Baby', iconId: 'stage-baby' as const },
    { id: 'child', label: 'Child', iconId: 'stage-child' as const },
    { id: 'adult', label: 'Adult', iconId: 'stage-adult' as const },
    { id: 'elder', label: 'Elder', iconId: 'stage-elder' as const },
  ];
  return {
    uid: `seq-human-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'sequence',
    packId: 'about-me-helpers',
    conceptId: 'ga:human-growth',
    conceptLabel: 'Stages of Human Growth',
    skillType: 'sequence_order',
    promptText: 'Put the 4 stages of human growth in order from youngest to oldest!',
    promptBadge: 'HUMAN GROWTH STAGES',
    voiceClipId: 'ga-seq-human-growth',
    voiceFallbackText: 'Put the four stages of human life in order from baby to elder!',
    steps: shuffleItems(
      stages.map((s, idx) => ({
        id: s.id,
        correctOrder: idx,
        label: s.label,
        art: { kind: 'quest-icon', id: s.iconId },
      })),
    ),
    orderedSummary: 'Baby → Child → Adult → Elder',
  };
}

export function buildEverydayVsSometimesFoodSortPrompt(): MiniSortQuestPrompt {
  const everyday = shuffleItems([
    { id: 'apple', label: 'Apple', art: { kind: 'word-art' as const, id: 'apple' as const } },
    { id: 'milk', label: 'Milk', art: { kind: 'word-art' as const, id: 'milk' as const } },
    { id: 'carrot', label: 'Carrot', art: { kind: 'word-art' as const, id: 'carrot' as const } },
    { id: 'plate', label: 'Fruits & Veggies', art: { kind: 'quest-icon' as const, id: 'food-healthy-plate' as const } },
  ]).slice(0, 2);

  const sometimes = shuffleItems([
    { id: 'candy', label: 'Candy & Soda', art: { kind: 'quest-icon' as const, id: 'food-candy-soda' as const } },
    { id: 'fries', label: 'French Fries', art: { kind: 'quest-icon' as const, id: 'food-fries' as const } },
    { id: 'donut', label: 'Frosted Donut', art: { kind: 'word-art' as const, id: 'donut' as const } },
    { id: 'cake', label: 'Sweet Cake', art: { kind: 'word-art' as const, id: 'cake' as const } },
  ]).slice(0, 2);

  return {
    uid: `sort-food-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'mini-sort',
    packId: 'about-me-helpers',
    conceptId: 'ga:everyday-sometimes-food',
    conceptLabel: 'Everyday vs Sometimes Food',
    skillType: 'general_awareness',
    promptText: 'Sort the foods into Everyday Healthy Food or Sometimes Treats!',
    promptBadge: 'HEALTHY FOOD HABITS',
    voiceClipId: 'ga-sort-food',
    voiceFallbackText: 'Sort each food into everyday healthy food or sometimes treats!',
    baskets: [
      { id: 'everyday', label: 'Everyday Food', sublabel: 'Helps us grow strong', accentColor: '#3BA99C' },
      { id: 'sometimes', label: 'Sometimes Food', sublabel: 'Once-in-a-while treats', accentColor: '#F27A5E' },
    ],
    items: shuffleItems([
      ...everyday.map((f) => ({
        ...f,
        targetBasketId: 'everyday',
        wrongExplanation: `${f.label} gives vitamins and energy — it belongs in Everyday Healthy Food!`,
      })),
      ...sometimes.map((f) => ({
        ...f,
        targetBasketId: 'sometimes',
        wrongExplanation: `${f.label} has lots of sugar or oil — we enjoy it only as a Sometimes Food!`,
      })),
    ]),
  };
}

export function buildCommunityHelpersPrompt(): ChoiceQuestPrompt {
  const helpers = [
    {
      id: 'doctor',
      name: 'Doctor',
      iconId: 'helper-doctor' as const,
      question: 'Who checks our heartbeat and helps us feel better when we are sick?',
      voiceId: 'ga-helper-doctor',
      role: 'cares for patients at the clinic or hospital',
    },
    {
      id: 'firefighter',
      name: 'Firefighter',
      iconId: 'helper-firefighter' as const,
      question: 'Who rides a fire engine and puts out fires to keep people safe?',
      voiceId: 'ga-helper-firefighter',
      role: 'puts out fires and rescues people',
    },
    {
      id: 'teacher',
      name: 'Teacher',
      iconId: 'helper-teacher' as const,
      question: 'Who helps children read, count, and learn at school?',
      voiceId: 'ga-helper-teacher',
      role: 'teaches children at school',
    },
    {
      id: 'farmer',
      name: 'Farmer',
      iconId: 'helper-farmer' as const,
      question: 'Who grows fresh fruits, vegetables, and grains on a farm?',
      voiceId: 'ga-helper-farmer',
      role: 'grows food crops on the farm',
    },
    {
      id: 'pilot',
      name: 'Pilot',
      iconId: 'helper-pilot' as const,
      question: 'Who flies an airplane high in the sky?',
      voiceId: 'ga-helper-pilot',
      role: 'flies airplanes across the sky',
    },
    {
      id: 'postman',
      name: 'Postman',
      iconId: 'helper-postman' as const,
      question: 'Who delivers letters and parcels to our homes?',
      voiceId: 'ga-helper-postman',
      role: 'delivers letters and packages',
    },
    {
      id: 'chef',
      name: 'Chef',
      iconId: 'helper-chef' as const,
      question: 'Who wears a tall white hat and cooks delicious meals in a kitchen?',
      voiceId: 'ga-helper-chef',
      role: 'cooks tasty meals in a kitchen',
    },
  ];

  const target = helpers[Math.floor(Math.random() * helpers.length)];
  const wrongs = shuffleItems(helpers.filter((h) => h.id !== target.id)).slice(0, 2);

  return {
    uid: `helper-${target.id}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'choice',
    packId: 'about-me-helpers',
    conceptId: `ga:helper-${target.id}`,
    conceptLabel: `Profession: ${target.name}`,
    skillType: 'general_awareness',
    promptText: target.question,
    promptBadge: 'PEOPLE & PROFESSIONS',
    voiceClipId: target.voiceId,
    voiceFallbackText: target.question,
    choices: shuffleItems([target, ...wrongs]).map((h) => ({
      id: `hlp-${h.id}`,
      label: h.name,
      art: { kind: 'quest-icon', id: h.iconId },
      isCorrect: h.id === target.id,
      wrongExplanation: `A ${h.name} ${h.role}. A ${target.name} ${target.role}!`,
    })),
  };
}

/* ================= 2. ANIMAL KINGDOM & NATURE / PLANTS ================= */

export function buildLifecycleSequencePrompt(): SequenceQuestPrompt {
  const lifecycles = [
    {
      id: 'butterfly',
      label: 'Butterfly Lifecycle',
      prompt: 'Put the 4 stages of the BUTTERFLY lifecycle in order!',
      voiceId: 'ga-seq-butterfly',
      summary: 'Eggs on Leaf → Caterpillar → Chrysalis → Butterfly',
      steps: [
        { id: 'egg', label: 'Eggs on Leaf', iconId: 'life-butterfly-egg' as const },
        { id: 'cat', label: 'Caterpillar', iconId: 'life-caterpillar' as const },
        { id: 'chr', label: 'Chrysalis', iconId: 'life-chrysalis' as const },
        { id: 'but', label: 'Butterfly', iconId: 'life-butterfly' as const },
      ],
    },
    {
      id: 'frog',
      label: 'Frog Lifecycle',
      prompt: 'Put the 4 stages of the FROG lifecycle in order!',
      voiceId: 'ga-seq-frog',
      summary: 'Frogspawn → Tadpole → Froglet → Frog',
      steps: [
        { id: 'spw', label: 'Frog Eggs', iconId: 'life-frog-spawn' as const },
        { id: 'tad', label: 'Tadpole', iconId: 'life-tadpole' as const },
        { id: 'fgl', label: 'Froglet', iconId: 'life-froglet' as const },
        { id: 'frg', label: 'Adult Frog', iconId: 'life-frog' as const },
      ],
    },
    {
      id: 'plant',
      label: 'Plant Lifecycle',
      prompt: 'Put the 4 stages of the PLANT lifecycle in order!',
      voiceId: 'ga-seq-plant',
      summary: 'Seed → Sprout → Young Plant → Fruit Tree',
      steps: [
        { id: 'seed', label: 'Seed in Soil', iconId: 'life-seed' as const },
        { id: 'spr', label: 'Sprout', iconId: 'life-sprout' as const },
        { id: 'sap', label: 'Young Plant', iconId: 'life-sapling' as const },
        { id: 'tree', label: 'Fruit Tree', iconId: 'life-fruit-tree' as const },
      ],
    },
  ];

  const lc = lifecycles[Math.floor(Math.random() * lifecycles.length)];
  return {
    uid: `lc-${lc.id}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'sequence',
    packId: 'animals-nature',
    conceptId: `ga:lifecycle-${lc.id}`,
    conceptLabel: lc.label,
    skillType: 'sequence_order',
    promptText: lc.prompt,
    promptBadge: lc.label.toUpperCase(),
    voiceClipId: lc.voiceId,
    voiceFallbackText: lc.prompt,
    steps: shuffleItems(
      lc.steps.map((s, idx) => ({
        id: s.id,
        correctOrder: idx,
        label: s.label,
        art: { kind: 'quest-icon', id: s.iconId },
      })),
    ),
    orderedSummary: lc.summary,
  };
}

export function buildAnimalClassificationSortPrompt(): MiniSortQuestPrompt {
  const modes: readonly {
    id: string;
    label: string;
    prompt: string;
    voiceId: string;
    baskets: readonly [
      { id: string; label: string; sublabel: string; accentColor: string },
      { id: string; label: string; sublabel: string; accentColor: string },
    ];
    groupA: readonly { id: string; label: string; art: QuestArtSpec; explain: string }[];
    groupB: readonly { id: string; label: string; art: QuestArtSpec; explain: string }[];
  }[] = [
    {
      id: 'birth',
      label: 'Egg-Laying vs Live-Birth Animals',
      prompt: 'Sort the animals by how their babies are born!',
      voiceId: 'ga-sort-eggs-babies',
      baskets: [
        { id: 'eggs', label: 'Hatches from Eggs', sublabel: 'Birds, frogs, turtles', accentColor: '#F2B84B' },
        { id: 'babies', label: 'Gives Birth to Babies', sublabel: 'Mammals', accentColor: '#5B5BD6' },
      ],
      groupA: [
        { id: 'duck', label: 'Duck', art: { kind: 'word-art', id: 'duck' }, explain: 'Ducks lay eggs in a nest!' },
        { id: 'turtle', label: 'Turtle', art: { kind: 'word-art', id: 'turtle' }, explain: 'Turtles hatch from eggs!' },
        { id: 'frog', label: 'Frog', art: { kind: 'word-art', id: 'frog' }, explain: 'Frogs hatch from frogspawn eggs!' },
      ],
      groupB: [
        { id: 'cow', label: 'Cow', art: { kind: 'word-art', id: 'cow' }, explain: 'A cow gives birth to a baby calf!' },
        { id: 'dog', label: 'Dog', art: { kind: 'word-art', id: 'dog' }, explain: 'A dog gives birth to live puppies!' },
        { id: 'elephant', label: 'Elephant', art: { kind: 'word-art', id: 'elephant' }, explain: 'Elephants give birth to live calves!' },
      ],
    },
    {
      id: 'birds-insects',
      label: 'Birds vs Insects',
      prompt: 'Sort each creature into Feathered Birds or 6-Legged Insects!',
      voiceId: 'ga-sort-birds-insects',
      baskets: [
        { id: 'birds', label: 'Birds', sublabel: '2 legs, feathers & beak', accentColor: '#3BA99C' },
        { id: 'insects', label: 'Insects', sublabel: 'Tiny with 6 legs', accentColor: '#F27A5E' },
      ],
      groupA: [
        { id: 'owl', label: 'Owl', art: { kind: 'word-art', id: 'owl' }, explain: 'An owl has feathers, wings, and a beak — it is a bird!' },
        { id: 'eagle', label: 'Eagle', art: { kind: 'word-art', id: 'eagle' }, explain: 'An eagle has feathers and 2 legs — it is a bird!' },
        { id: 'penguin', label: 'Penguin', art: { kind: 'word-art', id: 'penguin' }, explain: 'A penguin is a bird with feathers and a beak!' },
      ],
      groupB: [
        { id: 'ant', label: 'Ant', art: { kind: 'word-art', id: 'ant' }, explain: 'An ant has 6 legs and feelers — it is an insect!' },
        { id: 'bee', label: 'Bee', art: { kind: 'word-art', id: 'bee' }, explain: 'A bee is a 6-legged buzzing insect!' },
        { id: 'ladybug', label: 'Ladybug', art: { kind: 'word-art', id: 'ladybug' }, explain: 'A ladybug has 6 legs — it is an insect!' },
      ],
    },
    {
      id: 'food-habitat',
      label: 'Water vs Land Habitat',
      prompt: 'Where does each animal live? Sort into Land Animals or Water Animals!',
      voiceId: 'ga-sort-land-water',
      baskets: [
        { id: 'land', label: 'Lives on Land', sublabel: 'Forest, farm & savanna', accentColor: '#3BA99C' },
        { id: 'water', label: 'Lives in Water', sublabel: 'Ocean & rivers', accentColor: '#4A6FA5' },
      ],
      groupA: [
        { id: 'giraffe', label: 'Giraffe', art: { kind: 'word-art', id: 'giraffe' }, explain: 'Giraffes walk on land in the savanna!' },
        { id: 'rabbit', label: 'Rabbit', art: { kind: 'word-art', id: 'rabbit' }, explain: 'Rabbits hop on grassy land!' },
        { id: 'horse', label: 'Horse', art: { kind: 'word-art', id: 'horse' }, explain: 'Horses run on land!' },
      ],
      groupB: [
        { id: 'whale', label: 'Whale', art: { kind: 'word-art', id: 'whale' }, explain: 'Whales swim in the deep ocean water!' },
        { id: 'octopus', label: 'Octopus', art: { kind: 'word-art', id: 'octopus' }, explain: 'An octopus lives underwater in the sea!' },
        { id: 'dolphin', label: 'Dolphin', art: { kind: 'word-art', id: 'dolphin' }, explain: 'Dolphins live and swim in ocean water!' },
      ],
    },
  ];

  const m = modes[Math.floor(Math.random() * modes.length)];
  const aItems = shuffleItems(m.groupA).slice(0, 2);
  const bItems = shuffleItems(m.groupB).slice(0, 2);

  return {
    uid: `anim-sort-${m.id}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'mini-sort',
    packId: 'animals-nature',
    conceptId: `ga:animals-${m.id}`,
    conceptLabel: m.label,
    skillType: 'general_awareness',
    promptText: m.prompt,
    promptBadge: 'ANIMAL KINGDOM',
    voiceClipId: m.voiceId,
    voiceFallbackText: m.prompt,
    baskets: m.baskets,
    items: shuffleItems([
      ...aItems.map((it) => ({
        id: it.id,
        label: it.label,
        targetBasketId: m.baskets[0].id,
        art: it.art,
        wrongExplanation: it.explain,
      })),
      ...bItems.map((it) => ({
        id: it.id,
        label: it.label,
        targetBasketId: m.baskets[1].id,
        art: it.art,
        wrongExplanation: it.explain,
      })),
    ]),
  };
}

export function buildPlantsAndDietQuizPrompt(): ChoiceQuestPrompt {
  const bank = [
    {
      id: 'plant-roots',
      label: 'Parts of a Plant',
      question: 'Which part of a plant grows UNDER the soil and drinks water?',
      voiceId: 'ga-plant-roots',
      correct: { label: 'Roots', art: { kind: 'quest-icon' as const, id: 'plant-roots' as const } },
      wrongs: [
        { label: 'Flower', art: { kind: 'quest-icon' as const, id: 'plant-flower' as const } },
        { label: 'Leaf', art: { kind: 'quest-icon' as const, id: 'plant-leaf' as const } },
      ],
      explain: 'Roots grow underground to hold the plant and drink water!',
    },
    {
      id: 'plant-climber',
      label: 'Types of Plants',
      question: 'Which plant is a CLIMBER that needs a stick or support to grow up?',
      voiceId: 'ga-plant-climber',
      correct: { label: 'Climber Vine', art: { kind: 'quest-icon' as const, id: 'plant-climber' as const } },
      wrongs: [
        { label: 'Tall Pine Tree', art: { kind: 'quest-icon' as const, id: 'cmp-tall-pine' as const } },
        { label: 'Bushy Shrub', art: { kind: 'quest-icon' as const, id: 'plant-shrub' as const } },
      ],
      explain: 'Climbers have soft stems that curl around a support to climb up!',
    },
    {
      id: 'plant-product',
      label: 'Plant Products',
      question: 'Which of these everyday things is made from PLANTS (wood from trees)?',
      voiceId: 'ga-plant-product',
      correct: { label: 'Wooden Chair', art: { kind: 'quest-icon' as const, id: 'plant-wooden-chair' as const } },
      wrongs: [
        { label: 'Glass of Milk', art: { kind: 'word-art' as const, id: 'milk' as const } },
        { label: 'Fresh Egg', art: { kind: 'word-art' as const, id: 'egg' as const } },
      ],
      explain: 'Milk and eggs come from animals — wood for chairs comes from trees!',
    },
    {
      id: 'herbivore',
      label: 'Animal Diet',
      question: 'Which animal is a PLANT-EATER (eats grass and leaves)?',
      voiceId: 'ga-animal-herbivore',
      correct: { label: 'Cow', art: { kind: 'word-art' as const, id: 'cow' as const } },
      wrongs: [
        { label: 'Lion', art: { kind: 'word-art' as const, id: 'lion' as const } },
        { label: 'Alligator', art: { kind: 'word-art' as const, id: 'alligator' as const } },
      ],
      explain: 'Lions and alligators eat meat — cows munch fresh green grass and plants!',
    },
  ];

  const q = bank[Math.floor(Math.random() * bank.length)];
  const opts = shuffleItems([
    { ...q.correct, isCorrect: true },
    ...q.wrongs.map((w) => ({ ...w, isCorrect: false })),
  ]);

  return {
    uid: `nat-${q.id}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'choice',
    packId: 'animals-nature',
    conceptId: `ga:${q.id}`,
    conceptLabel: q.label,
    skillType: 'general_awareness',
    promptText: q.question,
    promptBadge: 'NATURE AROUND ME',
    voiceClipId: q.voiceId,
    voiceFallbackText: q.question,
    choices: opts.map((o, idx) => ({
      id: `n-${idx}`,
      label: o.label,
      art: o.art,
      isCorrect: o.isCorrect,
      wrongExplanation: q.explain,
    })),
  };
}

/* ================= 3. TRANSPORT, GADGETS, 3Rs & SKY ================= */

export function buildTransportSortPrompt(): MiniSortQuestPrompt {
  const land = shuffleItems([
    { id: 'bus', label: 'Bus', art: { kind: 'word-art' as const, id: 'bus' as const } },
    { id: 'car', label: 'Car', art: { kind: 'word-art' as const, id: 'car' as const } },
    { id: 'truck', label: 'Truck', art: { kind: 'word-art' as const, id: 'truck' as const } },
  ]).slice(0, 2);

  const water = [
    shuffleItems([
      { id: 'boat', label: 'Boat', art: { kind: 'word-art' as const, id: 'boat' as const } },
      { id: 'submarine', label: 'Submarine', art: { kind: 'word-art' as const, id: 'submarine' as const } },
      { id: 'yacht', label: 'Sailboat', art: { kind: 'word-art' as const, id: 'yacht' as const } },
    ])[0],
  ];

  const air = [
    shuffleItems([
      { id: 'airplane', label: 'Airplane', art: { kind: 'word-art' as const, id: 'airplane' as const } },
      { id: 'helicopter', label: 'Helicopter', art: { kind: 'word-art' as const, id: 'helicopter' as const } },
      { id: 'jet', label: 'Jet', art: { kind: 'word-art' as const, id: 'jet' as const } },
    ])[0],
  ];

  return {
    uid: `sort-trans-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'mini-sort',
    packId: 'world-transport',
    conceptId: 'ga:transportation',
    conceptLabel: 'Land, Water & Air Transport',
    skillType: 'general_awareness',
    promptText: 'Sort each vehicle into Land, Water, or Air transportation!',
    promptBadge: 'TYPES OF TRANSPORTATION',
    voiceClipId: 'ga-sort-transport',
    voiceFallbackText: 'Sort each vehicle by where it travels: land, water, or air!',
    baskets: [
      { id: 'land', label: 'Land', sublabel: 'Roads & tracks', accentColor: '#3BA99C' },
      { id: 'water', label: 'Water', sublabel: 'Rivers & sea', accentColor: '#4A6FA5' },
      { id: 'air', label: 'Air', sublabel: 'High in the sky', accentColor: '#5B5BD6' },
    ],
    items: shuffleItems([
      ...land.map((v) => ({
        ...v,
        targetBasketId: 'land',
        wrongExplanation: `A ${v.label} has wheels and drives on Land!`,
      })),
      ...water.map((v) => ({
        ...v,
        targetBasketId: 'water',
        wrongExplanation: `A ${v.label} floats or sails in Water!`,
      })),
      ...air.map((v) => ({
        ...v,
        targetBasketId: 'air',
        wrongExplanation: `A ${v.label} flies up in the Air!`,
      })),
    ]),
  };
}

export function buildWorldTechEcoSkyPrompt(): ChoiceQuestPrompt {
  const bank = [
    {
      id: 'fridge',
      label: 'Useful Technologies',
      question: 'Which helpful home machine keeps milk, fruits, and food cold and fresh?',
      voiceId: 'ga-tech-fridge',
      correct: { label: 'Refrigerator', art: { kind: 'quest-icon' as const, id: 'tech-fridge' as const } },
      wrongs: [
        { label: 'Washing Machine', art: { kind: 'quest-icon' as const, id: 'tech-washer' as const } },
        { label: 'Wall Clock', art: { kind: 'quest-icon' as const, id: 'obj-clock' as const } },
      ],
      explain: 'A washing machine cleans clothes, while a refrigerator keeps food cool and fresh!',
    },
    {
      id: '3rs-reuse',
      label: '3Rs (Reduce, Reuse, Recycle)',
      question: 'How can we REDUCE plastic waste and care for nature when shopping?',
      voiceId: 'ga-3rs-bag',
      correct: { label: 'Carry a Reusable Bag', art: { kind: 'quest-icon' as const, id: 'world-reuse-bag' as const } },
      wrongs: [
        { label: 'Soda Cans', art: { kind: 'quest-icon' as const, id: 'food-candy-soda' as const } },
        { label: 'Tablet Screen', art: { kind: 'quest-icon' as const, id: 'tech-tablet' as const } },
      ],
      explain: 'Using a cloth reusable bag again and again reduces plastic trash!',
    },
    {
      id: 'save-water',
      label: 'Protecting Nature',
      question: 'Which picture shows a smart way to SAVE WATER and protect Earth?',
      voiceId: 'ga-save-water',
      correct: { label: 'Turn Off the Tap', art: { kind: 'quest-icon' as const, id: 'world-save-water' as const } },
      wrongs: [
        { label: 'Full Beaker', art: { kind: 'quest-icon' as const, id: 'beaker-full' as const } },
        { label: 'Washing Machine', art: { kind: 'quest-icon' as const, id: 'tech-washer' as const } },
      ],
      explain: 'Turning off the water tap tightly while brushing saves precious clean water!',
    },
    {
      id: 'sky-planets',
      label: 'The Sky Above',
      question: 'Our Earth and Saturn travel around the Sun in space — what are they called?',
      voiceId: 'ga-sky-planets',
      correct: { label: 'Planets & Sun', art: { kind: 'quest-icon' as const, id: 'world-planets' as const } },
      wrongs: [
        { label: 'Rain Umbrella', art: { kind: 'word-art' as const, id: 'umbrella' as const } },
        { label: 'Rainbow', art: { kind: 'word-art' as const, id: 'rainbow' as const } },
      ],
      explain: 'Earth is one of the planets orbiting around our bright star, the Sun!',
    },
    {
      id: 'sky-moon',
      label: 'Day & Night Sky',
      question: 'What shines gently in the dark NIGHT sky alongside twinkling stars?',
      voiceId: 'ga-sky-moon',
      correct: { label: 'The Moon', art: { kind: 'word-art' as const, id: 'moon' as const } },
      wrongs: [
        { label: 'Bright Noon Sun', art: { kind: 'word-art' as const, id: 'sun' as const } },
        { label: 'Rainbow', art: { kind: 'word-art' as const, id: 'rainbow' as const } },
      ],
      explain: 'The Sun shines during the daytime — at night we see the Moon and stars!',
    },
  ];

  const q = bank[Math.floor(Math.random() * bank.length)];
  const opts = shuffleItems([
    { ...q.correct, isCorrect: true },
    ...q.wrongs.map((w) => ({ ...w, isCorrect: false })),
  ]);

  return {
    uid: `world-${q.id}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'choice',
    packId: 'world-transport',
    conceptId: `ga:${q.id}`,
    conceptLabel: q.label,
    skillType: 'general_awareness',
    promptText: q.question,
    promptBadge: 'THE WORLD AROUND ME',
    voiceClipId: q.voiceId,
    voiceFallbackText: q.question,
    choices: opts.map((o, idx) => ({
      id: `w-${idx}`,
      label: o.label,
      art: o.art,
      isCorrect: o.isCorrect,
      wrongExplanation: q.explain,
    })),
  };
}

export function buildAboutMeHelpersPackPool(): QuestPrompt[] {
  return [
    buildFiveSensesPrompt(),
    buildFiveSensesPrompt(),
    buildBodyPartsAndHabitsPrompt(),
    buildHumanGrowthStagesPrompt(),
    buildEverydayVsSometimesFoodSortPrompt(),
    buildCommunityHelpersPrompt(),
    buildCommunityHelpersPrompt(),
  ];
}

export function buildAnimalsNaturePackPool(): QuestPrompt[] {
  return [
    buildLifecycleSequencePrompt(),
    buildLifecycleSequencePrompt(),
    buildAnimalClassificationSortPrompt(),
    buildAnimalClassificationSortPrompt(),
    buildPlantsAndDietQuizPrompt(),
    buildPlantsAndDietQuizPrompt(),
  ];
}

export function buildWorldTransportPackPool(): QuestPrompt[] {
  return [
    buildTransportSortPrompt(),
    buildTransportSortPrompt(),
    buildWorldTechEcoSkyPrompt(),
    buildWorldTechEcoSkyPrompt(),
    buildWorldTechEcoSkyPrompt(),
  ];
}
