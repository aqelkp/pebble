#!/usr/bin/env node
/**
 * Circle & Sort Offline Audio Generator (Kokoro-82M af_heart + LameJS MP3)
 *
 * Generates compact mono MP3 clips into:
 *   - public/audio/circle-sort/items/<itemId>.mp3          ("Lion!", "Broccoli!")
 *   - public/audio/circle-sort/prompts/<questId>-<n>.mp3   ("Circle all 4 carnivores! Animals that eat meat.")
 *   - public/audio/circle-sort/mistakes/<key>.mp3          ("No, cow eats plants, it is not a carnivore.")
 *   - public/audio/circle-sort/cheers/<cheerId>.mp3        ("Bravo! You circled every right picture with zero mistakes!")
 *
 * Existing valid files are skipped unless --force is passed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const outBaseDir = path.join(repoRoot, 'public', 'audio', 'circle-sort');
const itemsOutDir = path.join(outBaseDir, 'items');
const promptsOutDir = path.join(outBaseDir, 'prompts');
const mistakesOutDir = path.join(outBaseDir, 'mistakes');
const cheersOutDir = path.join(outBaseDir, 'cheers');

const forceRegen = process.argv.includes('--force');
const require = createRequire(import.meta.url);

const MIN_DURATION_MS = 220;
const MIN_FILE_BYTES = 1200;
const SAFE_CLIP_ID = /^[a-z0-9-]+$/;

function safeOutFile(dirPath, clipId) {
  const cleanId = path.basename(String(clipId));
  if (!SAFE_CLIP_ID.test(cleanId)) {
    throw new Error(`Invalid audio clip ID: ${clipId}`);
  }
  const resolvedDir = path.resolve(dirPath);
  const resolvedOut = path.resolve(resolvedDir, `${cleanId}.mp3`);
  if (!resolvedOut.startsWith(resolvedDir + path.sep)) {
    throw new Error(`Path boundary check failed for ${clipId}`);
  }
  return resolvedOut;
}

const ITEMS = [
  // Fruits (11)
  { id: 'apple', label: 'Apple', spoken: 'Apple!' },
  { id: 'banana', label: 'Banana', spoken: 'Banana!' },
  { id: 'mango', label: 'Mango', spoken: 'Mango!' },
  { id: 'strawberry', label: 'Strawberry', spoken: 'Strawberry!' },
  { id: 'orange', label: 'Orange', spoken: 'Orange!' },
  { id: 'watermelon', label: 'Watermelon', spoken: 'Watermelon!' },
  { id: 'pineapple', label: 'Pineapple', spoken: 'Pineapple!' },
  { id: 'grapes', label: 'Grapes', spoken: 'Grapes!' },
  { id: 'cherries', label: 'Cherries', spoken: 'Cherries!' },
  { id: 'pear', label: 'Pear', spoken: 'Pear!' },
  { id: 'peach', label: 'Peach', spoken: 'Peach!' },
  // Vegetables (11)
  { id: 'carrot', label: 'Carrot', spoken: 'Carrot!' },
  { id: 'broccoli', label: 'Broccoli', spoken: 'Broccoli!' },
  { id: 'sweet-corn', label: 'Sweet Corn', spoken: 'Sweet corn!' },
  { id: 'green-peas', label: 'Green Peas', spoken: 'Green peas!' },
  { id: 'pumpkin', label: 'Pumpkin', spoken: 'Pumpkin!' },
  { id: 'potato', label: 'Potato', spoken: 'Potato!' },
  { id: 'onion', label: 'Onion', spoken: 'Onion!' },
  { id: 'cauliflower', label: 'Cauliflower', spoken: 'Cauliflower!' },
  { id: 'radish', label: 'Radish', spoken: 'Radish!' },
  { id: 'mushroom', label: 'Mushroom', spoken: 'Mushroom!' },
  { id: 'cabbage', label: 'Cabbage', spoken: 'Cabbage!' },
  // Healthy staples (3)
  { id: 'milk', label: 'Milk', spoken: 'Milk!' },
  { id: 'egg', label: 'Egg', spoken: 'Egg!' },
  { id: 'yogurt', label: 'Yogurt', spoken: 'Yogurt!' },
  // Junk / Treat Foods (9)
  { id: 'burger', label: 'Burger', spoken: 'Burger!' },
  { id: 'fries', label: 'French Fries', spoken: 'French fries!' },
  { id: 'soda', label: 'Soda', spoken: 'Soda!' },
  { id: 'candy', label: 'Candy', spoken: 'Candy!' },
  { id: 'donut', label: 'Donut', spoken: 'Donut!' },
  { id: 'pizza', label: 'Pizza', spoken: 'Pizza!' },
  { id: 'cake', label: 'Cake', spoken: 'Cake!' },
  { id: 'ice-cream', label: 'Ice Cream', spoken: 'Ice cream!' },
  { id: 'chips', label: 'Potato Chips', spoken: 'Potato chips!' },
  // Animals (28)
  { id: 'lion', label: 'Lion', spoken: 'Lion!' },
  { id: 'tiger', label: 'Tiger', spoken: 'Tiger!' },
  { id: 'shark', label: 'Shark', spoken: 'Shark!' },
  { id: 'alligator', label: 'Alligator', spoken: 'Alligator!' },
  { id: 'eagle', label: 'Eagle', spoken: 'Eagle!' },
  { id: 'owl', label: 'Owl', spoken: 'Owl!' },
  { id: 'fox', label: 'Fox', spoken: 'Fox!' },
  { id: 'cow', label: 'Cow', spoken: 'Cow!' },
  { id: 'goat', label: 'Goat', spoken: 'Goat!' },
  { id: 'donkey', label: 'Donkey', spoken: 'Donkey!' },
  { id: 'camel', label: 'Camel', spoken: 'Camel!' },
  { id: 'elephant', label: 'Elephant', spoken: 'Elephant!' },
  { id: 'giraffe', label: 'Giraffe', spoken: 'Giraffe!' },
  { id: 'zebra', label: 'Zebra', spoken: 'Zebra!' },
  { id: 'rabbit', label: 'Rabbit', spoken: 'Rabbit!' },
  { id: 'horse', label: 'Horse', spoken: 'Horse!' },
  { id: 'deer', label: 'Deer', spoken: 'Deer!' },
  { id: 'monkey', label: 'Monkey', spoken: 'Monkey!' },
  { id: 'dog', label: 'Dog', spoken: 'Dog!' },
  { id: 'cat', label: 'Cat', spoken: 'Cat!' },
  { id: 'hen', label: 'Hen', spoken: 'Hen!' },
  { id: 'duck', label: 'Duck', spoken: 'Duck!' },
  { id: 'pig', label: 'Pig', spoken: 'Pig!' },
  { id: 'dolphin', label: 'Dolphin', spoken: 'Dolphin!' },
  { id: 'whale', label: 'Whale', spoken: 'Whale!' },
  { id: 'octopus', label: 'Octopus', spoken: 'Octopus!' },
  { id: 'fish', label: 'Fish', spoken: 'Fish!' },
  { id: 'jellyfish', label: 'Jellyfish', spoken: 'Jellyfish!' },
  // Transport & Sky (16)
  { id: 'airplane', label: 'Airplane', spoken: 'Airplane!' },
  { id: 'helicopter', label: 'Helicopter', spoken: 'Helicopter!' },
  { id: 'jet', label: 'Jet', spoken: 'Jet!' },
  { id: 'rocket', label: 'Rocket', spoken: 'Rocket!' },
  { id: 'bee', label: 'Bee', spoken: 'Bee!' },
  { id: 'boat', label: 'Boat', spoken: 'Boat!' },
  { id: 'yacht', label: 'Yacht', spoken: 'Yacht!' },
  { id: 'submarine', label: 'Submarine', spoken: 'Submarine!' },
  { id: 'ship', label: 'Ship', spoken: 'Ship!' },
  { id: 'sailboat', label: 'Sailboat', spoken: 'Sailboat!' },
  { id: 'bus', label: 'Bus', spoken: 'Bus!' },
  { id: 'car', label: 'Car', spoken: 'Car!' },
  { id: 'truck', label: 'Truck', spoken: 'Truck!' },
  { id: 'van', label: 'Van', spoken: 'Van!' },
  { id: 'firetruck', label: 'Firetruck', spoken: 'Firetruck!' },
  { id: 'tractor', label: 'Tractor', spoken: 'Tractor!' },
];

const ITEM_MAP = new Map(ITEMS.map((item) => [item.id, item]));

function itemLower(id) {
  const item = ITEM_MAP.get(id);
  if (!item) throw new Error(`Unknown item ${id}`);
  return item.label.toLowerCase();
}

const QUEST_PROMPTS = [
  { id: 'carnivores', build: (n) => `Circle all ${n} carnivores! Animals that eat meat.` },
  { id: 'herbivores', build: (n) => `Circle all ${n} herbivores! Animals that eat plants.` },
  { id: 'wild-animals', build: (n) => `Circle all ${n} wild jungle animals!` },
  { id: 'farm-pets', build: (n) => `Circle all ${n} farm and pet animals!` },
  { id: 'water-animals', build: (n) => `Circle all ${n} water animals!` },
  { id: 'fruits', build: (n) => `Circle all ${n} fruits!` },
  { id: 'vegetables', build: (n) => `Circle all ${n} vegetables!` },
  { id: 'healthy-food', build: (n) => `Circle all ${n} healthy foods!` },
  { id: 'treat-food', build: (n) => `Circle all ${n} junk foods!` },
  { id: 'sky-fliers', build: (n) => `Circle all ${n} things that go in the sky!` },
  { id: 'water-transport', build: (n) => `Circle all ${n} water vehicles!` },
  { id: 'road-vehicles', build: (n) => `Circle all ${n} road vehicles!` },
];

function buildMistakeClips() {
  const list = [];
  const pushMany = (ids, prefix, fn) => {
    for (const id of ids) {
      list.push({
        key: `${prefix}-${id}`,
        text: fn(itemLower(id), id),
      });
    }
  };

  // 1. carnivores distractors (herbivores)
  pushMany(
    ['cow', 'goat', 'donkey', 'camel', 'elephant', 'giraffe', 'zebra', 'rabbit', 'horse', 'deer'],
    'not-carnivore',
    (name) => `No, ${name} eats plants, it is not a carnivore.`,
  );

  // 2. herbivores distractors (carnivores)
  pushMany(
    ['lion', 'tiger', 'shark', 'alligator', 'eagle', 'owl', 'fox'],
    'not-herbivore',
    (name) => `No, ${name} eats meat, it is not a plant-eater.`,
  );

  // 3. wild-animals distractors (farm & pets)
  pushMany(
    ['cow', 'dog', 'cat', 'hen', 'goat', 'duck', 'pig', 'horse'],
    'not-wild',
    (name, id) =>
      id === 'dog' || id === 'cat'
        ? `No, ${name} is a pet animal, not a wild jungle animal.`
        : `No, ${name} is a farm animal, not a wild jungle animal.`,
  );

  // 4. farm-pets distractors (wild animals)
  pushMany(
    ['lion', 'tiger', 'elephant', 'giraffe', 'zebra', 'monkey', 'alligator', 'fox'],
    'not-farm',
    (name) => `No, ${name} is a wild animal, not a farm or pet animal.`,
  );

  // 5. water-animals distractors (land animals)
  pushMany(
    ['lion', 'cow', 'elephant', 'giraffe', 'monkey', 'rabbit', 'horse', 'camel', 'deer'],
    'not-water-animal',
    (name) => `No, ${name} lives on land, not in the water.`,
  );

  // 6. fruits distractors (unambiguous vegetables)
  pushMany(
    ['carrot', 'broccoli', 'potato', 'onion', 'cabbage', 'cauliflower', 'radish', 'mushroom'],
    'not-fruit',
    (name) => `No, ${name} is a vegetable, not a fruit.`,
  );

  // 7. vegetables distractors (fruits)
  pushMany(
    ['apple', 'banana', 'mango', 'strawberry', 'orange', 'watermelon', 'pineapple', 'grapes', 'pear', 'peach'],
    'not-veg',
    (name, id) =>
      id === 'grapes'
        ? 'No, grapes are a fruit, not a vegetable.'
        : `No, ${name} is a fruit, not a vegetable.`,
  );

  // 8. healthy-food distractors (junk/treat foods)
  for (const id of ['burger', 'fries', 'soda', 'candy', 'donut', 'pizza', 'cake', 'ice-cream', 'chips']) {
    if (id === 'fries') {
      list.push({
        key: 'not-healthy-fries',
        text: 'No, French fries are junk food, not a healthy food.',
      });
    } else if (id === 'chips') {
      list.push({
        key: 'not-healthy-chips',
        text: 'No, potato chips are junk food, not a healthy food.',
      });
    } else if (id === 'soda') {
      list.push({
        key: 'not-healthy-soda',
        text: 'No, soda has too much sugar, it is not a healthy food.',
      });
    } else if (id === 'candy' || id === 'donut' || id === 'cake' || id === 'ice-cream') {
      list.push({
        key: `not-healthy-${id}`,
        text: `No, ${itemLower(id)} is a sugary treat, not a healthy food.`,
      });
    } else {
      list.push({
        key: `not-healthy-${id}`,
        text: `No, ${itemLower(id)} is junk food, not a healthy food.`,
      });
    }
  }

  // 9. treat-food distractors (healthy foods)
  pushMany(
    ['apple', 'banana', 'broccoli', 'carrot', 'milk', 'egg', 'yogurt', 'pear', 'sweet-corn', 'watermelon'],
    'not-junk',
    (name) => `No, ${name} is a healthy food, not junk food.`,
  );

  // 10. sky-fliers distractors (road & water)
  pushMany(
    ['car', 'bus', 'truck', 'van', 'firetruck'],
    'not-sky',
    (name) => `No, ${name} drives on roads, not in the sky.`,
  );
  pushMany(
    ['boat', 'yacht', 'submarine'],
    'not-sky',
    (name) => `No, ${name} goes in the water, not in the sky.`,
  );

  // 11. water-transport distractors (road vehicles)
  pushMany(
    ['bus', 'car', 'truck', 'van', 'firetruck', 'tractor'],
    'not-water-trans',
    (name) => `No, ${name} drives on roads, not in the water.`,
  );

  // 12. road-vehicles distractors (sky & water)
  pushMany(
    ['airplane', 'helicopter', 'jet', 'rocket'],
    'not-road',
    (name) => `No, ${name} flies in the sky, not on roads.`,
  );
  pushMany(
    ['boat', 'yacht', 'submarine', 'ship'],
    'not-road',
    (name) => `No, ${name} goes in the water, not on roads.`,
  );

  return list;
}

const CHEERS = [
  {
    id: 'flawless-page',
    text: 'Bravo! You circled every right picture with zero mistakes!',
  },
  {
    id: 'page-complete',
    text: 'Wonderful job! You found them all!',
  },
  {
    id: 'round-flawless',
    text: 'Amazing! Every page solved with zero mistakes!',
  },
  {
    id: 'round-complete',
    text: 'Great sorting! You finished all your pages!',
  },
];

function resolveTtsPackage(pkgName, esmSubpath = '') {
  const candidateRoots = [
    process.env.PEBBLE_TTS_NODE_MODULES,
    path.join(repoRoot, 'node_modules'),
    path.join(process.env.HOME || '', '.cache', 'pebble-tts', 'node_modules'),
  ].filter(Boolean);

  for (const root of candidateRoots) {
    const pkgPath = path.join(root, pkgName);
    if (fs.existsSync(pkgPath)) {
      if (esmSubpath) {
        return path.join(pkgPath, esmSubpath);
      }
      return require.resolve(pkgName, { paths: [root] });
    }
  }
  throw new Error(
    `Cannot locate "${pkgName}". Set PEBBLE_TTS_NODE_MODULES to a node_modules directory with kokoro-js and @breezystack/lamejs installed.`,
  );
}

function trimAndNormalizeFloat32(samples, sampleRate) {
  const threshold = 0.008;
  let start = 0;
  while (start < samples.length && Math.abs(samples[start]) < threshold) {
    start += 1;
  }
  let end = samples.length - 1;
  while (end > start && Math.abs(samples[end]) < threshold) {
    end -= 1;
  }
  const padSamples = Math.floor(sampleRate * 0.045);
  start = Math.max(0, start - padSamples);
  end = Math.min(samples.length - 1, end + padSamples);

  const slice = samples.subarray(start, end + 1);
  let maxAbs = 0;
  for (let i = 0; i < slice.length; i += 1) {
    const abs = Math.abs(slice[i]);
    if (abs > maxAbs) maxAbs = abs;
  }

  const gain = maxAbs > 0.02 ? Math.min(2.5, 0.88 / maxAbs) : 1;
  const int16 = new Int16Array(slice.length);
  for (let i = 0; i < slice.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, slice[i] * gain));
    int16[i] = clamped < 0 ? Math.round(clamped * 32768) : Math.round(clamped * 32767);
  }
  const durationMs = Math.round((slice.length / sampleRate) * 1000);
  return { int16, durationMs };
}

function encodeMonoMp3(Mp3Encoder, int16Samples, sampleRate, kbps = 64) {
  const encoder = new Mp3Encoder(1, sampleRate, kbps);
  const blockSize = 1152;
  const chunks = [];
  for (let i = 0; i < int16Samples.length; i += blockSize) {
    const chunk = int16Samples.subarray(i, i + blockSize);
    const mp3buf = encoder.encodeBuffer(chunk);
    if (mp3buf.length > 0) {
      chunks.push(Buffer.from(mp3buf));
    }
  }
  const flush = encoder.flush();
  if (flush.length > 0) {
    chunks.push(Buffer.from(flush));
  }
  return Buffer.concat(chunks);
}

function isExistingClipValid(filePath) {
  if (!fs.existsSync(filePath)) return false;
  return fs.statSync(filePath).size >= MIN_FILE_BYTES;
}

async function main() {
  fs.mkdirSync(itemsOutDir, { recursive: true });
  fs.mkdirSync(promptsOutDir, { recursive: true });
  fs.mkdirSync(mistakesOutDir, { recursive: true });
  fs.mkdirSync(cheersOutDir, { recursive: true });

  const jobs = [];

  for (const item of ITEMS) {
    const outPath = safeOutFile(itemsOutDir, item.id);
    if (forceRegen || !isExistingClipValid(outPath)) {
      jobs.push({
        kind: 'items',
        id: item.id,
        text: item.spoken,
        speed: 0.93,
        outPath,
      });
    }
  }

  for (const qp of QUEST_PROMPTS) {
    for (const count of [3, 4, 5]) {
      const clipId = `${qp.id}-${count}`;
      const outPath = safeOutFile(promptsOutDir, clipId);
      if (forceRegen || !isExistingClipValid(outPath)) {
        jobs.push({
          kind: 'prompts',
          id: clipId,
          text: qp.build(count),
          speed: 0.93,
          outPath,
        });
      }
    }
  }

  const mistakes = buildMistakeClips();
  for (const m of mistakes) {
    const outPath = safeOutFile(mistakesOutDir, m.key);
    if (forceRegen || !isExistingClipValid(outPath)) {
      jobs.push({
        kind: 'mistakes',
        id: m.key,
        text: m.text,
        speed: 0.94,
        outPath,
      });
    }
  }

  for (const c of CHEERS) {
    const outPath = safeOutFile(cheersOutDir, c.id);
    if (forceRegen || !isExistingClipValid(outPath)) {
      jobs.push({
        kind: 'cheers',
        id: c.id,
        text: c.text,
        speed: 0.95,
        outPath,
      });
    }
  }

  console.log(
    `Circle & Sort Audio: ${ITEMS.length} items, ${QUEST_PROMPTS.length * 3} prompts, ${mistakes.length} mistake clips, ${CHEERS.length} cheers (${jobs.length} queued).`,
  );
  if (jobs.length === 0) {
    console.log('All Circle & Sort MP3 clips are already up to date.');
    return;
  }

  const kokoroEntry = resolveTtsPackage('kokoro-js');
  const lameEntry = resolveTtsPackage('@breezystack/lamejs', 'dist/lamejs.js');

  const { KokoroTTS } = await import(pathToFileURL(kokoroEntry).href);
  const lameMod = await import(pathToFileURL(lameEntry).href);
  const Mp3Encoder = lameMod.Mp3Encoder || lameMod.default?.Mp3Encoder;
  if (!Mp3Encoder) {
    throw new Error('Could not resolve Mp3Encoder from @breezystack/lamejs');
  }

  const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
    dtype: 'q8',
    device: 'cpu',
  });

  let totalBytes = 0;
  for (let i = 0; i < jobs.length; i += 1) {
    const job = jobs[i];
    const spoken = await tts.generate(job.text, {
      voice: 'af_heart',
      speed: job.speed,
    });
    const { int16, durationMs } = trimAndNormalizeFloat32(spoken.audio, spoken.sampling_rate);
    if (durationMs < MIN_DURATION_MS) {
      throw new Error(
        `Clip ${job.kind}/${job.id} ("${job.text}") trimmed too short: ${durationMs}ms < ${MIN_DURATION_MS}ms`,
      );
    }

    const mp3Buffer = encodeMonoMp3(Mp3Encoder, int16, spoken.sampling_rate, 64);
    if (mp3Buffer.length < MIN_FILE_BYTES) {
      throw new Error(
        `Clip ${job.kind}/${job.id} produced ${mp3Buffer.length} B < ${MIN_FILE_BYTES} B`,
      );
    }

    fs.writeFileSync(job.outPath, mp3Buffer);
    totalBytes += mp3Buffer.length;
    if ((i + 1) % 25 === 0 || i === jobs.length - 1) {
      console.log(
        `  [${i + 1}/${jobs.length}] ${job.kind}/${job.id}.mp3 (${mp3Buffer.length} B, ${durationMs}ms)`,
      );
    }
  }

  console.log(
    `Done! Generated ${jobs.length} Circle & Sort MP3 clips (${(totalBytes / 1024).toFixed(1)} KB total).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
