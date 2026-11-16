#!/usr/bin/env node
/**
 * K1 Syllabus Bundled Voice Generator (Kokoro-82M + LameJS MP3)
 *
 * Generates offline static MP3 audio clips for:
 *   - public/audio/numbers/0.mp3 .. 50.mp3
 *   - public/audio/words/<sight-or-shape>.mp3
 *   - public/audio/quest/<voiceClipId>.mp3
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const numbersOutDir = path.join(repoRoot, 'public', 'audio', 'numbers');
const wordsOutDir = path.join(repoRoot, 'public', 'audio', 'words');
const questOutDir = path.join(repoRoot, 'public', 'audio', 'quest');

const forceRegen = process.argv.includes('--force');
const require = createRequire(import.meta.url);

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
  return int16;
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

const NUMBER_SPOKEN = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
  'twenty', 'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four', 'twenty-five', 'twenty-six', 'twenty-seven', 'twenty-eight', 'twenty-nine',
  'thirty', 'thirty-one', 'thirty-two', 'thirty-three', 'thirty-four', 'thirty-five', 'thirty-six', 'thirty-seven', 'thirty-eight', 'thirty-nine',
  'forty', 'forty-one', 'forty-two', 'forty-three', 'forty-four', 'forty-five', 'forty-six', 'forty-seven', 'forty-eight', 'forty-nine',
  'fifty',
];

const EXTRA_WORD_CLIPS = [
  { id: 'the', text: 'the' },
  { id: 'see', text: 'see' },
  { id: 'can', text: 'can' },
  { id: 'you', text: 'you' },
  { id: 'and', text: 'and' },
  { id: 'for', text: 'for' },
  { id: 'are', text: 'are' },
  { id: 'she', text: 'she' },
  { id: 'all', text: 'all' },
  { id: 'my', text: 'my' },
  { id: 'we', text: 'we' },
  { id: 'was', text: 'was' },
  { id: 'he', text: 'he' },
  { id: 'go', text: 'go' },
  { id: 'circle', text: 'circle' },
  { id: 'square', text: 'square' },
  { id: 'rectangle', text: 'rectangle' },
  { id: 'triangle', text: 'triangle' },
];

function buildQuestClips() {
  const clips = [];

  // 1. Math & Place Value & Number Line
  for (let n = 0; n <= 50; n += 1) {
    clips.push({
      id: `num-find-${n}`,
      text: `Find the number ${NUMBER_SPOKEN[n]}!`,
    });
  }
  for (let n = 0; n <= 10; n += 1) {
    const w = NUMBER_SPOKEN[n];
    const cap = w[0].toUpperCase() + w.slice(1);
    clips.push({
      id: `numword-${n}`,
      text: `${cap} is ${w}!`,
    });
  }
  clips.push(
    { id: 'num-read-word-generic', text: 'Read the number word in the box and tap its matching number!' },
    { id: 'num-in-between', text: 'Which number goes right in between on the number train?' },
    { id: 'num-comes-after', text: 'What number comes right after on the number train?' },
    { id: 'num-comes-before', text: 'What number comes right before on the number train?' },
    { id: 'seq-count-backward', text: 'Count backward step by step and place the numbers in countdown order!' },
    { id: 'pv-build-zero', text: 'Show zero in the tray with zero tens and zero ones, then tap Check!' },
    { id: 'pv-build-tens-ones', text: 'Use ten bundles and single pebbles to build the number!' },
    { id: 'pv-count-bundles', text: 'Count the bundles of ten and the single pebbles. What number do they make?' },
    { id: 'numline-one-more', text: 'Hop one more forward on the number line! Which number does the frog land on?' },
    { id: 'numline-one-less', text: 'Hop one less backward on the number line! Which number does the frog land on?' },
    { id: 'ord-which-place', text: 'Count from the finish flag on the left! Which place is that animal in?' },
  );

  // 2. Shapes, Patterns & Pre-Math
  const shapes = ['circle', 'square', 'rectangle', 'triangle', 'sphere', 'cube', 'cone', 'cylinder'];
  for (const s of shapes) {
    clips.push(
      { id: `shape-find-${s}`, text: `Tap the ${s}!` },
      { id: `shape-obj-${s}`, text: `Which everyday object is shaped like a ${s}?` },
    );
  }
  clips.push(
    { id: 'shape-sort-2d-3d', text: 'Sort each shape into flat 2D shapes or solid 3D shapes!' },
    { id: 'pattern-what-next', text: 'Look at the pattern! Which shape comes next?' },
    { id: 'cmp-beaker-empty', text: 'Tap the glass that is empty!' },
    { id: 'cmp-beaker-quarter', text: 'Tap the glass that is quarter full!' },
    { id: 'cmp-beaker-half', text: 'Tap the glass that is half full!' },
    { id: 'cmp-beaker-full', text: 'Tap the glass that is full!' },
    { id: 'cmp-heavier', text: 'Which one is heavier?' },
    { id: 'cmp-lighter', text: 'Which one is lighter?' },
    { id: 'cmp-taller', text: 'Which plant is taller?' },
    { id: 'cmp-bigger', text: 'Which fruit is bigger?' },
    { id: 'dir-left', text: 'Tap the arrow pointing left!' },
    { id: 'dir-right', text: 'Tap the arrow pointing right!' },
    { id: 'dir-up', text: 'Tap the arrow pointing up!' },
    { id: 'dir-down', text: 'Tap the arrow pointing down!' },
    { id: 'seq-times-of-day', text: 'Put the four times of the day in order from morning sunrise to night!' },
    { id: 'measure-how-many-blocks', text: 'Count the wooden blocks underneath! How many blocks long is it?' },
    { id: 'graph-which-most', text: 'Look at the bar graph! Which fruit has the tallest bar with the most?' },
    { id: 'graph-which-least', text: 'Look at the bar graph! Which fruit has the shortest bar with the least?' },
  );

  // 3. Literacy, CVC, Sight Words & Short Phrases
  const phrases = [
    { id: 'cat-mat', text: 'A cat on a mat.' },
    { id: 'dog-box', text: 'A dog in a box.' },
    { id: 'bug-log', text: 'A bug on a log.' },
    { id: 'pig-mud', text: 'A pig in the mud.' },
    { id: 'hen-pen', text: 'A hen in a pen.' },
    { id: 'red-bus', text: 'I see a red bus.' },
    { id: 'fox-den', text: 'The fox is in a den.' },
    { id: 'cup-bed', text: 'My cup on the bed.' },
    { id: 'fish-net', text: 'A fish in a net.' },
    { id: 'frog-pad', text: 'The frog on a pad.' },
  ];
  for (const p of phrases) {
    clips.push({ id: `phrase-${p.id}`, text: p.text });
  }

  const cvcWords = ['cat', 'hat', 'van', 'jam', 'net', 'jet', 'pig', 'dog', 'fox', 'bus', 'cup', 'sun', 'nut'];
  for (const w of cvcWords) {
    clips.push(
      { id: `cvc-mid-${w}`, text: `Listen to the word ${w}! Which vowel sound is in the middle?` },
      { id: `cvc-end-${w}`, text: `Listen to the word ${w}! Which letter sound comes at the very end?` },
      { id: `cvc-word-${w}`, text: `${w}!` },
    );
  }

  const sightWords = ['the', 'see', 'can', 'my', 'we', 'you', 'are', 'was', 'she', 'he', 'go', 'all'];
  for (const sw of sightWords) {
    clips.push({ id: `sight-find-${sw}`, text: `Find the sight word, ${sw}!` });
  }

  clips.push(
    { id: 'lit-read-phrase-generic', text: 'Read the short sentence in the box and tap the picture that matches!' },
    { id: 'lit-blend-cvc-generic', text: 'Sound out the three letters in the box and tap the matching picture!' },
  );

  // 4. General Awareness (All About Me, Helpers, Animals, Nature, Transport, World)
  clips.push(
    { id: 'ga-sense-smell', text: 'Which body part helps us smell a sweet rose?' },
    { id: 'ga-sense-hear', text: 'Which body part helps us hear music and drums?' },
    { id: 'ga-sense-see', text: 'Which body part helps us see a colorful rainbow?' },
    { id: 'ga-sense-taste', text: 'Which body part helps us taste sweet mango or sour lemon?' },
    { id: 'ga-sense-touch', text: 'Which body part helps us feel and touch a soft teddy?' },
    { id: 'ga-body-knees', text: 'Which picture shows our knees that bend when we jump?' },
    { id: 'ga-habit-wash-hands', text: 'What healthy habit should we do before eating meals?' },
    { id: 'ga-habit-brush-teeth', text: 'What keeps our teeth clean and strong morning and night?' },
    { id: 'ga-seq-human-growth', text: 'Put the four stages of human life in order from baby to elder!' },
    { id: 'ga-sort-food', text: 'Sort each food into everyday healthy food or sometimes treats!' },
    { id: 'ga-helper-doctor', text: 'Who checks our heartbeat and helps us feel better when we are sick?' },
    { id: 'ga-helper-firefighter', text: 'Who rides a fire engine and puts out fires to keep people safe?' },
    { id: 'ga-helper-teacher', text: 'Who helps children read, count, and learn at school?' },
    { id: 'ga-helper-farmer', text: 'Who grows fresh fruits, vegetables, and grains on a farm?' },
    { id: 'ga-helper-pilot', text: 'Who flies an airplane high in the sky?' },
    { id: 'ga-helper-postman', text: 'Who delivers letters and parcels to our homes?' },
    { id: 'ga-helper-chef', text: 'Who wears a tall white hat and cooks delicious meals in a kitchen?' },
    { id: 'ga-seq-butterfly', text: 'Put the four stages of the butterfly lifecycle in order!' },
    { id: 'ga-seq-frog', text: 'Put the four stages of the frog lifecycle in order!' },
    { id: 'ga-seq-plant', text: 'Put the four stages of the plant lifecycle in order!' },
    { id: 'ga-sort-eggs-babies', text: 'Sort the animals by how their babies are born!' },
    { id: 'ga-sort-birds-insects', text: 'Sort each creature into feathered birds or six-legged insects!' },
    { id: 'ga-sort-land-water', text: 'Where does each animal live? Sort into land animals or water animals!' },
    { id: 'ga-plant-roots', text: 'Which part of a plant grows under the soil and drinks water?' },
    { id: 'ga-plant-climber', text: 'Which plant is a climber that needs a stick or support to grow up?' },
    { id: 'ga-plant-product', text: 'Which of these everyday things is made from wood from trees?' },
    { id: 'ga-animal-herbivore', text: 'Which animal is a plant-eater that eats grass and leaves?' },
    { id: 'ga-sort-transport', text: 'Sort each vehicle by where it travels: land, water, or air!' },
    { id: 'ga-tech-fridge', text: 'Which helpful home machine keeps milk, fruits, and food cold and fresh?' },
    { id: 'ga-3rs-bag', text: 'How can we reduce plastic waste and care for nature when shopping?' },
    { id: 'ga-save-water', text: 'Which picture shows a smart way to save water and protect Earth?' },
    { id: 'ga-sky-planets', text: 'Our Earth and Saturn travel around the Sun in space. What are they called?' },
    { id: 'ga-sky-moon', text: 'What shines gently in the dark night sky alongside twinkling stars?' },
  );

  return clips;
}

async function main() {
  fs.mkdirSync(numbersOutDir, { recursive: true });
  fs.mkdirSync(wordsOutDir, { recursive: true });
  fs.mkdirSync(questOutDir, { recursive: true });

  const jobs = [];

  for (let n = 0; n <= 50; n += 1) {
    const outPath = path.join(numbersOutDir, `${n}.mp3`);
    if (forceRegen || !fs.existsSync(outPath)) {
      jobs.push({ label: `numbers/${n}.mp3`, text: `${NUMBER_SPOKEN[n]}.`, outPath, speed: 0.92 });
    }
  }

  for (const w of EXTRA_WORD_CLIPS) {
    const outPath = path.join(wordsOutDir, `${w.id}.mp3`);
    if (forceRegen || !fs.existsSync(outPath)) {
      jobs.push({ label: `words/${w.id}.mp3`, text: `${w.text}.`, outPath, speed: 0.9 });
    }
  }

  for (const q of buildQuestClips()) {
    const outPath = path.join(questOutDir, `${q.id}.mp3`);
    if (forceRegen || !fs.existsSync(outPath)) {
      jobs.push({ label: `quest/${q.id}.mp3`, text: q.text, outPath, speed: 0.93 });
    }
  }

  if (jobs.length === 0) {
    console.log('All K1 number, word, and quest MP3 clips are already up to date.');
    return;
  }

  console.log(`Generating ${jobs.length} K1 bundled audio clips via Kokoro (af_heart)...`);
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
    const audio = await tts.generate(job.text, {
      voice: 'af_heart',
      speed: job.speed,
    });
    const int16 = trimAndNormalizeFloat32(audio.audio, audio.sampling_rate);
    const mp3Buffer = encodeMonoMp3(Mp3Encoder, int16, audio.sampling_rate, 64);
    fs.writeFileSync(job.outPath, mp3Buffer);
    totalBytes += mp3Buffer.length;
    if ((i + 1) % 25 === 0 || i === jobs.length - 1) {
      console.log(`  [${i + 1}/${jobs.length}] ${job.label} (${(totalBytes / 1024).toFixed(1)} KB cumulative)`);
    }
  }

  console.log(`Done! Generated ${jobs.length} bundled MP3 clips (${(totalBytes / 1024).toFixed(1)} KB total).`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
