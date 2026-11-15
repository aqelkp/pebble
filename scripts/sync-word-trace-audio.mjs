#!/usr/bin/env node
/**
 * Word Trace Offline Audio Generator (Kokoro-82M + LameJS MP3)
 *
 * Generates compact 64kbps mono MP3 clips into:
 *   - public/audio/word-trace/prompt-<id>.mp3       ("Can you write <word>?")
 *   - public/audio/word-trace/word-<id>.mp3         (Spoken sight words: "Be!", "Or!", etc.)
 *   - public/audio/word-trace/hint-left-to-right.mp3
 *   - public/audio/journey/word-trace.mp3           (+ updates src/journey/journeyAudioCatalog.json)
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

const wordTraceAudioDir = path.join(repoRoot, 'public', 'audio', 'word-trace');
const journeyAudioDir = path.join(repoRoot, 'public', 'audio', 'journey');
const journeyCatalogPath = path.join(repoRoot, 'src', 'journey', 'journeyAudioCatalog.json');

const forceRegen = process.argv.includes('--force');
const require = createRequire(import.meta.url);

const MIN_DURATION_MS = 180;
const MIN_FILE_BYTES = 1100;

const CVC_WORDS = [
  'cat', 'dog', 'pig', 'fox', 'hen', 'cow', 'bee',
  'cup', 'hat', 'bed', 'box', 'pot', 'jar', 'pan',
  'bus', 'car', 'jet', 'sub', 'top', 'bag', 'van',
  'map', 'sun', 'log', 'web', 'pod', 'bug', 'gem',
  'ant', 'egg', 'nut', 'net', 'yak',
];

const SIGHT_WORDS = [
  // 6 School Homework Words
  { id: 'or', word: 'or', promptText: 'Can you write or? Sun or rain!', wordText: 'Or!', fallbackWordText: 'Or.' },
  { id: 'be', word: 'be', promptText: "Can you write be? Let's be kind!", wordText: 'Be!', fallbackWordText: 'Bee.' },
  { id: 'an', word: 'an', promptText: 'Can you write an? Eat an apple!', wordText: 'An!', fallbackWordText: 'An.' },
  { id: 'no', word: 'no', promptText: 'Can you write no? No more rain!', wordText: 'No!', fallbackWordText: 'No.' },
  { id: 'do', word: 'do', promptText: 'Can you write do? You can do it!', wordText: 'Do!', fallbackWordText: 'Do.' },
  { id: 'am', word: 'am', promptText: 'Can you write am? I am happy!', wordText: 'Am!', fallbackWordText: 'Am.' },
  // 14 Core K1 2-Letter Sight Words
  { id: 'in', word: 'in', promptText: 'Can you write in? Hop in the box!', wordText: 'In!', fallbackWordText: 'In.' },
  { id: 'on', word: 'on', promptText: 'Can you write on? Hat on top!', wordText: 'On!', fallbackWordText: 'On.' },
  { id: 'up', word: 'up', promptText: 'Can you write up? Look way up!', wordText: 'Up!', fallbackWordText: 'Up.' },
  { id: 'go', word: 'go', promptText: 'Can you write go? Ready, set, go!', wordText: 'Go!', fallbackWordText: 'Go.' },
  { id: 'it', word: 'it', promptText: 'Can you write it? You found it!', wordText: 'It!', fallbackWordText: 'It.' },
  { id: 'is', word: 'is', promptText: 'Can you write is? The sun is warm!', wordText: 'Is!', fallbackWordText: 'Is.' },
  { id: 'at', word: 'at', promptText: 'Can you write at? Smile at home!', wordText: 'At!', fallbackWordText: 'At.' },
  { id: 'to', word: 'to', promptText: 'Can you write to? Walk to school!', wordText: 'To!', fallbackWordText: 'Too!' },
  { id: 'we', word: 'we', promptText: 'Can you write we? Together we play!', wordText: 'We!', fallbackWordText: 'We.' },
  { id: 'me', word: 'me', promptText: 'Can you write me? Read with me!', wordText: 'Me!', fallbackWordText: 'Me.' },
  { id: 'my', word: 'my', promptText: 'Can you write my? Hold my hand!', wordText: 'My!', fallbackWordText: 'My.' },
  { id: 'he', word: 'he', promptText: 'Can you write he? He can jump!', wordText: 'He!', fallbackWordText: 'He.' },
  { id: 'so', word: 'so', promptText: 'Can you write so? You are so kind!', wordText: 'So!', fallbackWordText: 'So.' },
  { id: 'by', word: 'by', promptText: 'Can you write by? Sit by the tree!', wordText: 'By!', fallbackWordText: 'Bye!' },
];

const NUMBER_WORDS = [
  { id: 'zero', promptText: 'Can you write zero?' },
  { id: 'one', promptText: 'Can you write one?' },
  { id: 'two', promptText: 'Can you write two?' },
  { id: 'four', promptText: 'Can you write four?' },
  { id: 'five', promptText: 'Can you write five?' },
  { id: 'six', promptText: 'Can you write six?' },
  { id: 'nine', promptText: 'Can you write nine?' },
  { id: 'ten', promptText: 'Can you write ten?' },
];

const NUMERAL_ITEMS = [
  { id: 'num-0', promptText: 'Can you write the number zero?' },
  { id: 'num-1', promptText: 'Can you write the number one?' },
  { id: 'num-2', promptText: 'Can you write the number two?' },
  { id: 'num-3', promptText: 'Can you write the number three?' },
  { id: 'num-4', promptText: 'Can you write the number four?' },
  { id: 'num-5', promptText: 'Can you write the number five?' },
  { id: 'num-6', promptText: 'Can you write the number six?' },
  { id: 'num-7', promptText: 'Can you write the number seven?' },
  { id: 'num-8', promptText: 'Can you write the number eight?' },
  { id: 'num-9', promptText: 'Can you write the number nine?' },
  { id: 'num-10', promptText: 'Can you write the number ten?' },
];

const JOURNEY_CLIP = {
  id: 'word-trace',
  text: 'Listen to the word, then trace each letter left to right along the four lines!',
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
  fs.mkdirSync(wordTraceAudioDir, { recursive: true });
  fs.mkdirSync(journeyAudioDir, { recursive: true });

  const jobs = [];

  // 1. CVC prompts
  for (const w of CVC_WORDS) {
    const outPath = path.join(wordTraceAudioDir, `prompt-${w}.mp3`);
    if (forceRegen || !isExistingClipValid(outPath)) {
      jobs.push({
        kind: 'prompt',
        id: `prompt-${w}`,
        text: `Can you write ${w}?`,
        speed: 0.93,
        outPath,
      });
    }
  }

  // 2. Sight word prompts + spoken sight words
  for (const s of SIGHT_WORDS) {
    const promptPath = path.join(wordTraceAudioDir, `prompt-${s.id}.mp3`);
    if (forceRegen || !isExistingClipValid(promptPath)) {
      jobs.push({
        kind: 'prompt',
        id: `prompt-${s.id}`,
        text: s.promptText,
        speed: 0.93,
        outPath: promptPath,
      });
    }
    const wordPath = path.join(wordTraceAudioDir, `word-${s.id}.mp3`);
    if (forceRegen || !isExistingClipValid(wordPath)) {
      jobs.push({
        kind: 'word',
        id: `word-${s.id}`,
        text: s.wordText,
        fallbackText: s.fallbackWordText,
        speed: 0.9,
        outPath: wordPath,
      });
    }
  }

  // 3. Number word prompts & numeral prompts
  for (const nw of NUMBER_WORDS) {
    const outPath = path.join(wordTraceAudioDir, `prompt-${nw.id}.mp3`);
    if (forceRegen || !isExistingClipValid(outPath)) {
      jobs.push({
        kind: 'prompt',
        id: `prompt-${nw.id}`,
        text: nw.promptText,
        speed: 0.93,
        outPath,
      });
    }
  }
  for (const num of NUMERAL_ITEMS) {
    const outPath = path.join(wordTraceAudioDir, `prompt-${num.id}.mp3`);
    if (forceRegen || !isExistingClipValid(outPath)) {
      jobs.push({
        kind: 'prompt',
        id: `prompt-${num.id}`,
        text: num.promptText,
        speed: 0.93,
        outPath,
      });
    }
  }

  // 4. Teach-First left-to-right stroke hint
  const hintPath = path.join(wordTraceAudioDir, 'hint-left-to-right.mp3');
  if (forceRegen || !isExistingClipValid(hintPath)) {
    jobs.push({
      kind: 'hint',
      id: 'hint-left-to-right',
      text: "Let's write left to right! Start at the glowing circle and follow the arrow.",
      speed: 0.94,
      outPath: hintPath,
    });
  }

  // 5. Journey intro voice clip + word timings
  const journeyOutPath = path.join(journeyAudioDir, `${JOURNEY_CLIP.id}.mp3`);
  let existingCatalog = { clips: {} };
  if (fs.existsSync(journeyCatalogPath)) {
    try {
      existingCatalog = JSON.parse(fs.readFileSync(journeyCatalogPath, 'utf8'));
    } catch {
      existingCatalog = { clips: {} };
    }
  }
  const needJourney =
    forceRegen ||
    !isExistingClipValid(journeyOutPath) ||
    !existingCatalog.clips?.[JOURNEY_CLIP.id]?.words?.length;

  console.log(
    `Word Trace Audio: ${jobs.length} game clips + ${needJourney ? 1 : 0} journey clip queued.`,
  );
  if (jobs.length === 0 && !needJourney) {
    console.log('All Word Trace MP3 clips are already up to date.');
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

    if (job.fallbackText && durationMs < 240) {
      console.log(
        `  [retry ${job.id}] "${job.text}" trimmed to ${durationMs}ms; regenerating as "${job.fallbackText}"`,
      );
      spoken = await tts.generate(job.fallbackText, {
        voice: 'af_heart',
        speed: job.speed,
      });
      ({ int16, durationMs } = trimAndNormalizeFloat32(spoken.audio, spoken.sampling_rate));
    }

    if (durationMs < MIN_DURATION_MS) {
      throw new Error(`Clip ${job.id} ("${job.text}") trimmed too short: ${durationMs}ms`);
    }

    const mp3Buffer = encodeMonoMp3(Mp3Encoder, int16, spoken.sampling_rate, 64);
    if (mp3Buffer.length < MIN_FILE_BYTES) {
      throw new Error(`Clip ${job.id} produced ${mp3Buffer.length} B < ${MIN_FILE_BYTES} B`);
    }

    fs.writeFileSync(job.outPath, mp3Buffer);
    totalBytes += mp3Buffer.length;
    if ((i + 1) % 15 === 0 || i === jobs.length - 1 || job.kind === 'hint') {
      console.log(
        `  [${i + 1}/${jobs.length}] ${job.id}.mp3 (${mp3Buffer.length} B, ${durationMs}ms)`,
      );
    }
  }

  if (needJourney) {
    const spoken = await tts.generate(JOURNEY_CLIP.text, {
      voice: 'af_heart',
      speed: 0.92,
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
    `Done! Generated ${jobs.length + (needJourney ? 1 : 0)} Word Trace MP3 clips (${(
      totalBytes / 1024
    ).toFixed(1)} KB total).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
