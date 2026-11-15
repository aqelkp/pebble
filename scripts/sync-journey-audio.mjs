#!/usr/bin/env node
/**
 * Journey Voice Instruction Generator (Kokoro-82M + LameJS MP3 + Word Timings)
 *
 * Generates calm, pre-reader voice instructions for each activity type into
 *   - public/audio/journey/<id>.mp3
 *   - src/journey/journeyAudioCatalog.json
 *
 * Usage:
 *   PEBBLE_TTS_NODE_MODULES=/path/to/kokoro/node_modules node scripts/sync-journey-audio.mjs [--force]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const journeyAudioOutDir = path.join(repoRoot, 'public', 'audio', 'journey');
const catalogOutPath = path.join(repoRoot, 'src', 'journey', 'journeyAudioCatalog.json');

const forceRegen = process.argv.includes('--force');

const require = createRequire(import.meta.url);

const JOURNEY_PROMPTS = [
  {
    id: 'memory-match',
    text: 'Flip two cards to find the matching pictures!',
  },
  {
    id: 'letter-train',
    text: 'Load the pictures starting with this letter onto the train!',
  },
  {
    id: 'letter-river',
    text: 'Scoop each swimming fish into the matching letter bucket!',
  },
  {
    id: 'picture-sudoku',
    text: 'Place each missing picture so every row and column has one!',
  },
  {
    id: 'word-fun',
    text: 'Tap the letter blocks in order to spell the picture word!',
  },
  {
    id: 'number-safari-count',
    text: 'Tap each animal to count them, then pick the number block!',
  },
  {
    id: 'number-safari-add',
    text: 'Count both animal groups together, then pick the total number!',
  },
  {
    id: 'rescue-road',
    text: 'Place the road tiles to connect the garage to the finish flag!',
  },
  {
    id: 'sticker-jigsaw',
    text: 'Place each puzzle piece to build the picture sticker!',
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

async function main() {
  fs.mkdirSync(journeyAudioOutDir, { recursive: true });
  fs.mkdirSync(path.dirname(catalogOutPath), { recursive: true });

  let existingCatalog = { clips: {} };
  if (fs.existsSync(catalogOutPath)) {
    try {
      existingCatalog = JSON.parse(fs.readFileSync(catalogOutPath, 'utf8'));
    } catch {
      existingCatalog = { clips: {} };
    }
  }

  const jobs = [];
  for (const prompt of JOURNEY_PROMPTS) {
    const outPath = path.join(journeyAudioOutDir, `${prompt.id}.mp3`);
    const hasTiming = Boolean(existingCatalog.clips?.[prompt.id]?.words?.length);
    if (forceRegen || !fs.existsSync(outPath) || !hasTiming) {
      jobs.push({
        id: prompt.id,
        text: prompt.text,
        outPath,
      });
    }
  }

  if (jobs.length === 0) {
    console.log('All journey audio clips and word timings are already up to date.');
    return;
  }

  console.log(`Generating ${jobs.length} journey instruction clips via Kokoro (af_heart)...`);
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

  const clips = { ...(existingCatalog.clips || {}) };
  let totalBytes = 0;

  for (let i = 0; i < jobs.length; i += 1) {
    const job = jobs[i];
    const audio = await tts.generate(job.text, {
      voice: 'af_heart',
      speed: 0.92,
    });
    const int16 = trimAndNormalizeFloat32(audio.audio, audio.sampling_rate);
    const mp3Buffer = encodeMonoMp3(Mp3Encoder, int16, audio.sampling_rate, 64);
    fs.writeFileSync(job.outPath, mp3Buffer);
    totalBytes += mp3Buffer.length;

    const timing = computeWordTimings(job.text, int16, audio.sampling_rate);
    clips[job.id] = {
      id: job.id,
      text: job.text,
      audioPath: `audio/journey/${job.id}.mp3`,
      durationMs: timing.durationMs,
      words: timing.words,
    };

    console.log(
      `  [${i + 1}/${jobs.length}] ${job.id}.mp3 (${mp3Buffer.length} B, ${timing.durationMs}ms, ${timing.words.length} words)`,
    );
  }

  fs.writeFileSync(catalogOutPath, `${JSON.stringify({ clips }, null, 2)}\n`, 'utf8');
  console.log(`Done! Saved ${jobs.length} clips (${(totalBytes / 1024).toFixed(1)} KB total) and catalog.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
