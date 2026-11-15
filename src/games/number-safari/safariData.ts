import { assetUrl } from '../../utils/assets';

export type SafariModeId = 'count-5' | 'count-10' | 'add-10';
export type SafariLengthId = '4-stops' | '8-stops' | '6-stops' | '12-stops';

export interface SafariAnimalSpec {
  id: string;
  singular: string;
  plural: string;
  imagePath: string;
}

export interface SafariModeSpec {
  id: SafariModeId;
  title: string;
  rangeBadge: string;
  subtitle: string;
  ageHint: string;
  maxNumber: 5 | 10;
  previewPaths: [string, string];
  isDefault?: boolean;
}

export interface SafariLengthSpec {
  id: SafariLengthId;
  label: string;
  description: string;
  stops: number;
  isDefault?: boolean;
}

export interface SafariAnimalInstance {
  uid: string;
  label: string;
  imageSrc: string;
  groupIndex: 0 | 1;
}

export interface SafariStop {
  uid: string;
  stopNumber: number;
  kind: 'count' | 'addition';
  answer: number;
  promptText: string;
  celebrationDetail: string;
  primaryAnimalLabel: string;
  secondaryAnimalLabel?: string;
  leftCount: number;
  rightCount: number;
  animals: SafariAnimalInstance[];
}

export const DEFAULT_SAFARI_MODE_ID: SafariModeId = 'count-10';
export const DEFAULT_SAFARI_LENGTH_ID: SafariLengthId = '8-stops';

export const SAFARI_MODES: readonly SafariModeSpec[] = [
  {
    id: 'count-5',
    title: 'Meadow Count',
    rangeBadge: '1 – 5',
    subtitle: 'Gentle counting 1 to 5',
    ageHint: 'Ages 3–4',
    maxNumber: 5,
    previewPaths: ['themes/lion-king/01-simba.png', 'themes/lion-king/08-baby-elephant.png'],
  },
  {
    id: 'count-10',
    title: 'Savanna Trail',
    rangeBadge: '1 – 10',
    subtitle: '5-frame counting to 10',
    ageHint: 'Ages 4–6',
    maxNumber: 10,
    previewPaths: ['themes/lion-king/10-giraffe.png', 'themes/lion-king/11-zebra.png'],
    isDefault: true,
  },
  {
    id: 'add-10',
    title: 'Safari Sums',
    rangeBadge: 'Add to 10',
    subtitle: 'Join two animal groups',
    ageHint: 'Ages 5–7',
    maxNumber: 10,
    previewPaths: ['themes/lion-king/09-cheetah.png', 'themes/lion-king/13-hippo.png'],
  },
];

export const SAFARI_LENGTHS: readonly SafariLengthSpec[] = [
  {
    id: '8-stops',
    label: '8 Stops',
    description: 'Balanced trail • 8 points',
    stops: 8,
    isDefault: true,
  },
  {
    id: '6-stops',
    label: '6 Stops',
    description: 'Quick safari • 6 points',
    stops: 6,
  },
  {
    id: '12-stops',
    label: '12 Stops',
    description: 'Grand tour • 12 points',
    stops: 12,
  },
  {
    id: '4-stops',
    label: '4 Stops',
    description: 'Mini safari • 4 points',
    stops: 4,
  },
];

export const SAFARI_ANIMALS: readonly SafariAnimalSpec[] = [
  {
    id: 'lion-cub',
    singular: 'Lion Cub',
    plural: 'Lion Cubs',
    imagePath: 'themes/lion-king/01-simba.png',
  },
  {
    id: 'elephant',
    singular: 'Baby Elephant',
    plural: 'Baby Elephants',
    imagePath: 'themes/lion-king/08-baby-elephant.png',
  },
  {
    id: 'giraffe',
    singular: 'Giraffe',
    plural: 'Giraffes',
    imagePath: 'themes/lion-king/10-giraffe.png',
  },
  {
    id: 'zebra',
    singular: 'Zebra',
    plural: 'Zebras',
    imagePath: 'themes/lion-king/11-zebra.png',
  },
  {
    id: 'cheetah',
    singular: 'Cheetah',
    plural: 'Cheetahs',
    imagePath: 'themes/lion-king/09-cheetah.png',
  },
  {
    id: 'hippo',
    singular: 'Hippo',
    plural: 'Hippos',
    imagePath: 'themes/lion-king/13-hippo.png',
  },
  {
    id: 'rhino',
    singular: 'Rhino',
    plural: 'Rhinos',
    imagePath: 'themes/lion-king/14-rhino.png',
  },
  {
    id: 'crane',
    singular: 'Crowned Crane',
    plural: 'Crowned Cranes',
    imagePath: 'themes/lion-king/15-crane.png',
  },
  {
    id: 'chameleon',
    singular: 'Chameleon',
    plural: 'Chameleons',
    imagePath: 'themes/lion-king/16-chameleon.png',
  },
  {
    id: 'meerkat',
    singular: 'Meerkat',
    plural: 'Meerkats',
    imagePath: 'themes/lion-king/04-timon.png',
  },
  {
    id: 'warthog',
    singular: 'Warthog',
    plural: 'Warthogs',
    imagePath: 'themes/lion-king/05-pumbaa.png',
  },
  {
    id: 'hornbill',
    singular: 'Hornbill',
    plural: 'Hornbills',
    imagePath: 'themes/lion-king/07-zazu.png',
  },
];

export function isValidSafariModeId(value: unknown): value is SafariModeId {
  return value === 'count-5' || value === 'count-10' || value === 'add-10';
}

export function isValidSafariLengthId(value: unknown): value is SafariLengthId {
  return value === '4-stops' || value === '8-stops' || value === '6-stops' || value === '12-stops';
}

export function getSafariModeSpec(modeId: SafariModeId): SafariModeSpec {
  return SAFARI_MODES.find((m) => m.id === modeId) ?? SAFARI_MODES[1];
}

export function getSafariLengthSpec(lengthId: SafariLengthId): SafariLengthSpec {
  return SAFARI_LENGTHS.find((l) => l.id === lengthId) ?? SAFARI_LENGTHS[0];
}

function getRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 1) return 0;
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return arr[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

function shuffleList<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = getRandomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildTargetNumbers(modeId: SafariModeId, totalStops: number): number[] {
  const minVal = modeId === 'add-10' ? 2 : 1;
  const maxVal = modeId === 'count-5' ? 5 : 10;

  const pool: number[] = [];
  for (let n = minVal; n <= maxVal; n += 1) {
    pool.push(n);
  }

  const sequence: number[] = [];
  while (sequence.length < totalStops) {
    const batch = shuffleList(pool);
    // Avoid back-to-back duplicate target answers across batch boundaries
    if (sequence.length > 0 && batch.length > 1 && batch[0] === sequence[sequence.length - 1]) {
      [batch[0], batch[1]] = [batch[1], batch[0]];
    }
    sequence.push(...batch);
  }

  return sequence.slice(0, totalStops);
}

export function buildSafariTrail(
  modeId: SafariModeId,
  lengthId: SafariLengthId,
): SafariStop[] {
  const lengthSpec = getSafariLengthSpec(lengthId);
  const targets = buildTargetNumbers(modeId, lengthSpec.stops);
  const shuffledAnimals = shuffleList(SAFARI_ANIMALS);

  return targets.map((answer, index) => {
    const stopNumber = index + 1;
    const primaryAnimal = shuffledAnimals[index % shuffledAnimals.length];

    if (modeId === 'add-10') {
      const secondaryAnimal =
        shuffledAnimals[(index + 5) % shuffledAnimals.length].id === primaryAnimal.id
          ? shuffledAnimals[(index + 1) % shuffledAnimals.length]
          : shuffledAnimals[(index + 5) % shuffledAnimals.length];

      // Keep each group between 1 and 5 so both savanna pods stay clean and subitizable
      const minLeft = Math.max(1, answer - 5);
      const maxLeft = Math.min(5, answer - 1);
      const leftCount = minLeft + getRandomInt(maxLeft - minLeft + 1);
      const rightCount = answer - leftCount;

      const leftSrc = assetUrl(primaryAnimal.imagePath);
      const rightSrc = assetUrl(secondaryAnimal.imagePath);

      const animals: SafariAnimalInstance[] = [];
      for (let i = 0; i < leftCount; i += 1) {
        animals.push({
          uid: `stop-${stopNumber}-a-${i}`,
          label: primaryAnimal.singular,
          imageSrc: leftSrc,
          groupIndex: 0,
        });
      }
      for (let i = 0; i < rightCount; i += 1) {
        animals.push({
          uid: `stop-${stopNumber}-b-${i}`,
          label: secondaryAnimal.singular,
          imageSrc: rightSrc,
          groupIndex: 1,
        });
      }

      const leftLabel = leftCount === 1 ? primaryAnimal.singular : primaryAnimal.plural;
      const rightLabel = rightCount === 1 ? secondaryAnimal.singular : secondaryAnimal.plural;

      return {
        uid: `safari-stop-${stopNumber}`,
        stopNumber,
        kind: 'addition',
        answer,
        promptText: 'How many safari friends altogether?',
        celebrationDetail: `${leftCount} + ${rightCount} = ${answer} Safari Friends!`,
        primaryAnimalLabel: leftLabel,
        secondaryAnimalLabel: rightLabel,
        leftCount,
        rightCount,
        animals,
      };
    }

    const src = assetUrl(primaryAnimal.imagePath);
    const animals: SafariAnimalInstance[] = [];
    for (let i = 0; i < answer; i += 1) {
      animals.push({
        uid: `stop-${stopNumber}-c-${i}`,
        label: primaryAnimal.singular,
        imageSrc: src,
        groupIndex: 0,
      });
    }

    const countLabel = answer === 1 ? primaryAnimal.singular : primaryAnimal.plural;

    return {
      uid: `safari-stop-${stopNumber}`,
      stopNumber,
      kind: 'count',
      answer,
      promptText: `How many ${primaryAnimal.plural} do you spot?`,
      celebrationDetail: `${answer} ${countLabel}!`,
      primaryAnimalLabel: countLabel,
      leftCount: answer,
      rightCount: 0,
      animals,
    };
  });
}
