#!/usr/bin/env node
/**
 * Compare Quest Offline Audio Generator (Kokoro-82M + LameJS MP3)
 *
 * Generates compact 64kbps mono MP3 clips into:
 *   - public/audio/compare/*.mp3 (numbers 0..10, relations, celebration leads, prompt cues, Teach-First explanations)
 *   - public/audio/journey/compare-quest.mp3 (+ updates src/journey/journeyAudioCatalog.json)
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

const compareOutDir = path.join(repoRoot, 'public', 'audio', 'compare');
const journeyOutDir = path.join(repoRoot, 'public', 'audio', 'journey');
const journeyCatalogPath = path.join(repoRoot, 'src', 'journey', 'journeyAudioCatalog.json');

const forceRegen = process.argv.includes('--force');
const require = createRequire(import.meta.url);

const MIN_DURATION_MS = 200;
const MIN_FILE_BYTES = 1200;

const NUMBER_WORDS = [
  'Zero',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
];

function buildCompareJobs() {
  const specs = [];

  // 1. Spoken numbers 0..10
  for (let n = 0; n <= 10; n += 1) {
    specs.push({
      id: `num-${n}`,
      text: `${NUMBER_WORDS[n]}.`,
      speed: 0.92,
    });
  }

  // 2. Standalone relation phrases
  specs.push(
    { id: 'rel-gt', text: 'is greater than', speed: 0.94 },
    { id: 'rel-lt', text: 'is less than', speed: 0.94 },
    { id: 'rel-eq', text: 'is equal to', speed: 0.94 },
  );

  // 3. Natural celebration leads & full equal sentences
  for (let n = 1; n <= 10; n += 1) {
    specs.push({
      id: `gt-lead-${n}`,
      text: `${NUMBER_WORDS[n]} is greater than`,
      speed: 0.95,
    });
  }
  for (let n = 0; n <= 9; n += 1) {
    specs.push({
      id: `lt-lead-${n}`,
      text: `${NUMBER_WORDS[n]} is less than`,
      speed: 0.95,
    });
  }
  for (let n = 0; n <= 10; n += 1) {
    specs.push({
      id: `eq-full-${n}`,
      text: `${NUMBER_WORDS[n]} is equal to ${NUMBER_WORDS[n].toLowerCase()}!`,
      speed: 0.95,
    });
  }

  // 4. Mode prompt cues & round cheers
  specs.push(
    { id: 'cue-quantity', text: 'Count both baskets and pick the sign!', speed: 0.94 },
    { id: 'cue-sticks', text: 'Compare the lengths and pick the sign!', speed: 0.94 },
    { id: 'cue-towers', text: 'Compare the block towers and pick the sign!', speed: 0.94 },
    { id: 'cue-measure', text: 'Check both juice jugs and pick the sign!', speed: 0.94 },
    { id: 'cue-numbers', text: 'Compare the two numbers and pick the sign!', speed: 0.94 },
    { id: 'cheer-flawless', text: 'Bravo! Zero mistakes! Every comparison was spot on!', speed: 0.95 },
    { id: 'cheer-complete', text: 'Awesome comparing! You finished the whole quest!', speed: 0.95 },
  );

  // 5. Teach-First calm mistake explanation clips
  for (let n = 1; n <= 10; n += 1) {
    specs.push({
      id: `teach-more-${n}`,
      text: `Look closely! ${NUMBER_WORDS[n]} is more than`,
      speed: 0.92,
    });
  }
  for (let n = 0; n <= 9; n += 1) {
    specs.push({
      id: `teach-less-${n}`,
      text: `Look closely! ${NUMBER_WORDS[n]} is less than`,
      speed: 0.92,
    });
  }
  specs.push(
    {
      id: 'teach-open-side',
      text: 'The wide open side points to the bigger side.',
      speed: 0.92,
    },
    {
      id: 'teach-equal',
      text: 'Look closely! Both sides are equal, so we use the equal sign.',
      speed: 0.92,
    },
  );

  return specs;
}

const JOURNEY_CLIP_SPEC = {
  id: 'compare-quest',
  text: 'Compare both sides and place greater than, less than, or equal in the middle!',
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
  const padSamples = Math.floor(sampleRate * 0.042);
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
  if (words.length === 0) return { durationMs, words: [] };

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
  fs.mkdirSync(compareOutDir, { recursive: true });
  fs.mkdirSync(journeyOutDir, { recursive: true });

  const allCompareSpecs = buildCompareJobs();
  const compareJobs = allCompareSpecs
    .map((spec) => ({
      ...spec,
      outPath: path.join(compareOutDir, `${spec.id}.mp3`),
    }))
    .filter((job) => forceRegen || !isExistingClipValid(job.outPath));

  let existingCatalog = { clips: {} };
  if (fs.existsSync(journeyCatalogPath)) {
    try {
      existingCatalog = JSON.parse(fs.readFileSync(journeyCatalogPath, 'utf8'));
    } catch {
      existingCatalog = { clips: {} };
    }
  }

  const journeyOutPath = path.join(journeyOutDir, `${JOURNEY_CLIP_SPEC.id}.mp3`);
  const needsJourneyClip =
    forceRegen ||
    !isExistingClipValid(journeyOutPath) ||
    !existingCatalog.clips?.[JOURNEY_CLIP_SPEC.id]?.words?.length;

  console.log(
    `Compare Quest Audio: ${allCompareSpecs.length} compare clips (${compareJobs.length} queued), journey clip needed: ${needsJourneyClip}.`,
  );

  if (compareJobs.length === 0 && !needsJourneyClip) {
    console.log('All Compare Quest MP3 clips are already up to date.');
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
  for (let i = 0; i < compareJobs.length; i += 1) {
    const job = compareJobs[i];
    const spoken = await tts.generate(job.text, {
      voice: 'af_heart',
      speed: job.speed,
    });
    const { int16, durationMs } = trimAndNormalizeFloat32(spoken.audio, spoken.sampling_rate);
    if (durationMs < MIN_DURATION_MS) {
      throw new Error(`Clip ${job.id} trimmed too short: ${durationMs}ms`);
    }
    const mp3Buffer = encodeMonoMp3(Mp3Encoder, int16, spoken.sampling_rate, 64);
    if (mp3Buffer.length < MIN_FILE_BYTES) {
      throw new Error(`Clip ${job.id} produced ${mp3Buffer.length} B < ${MIN_FILE_BYTES} B`);
    }
    fs.writeFileSync(job.outPath, mp3Buffer);
    totalBytes += mp3Buffer.length;
    if ((i + 1) % 10 === 0 || i === compareJobs.length - 1) {
      console.log(
        `  [${i + 1}/${compareJobs.length}] ${job.id}.mp3 (${mp3Buffer.length} B, ${durationMs}ms)`,
      );
    }
  }

  if (needsJourneyClip) {
    const spoken = await tts.generate(JOURNEY_CLIP_SPEC.text, {
      voice: 'af_heart',
      speed: 0.92,
    });
    const { int16 } = trimAndNormalizeFloat32(spoken.audio, spoken.sampling_rate);
    const mp3Buffer = encodeMonoMp3(Mp3Encoder, int16, spoken.sampling_rate, 64);
    fs.writeFileSync(journeyOutPath, mp3Buffer);
    totalBytes += mp3Buffer.length;

    const timing = computeWordTimings(JOURNEY_CLIP_SPEC.text, int16, spoken.sampling_rate);
    const clips = {
      ...(existingCatalog.clips || {}),
      [JOURNEY_CLIP_SPEC.id]: {
        id: JOURNEY_CLIP_SPEC.id,
        text: JOURNEY_CLIP_SPEC.text,
        audioPath: `audio/journey/${JOURNEY_CLIP_SPEC.id}.mp3`,
        durationMs: timing.durationMs,
        words: timing.words,
      },
    };
    fs.writeFileSync(journeyCatalogPath, `${JSON.stringify({ clips }, null, 2)}\n`, 'utf8');
    console.log(
      `  [journey] ${JOURNEY_CLIP_SPEC.id}.mp3 (${mp3Buffer.length} B, ${timing.durationMs}ms, ${timing.words.length} words)`,
    );
  }

  console.log(
    `Done! Generated ${compareJobs.length + (needsJourneyClip ? 1 : 0)} MP3 clips (${(totalBytes / 1024).toFixed(1)} KB total).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
