#!/usr/bin/env node
/**
 * Word Peekaboo Offline Audio Generator (Kokoro-82M + LameJS MP3)
 *
 * Generates compact mono MP3 clips into:
 *   - public/audio/peekaboo/words/<wordId>.mp3    (ONLY the single word)
 *   - public/audio/peekaboo/thats/<wordId>.mp3    ("That's <word>.")
 *   - public/audio/peekaboo/intro/<pairId>.mp3    ("Help discover <Character>!")
 *   - public/audio/peekaboo/found/<pairId>.mp3    ("Congratulations! You found <Character>!")
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

const outBaseDir = path.join(repoRoot, 'public', 'audio', 'peekaboo');
const wordsOutDir = path.join(outBaseDir, 'words');
const thatsOutDir = path.join(outBaseDir, 'thats');
const introOutDir = path.join(outBaseDir, 'intro');
const foundOutDir = path.join(outBaseDir, 'found');

const forceRegen = process.argv.includes('--force');
const require = createRequire(import.meta.url);

const MIN_DURATION_MS = 200;
const MIN_FILE_BYTES = 1200;

const KLAY_WORDS = [
  // Sight Words 1 (Page 1)
  { id: 'i', wordText: 'I.', thatsText: "That's I." },
  { id: 'he', wordText: 'He.', thatsText: "That's he." },
  { id: 'she', wordText: 'She.', thatsText: "That's she." },
  { id: 'the', wordText: 'The.', thatsText: "That's the." },
  { id: 'be', wordText: 'Be.', thatsText: "That's be." },
  { id: 'to', wordText: 'To.', fallbackWordText: 'Too.', thatsText: "That's too." },
  { id: 'do', wordText: 'Do.', thatsText: "That's do." },
  { id: 'me', wordText: 'Me.', thatsText: "That's me." },
  // Sight Words 2 (Page 13)
  { id: 'we', wordText: 'We.', thatsText: "That's we." },
  { id: 'was', wordText: 'Was.', thatsText: "That's was." },
  { id: 'of', wordText: 'Of.', thatsText: "That's of." },
  { id: 'are', wordText: 'Are.', thatsText: "That's are." },
  { id: 'all', wordText: 'All.', thatsText: "That's all." },
  { id: 'you', wordText: 'You.', thatsText: "That's you." },
  { id: 'go', wordText: 'Go.', thatsText: "That's go." },
  { id: 'no', wordText: 'No.', thatsText: "That's no." },
  // Short a & i CVC (Page 10)
  { id: 'cab', wordText: 'Cab.', thatsText: "That's cab." },
  { id: 'lid', wordText: 'Lid.', thatsText: "That's lid." },
  { id: 'jam', wordText: 'Jam.', thatsText: "That's jam." },
  { id: 'sip', wordText: 'Sip.', thatsText: "That's sip." },
  { id: 'tap', wordText: 'Tap.', thatsText: "That's tap." },
  { id: 'pig', wordText: 'Pig.', thatsText: "That's pig." },
  { id: 'bag', wordText: 'Bag.', thatsText: "That's bag." },
  { id: 'fin', wordText: 'Fin.', thatsText: "That's fin." },
  { id: 'fan', wordText: 'Fan.', thatsText: "That's fan." },
  { id: 'bib', wordText: 'Bib.', thatsText: "That's bib." },
  // Short o CVC (Page 25)
  { id: 'job', wordText: 'Job.', thatsText: "That's job." },
  { id: 'mop', wordText: 'Mop.', thatsText: "That's mop." },
  { id: 'nod', wordText: 'Nod.', thatsText: "That's nod." },
  { id: 'dog', wordText: 'Dog.', thatsText: "That's dog." },
  { id: 'hot', wordText: 'Hot.', thatsText: "That's hot." },
  { id: 'pot', wordText: 'Pot.', thatsText: "That's pot." },
  { id: 'jog', wordText: 'Jog.', thatsText: "That's jog." },
  { id: 'top', wordText: 'Top.', thatsText: "That's top." },
  // Short e CVC (Page 34)
  { id: 'jet', wordText: 'Jet.', thatsText: "That's jet." },
  { id: 'red', wordText: 'Red.', thatsText: "That's red." },
  { id: 'ten', wordText: 'Ten.', thatsText: "That's ten." },
  { id: 'pet', wordText: 'Pet.', thatsText: "That's pet." },
  { id: 'bed', wordText: 'Bed.', thatsText: "That's bed." },
  { id: 'leg', wordText: 'Leg.', thatsText: "That's leg." },
  { id: 'hen', wordText: 'Hen.', thatsText: "That's hen." },
  { id: 'net', wordText: 'Net.', thatsText: "That's net." },
];

const STAR_CHARACTERS = [
  // Cars (8)
  { pairId: 'cars-01', name: 'Lightning McQueen' },
  { pairId: 'cars-04', name: 'Mater' },
  { pairId: 'cars-06', name: 'Cruz Ramirez' },
  { pairId: 'cars-05', name: 'Sally' },
  { pairId: 'cars-03', name: 'Doc Hudson' },
  { pairId: 'cars-02', name: 'Jackson Storm' },
  { pairId: 'cars-13', name: 'Mack' },
  { pairId: 'cars-07', name: 'Luigi' },
  // PAW Patrol (8)
  { pairId: 'pp-01', name: 'Chase' },
  { pairId: 'pp-02', name: 'Marshall' },
  { pairId: 'pp-03', name: 'Skye' },
  { pairId: 'pp-04', name: 'Rubble' },
  { pairId: 'pp-05', name: 'Rocky' },
  { pairId: 'pp-06', name: 'Zuma' },
  { pairId: 'pp-07', name: 'Everest' },
  { pairId: 'pp-08', name: 'Tracker' },
  // Lion King (6)
  { pairId: 'lk-01', name: 'Simba' },
  { pairId: 'lk-02', name: 'Mufasa' },
  { pairId: 'lk-03', name: 'Nala' },
  { pairId: 'lk-04', name: 'Timon' },
  { pairId: 'lk-05', name: 'Pumbaa' },
  { pairId: 'lk-07', name: 'Zazu' },
  // Toy Story (6)
  { pairId: 'ts-01', name: 'Woody' },
  { pairId: 'ts-02', name: 'Buzz Lightyear' },
  { pairId: 'ts-03', name: 'Jessie' },
  { pairId: 'ts-04', name: 'Rex' },
  { pairId: 'ts-06', name: 'Slinky Dog' },
  { pairId: 'ts-07', name: 'Bullseye' },
  // Kung Fu Panda (5)
  { pairId: 'kfp-01', name: 'Po' },
  { pairId: 'kfp-02', name: 'Tigress' },
  { pairId: 'kfp-03', name: 'Master Shifu' },
  { pairId: 'kfp-04', name: 'Master Oogway' },
  { pairId: 'kfp-05', name: 'Monkey' },
  // Tom & Jerry (5)
  { pairId: 'tj-01', name: 'Tom' },
  { pairId: 'tj-02', name: 'Jerry' },
  { pairId: 'tj-03', name: 'Spike' },
  { pairId: 'tj-04', name: 'Tyke' },
  { pairId: 'tj-05', name: 'Tuffy' },
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

function trimAndNormalizeFloat32(samples, sampleRate, minPadDurationMs = 0) {
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
  const minSamples = Math.ceil((minPadDurationMs / 1000) * sampleRate);
  const outLength = Math.max(slice.length, minSamples);
  const int16 = new Int16Array(outLength);
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
  fs.mkdirSync(wordsOutDir, { recursive: true });
  fs.mkdirSync(thatsOutDir, { recursive: true });
  fs.mkdirSync(introOutDir, { recursive: true });
  fs.mkdirSync(foundOutDir, { recursive: true });

  const jobs = [];
  for (const w of KLAY_WORDS) {
    const wordOut = path.join(wordsOutDir, `${w.id}.mp3`);
    if (forceRegen || !isExistingClipValid(wordOut)) {
      jobs.push({
        kind: 'word',
        id: w.id,
        text: w.wordText,
        fallbackText: w.fallbackWordText,
        speed: 0.9,
        outPath: wordOut,
      });
    }
    const thatsOut = path.join(thatsOutDir, `${w.id}.mp3`);
    if (forceRegen || !isExistingClipValid(thatsOut)) {
      jobs.push({
        kind: 'thats',
        id: w.id,
        text: w.thatsText,
        speed: 0.94,
        outPath: thatsOut,
      });
    }
  }

  for (const c of STAR_CHARACTERS) {
    const introOut = path.join(introOutDir, `${c.pairId}.mp3`);
    if (forceRegen || !isExistingClipValid(introOut)) {
      jobs.push({
        kind: 'intro',
        id: c.pairId,
        text: `Help discover ${c.name}!`,
        speed: 0.95,
        outPath: introOut,
      });
    }
    const foundOut = path.join(foundOutDir, `${c.pairId}.mp3`);
    if (forceRegen || !isExistingClipValid(foundOut)) {
      jobs.push({
        kind: 'found',
        id: c.pairId,
        text: `Congratulations! You found ${c.name}!`,
        speed: 0.95,
        outPath: foundOut,
      });
    }
  }

  console.log(
    `Word Peekaboo Audio: ${KLAY_WORDS.length} words, ${STAR_CHARACTERS.length} characters (${jobs.length} clips queued).`,
  );
  if (jobs.length === 0) {
    console.log('All Word Peekaboo MP3 clips are already up to date.');
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
    let spoken = await tts.generate(job.text, {
      voice: 'af_heart',
      speed: job.speed,
    });
    let { int16, durationMs } = trimAndNormalizeFloat32(spoken.audio, spoken.sampling_rate);

    if (job.fallbackText && durationMs < 250) {
      console.log(
        `  [retry ${job.kind}/${job.id}] "${job.text}" trimmed to ${durationMs}ms (<250ms); regenerating as "${job.fallbackText}"`,
      );
      spoken = await tts.generate(job.fallbackText, {
        voice: 'af_heart',
        speed: job.speed,
      });
      ({ int16, durationMs } = trimAndNormalizeFloat32(spoken.audio, spoken.sampling_rate));
    }

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
    if ((i + 1) % 20 === 0 || i === jobs.length - 1 || job.kind === 'word') {
      console.log(
        `  [${i + 1}/${jobs.length}] ${job.kind}/${job.id}.mp3 (${mp3Buffer.length} B, ${durationMs}ms)`,
      );
    }
  }

  console.log(
    `Done! Generated ${jobs.length} Word Peekaboo MP3 clips (${(totalBytes / 1024).toFixed(1)} KB total).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
