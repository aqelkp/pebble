#!/usr/bin/env node
/**
 * Pipe Countdown Offline Audio Generator (Kokoro-82M + LameJS MP3)
 *
 * Generates compact 64kbps mono MP3 clips into:
 *   - public/audio/countdown/*.mp3
 *   - public/audio/journey/pipe-countdown.mp3 (+ updates src/journey/journeyAudioCatalog.json)
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

const countdownOutDir = path.join(repoRoot, 'public', 'audio', 'countdown');
const journeyOutDir = path.join(repoRoot, 'public', 'audio', 'journey');
const journeyCatalogPath = path.join(repoRoot, 'src', 'journey', 'journeyAudioCatalog.json');

const forceRegen = process.argv.includes('--force');
const require = createRequire(import.meta.url);

const MIN_DURATION_MS = 180;
const MIN_FILE_BYTES = 1100;

const NUMBER_WORDS = [
  { num: 0, word: 'zero', title: 'Zero!' },
  { num: 1, word: 'one', title: 'One!' },
  { num: 2, word: 'two', title: 'Two!' },
  { num: 3, word: 'three', title: 'Three!' },
  { num: 4, word: 'four', title: 'Four!' },
  { num: 5, word: 'five', title: 'Five!' },
  { num: 6, word: 'six', title: 'Six!' },
  { num: 7, word: 'seven', title: 'Seven!' },
  { num: 8, word: 'eight', title: 'Eight!' },
  { num: 9, word: 'nine', title: 'Nine!' },
  { num: 10, word: 'ten', title: 'Ten!' },
];

const STATIC_COUNTDOWN_CLIPS = [
  { id: 'we-need-number', text: 'We need number', speed: 0.94 },
  { id: 'next', text: 'Next!', speed: 0.94 },
  {
    id: 'hint-0',
    text: 'Time for zero! Seal the round valve cap!',
    speed: 0.94,
  },
  {
    id: 'intro-9-to-0',
    text: 'Plug the leaks from biggest to smallest! Start at nine, down to zero!',
    speed: 0.94,
  },
  {
    id: 'intro-5-to-0',
    text: 'Plug the leaks from biggest to smallest! Start at five, down to zero!',
    speed: 0.94,
  },
  {
    id: 'intro-10-to-0',
    text: 'Plug the leaks from biggest to smallest! Start at ten, down to zero!',
    speed: 0.94,
  },
  {
    id: 'intro-missing-rods',
    text: 'Fill the missing countdown numbers from biggest down to zero!',
    speed: 0.94,
  },
  {
    id: 'zero-splash',
    text: 'Zero leaks! Three, two, one, zero — splash!',
    speed: 0.94,
  },
  {
    id: 'zero-wonderful',
    text: 'Zero leaks! Wonderful countdown!',
    speed: 0.94,
  },
  {
    id: 'perfect-crown',
    text: 'Bravo! Zero mistakes! You fixed every pipe in order!',
    speed: 0.95,
  },
];

const JOURNEY_CLIP = {
  id: 'pipe-countdown',
  text: 'Plug each leaking pipe from biggest down to zero to start the garden fountain!',
  speed: 0.92,
};

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

function estimateSyllables(word) {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return 1;
  const groups = clean.match(/[aeiouy]+/g);
  let count = groups ? groups.length : 1;
  if (clean.length > 3 && clean.endsWith('e') && !clean.endsWith('le')) {
    count = Math.max(1, count - 1);
  }
  return Math.max(1, count);
}

function computeRmsWindow(int16Samples, centerSample, halfWindowSamples) {
  const start = Math.max(0, centerSample - halfWindowSamples);
  const end = Math.min(int16Samples.length - 1, centerSample + halfWindowSamples);
  if (end <= start) return 0;
  let sumSq = 0;
  for (let i = start; i <= end; i += 1) {
    const v = int16Samples[i];
    sumSq += v * v;
  }
  return Math.sqrt(sumSq / (end - start + 1));
}

function snapBoundaryToLowestRmsTrough(int16Samples, sampleRate, targetMs, minMs, maxMs) {
  const searchRadiusMs = 80;
  const windowHalfSamples = Math.max(1, Math.floor((sampleRate * 0.015) / 2));
  const stepMs = 5;
  const startMs = Math.max(minMs, targetMs - searchRadiusMs);
  const endMs = Math.min(maxMs, targetMs + searchRadiusMs);

  let bestMs = Math.max(minMs, Math.min(maxMs, targetMs));
  let bestRms = Infinity;

  for (let ms = startMs; ms <= endMs; ms += stepMs) {
    const centerSample = Math.round((ms / 1000) * sampleRate);
    const rms = computeRmsWindow(int16Samples, centerSample, windowHalfSamples);
    if (rms < bestRms) {
      bestRms = rms;
      bestMs = ms;
    }
  }
  return Math.round(bestMs);
}

function computeWordTimings(text, int16Samples, sampleRate) {
  const durationMs = Math.round((int16Samples.length / sampleRate) * 1000);
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return { durationMs, words: [] };
  }

  const startOffsetMs = Math.min(35, Math.floor(durationMs * 0.05));
  const endOffsetMs = Math.max(startOffsetMs + words.length * 40, Math.max(200, durationMs - 45));
  const activeSpanMs = Math.max(120, endOffsetMs - startOffsetMs);

  const weights = words.map((word) => {
    const cleanLen = word.replace(/[^a-zA-Z0-9]/g, '').length;
    const syllables = estimateSyllables(word);
    const commaPause = word.endsWith(',') ? 0.75 : 0;
    const endPunctPause = /[.!]$/.test(word) ? 0.25 : 0;
    return syllables * 1.0 + cleanLen * 0.08 + commaPause + endPunctPause;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0) || 1;
  const rawBoundaries = [startOffsetMs];
  let acc = 0;
  for (let i = 0; i < words.length; i += 1) {
    acc += weights[i];
    if (i < words.length - 1) {
      rawBoundaries.push(Math.round(startOffsetMs + (acc / totalWeight) * activeSpanMs));
    } else {
      rawBoundaries.push(endOffsetMs);
    }
  }

  const snappedBoundaries = [...rawBoundaries];
  for (let i = 1; i < words.length; i += 1) {
    const prevMs = snappedBoundaries[i - 1] + 45;
    const nextMinBudget = (words.length - i) * 45;
    const maxAllowedMs = Math.max(prevMs, endOffsetMs - nextMinBudget);
    snappedBoundaries[i] = snapBoundaryToLowestRmsTrough(
      int16Samples,
      sampleRate,
      rawBoundaries[i],
      prevMs,
      maxAllowedMs,
    );
  }

  const timings = words.map((word, idx) => ({
    word,
    startMs: idx === 0 ? 0 : snappedBoundaries[idx],
    endMs: idx === words.length - 1 ? durationMs : snappedBoundaries[idx + 1],
  }));

  return { durationMs, words: timings };
}

function isExistingClipValid(filePath) {
  if (!fs.existsSync(filePath)) return false;
  return fs.statSync(filePath).size >= MIN_FILE_BYTES;
}

async function main() {
  fs.mkdirSync(countdownOutDir, { recursive: true });
  fs.mkdirSync(journeyOutDir, { recursive: true });

  const jobs = [];

  for (const n of NUMBER_WORDS) {
    const numOut = path.join(countdownOutDir, `${n.num}.mp3`);
    if (forceRegen || !isExistingClipValid(numOut)) {
      jobs.push({
        id: String(n.num),
        text: n.title,
        speed: 0.92,
        outPath: numOut,
      });
    }

    if (n.num >= 1) {
      const hintOut = path.join(countdownOutDir, `hint-${n.num}.mp3`);
      if (forceRegen || !isExistingClipValid(hintOut)) {
        jobs.push({
          id: `hint-${n.num}`,
          text: `We need number ${n.word} next!`,
          speed: 0.94,
          outPath: hintOut,
        });
      }

      const gapOut = path.join(countdownOutDir, `gap-need-${n.num}.mp3`);
      if (forceRegen || !isExistingClipValid(gapOut)) {
        jobs.push({
          id: `gap-need-${n.num}`,
          text: `Look at the wide gap! We need number ${n.word} next,`,
          speed: 0.95,
          outPath: gapOut,
        });
      }
    }

    if (n.num <= 9) {
      const beforeOut = path.join(countdownOutDir, `before-${n.num}.mp3`);
      if (forceRegen || !isExistingClipValid(beforeOut)) {
        jobs.push({
          id: `before-${n.num}`,
          text: `before ${n.word}.`,
          speed: 0.95,
          outPath: beforeOut,
        });
      }
    }
  }

  for (const clip of STATIC_COUNTDOWN_CLIPS) {
    const outPath = path.join(countdownOutDir, `${clip.id}.mp3`);
    if (forceRegen || !isExistingClipValid(outPath)) {
      jobs.push({
        id: clip.id,
        text: clip.text,
        speed: clip.speed,
        outPath,
      });
    }
  }

  let existingCatalog = { clips: {} };
  if (fs.existsSync(journeyCatalogPath)) {
    try {
      existingCatalog = JSON.parse(fs.readFileSync(journeyCatalogPath, 'utf8'));
    } catch {
      existingCatalog = { clips: {} };
    }
  }

  const journeyOutPath = path.join(journeyOutDir, `${JOURNEY_CLIP.id}.mp3`);
  const needJourney =
    forceRegen ||
    !isExistingClipValid(journeyOutPath) ||
    !existingCatalog.clips?.[JOURNEY_CLIP.id]?.words?.length;

  console.log(
    `Pipe Countdown Audio: ${jobs.length} game clips + ${needJourney ? 1 : 0} journey clip queued.`,
  );
  if (jobs.length === 0 && !needJourney) {
    console.log('All Pipe Countdown MP3 clips are already up to date.');
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
        `Clip ${job.id} ("${job.text}") trimmed too short: ${durationMs}ms < ${MIN_DURATION_MS}ms`,
      );
    }

    const mp3Buffer = encodeMonoMp3(Mp3Encoder, int16, spoken.sampling_rate, 64);
    if (mp3Buffer.length < MIN_FILE_BYTES) {
      throw new Error(`Clip ${job.id} produced ${mp3Buffer.length} B < ${MIN_FILE_BYTES} B`);
    }

    fs.writeFileSync(job.outPath, mp3Buffer);
    totalBytes += mp3Buffer.length;
    if ((i + 1) % 10 === 0 || i === jobs.length - 1) {
      console.log(`  [${i + 1}/${jobs.length}] ${job.id}.mp3 (${mp3Buffer.length} B, ${durationMs}ms)`);
    }
  }

  if (needJourney) {
    const spoken = await tts.generate(JOURNEY_CLIP.text, {
      voice: 'af_heart',
      speed: JOURNEY_CLIP.speed,
    });
    const { int16 } = trimAndNormalizeFloat32(spoken.audio, spoken.sampling_rate);
    const mp3Buffer = encodeMonoMp3(Mp3Encoder, int16, spoken.sampling_rate, 64);
    fs.writeFileSync(journeyOutPath, mp3Buffer);
    totalBytes += mp3Buffer.length;

    const timing = computeWordTimings(JOURNEY_CLIP.text, int16, spoken.sampling_rate);
    const clips = {
      ...(existingCatalog.clips || {}),
      [JOURNEY_CLIP.id]: {
        id: JOURNEY_CLIP.id,
        text: JOURNEY_CLIP.text,
        audioPath: `audio/journey/${JOURNEY_CLIP.id}.mp3`,
        durationMs: timing.durationMs,
        words: timing.words,
      },
    };
    fs.writeFileSync(journeyCatalogPath, `${JSON.stringify({ clips }, null, 2)}\n`, 'utf8');
    console.log(
      `  [journey] ${JOURNEY_CLIP.id}.mp3 (${mp3Buffer.length} B, ${timing.durationMs}ms, ${timing.words.length} words)`,
    );
  }

  console.log(
    `Done! Generated ${jobs.length + (needJourney ? 1 : 0)} Pipe Countdown MP3 clips (${(
      totalBytes / 1024
    ).toFixed(1)} KB total).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
