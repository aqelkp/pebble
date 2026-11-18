import type { LetterWordArtId } from '../../data/wordBank';

// TODO(security): Pebble runs 100% locally in the browser as a static client-only PWA with no
// backend server, authentication, or database. All localStorage mastery records and sessionStorage
// active workbook pages are treated as untrusted input and validated against strict allow-lists
// and numeric bounds before use.

export type CircleSortPackId =
  | 'mix'
  | 'animal-world'
  | 'orchard-garden'
  | 'healthy-plate'
  | 'on-the-move';

export type CircleSortGridMode = '3x3' | '2x3';

export type CircleSortRoundLength = 1 | 3 | 5;

export interface CircleSortConfig {
  packId: CircleSortPackId;
  gridMode: CircleSortGridMode;
  roundLength: CircleSortRoundLength;
}

export type CircleSortQuestId =
  | 'carnivores'
  | 'herbivores'
  | 'wild-animals'
  | 'farm-pets'
  | 'water-animals'
  | 'fruits'
  | 'vegetables'
  | 'healthy-food'
  | 'treat-food'
  | 'sky-fliers'
  | 'water-transport'
  | 'road-vehicles';

export type CustomCircleSortArtId =
  | 'burger'
  | 'fries'
  | 'soda'
  | 'candy'
  | 'chips'
  | 'shark'
  | 'donkey'
  | 'camel'
  | 'deer'
  | 'ship'
  | 'sailboat'
  | 'tractor'
  | 'hen';

export type CircleSortItemId =
  // Fruits (11)
  | 'apple'
  | 'banana'
  | 'mango'
  | 'strawberry'
  | 'orange'
  | 'watermelon'
  | 'pineapple'
  | 'grapes'
  | 'pear'
  | 'peach'
  | 'cherries'
  // Vegetables (11)
  | 'carrot'
  | 'broccoli'
  | 'potato'
  | 'onion'
  | 'cabbage'
  | 'cauliflower'
  | 'green-peas'
  | 'radish'
  | 'sweet-corn'
  | 'pumpkin'
  | 'mushroom'
  // Healthy staples (3 additional beyond fruits/veg)
  | 'milk'
  | 'egg'
  | 'yogurt'
  // Junk / Treat foods (9)
  | 'burger'
  | 'fries'
  | 'soda'
  | 'candy'
  | 'donut'
  | 'pizza'
  | 'cake'
  | 'ice-cream'
  | 'chips'
  // Animals (26)
  | 'lion'
  | 'tiger'
  | 'shark'
  | 'alligator'
  | 'eagle'
  | 'owl'
  | 'fox'
  | 'cow'
  | 'goat'
  | 'donkey'
  | 'camel'
  | 'elephant'
  | 'giraffe'
  | 'zebra'
  | 'rabbit'
  | 'horse'
  | 'deer'
  | 'monkey'
  | 'dog'
  | 'cat'
  | 'hen'
  | 'duck'
  | 'pig'
  | 'dolphin'
  | 'whale'
  | 'octopus'
  | 'fish'
  | 'jellyfish'
  // Transport & Sky (16)
  | 'airplane'
  | 'helicopter'
  | 'jet'
  | 'rocket'
  | 'bee'
  | 'boat'
  | 'yacht'
  | 'submarine'
  | 'ship'
  | 'sailboat'
  | 'bus'
  | 'car'
  | 'truck'
  | 'van'
  | 'firetruck'
  | 'tractor';

export type CircleSortArtSource =
  | { kind: 'png'; path: string }
  | { kind: 'word-art'; id: LetterWordArtId }
  | { kind: 'custom-svg'; id: CustomCircleSortArtId };

export interface CircleSortItemSpec {
  id: CircleSortItemId;
  label: string;
  spokenLabel: string;
  conceptId: string;
  art: CircleSortArtSource;
}

export interface CircleSortDistractorSpec {
  itemId: CircleSortItemId;
  pillLabel: string;
  mistakeAudioKey: string;
  mistakeSpokenText: string;
}

export interface CircleSortQuestSpec {
  id: CircleSortQuestId;
  packId: Exclude<CircleSortPackId, 'mix'>;
  title: string;
  shortBadge: string;
  promptSubHint: string;
  buildHeadline: (count: number) => string;
  buildSpokenPrompt: (count: number) => string;
  targets: readonly CircleSortItemId[];
  distractors: readonly CircleSortDistractorSpec[];
}

export interface CircleSortPackSpec {
  id: CircleSortPackId;
  title: string;
  subtitle: string;
  badge: string;
  previewItemId: CircleSortItemId;
  questIds: readonly CircleSortQuestId[];
}

export interface CircleSortCardSlot {
  slotIndex: number;
  itemId: CircleSortItemId;
  label: string;
  isTarget: boolean;
  pillLabel?: string;
  mistakeAudioKey?: string;
  mistakeSpokenText?: string;
}

export interface CircleSortPageSpec {
  pageUid: string;
  questId: CircleSortQuestId;
  cols: number;
  rows: number;
  targetCount: number;
  slots: CircleSortCardSlot[];
}

export interface CircleSortMasteryState {
  version: 1;
  questWins: Partial<Record<CircleSortQuestId, number>>;
  flawlessQuests: CircleSortQuestId[];
}

export const CIRCLE_SORT_MASTERY_KEY = 'pebble.circle-sort.mastery.v1';
export const CIRCLE_SORT_SESSION_KEY = 'pebble.circle-sort.active.v1';

export const CIRCLE_SORT_ITEMS: readonly CircleSortItemSpec[] = [
  // Fruits (themes/fruits PNGs)
  { id: 'apple', label: 'Apple', spokenLabel: 'Apple!', conceptId: 'word:apple', art: { kind: 'png', path: 'themes/fruits/01-apple.png' } },
  { id: 'banana', label: 'Banana', spokenLabel: 'Banana!', conceptId: 'word:banana', art: { kind: 'png', path: 'themes/fruits/02-banana.png' } },
  { id: 'mango', label: 'Mango', spokenLabel: 'Mango!', conceptId: 'word:mango', art: { kind: 'png', path: 'themes/fruits/03-mango.png' } },
  { id: 'strawberry', label: 'Strawberry', spokenLabel: 'Strawberry!', conceptId: 'word:strawberry', art: { kind: 'png', path: 'themes/fruits/04-strawberry.png' } },
  { id: 'orange', label: 'Orange', spokenLabel: 'Orange!', conceptId: 'word:orange', art: { kind: 'png', path: 'themes/fruits/05-orange.png' } },
  { id: 'watermelon', label: 'Watermelon', spokenLabel: 'Watermelon!', conceptId: 'word:watermelon', art: { kind: 'png', path: 'themes/fruits/06-watermelon.png' } },
  { id: 'pineapple', label: 'Pineapple', spokenLabel: 'Pineapple!', conceptId: 'evs:pineapple', art: { kind: 'png', path: 'themes/fruits/07-pineapple.png' } },
  { id: 'grapes', label: 'Grapes', spokenLabel: 'Grapes!', conceptId: 'word:grapes', art: { kind: 'png', path: 'themes/fruits/08-grapes.png' } },
  { id: 'cherries', label: 'Cherries', spokenLabel: 'Cherries!', conceptId: 'evs:cherries', art: { kind: 'png', path: 'themes/fruits/09-cherries.png' } },
  { id: 'pear', label: 'Pear', spokenLabel: 'Pear!', conceptId: 'word:pear', art: { kind: 'png', path: 'themes/fruits/10-pear.png' } },
  { id: 'peach', label: 'Peach', spokenLabel: 'Peach!', conceptId: 'evs:peach', art: { kind: 'png', path: 'themes/fruits/11-peach.png' } },

  // Vegetables (themes/vegetables PNGs)
  { id: 'carrot', label: 'Carrot', spokenLabel: 'Carrot!', conceptId: 'word:carrot', art: { kind: 'png', path: 'themes/vegetables/01-carrot.png' } },
  { id: 'broccoli', label: 'Broccoli', spokenLabel: 'Broccoli!', conceptId: 'evs:broccoli', art: { kind: 'png', path: 'themes/vegetables/02-broccoli.png' } },
  { id: 'sweet-corn', label: 'Sweet Corn', spokenLabel: 'Sweet corn!', conceptId: 'evs:sweet-corn', art: { kind: 'png', path: 'themes/vegetables/04-corn.png' } },
  { id: 'green-peas', label: 'Green Peas', spokenLabel: 'Green peas!', conceptId: 'evs:green-peas', art: { kind: 'png', path: 'themes/vegetables/07-green-peas.png' } },
  { id: 'pumpkin', label: 'Pumpkin', spokenLabel: 'Pumpkin!', conceptId: 'word:pumpkin', art: { kind: 'png', path: 'themes/vegetables/08-pumpkin.png' } },
  { id: 'potato', label: 'Potato', spokenLabel: 'Potato!', conceptId: 'evs:potato', art: { kind: 'png', path: 'themes/vegetables/09-potato.png' } },
  { id: 'onion', label: 'Onion', spokenLabel: 'Onion!', conceptId: 'word:onion', art: { kind: 'png', path: 'themes/vegetables/10-onion.png' } },
  { id: 'cauliflower', label: 'Cauliflower', spokenLabel: 'Cauliflower!', conceptId: 'evs:cauliflower', art: { kind: 'png', path: 'themes/vegetables/11-cauliflower.png' } },
  { id: 'radish', label: 'Radish', spokenLabel: 'Radish!', conceptId: 'evs:radish', art: { kind: 'png', path: 'themes/vegetables/13-radish.png' } },
  { id: 'mushroom', label: 'Mushroom', spokenLabel: 'Mushroom!', conceptId: 'word:mushroom', art: { kind: 'png', path: 'themes/vegetables/14-mushroom.png' } },
  { id: 'cabbage', label: 'Cabbage', spokenLabel: 'Cabbage!', conceptId: 'evs:cabbage', art: { kind: 'png', path: 'themes/vegetables/16-cabbage.png' } },

  // Healthy staples
  { id: 'milk', label: 'Milk', spokenLabel: 'Milk!', conceptId: 'word:milk', art: { kind: 'word-art', id: 'milk' } },
  { id: 'egg', label: 'Egg', spokenLabel: 'Egg!', conceptId: 'word:egg', art: { kind: 'word-art', id: 'egg' } },
  { id: 'yogurt', label: 'Yogurt', spokenLabel: 'Yogurt!', conceptId: 'word:yogurt', art: { kind: 'word-art', id: 'yogurt' } },

  // Junk / Treat Foods
  { id: 'burger', label: 'Burger', spokenLabel: 'Burger!', conceptId: 'evs:burger', art: { kind: 'custom-svg', id: 'burger' } },
  { id: 'fries', label: 'French Fries', spokenLabel: 'French fries!', conceptId: 'evs:fries', art: { kind: 'custom-svg', id: 'fries' } },
  { id: 'soda', label: 'Soda', spokenLabel: 'Soda!', conceptId: 'evs:soda', art: { kind: 'custom-svg', id: 'soda' } },
  { id: 'candy', label: 'Candy', spokenLabel: 'Candy!', conceptId: 'evs:candy', art: { kind: 'custom-svg', id: 'candy' } },
  { id: 'donut', label: 'Donut', spokenLabel: 'Donut!', conceptId: 'word:donut', art: { kind: 'word-art', id: 'donut' } },
  { id: 'pizza', label: 'Pizza', spokenLabel: 'Pizza!', conceptId: 'word:pizza', art: { kind: 'word-art', id: 'pizza' } },
  { id: 'cake', label: 'Cake', spokenLabel: 'Cake!', conceptId: 'word:cake', art: { kind: 'word-art', id: 'cake' } },
  { id: 'ice-cream', label: 'Ice Cream', spokenLabel: 'Ice cream!', conceptId: 'word:ice-cream', art: { kind: 'word-art', id: 'ice-cream' } },
  { id: 'chips', label: 'Potato Chips', spokenLabel: 'Potato chips!', conceptId: 'evs:chips', art: { kind: 'custom-svg', id: 'chips' } },

  // Animals
  { id: 'lion', label: 'Lion', spokenLabel: 'Lion!', conceptId: 'word:lion', art: { kind: 'word-art', id: 'lion' } },
  { id: 'tiger', label: 'Tiger', spokenLabel: 'Tiger!', conceptId: 'word:tiger', art: { kind: 'word-art', id: 'tiger' } },
  { id: 'shark', label: 'Shark', spokenLabel: 'Shark!', conceptId: 'evs:shark', art: { kind: 'custom-svg', id: 'shark' } },
  { id: 'alligator', label: 'Alligator', spokenLabel: 'Alligator!', conceptId: 'word:alligator', art: { kind: 'word-art', id: 'alligator' } },
  { id: 'eagle', label: 'Eagle', spokenLabel: 'Eagle!', conceptId: 'word:eagle', art: { kind: 'word-art', id: 'eagle' } },
  { id: 'owl', label: 'Owl', spokenLabel: 'Owl!', conceptId: 'word:owl', art: { kind: 'word-art', id: 'owl' } },
  { id: 'fox', label: 'Fox', spokenLabel: 'Fox!', conceptId: 'word:fox', art: { kind: 'word-art', id: 'fox' } },
  { id: 'cow', label: 'Cow', spokenLabel: 'Cow!', conceptId: 'word:cow', art: { kind: 'word-art', id: 'cow' } },
  { id: 'goat', label: 'Goat', spokenLabel: 'Goat!', conceptId: 'word:goat', art: { kind: 'word-art', id: 'goat' } },
  { id: 'donkey', label: 'Donkey', spokenLabel: 'Donkey!', conceptId: 'evs:donkey', art: { kind: 'custom-svg', id: 'donkey' } },
  { id: 'camel', label: 'Camel', spokenLabel: 'Camel!', conceptId: 'evs:camel', art: { kind: 'custom-svg', id: 'camel' } },
  { id: 'elephant', label: 'Elephant', spokenLabel: 'Elephant!', conceptId: 'word:elephant', art: { kind: 'word-art', id: 'elephant' } },
  { id: 'giraffe', label: 'Giraffe', spokenLabel: 'Giraffe!', conceptId: 'word:giraffe', art: { kind: 'word-art', id: 'giraffe' } },
  { id: 'zebra', label: 'Zebra', spokenLabel: 'Zebra!', conceptId: 'word:zebra', art: { kind: 'word-art', id: 'zebra' } },
  { id: 'rabbit', label: 'Rabbit', spokenLabel: 'Rabbit!', conceptId: 'word:rabbit', art: { kind: 'word-art', id: 'rabbit' } },
  { id: 'horse', label: 'Horse', spokenLabel: 'Horse!', conceptId: 'word:horse', art: { kind: 'word-art', id: 'horse' } },
  { id: 'deer', label: 'Deer', spokenLabel: 'Deer!', conceptId: 'evs:deer', art: { kind: 'custom-svg', id: 'deer' } },
  { id: 'monkey', label: 'Monkey', spokenLabel: 'Monkey!', conceptId: 'word:monkey', art: { kind: 'word-art', id: 'monkey' } },
  { id: 'dog', label: 'Dog', spokenLabel: 'Dog!', conceptId: 'word:dog', art: { kind: 'word-art', id: 'dog' } },
  { id: 'cat', label: 'Cat', spokenLabel: 'Cat!', conceptId: 'word:cat', art: { kind: 'word-art', id: 'cat' } },
  { id: 'hen', label: 'Hen', spokenLabel: 'Hen!', conceptId: 'word:hen', art: { kind: 'custom-svg', id: 'hen' } },
  { id: 'duck', label: 'Duck', spokenLabel: 'Duck!', conceptId: 'word:duck', art: { kind: 'word-art', id: 'duck' } },
  { id: 'pig', label: 'Pig', spokenLabel: 'Pig!', conceptId: 'word:pig', art: { kind: 'word-art', id: 'pig' } },
  { id: 'dolphin', label: 'Dolphin', spokenLabel: 'Dolphin!', conceptId: 'word:dolphin', art: { kind: 'word-art', id: 'dolphin' } },
  { id: 'whale', label: 'Whale', spokenLabel: 'Whale!', conceptId: 'word:whale', art: { kind: 'word-art', id: 'whale' } },
  { id: 'octopus', label: 'Octopus', spokenLabel: 'Octopus!', conceptId: 'word:octopus', art: { kind: 'word-art', id: 'octopus' } },
  { id: 'fish', label: 'Fish', spokenLabel: 'Fish!', conceptId: 'word:fish', art: { kind: 'word-art', id: 'fish' } },
  { id: 'jellyfish', label: 'Jellyfish', spokenLabel: 'Jellyfish!', conceptId: 'word:jellyfish', art: { kind: 'word-art', id: 'jellyfish' } },

  // Transport & Sky
  { id: 'airplane', label: 'Airplane', spokenLabel: 'Airplane!', conceptId: 'word:airplane', art: { kind: 'word-art', id: 'airplane' } },
  { id: 'helicopter', label: 'Helicopter', spokenLabel: 'Helicopter!', conceptId: 'word:helicopter', art: { kind: 'word-art', id: 'helicopter' } },
  { id: 'jet', label: 'Jet', spokenLabel: 'Jet!', conceptId: 'word:jet', art: { kind: 'word-art', id: 'jet' } },
  { id: 'rocket', label: 'Rocket', spokenLabel: 'Rocket!', conceptId: 'word:rocket', art: { kind: 'word-art', id: 'rocket' } },
  { id: 'bee', label: 'Bee', spokenLabel: 'Bee!', conceptId: 'word:bee', art: { kind: 'word-art', id: 'bee' } },
  { id: 'boat', label: 'Boat', spokenLabel: 'Boat!', conceptId: 'word:boat', art: { kind: 'word-art', id: 'boat' } },
  { id: 'yacht', label: 'Yacht', spokenLabel: 'Yacht!', conceptId: 'word:yacht', art: { kind: 'word-art', id: 'yacht' } },
  { id: 'submarine', label: 'Submarine', spokenLabel: 'Submarine!', conceptId: 'word:submarine', art: { kind: 'word-art', id: 'submarine' } },
  { id: 'ship', label: 'Ship', spokenLabel: 'Ship!', conceptId: 'evs:ship', art: { kind: 'custom-svg', id: 'ship' } },
  { id: 'sailboat', label: 'Sailboat', spokenLabel: 'Sailboat!', conceptId: 'evs:sailboat', art: { kind: 'custom-svg', id: 'sailboat' } },
  { id: 'bus', label: 'Bus', spokenLabel: 'Bus!', conceptId: 'word:bus', art: { kind: 'word-art', id: 'bus' } },
  { id: 'car', label: 'Car', spokenLabel: 'Car!', conceptId: 'word:car', art: { kind: 'word-art', id: 'car' } },
  { id: 'truck', label: 'Truck', spokenLabel: 'Truck!', conceptId: 'word:truck', art: { kind: 'word-art', id: 'truck' } },
  { id: 'van', label: 'Van', spokenLabel: 'Van!', conceptId: 'word:van', art: { kind: 'word-art', id: 'van' } },
  { id: 'firetruck', label: 'Firetruck', spokenLabel: 'Firetruck!', conceptId: 'word:firetruck', art: { kind: 'word-art', id: 'firetruck' } },
  { id: 'tractor', label: 'Tractor', spokenLabel: 'Tractor!', conceptId: 'evs:tractor', art: { kind: 'custom-svg', id: 'tractor' } },
];

const ITEM_MAP = new Map<CircleSortItemId, CircleSortItemSpec>(
  CIRCLE_SORT_ITEMS.map((item) => [item.id, item]),
);

const VALID_ITEM_ID_SET = new Set<string>(CIRCLE_SORT_ITEMS.map((item) => item.id));

export function isValidCircleSortItemId(value: unknown): value is CircleSortItemId {
  return typeof value === 'string' && VALID_ITEM_ID_SET.has(value);
}

export function getCircleSortItemSpec(id: CircleSortItemId): CircleSortItemSpec {
  return ITEM_MAP.get(id) ?? CIRCLE_SORT_ITEMS[0];
}

function makeDistractors(
  ids: readonly CircleSortItemId[],
  prefix: string,
  pillSuffix: string,
  buildSentence: (nameLower: string, item: CircleSortItemSpec) => string,
): CircleSortDistractorSpec[] {
  return ids.map((id) => {
    const spec = getCircleSortItemSpec(id);
    const shortName =
      spec.id === 'fries'
        ? 'Fries'
        : spec.id === 'chips'
          ? 'Chips'
          : spec.id === 'sweet-corn'
            ? 'Corn'
            : spec.id === 'green-peas'
              ? 'Peas'
              : spec.label;
    return {
      itemId: id,
      pillLabel: `${shortName} → ${pillSuffix}`,
      mistakeAudioKey: `${prefix}-${id}`,
      mistakeSpokenText: buildSentence(spec.label.toLowerCase(), spec),
    };
  });
}

const CARNIVORE_IDS: readonly CircleSortItemId[] = [
  'lion',
  'tiger',
  'shark',
  'alligator',
  'eagle',
  'owl',
  'fox',
];

const HERBIVORE_IDS: readonly CircleSortItemId[] = [
  'cow',
  'goat',
  'donkey',
  'camel',
  'elephant',
  'giraffe',
  'zebra',
  'rabbit',
  'horse',
  'deer',
];

const WILD_ANIMAL_IDS: readonly CircleSortItemId[] = [
  'lion',
  'tiger',
  'elephant',
  'giraffe',
  'zebra',
  'monkey',
  'alligator',
  'fox',
];

const FARM_PET_IDS: readonly CircleSortItemId[] = [
  'cow',
  'dog',
  'cat',
  'hen',
  'goat',
  'duck',
  'pig',
  'horse',
];

const WATER_ANIMAL_IDS: readonly CircleSortItemId[] = [
  'shark',
  'dolphin',
  'whale',
  'octopus',
  'fish',
  'jellyfish',
];

const PURE_LAND_ANIMAL_IDS: readonly CircleSortItemId[] = [
  'lion',
  'cow',
  'elephant',
  'giraffe',
  'monkey',
  'rabbit',
  'horse',
  'camel',
  'deer',
];

const FRUIT_IDS: readonly CircleSortItemId[] = [
  'apple',
  'banana',
  'mango',
  'strawberry',
  'orange',
  'watermelon',
  'pineapple',
  'grapes',
  'pear',
  'peach',
  'cherries',
];

const UNAMBIGUOUS_VEG_DISTRACTOR_IDS: readonly CircleSortItemId[] = [
  'carrot',
  'broccoli',
  'potato',
  'onion',
  'cabbage',
  'cauliflower',
  'radish',
  'mushroom',
];

const VEGETABLE_TARGET_IDS: readonly CircleSortItemId[] = [
  'carrot',
  'broccoli',
  'potato',
  'onion',
  'cabbage',
  'cauliflower',
  'green-peas',
  'radish',
  'sweet-corn',
  'pumpkin',
];

const FRUIT_DISTRACTOR_IDS: readonly CircleSortItemId[] = [
  'apple',
  'banana',
  'mango',
  'strawberry',
  'orange',
  'watermelon',
  'pineapple',
  'grapes',
  'pear',
  'peach',
];

const HEALTHY_FOOD_IDS: readonly CircleSortItemId[] = [
  'apple',
  'banana',
  'broccoli',
  'carrot',
  'milk',
  'egg',
  'yogurt',
  'pear',
  'sweet-corn',
  'watermelon',
];

const JUNK_TREAT_IDS: readonly CircleSortItemId[] = [
  'burger',
  'fries',
  'soda',
  'candy',
  'donut',
  'pizza',
  'cake',
  'ice-cream',
  'chips',
];

const SKY_FLIER_IDS: readonly CircleSortItemId[] = [
  'airplane',
  'helicopter',
  'jet',
  'rocket',
  'eagle',
  'owl',
  'bee',
];

const WATER_TRANSPORT_IDS: readonly CircleSortItemId[] = [
  'boat',
  'yacht',
  'submarine',
  'ship',
  'sailboat',
];

const ROAD_VEHICLE_IDS: readonly CircleSortItemId[] = [
  'bus',
  'car',
  'truck',
  'van',
  'firetruck',
  'tractor',
];

export const CIRCLE_SORT_QUESTS: readonly CircleSortQuestSpec[] = [
  {
    id: 'carnivores',
    packId: 'animal-world',
    title: 'Carnivores',
    shortBadge: 'Meat-Eaters',
    promptSubHint: 'Animals that eat meat',
    buildHeadline: (n) => `Circle all ${n} Carnivores!`,
    buildSpokenPrompt: (n) => `Circle all ${n} carnivores! Animals that eat meat.`,
    targets: CARNIVORE_IDS,
    distractors: makeDistractors(
      HERBIVORE_IDS,
      'not-carnivore',
      'Eats Plants',
      (name) => `No, ${name} eats plants, it is not a carnivore.`,
    ),
  },
  {
    id: 'herbivores',
    packId: 'animal-world',
    title: 'Herbivores',
    shortBadge: 'Plant-Eaters',
    promptSubHint: 'Animals that eat plants & grass',
    buildHeadline: (n) => `Circle all ${n} Herbivores!`,
    buildSpokenPrompt: (n) => `Circle all ${n} herbivores! Animals that eat plants.`,
    targets: HERBIVORE_IDS,
    distractors: makeDistractors(
      CARNIVORE_IDS,
      'not-herbivore',
      'Eats Meat',
      (name) => `No, ${name} eats meat, it is not a plant-eater.`,
    ),
  },
  {
    id: 'wild-animals',
    packId: 'animal-world',
    title: 'Wild Jungle Animals',
    shortBadge: 'Wild Animals',
    promptSubHint: 'Animals that live out in the wild',
    buildHeadline: (n) => `Circle all ${n} Wild Animals!`,
    buildSpokenPrompt: (n) => `Circle all ${n} wild jungle animals!`,
    targets: WILD_ANIMAL_IDS,
    distractors: FARM_PET_IDS.map((id) => {
      const spec = getCircleSortItemSpec(id);
      const isPet = id === 'dog' || id === 'cat';
      return {
        itemId: id,
        pillLabel: `${spec.label} → ${isPet ? 'Pet Animal' : 'Farm Animal'}`,
        mistakeAudioKey: `not-wild-${id}`,
        mistakeSpokenText: isPet
          ? `No, ${spec.label.toLowerCase()} is a pet animal, not a wild jungle animal.`
          : `No, ${spec.label.toLowerCase()} is a farm animal, not a wild jungle animal.`,
      };
    }),
  },
  {
    id: 'farm-pets',
    packId: 'animal-world',
    title: 'Farm & Pet Animals',
    shortBadge: 'Farm & Pets',
    promptSubHint: 'Friendly animals on farms & at home',
    buildHeadline: (n) => `Circle all ${n} Farm & Pet Animals!`,
    buildSpokenPrompt: (n) => `Circle all ${n} farm and pet animals!`,
    targets: FARM_PET_IDS,
    distractors: makeDistractors(
      WILD_ANIMAL_IDS,
      'not-farm',
      'Wild Animal',
      (name) => `No, ${name} is a wild animal, not a farm or pet animal.`,
    ),
  },
  {
    id: 'water-animals',
    packId: 'animal-world',
    title: 'Water Animals',
    shortBadge: 'Ocean & Sea',
    promptSubHint: 'Animals that swim & live in water',
    buildHeadline: (n) => `Circle all ${n} Water Animals!`,
    buildSpokenPrompt: (n) => `Circle all ${n} water animals!`,
    targets: WATER_ANIMAL_IDS,
    distractors: makeDistractors(
      PURE_LAND_ANIMAL_IDS,
      'not-water-animal',
      'Lives on Land',
      (name) => `No, ${name} lives on land, not in the water.`,
    ),
  },
  {
    id: 'fruits',
    packId: 'orchard-garden',
    title: 'Fruits',
    shortBadge: 'Orchard Fruits',
    promptSubHint: 'Sweet & juicy fruits from trees & vines',
    buildHeadline: (n) => `Circle all ${n} Fruits!`,
    buildSpokenPrompt: (n) => `Circle all ${n} fruits!`,
    targets: FRUIT_IDS,
    distractors: makeDistractors(
      UNAMBIGUOUS_VEG_DISTRACTOR_IDS,
      'not-fruit',
      'Vegetable',
      (name) => `No, ${name} is a vegetable, not a fruit.`,
    ),
  },
  {
    id: 'vegetables',
    packId: 'orchard-garden',
    title: 'Vegetables',
    shortBadge: 'Garden Veggies',
    promptSubHint: 'Crunchy & leafy garden vegetables',
    buildHeadline: (n) => `Circle all ${n} Vegetables!`,
    buildSpokenPrompt: (n) => `Circle all ${n} vegetables!`,
    targets: VEGETABLE_TARGET_IDS,
    distractors: makeDistractors(
      FRUIT_DISTRACTOR_IDS,
      'not-veg',
      'Fruit',
      (name) => `No, ${name === 'grapes' || name === 'cherries' ? name + ' are' : name + ' is'} a fruit, not a vegetable.`,
    ),
  },
  {
    id: 'healthy-food',
    packId: 'healthy-plate',
    title: 'Healthy Foods',
    shortBadge: 'Grow Strong',
    promptSubHint: 'Everyday foods that help your body grow strong',
    buildHeadline: (n) => `Circle all ${n} Healthy Foods!`,
    buildSpokenPrompt: (n) => `Circle all ${n} healthy foods!`,
    targets: HEALTHY_FOOD_IDS,
    distractors: JUNK_TREAT_IDS.map((id) => {
      const spec = getCircleSortItemSpec(id);
      if (id === 'fries') {
        return {
          itemId: id,
          pillLabel: 'Fries → Junk Food',
          mistakeAudioKey: 'not-healthy-fries',
          mistakeSpokenText: 'No, French fries are junk food, not a healthy food.',
        };
      }
      if (id === 'chips') {
        return {
          itemId: id,
          pillLabel: 'Chips → Junk Food',
          mistakeAudioKey: 'not-healthy-chips',
          mistakeSpokenText: 'No, potato chips are junk food, not a healthy food.',
        };
      }
      if (id === 'soda') {
        return {
          itemId: id,
          pillLabel: 'Soda → Sugary Drink',
          mistakeAudioKey: 'not-healthy-soda',
          mistakeSpokenText: 'No, soda has too much sugar, it is not a healthy food.',
        };
      }
      const isSweet = id === 'candy' || id === 'donut' || id === 'cake' || id === 'ice-cream';
      return {
        itemId: id,
        pillLabel: `${spec.label} → ${isSweet ? 'Sweet Treat' : 'Junk Food'}`,
        mistakeAudioKey: `not-healthy-${id}`,
        mistakeSpokenText: isSweet
          ? `No, ${spec.label.toLowerCase()} is a sugary treat, not a healthy food.`
          : `No, ${spec.label.toLowerCase()} is junk food, not a healthy food.`,
      };
    }),
  },
  {
    id: 'treat-food',
    packId: 'healthy-plate',
    title: 'Junk & Treat Foods',
    shortBadge: 'Sometimes Treats',
    promptSubHint: 'Sugary or fried treats we eat only sometimes',
    buildHeadline: (n) => `Circle all ${n} Junk Foods!`,
    buildSpokenPrompt: (n) => `Circle all ${n} junk foods!`,
    targets: JUNK_TREAT_IDS,
    distractors: makeDistractors(
      HEALTHY_FOOD_IDS,
      'not-junk',
      'Healthy Food',
      (name) =>
        name === 'sweet corn'
          ? 'No, sweet corn is a healthy food, not junk food.'
          : `No, ${name} is a healthy food, not junk food.`,
    ),
  },
  {
    id: 'sky-fliers',
    packId: 'on-the-move',
    title: 'Things in the Sky',
    shortBadge: 'Sky Fliers',
    promptSubHint: 'Planes, rockets & birds that fly high up',
    buildHeadline: (n) => `Circle all ${n} Sky Fliers!`,
    buildSpokenPrompt: (n) => `Circle all ${n} things that go in the sky!`,
    targets: SKY_FLIER_IDS,
    distractors: [
      ...makeDistractors(
        ['car', 'bus', 'truck', 'van', 'firetruck'],
        'not-sky',
        'Drives on Roads',
        (name) => `No, ${name} drives on roads, not in the sky.`,
      ),
      ...makeDistractors(
        ['boat', 'yacht', 'submarine'],
        'not-sky',
        'Goes in Water',
        (name) => `No, ${name} goes in the water, not in the sky.`,
      ),
    ],
  },
  {
    id: 'water-transport',
    packId: 'on-the-move',
    title: 'Water Transport',
    shortBadge: 'Boats & Sea',
    promptSubHint: 'Boats, ships & submarines that travel on water',
    buildHeadline: (n) => `Circle all ${n} Water Vehicles!`,
    buildSpokenPrompt: (n) => `Circle all ${n} water vehicles!`,
    targets: WATER_TRANSPORT_IDS,
    distractors: makeDistractors(
      ROAD_VEHICLE_IDS,
      'not-water-trans',
      'Road Vehicle',
      (name) => `No, ${name} drives on roads, not in the water.`,
    ),
  },
  {
    id: 'road-vehicles',
    packId: 'on-the-move',
    title: 'Road Vehicles',
    shortBadge: 'Wheels on Roads',
    promptSubHint: 'Cars, buses & trucks that roll on roads',
    buildHeadline: (n) => `Circle all ${n} Road Vehicles!`,
    buildSpokenPrompt: (n) => `Circle all ${n} road vehicles!`,
    targets: ROAD_VEHICLE_IDS,
    distractors: [
      ...makeDistractors(
        ['airplane', 'helicopter', 'jet', 'rocket'],
        'not-road',
        'Flies in Sky',
        (name) => `No, ${name} flies in the sky, not on roads.`,
      ),
      ...makeDistractors(
        ['boat', 'yacht', 'submarine', 'ship'],
        'not-road',
        'Goes in Water',
        (name) => `No, ${name} goes in the water, not on roads.`,
      ),
    ],
  },
];

const QUEST_MAP = new Map<CircleSortQuestId, CircleSortQuestSpec>(
  CIRCLE_SORT_QUESTS.map((q) => [q.id, q]),
);

const VALID_QUEST_ID_SET = new Set<string>(CIRCLE_SORT_QUESTS.map((q) => q.id));

export function isValidCircleSortQuestId(value: unknown): value is CircleSortQuestId {
  return typeof value === 'string' && VALID_QUEST_ID_SET.has(value);
}

export function getCircleSortQuestSpec(id: CircleSortQuestId): CircleSortQuestSpec {
  return QUEST_MAP.get(id) ?? CIRCLE_SORT_QUESTS[0];
}

export const CIRCLE_SORT_PACKS: readonly CircleSortPackSpec[] = [
  {
    id: 'mix',
    title: 'All K1 Quests',
    subtitle: 'Carnivores, fruits & veggies, healthy plates, and sky & road sorting!',
    badge: '12 Quests • Mix',
    previewItemId: 'lion',
    questIds: CIRCLE_SORT_QUESTS.map((q) => q.id),
  },
  {
    id: 'animal-world',
    title: 'Animal Diets & Homes',
    subtitle: 'Circle the Carnivores, Herbivores, Wild Jungle, Farm & Water animals!',
    badge: 'EVS • Animals',
    previewItemId: 'tiger',
    questIds: ['carnivores', 'herbivores', 'wild-animals', 'farm-pets', 'water-animals'],
  },
  {
    id: 'orchard-garden',
    title: 'Fruits vs. Vegetables',
    subtitle: 'Sort sweet orchard fruits from crunchy garden vegetables!',
    badge: 'EVS • Harvest',
    previewItemId: 'apple',
    questIds: ['fruits', 'vegetables'],
  },
  {
    id: 'healthy-plate',
    title: 'Healthy vs. Junk Food',
    subtitle: 'Spot everyday grow-strong foods vs. sugary & fried sometimes treats!',
    badge: 'EVS • Nutrition',
    previewItemId: 'broccoli',
    questIds: ['healthy-food', 'treat-food'],
  },
  {
    id: 'on-the-move',
    title: 'Transport & Sky',
    subtitle: 'Sort sky fliers, water boats & ships, and wheeled road vehicles!',
    badge: 'EVS • Vehicles',
    previewItemId: 'airplane',
    questIds: ['sky-fliers', 'water-transport', 'road-vehicles'],
  },
];

const PACK_MAP = new Map<CircleSortPackId, CircleSortPackSpec>(
  CIRCLE_SORT_PACKS.map((p) => [p.id, p]),
);

export function isValidCircleSortPackId(value: unknown): value is CircleSortPackId {
  return typeof value === 'string' && PACK_MAP.has(value as CircleSortPackId);
}

export function getCircleSortPackSpec(id: CircleSortPackId): CircleSortPackSpec {
  return PACK_MAP.get(id) ?? CIRCLE_SORT_PACKS[0];
}

export function getDefaultCircleSortConfig(): CircleSortConfig {
  return {
    packId: 'mix',
    gridMode: '3x3',
    roundLength: 3,
  };
}

export function isValidCircleSortConfig(value: unknown): value is CircleSortConfig {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<CircleSortConfig>;
  const validPack = isValidCircleSortPackId(c.packId);
  const validGrid = c.gridMode === '3x3' || c.gridMode === '2x3';
  const validLen = c.roundLength === 1 || c.roundLength === 3 || c.roundLength === 5;
  return validPack && validGrid && validLen;
}

function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildPageForQuest(
  questId: CircleSortQuestId,
  gridMode: CircleSortGridMode,
  pageIndex: number,
): CircleSortPageSpec {
  const quest = getCircleSortQuestSpec(questId);
  const cols = 3;
  const rows = gridMode === '2x3' ? 2 : 3;
  const totalSlots = cols * rows;

  let targetCount = 3;
  if (gridMode === '3x3') {
    const possibleCounts: number[] = [4, 4, 3];
    if (quest.targets.length >= 6 && quest.distractors.length >= 5) {
      possibleCounts.push(5);
    }
    targetCount = possibleCounts[Math.floor(Math.random() * possibleCounts.length)];
    targetCount = Math.min(targetCount, quest.targets.length, totalSlots - 3);
  }
  const distractorCount = totalSlots - targetCount;

  const chosenTargets = shuffleArray(quest.targets).slice(0, targetCount);
  const chosenDistractors = shuffleArray(quest.distractors).slice(0, distractorCount);

  const rawCards: Omit<CircleSortCardSlot, 'slotIndex'>[] = [
    ...chosenTargets.map((itemId) => ({
      itemId,
      label: getCircleSortItemSpec(itemId).label,
      isTarget: true,
    })),
    ...chosenDistractors.map((d) => ({
      itemId: d.itemId,
      label: getCircleSortItemSpec(d.itemId).label,
      isTarget: false,
      pillLabel: d.pillLabel,
      mistakeAudioKey: d.mistakeAudioKey,
      mistakeSpokenText: d.mistakeSpokenText,
    })),
  ];

  const shuffled = shuffleArray(rawCards).map((card, slotIndex) => ({
    ...card,
    slotIndex,
  }));

  return {
    pageUid: `${questId}-${pageIndex}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    questId,
    cols,
    rows,
    targetCount,
    slots: shuffled,
  };
}

export function buildCircleSortDeck(config: CircleSortConfig): CircleSortPageSpec[] {
  const pack = getCircleSortPackSpec(config.packId);
  const pool = pack.questIds;
  const chosenQuests: CircleSortQuestId[] = [];

  if (config.packId === 'animal-world') {
    // Lead with the signature K1 Carnivores quest, then shuffle the remaining animal quests
    const others = shuffleArray(pool.filter((q) => q !== 'carnivores'));
    const ordered = ['carnivores' as const, ...others];
    for (let i = 0; i < config.roundLength; i += 1) {
      chosenQuests.push(ordered[i % ordered.length]);
    }
  } else {
    let bag = shuffleArray(pool);
    for (let i = 0; i < config.roundLength; i += 1) {
      if (bag.length === 0) {
        bag = shuffleArray(pool);
        if (chosenQuests.length > 0 && bag[0] === chosenQuests[chosenQuests.length - 1] && bag.length > 1) {
          [bag[0], bag[1]] = [bag[1], bag[0]];
        }
      }
      chosenQuests.push(bag.shift()!);
    }
  }

  return chosenQuests.map((questId, idx) => buildPageForQuest(questId, config.gridMode, idx));
}

export function loadCircleSortMastery(): CircleSortMasteryState {
  const empty: CircleSortMasteryState = {
    version: 1,
    questWins: {},
    flawlessQuests: [],
  };
  if (typeof window === 'undefined') return empty;
  try {
    const raw = window.localStorage.getItem(CIRCLE_SORT_MASTERY_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<CircleSortMasteryState>;
    if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) return empty;

    const questWins: Partial<Record<CircleSortQuestId, number>> = {};
    if (parsed.questWins && typeof parsed.questWins === 'object') {
      for (const [k, v] of Object.entries(parsed.questWins)) {
        if (isValidCircleSortQuestId(k) && typeof v === 'number' && Number.isFinite(v) && v > 0) {
          questWins[k] = Math.min(9999, Math.floor(v));
        }
      }
    }

    const flawlessSet = new Set<CircleSortQuestId>();
    if (Array.isArray(parsed.flawlessQuests)) {
      for (const q of parsed.flawlessQuests) {
        if (isValidCircleSortQuestId(q)) {
          flawlessSet.add(q);
        }
      }
    }

    return {
      version: 1,
      questWins,
      flawlessQuests: Array.from(flawlessSet),
    };
  } catch {
    return empty;
  }
}

export function recordCircleSortQuestMastery(
  questId: CircleSortQuestId,
  wasFlawless: boolean,
): CircleSortMasteryState {
  const state = loadCircleSortMastery();
  const prevWins = state.questWins[questId] ?? 0;
  const nextWins = Math.min(9999, prevWins + 1);
  const flawlessSet = new Set<CircleSortQuestId>(state.flawlessQuests);
  if (wasFlawless) {
    flawlessSet.add(questId);
  }
  const next: CircleSortMasteryState = {
    version: 1,
    questWins: {
      ...state.questWins,
      [questId]: nextWins,
    },
    flawlessQuests: Array.from(flawlessSet),
  };
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CIRCLE_SORT_MASTERY_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

export function getPackMasteryProgress(
  packId: CircleSortPackId,
  mastery: CircleSortMasteryState,
): { mastered: number; total: number } {
  const pack = getCircleSortPackSpec(packId);
  let mastered = 0;
  for (const qId of pack.questIds) {
    if ((mastery.questWins[qId] ?? 0) > 0) {
      mastered += 1;
    }
  }
  return { mastered, total: pack.questIds.length };
}
